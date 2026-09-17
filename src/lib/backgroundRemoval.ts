import { AutoRemoveSettings, WandSettings } from '../types';

/**
 * Perceptual color distance approximation (Redmean algorithm).
 * Returns distance from 0 (identical) to ~765 (black vs white).
 */
export function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  const rmean = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(
    (((512 + rmean) * dr * dr) >> 8) +
      4 * dg * dg +
      (((767 - rmean) * db * db) >> 8)
  );
}

/**
 * Computes Sobel edge gradient magnitude for edge-preserving segmentation.
 */
function computeSobelGradients(
  data: Uint8ClampedArray,
  width: number,
  height: number
): Float32Array {
  const gradients = new Float32Array(width * height);
  const grayscale = new Float32Array(width * height);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    grayscale[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;

      // Sobel kernel X
      const gx =
        -grayscale[idx - width - 1] +
        grayscale[idx - width + 1] -
        2 * grayscale[idx - 1] +
        2 * grayscale[idx + 1] -
        grayscale[idx + width - 1] +
        grayscale[idx + width + 1];

      // Sobel kernel Y
      const gy =
        -grayscale[idx - width - 1] -
        2 * grayscale[idx - width] -
        grayscale[idx - width + 1] +
        grayscale[idx + width - 1] +
        2 * grayscale[idx + width] +
        grayscale[idx + width + 1];

      gradients[idx] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  return gradients;
}

/**
 * Samples perimeter pixels and identifies common background color clusters.
 */
function sampleCommonBackgroundColors(
  data: Uint8ClampedArray,
  width: number,
  height: number
): Array<{ r: number; g: number; b: number; count: number }> {
  const samples: Array<[number, number, number]> = [];
  const stepX = Math.max(1, Math.floor(width / 60));
  const stepY = Math.max(1, Math.floor(height / 60));

  // Top and bottom borders (multiple pixel rows for stability)
  for (let row = 0; row < Math.min(3, height); row++) {
    for (let x = 0; x < width; x += stepX) {
      const topIdx = (row * width + x) * 4;
      samples.push([data[topIdx], data[topIdx + 1], data[topIdx + 2]]);

      const botIdx = ((height - 1 - row) * width + x) * 4;
      samples.push([data[botIdx], data[botIdx + 1], data[botIdx + 2]]);
    }
  }

  // Left and right borders
  for (let col = 0; col < Math.min(3, width); col++) {
    for (let y = 0; y < height; y += stepY) {
      const leftIdx = (y * width + col) * 4;
      samples.push([data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]]);

      const rightIdx = (y * width + (width - 1 - col)) * 4;
      samples.push([data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]]);
    }
  }

  // Four corners (concentrated samples)
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  for (const [cx, cy] of corners) {
    const idx = (cy * width + cx) * 4;
    samples.push([data[idx], data[idx + 1], data[idx + 2]]);
  }

  // Simple clustering to find dominant background colors
  const clusters: Array<{ r: number; g: number; b: number; count: number }> = [];
  const clusterDistThreshold = 35;

  for (const [r, g, b] of samples) {
    let matched = false;
    for (const c of clusters) {
      if (colorDistance(r, g, b, c.r, c.g, c.b) < clusterDistThreshold) {
        c.r = Math.round((c.r * c.count + r) / (c.count + 1));
        c.g = Math.round((c.g * c.count + g) / (c.count + 1));
        c.b = Math.round((c.b * c.count + b) / (c.count + 1));
        c.count++;
        matched = true;
        break;
      }
    }
    if (!matched) {
      clusters.push({ r, g, b, count: 1 });
    }
  }

  // Sort by frequency
  clusters.sort((a, b) => b.count - a.count);
  return clusters.slice(0, 6); // Top dominant common colors
}

/**
 * Identifies common background areas and automatically removes them.
 * Produces an alpha mask (0 = removed background, 255 = preserved foreground).
 */
