import { BackdropConfig, CropRect } from '../types';

/**
 * Creates a composite canvas with chosen backdrop (transparent, solid color, or gradient).
 */
export function createCompositedCanvas(
  sourceCanvas: HTMLCanvasElement,
  backdrop: BackdropConfig
): HTMLCanvasElement {
  const output = document.createElement('canvas');
  output.width = sourceCanvas.width;
  output.height = sourceCanvas.height;
  const ctx = output.getContext('2d');
  if (!ctx) return sourceCanvas;

  if (backdrop.type === 'color') {
    ctx.fillStyle = backdrop.color || '#FFFFFF';
    ctx.fillRect(0, 0, output.width, output.height);
  } else if (backdrop.type === 'gradient') {
    // Generate gradient
    const grad = ctx.createLinearGradient(0, 0, output.width, output.height);
    if (backdrop.gradient === 'sunset') {
      grad.addColorStop(0, '#f97316');
      grad.addColorStop(1, '#ec4899');
    } else if (backdrop.gradient === 'cyber') {
      grad.addColorStop(0, '#06b6d4');
      grad.addColorStop(1, '#3b82f6');
    } else if (backdrop.gradient === 'slate') {
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
    } else if (backdrop.gradient === 'peach') {
      grad.addColorStop(0, '#fbcfe8');
      grad.addColorStop(1, '#fed7aa');
    } else if (backdrop.gradient === 'studio') {
      grad.addColorStop(0, '#f1f5f9');
      grad.addColorStop(1, '#cbd5e1');
    } else {
      grad.addColorStop(0, '#e2e8f0');
      grad.addColorStop(1, '#94a3b8');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, output.width, output.height);
  }

  // Draw source image on top
  ctx.drawImage(sourceCanvas, 0, 0);
  return output;
}

/**
 * Crops, rotates, and flips image canvas.
 */
export function applyCropAndTransform(
  sourceCanvas: HTMLCanvasElement,
  crop: CropRect,
  rotation: number = 0,
  flipH: boolean = false,
  flipV: boolean = false
): HTMLCanvasElement {
  // 1. First extract crop region
  const cropCanvas = document.createElement('canvas');
  const cropWidth = Math.max(1, Math.round(crop.width));
  const cropHeight = Math.max(1, Math.round(crop.height));
  cropCanvas.width = cropWidth;
  cropCanvas.height = cropHeight;

  const cropCtx = cropCanvas.getContext('2d');
  if (!cropCtx) return sourceCanvas;

  cropCtx.imageSmoothingEnabled = true;
  cropCtx.imageSmoothingQuality = 'high';

  cropCtx.drawImage(
    sourceCanvas,
    Math.round(crop.x),
    Math.round(crop.y),
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  );

  // If no rotation or flips, return cropped
  const normalizedRot = ((rotation % 360) + 360) % 360;
  if (normalizedRot === 0 && !flipH && !flipV) {
    return cropCanvas;
  }

  // 2. Handle rotation and flips
  const output = document.createElement('canvas');
  const rad = (normalizedRot * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));

  const newWidth = Math.round(cropWidth * cos + cropHeight * sin);
  const newHeight = Math.round(cropWidth * sin + cropHeight * cos);

  output.width = newWidth;
  output.height = newHeight;

  const outCtx = output.getContext('2d');
  if (!outCtx) return cropCanvas;

  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';

  outCtx.translate(newWidth / 2, newHeight / 2);
  outCtx.rotate(rad);
  outCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  outCtx.drawImage(cropCanvas, -cropWidth / 2, -cropHeight / 2);

  return output;
}

/**
 * Resizes canvas using high-quality resampling.
 */
export function applyResize(
  sourceCanvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement {
  const width = Math.max(1, Math.round(targetWidth));
  const height = Math.max(1, Math.round(targetHeight));

  const output = document.createElement('canvas');
  output.width = width;
  output.height = height;

  const ctx = output.getContext('2d');
  if (!ctx) return sourceCanvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, width, height);

  return output;
}

/**
 * Downloads canvas as PNG, WebP, or JPEG with custom filename.
 */
export function downloadCanvas(
  sourceCanvas: HTMLCanvasElement,
  backdrop: BackdropConfig,
  fileName: string,
  format: 'png' | 'webp' | 'jpeg',
  quality: number = 0.95
): void {
  // If format is JPEG, transparent areas turn black unless we composite with white or backdrop
  const finalCanvas =
    format === 'jpeg' && backdrop.type === 'transparent'
      ? createCompositedCanvas(sourceCanvas, { type: 'color', color: '#FFFFFF', gradient: '' })
      : createCompositedCanvas(sourceCanvas, backdrop);

  const mimeType = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg';
  const cleanName = fileName.replace(/\.[^/.]+$/, '');
  const downloadName = `${cleanName || 'image-no-bg'}.${format}`;

  finalCanvas.toBlob(
    (blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    mimeType,
    quality
  );
}

/**
 * Copies canvas image to clipboard as PNG.
 */
export async function copyCanvasToClipboard(
  sourceCanvas: HTMLCanvasElement,
  backdrop: BackdropConfig
): Promise<boolean> {
  try {
    const finalCanvas = createCompositedCanvas(sourceCanvas, backdrop);
    return new Promise((resolve) => {
      finalCanvas.toBlob(async (blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob,
            }),
          ]);
          resolve(true);
        } catch (err) {
          console.error('Failed to copy to clipboard:', err);
          resolve(false);
        }
      }, 'image/png');
    });
  } catch (e) {
    console.error('Error copying canvas:', e);
    return false;
  }
}