export function autoIdentifyAndRemoveBackground(
  imageData: ImageData,
  settings: AutoRemoveSettings
): Uint8Array {
  const { width, height, data } = imageData;
  const mask = new Uint8Array(width * height).fill(255); // start with foreground kept
  const visited = new Uint8Array(width * height);

  // 1. Identify dominant common background colors from borders
  const bgClusters = sampleCommonBackgroundColors(data, width, height);
  if (bgClusters.length === 0) return mask;

  // 2. Compute edge gradients to prevent bleed into foreground subjects
  const gradients = computeSobelGradients(data, width, height);

  // Map sensitivity (10-90) to color tolerance threshold (~25 to ~220)
  const maxColorDist = settings.sensitivity * 2.6 + 15;
  const edgeThreshold = Math.max(15, 120 - settings.edgePreserve * 1.8);

  // 3. Queue border pixels to initiate connected background flooding
  const queue: number[] = [];

  const checkAndQueue = (x: number, y: number) => {
    const idx = y * width + x;
    if (visited[idx]) return;

    const p = idx * 4;
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];

    // Check if close to ANY common background color cluster
    let isBg = false;
    for (const cluster of bgClusters) {
      if (colorDistance(r, g, b, cluster.r, cluster.g, cluster.b) < maxColorDist * 1.1) {
        isBg = true;
        break;
      }
    }

    if (isBg) {
      visited[idx] = 1;
      mask[idx] = 0; // marked as background
      queue.push(x, y);
    }
  };

  // Seed with all border edges
  for (let x = 0; x < width; x++) {
    checkAndQueue(x, 0);
    checkAndQueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    checkAndQueue(0, y);
    checkAndQueue(width - 1, y);
  }

  // 4. Breadth-First Flood Fill with Edge Barrier
  let head = 0;
  const neighbors = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    const curIdx = y * width + x;
    const curP = curIdx * 4;
    const curR = data[curP];
    const curG = data[curP + 1];
    const curB = data[curP + 2];

    for (const [dx, dy] of neighbors) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nextIdx = ny * width + nx;
        if (visited[nextIdx] === 0) {
          // If edge gradient is very strong, stop to preserve crisp foreground subject boundaries
          if (gradients[nextIdx] > edgeThreshold) {
            continue;
          }

          const nextP = nextIdx * 4;
          const nr = data[nextP];
          const ng = data[nextP + 1];
          const nb = data[nextP + 2];

          // Check color similarity against current pixel AND against dominant background clusters
          const distToCurrent = colorDistance(curR, curG, curB, nr, ng, nb);
          let matchesBgCluster = false;
          for (const cluster of bgClusters) {
            if (colorDistance(nr, ng, nb, cluster.r, cluster.g, cluster.b) < maxColorDist) {
              matchesBgCluster = true;
              break;
            }
          }

          if (matchesBgCluster || (distToCurrent < maxColorDist * 0.45 && gradients[nextIdx] < edgeThreshold * 0.7)) {
            visited[nextIdx] = 1;
            mask[nextIdx] = 0;
            queue.push(nx, ny);
          }
        }
      }
    }
  }

  // 5. Apply Feathering / Edge smoothing if requested
  if (settings.feather > 0) {
    return applyFeathering(mask, width, height, settings.feather);
  }

  return mask;
}

/**
 * Magic Wand tool: identifies common area matching clicked color and removes it.
 */
export function magicWandRemove(
  imageData: ImageData,
  existingMask: Uint8Array,
  startX: number,
  startY: number,
  settings: WandSettings
): Uint8Array {
  const { width, height, data } = imageData;
  const newMask = new Uint8Array(existingMask);
  const targetIdx = (startY * width + startX) * 4;
  const targetR = data[targetIdx];
  const targetG = data[targetIdx + 1];
  const targetB = data[targetIdx + 2];

  const toleranceDist = settings.tolerance * 4.2 + 5;

  if (!settings.contiguous) {
    // Global removal of this common color across entire image
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const p = idx * 4;
        const dist = colorDistance(targetR, targetG, targetB, data[p], data[p + 1], data[p + 2]);
        if (dist <= toleranceDist) {
          newMask[idx] = 0;
        }
      }
    }
  } else {
    // Contiguous flood fill from (startX, startY)
    const visited = new Uint8Array(width * height);
    const queue: number[] = [startX, startY];
    visited[startY * width + startX] = 1;
    newMask[startY * width + startX] = 0;

    let head = 0;
    while (head < queue.length) {
      const cx = queue[head++];
      const cy = queue[head++];

      const dirs = [
        [cx - 1, cy],
        [cx + 1, cy],
        [cx, cy - 1],
        [cx, cy + 1],
      ];

      for (const [nx, ny] of dirs) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIdx = ny * width + nx;
          if (!visited[nIdx]) {
            visited[nIdx] = 1;
            const np = nIdx * 4;
            const dist = colorDistance(targetR, targetG, targetB, data[np], data[np + 1], data[np + 2]);
            if (dist <= toleranceDist) {
              newMask[nIdx] = 0;
              queue.push(nx, ny);
            }
          }
        }
      }
    }
  }

  if (settings.feather > 0) {
    return applyFeathering(newMask, width, height, settings.feather);
  }

  return newMask;
}

/**
 * Erase or Restore brush directly on mask with customizable softness.
 */
export function applyBrushToMask(
  mask: Uint8Array,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  radius: number,
  hardness: number,
  mode: 'erase' | 'restore'
): Uint8Array {
  const newMask = new Uint8Array(mask);
  const targetValue = mode === 'erase' ? 0 : 255;
  const innerRadius = (radius * hardness) / 100;
  const rSquared = radius * radius;

  const minX = Math.max(0, Math.floor(centerX - radius));
  const maxX = Math.min(width - 1, Math.ceil(centerX + radius));
  const minY = Math.max(0, Math.floor(centerY - radius));
  const maxY = Math.min(height - 1, Math.ceil(centerY + radius));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const dSquared = dx * dx + dy * dy;

      if (dSquared <= rSquared) {
        const d = Math.sqrt(dSquared);
        const idx = y * width + x;

        if (d <= innerRadius) {
          newMask[idx] = targetValue;
        } else {
          // Feathered falloff between innerRadius and radius
          const factor = (radius - d) / (radius - innerRadius);
          const currentVal = newMask[idx];
          if (mode === 'erase') {
            const newVal = Math.round(currentVal * (1 - factor));
            newMask[idx] = Math.min(newMask[idx], newVal);
          } else {
            const newVal = Math.round(currentVal + (255 - currentVal) * factor);
            newMask[idx] = Math.max(newMask[idx], newVal);
          }
        }
      }
    }
  }

  return newMask;
}

/**
 * Smooths and feathers the boundary of an alpha mask.
 */
export function applyFeathering(
  mask: Uint8Array,
  width: number,
  height: number,
  featherRadius: number
): Uint8Array {
  const radius = Math.min(8, Math.max(1, Math.round(featherRadius)));
  const output = new Uint8Array(width * height);

  // Fast box blur approximation of Gaussian feathering
  const temp = new Float32Array(width * height);

  // Horizontal blur pass
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let kx = -radius; kx <= radius; kx++) {
        const px = x + kx;
        if (px >= 0 && px < width) {
          sum += mask[rowOffset + px];
          count++;
        }
      }
      temp[rowOffset + x] = sum / count;
    }
  }

  // Vertical blur pass
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let sum = 0;
      let count = 0;
      for (let ky = -radius; ky <= radius; ky++) {
        const py = y + ky;
        if (py >= 0 && py < height) {
          sum += temp[py * width + x];
          count++;
        }
      }
      // Re-threshold slightly to preserve subject core
      const avg = sum / count;
      output[y * width + x] = Math.min(255, Math.max(0, Math.round(avg)));
    }
  }

  return output;
}

/**
 * Cleanly removes bright green chroma key (#00FF00) generated by AI models.
 */
export function keyOutGreenScreen(imageData: ImageData, tolerance: number = 65): Uint8Array {
  const { width, height, data } = imageData;
  const mask = new Uint8Array(width * height).fill(255);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Green is clearly dominant
    if (g > 80 && g > r + 30 && g > b + 30) {
      mask[p] = 0;
    } else if (g > r + 15 && g > b + 15) {
      // Semi-green edge: feather out
      const diff = Math.min(g - r, g - b);
      mask[p] = Math.max(0, 255 - diff * 4);
    }
  }

  return applyFeathering(mask, width, height, 1.5);
}

/**
 * Creates final canvas image by combining original pixels and alpha mask with defringing.
 */
export function renderMaskedCanvas(
  sourceImage: HTMLImageElement | HTMLCanvasElement,
  mask: Uint8Array,
  defringe: boolean = true
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const width = sourceImage.width;
  const height = sourceImage.height;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.drawImage(sourceImage, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const alpha = mask[p];
    data[i + 3] = alpha;

    // Optional defringe: prevent background color halo on edge pixels
    if (defringe && alpha > 0 && alpha < 240) {
      // Scale RGB values towards non-halo balance
      const a = alpha / 255;
      data[i] = Math.min(255, Math.round(data[i] / (a * 0.4 + 0.6)));
      data[i + 1] = Math.min(255, Math.round(data[i + 1] / (a * 0.4 + 0.6)));
      data[i + 2] = Math.min(255, Math.round(data[i + 2] / (a * 0.4 + 0.6)));
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}
