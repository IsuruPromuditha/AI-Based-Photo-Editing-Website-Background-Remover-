import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { Workspace } from './components/Workspace';
import { ToolPanel } from './components/ToolPanel';
import { SamplesModal } from './components/SamplesModal';
import { SideDashboard } from './components/SideDashboard';
import { ProductionPreviewModal } from './components/ProductionPreviewModal';
import {
  ActiveTool,
  AspectRatio,
  AutoRemoveSettings,
  BackdropConfig,
  BrushSettings,
  CropRect,
  ExportSettings,
  HistoryItem,
  ResizeSettings,
  WandSettings,
  Project,
  ProjectImage,
} from './types';
import {
  autoIdentifyAndRemoveBackground,
  magicWandRemove,
  applyBrushToMask,
  renderMaskedCanvas,
  keyOutGreenScreen,
} from './lib/backgroundRemoval';
import {
  applyCropAndTransform,
  applyResize,
  copyCanvasToClipboard,
  downloadCanvas,
} from './lib/imageTransform';
import { SampleImage } from './data/sampleImages';

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'E-Commerce Catalog Cutouts',
    category: 'Product Photography',
    status: 'active',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now(),
    images: [],
  },
];

export const App: React.FC = () => {
  // Project & Dashboard state
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('bg_remover_projects_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p) => ({
            ...p,
            images: Array.isArray(p?.images) ? p.images : [],
          }));
        }
      }
    } catch (e) {
      console.warn('Could not parse saved projects:', e);
    }
    return DEFAULT_PROJECTS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem('bg_remover_active_project_id_v2');
      if (savedId) return savedId;
    } catch (e) {}
    return DEFAULT_PROJECTS[0].id;
  });

  const [activeImageId, setActiveImageId] = useState<string | undefined>(undefined);
  const [isSideDashboardOpen, setIsSideDashboardOpen] = useState<boolean>(true);
  const [isProductionPreviewOpen, setIsProductionPreviewOpen] = useState<boolean>(false);
  const [previewImageTarget, setPreviewImageTarget] = useState<ProjectImage | null>(null);

  // Sync refs to avoid stale closures in callbacks
  const activeProjectIdRef = useRef(activeProjectId);
  activeProjectIdRef.current = activeProjectId;
  const activeImageIdRef = useRef(activeImageId);
  activeImageIdRef.current = activeImageId;

  // Active project helper
  const activeProject: Project =
    (projects && projects.find((p) => p && p.id === activeProjectId)) ||
    (projects && projects[0]) ||
    DEFAULT_PROJECTS[0];

  const currentProjectImage = activeProject?.images?.find((img) => img.id === activeImageId);

  // Persist projects to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bg_remover_projects_v2', JSON.stringify(projects));
      localStorage.setItem('bg_remover_active_project_id_v2', activeProjectId);
    } catch (err) {
      console.warn('LocalStorage save failed:', err);
    }
  }, [projects, activeProjectId]);

  // Image & Canvas state
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState<string>('image.png');
  const [imageWidth, setImageWidth] = useState<number>(0);
  const [imageHeight, setImageHeight] = useState<number>(0);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mask state (Uint8Array: 0 = transparent/removed, 255 = preserved)
  const maskRef = useRef<Uint8Array | null>(null);

  // Active Tool state
  const [tool, setTool] = useState<ActiveTool>('auto');

  // Background removal settings
  const [autoSettings, setAutoSettings] = useState<AutoRemoveSettings>({
    sensitivity: 45,
    edgePreserve: 25,
    feather: 1.5,
    defringe: true,
  });

  const [wandSettings, setWandSettings] = useState<WandSettings>({
    tolerance: 30,
    contiguous: true,
    feather: 1,
  });

  const [brushSettings, setBrushSettings] = useState<BrushSettings>({
    size: 35,
    hardness: 60,
  });

  // Backdrop setting
  const [backdrop, setBackdrop] = useState<BackdropConfig>({
    type: 'transparent',
    color: '#FFFFFF',
    gradient: 'studio',
  });

  // Crop & Transform state
  const [cropRect, setCropRect] = useState<CropRect>({ x: 0, y: 0, width: 0, height: 0 });
  const [rotation, setRotation] = useState<number>(0);

  // Resize settings
  const [resizeSettings, setResizeSettings] = useState<ResizeSettings>({
    width: 0,
    height: 0,
    maintainAspectRatio: true,
  });

  // Export settings
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'png',
    quality: 0.95,
    fileName: 'image-no-bg',
  });

  // Status & processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSamplesModalOpen, setIsSamplesModalOpen] = useState<boolean>(false);
  const [isLoadingSample, setIsLoadingSample] = useState<boolean>(false);

  // History state for Undo / Redo
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Redraw canvas with current sourceImage and maskRef
  const redrawCanvas = useCallback(() => {
    if (!canvasRef.current || !sourceImage || !maskRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = sourceImage.width;
    canvas.height = sourceImage.height;

    // Render masked image onto working canvas
    const rendered = renderMaskedCanvas(sourceImage, maskRef.current, autoSettings.defringe);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(rendered, 0, 0);
  }, [sourceImage, autoSettings.defringe]);

  // Synchronize canvas result with active project image thumbnail in real time
  const updateActiveProjectImageThumbnail = useCallback(
    (dataUrl: string, status: 'original' | 'edited' = 'edited') => {
      const currentImgId = activeImageIdRef.current;
      const currentProjId = activeProjectIdRef.current;
      if (!currentImgId) return;

      setProjects((prev) =>
        prev.map((proj) => {
          if (proj.id !== currentProjId) return proj;
          return {
            ...proj,
            updatedAt: Date.now(),
            images: proj.images.map((img) =>
              img.id === currentImgId
                ? {
                    ...img,
                    currentDataUrl: dataUrl,
                    status,
                    historyCount: img.historyCount + 1,
                    updatedAt: Date.now(),
                  }
                : img
            ),
          };
        })
      );
    },
    []
  );

  // Push new state to history
  const pushHistory = useCallback(
    (description: string) => {
      if (!canvasRef.current || !sourceImage || !maskRef.current) return;
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL('image/png');
      const item: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        description,
        canvasDataUrl: dataUrl,
        maskDataUrl: sourceImage.src,
        width: sourceImage.width,
        height: sourceImage.height,
        timestamp: Date.now(),
      };

      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        return [...next, item];
      });
      setHistoryIndex((prev) => prev + 1);

      // Immediately sync with side dashboard gallery
      updateActiveProjectImageThumbnail(dataUrl, 'edited');
    },
    [sourceImage, historyIndex, updateActiveProjectImageThumbnail]
  );

  // Initialize new image into state
  const loadNewImage = useCallback(
    (img: HTMLImageElement, name: string, imageId?: string, isPreRendered: boolean = false) => {
      setSourceImage(img);
      setFileName(name);
      setImageWidth(img.width);
      setImageHeight(img.height);

      if (imageId) {
        setActiveImageId(imageId);
        activeImageIdRef.current = imageId;
      }

      // Initial default crop
      setCropRect({
        x: 0,
        y: 0,
        width: img.width,
        height: img.height,
      });

      // Initial resize settings
      setResizeSettings({
        width: img.width,
        height: img.height,
        maintainAspectRatio: true,
      });

      // Initial export name
      const baseName = name.replace(/\.[^/.]+$/, '');
      setExportSettings((s) => ({
        ...s,
        fileName: `${baseName}-no-bg`,
      }));

      // Initialize mask
      const newMask = new Uint8Array(img.width * img.height).fill(255);
      maskRef.current = newMask;

      // Draw to canvas
      if (canvasRef.current) {
        canvasRef.current.width = img.width;
        canvasRef.current.height = img.height;
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
      }

      // Reset history
      const initialItem: HistoryItem = {
        id: 'init',
        description: isPreRendered ? 'Edited Cutout Loaded' : 'Original Image Loaded',
        canvasDataUrl: img.src,
        width: img.width,
        height: img.height,
        timestamp: Date.now(),
      };
      setHistory([initialItem]);
      setHistoryIndex(0);
    },
    []
  );

  // Handle batch / single file selection
  const handleImportFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArr = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (fileArr.length === 0) return;

      setIsProcessing(true);
      setStatusMessage(`Importing ${fileArr.length} image${fileArr.length > 1 ? 's' : ''}...`);

      const newImages: ProjectImage[] = [];

      for (let i = 0; i < fileArr.length; i++) {
        const file = fileArr[i];
        try {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const { width, height } = await new Promise<{ width: number; height: number }>(
            (resolve) => {
              const img = new Image();
              img.onload = () => resolve({ width: img.width, height: img.height });
              img.onerror = () => resolve({ width: 800, height: 600 });
              img.src = dataUrl;
            }
          );

          const projImage: ProjectImage = {
            id: 'img-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
            name: file.name,
            originalDataUrl: dataUrl,
            currentDataUrl: dataUrl,
            width,
            height,
            status: 'original',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            historyCount: 0,
          };
          newImages.push(projImage);
        } catch (e) {
          console.error('Failed reading file:', file.name, e);
        }
      }

      if (newImages.length === 0) {
        setIsProcessing(false);
        setStatusMessage('');
        return;
      }

      // Add to current active project
      const targetProjId = activeProjectIdRef.current;
      setProjects((prev) =>
        prev.map((p) =>
          p.id === targetProjId
            ? {
                ...p,
                updatedAt: Date.now(),
                images: [...newImages, ...p.images],
              }
            : p
        )
      );

      // Load first imported image into workspace
      const firstImg = newImages[0];
      const imgEl = new Image();
      imgEl.onload = () => {
        loadNewImage(imgEl, firstImg.name, firstImg.id);
        setIsProcessing(false);
        setStatusMessage('');
      };
      imgEl.src = firstImg.originalDataUrl;
    },
    [loadNewImage]
  );

  // Handle single file drop
  const handleImageFile = useCallback(
    (file: File) => {
      handleImportFiles([file]);
    },
    [handleImportFiles]
  );

  // Handle selecting an image from the side dashboard
  const handleSelectImage = useCallback(
    (imageId: string) => {
      const proj = projects.find((p) => p.id === activeProjectIdRef.current);
      if (!proj) return;
      const targetImg = proj.images.find((img) => img.id === imageId);
      if (!targetImg) return;

      setIsProcessing(true);
      setStatusMessage(`Opening ${targetImg.name}...`);

      const imgEl = new Image();
      imgEl.onload = () => {
        const isEdited = targetImg.status === 'edited' && targetImg.currentDataUrl !== targetImg.originalDataUrl;
        loadNewImage(imgEl, targetImg.name, targetImg.id, isEdited);
        setIsProcessing(false);
        setStatusMessage('');
      };
      imgEl.src = targetImg.currentDataUrl || targetImg.originalDataUrl;
    },
    [projects, loadNewImage]
  );

  // Handle Project Switching
  const handleSelectProject = useCallback(
    (projectId: string) => {
      if (projectId === activeProjectIdRef.current) return;
      setActiveProjectId(projectId);
      activeProjectIdRef.current = projectId;

      const targetProj = projects.find((p) => p.id === projectId);
      if (targetProj && targetProj.images.length > 0) {
        handleSelectImage(targetProj.images[0].id);
      } else {
        setSourceImage(null);
        setActiveImageId(undefined);
        activeImageIdRef.current = undefined;
      }
    },
    [projects, handleSelectImage]
  );

  // Handle Project Creation (Option to create another project after one is done)
  const handleCreateProject = useCallback(
    (name: string, category?: string) => {
      const newProject: Project = {
        id: 'proj-' + Date.now(),
        name: name.trim() || `Project ${projects.length + 1}`,
        category: category || 'General Cutouts',
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        images: [],
      };

      setProjects((prev) => [newProject, ...prev]);
      setActiveProjectId(newProject.id);
      activeProjectIdRef.current = newProject.id;
      setActiveImageId(undefined);
      activeImageIdRef.current = undefined;
      setSourceImage(null);
    },
    [projects.length]
  );

  // Toggle Project Status (Active / Completed)
  const handleToggleProjectStatus = useCallback((projectId: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              status: p.status === 'completed' ? 'active' : 'completed',
              updatedAt: Date.now(),
            }
          : p
      )
    );
  }, []);

  // Delete Image
  const handleDeleteImage = useCallback(
    (imageId: string) => {
      const targetProjId = activeProjectIdRef.current || activeProjectId;
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === targetProjId || p.images.some((img) => img.id === imageId)) {
            return {
              ...p,
              images: p.images.filter((img) => img.id !== imageId),
              updatedAt: Date.now(),
            };
          }
          return p;
        })
      );

      // Close preview modal if the active preview target was deleted
      setPreviewImageTarget((prev) => (prev?.id === imageId ? null : prev));

      if (activeImageIdRef.current === imageId || activeImageId === imageId) {
        const currentProj = projects.find((p) => p.id === targetProjId);
        const remaining = currentProj?.images.filter((img) => img.id !== imageId) || [];
        if (remaining.length > 0) {
          handleSelectImage(remaining[0].id);
        } else {
          setSourceImage(null);
          setActiveImageId(undefined);
          activeImageIdRef.current = undefined;
          maskRef.current = null;
          setHistory([]);
          setHistoryIndex(-1);
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        }
      }
    },
    [projects, activeProjectId, activeImageId, handleSelectImage]
  );

  // Delete Project
  const handleDeleteProject = useCallback(
    (projectId: string) => {
      if (projects.length <= 1) {
        const fresh: Project = {
          id: 'proj-' + Date.now(),
          name: 'New Cutouts Project',
          category: 'General',
          status: 'active',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          images: [],
        };
        setProjects([fresh]);
        setActiveProjectId(fresh.id);
        activeProjectIdRef.current = fresh.id;
        setSourceImage(null);
        setActiveImageId(undefined);
        activeImageIdRef.current = undefined;
        return;
      }

      const remaining = projects.filter((p) => p.id !== projectId);
      setProjects(remaining);
      if (activeProjectIdRef.current === projectId) {
        const nextProj = remaining[0];
        setActiveProjectId(nextProj.id);
        activeProjectIdRef.current = nextProj.id;
        if (nextProj.images.length > 0) {
          handleSelectImage(nextProj.images[0].id);
        } else {
          setSourceImage(null);
          setActiveImageId(undefined);
          activeImageIdRef.current = undefined;
        }
      }
    },
    [projects, handleSelectImage]
  );

  // Quick Production Preview
  const handleQuickPreviewImage = useCallback((image: ProjectImage) => {
    setPreviewImageTarget(image);
    setIsProductionPreviewOpen(true);
  }, []);

  // Handle sample image selection
  const handleSampleSelected = useCallback(
    (sample: SampleImage) => {
      setIsLoadingSample(true);
      setIsProcessing(true);
      setStatusMessage(`Loading ${sample.name}...`);

      const setupLoadedSample = (loadedImg: HTMLImageElement) => {
        const sampleImageId = `sample-${sample.id}-${Date.now()}`;
        const newProjImage: ProjectImage = {
          id: sampleImageId,
          name: `${sample.name}.jpg`,
          originalDataUrl: sample.url,
          currentDataUrl: sample.url,
          width: loadedImg.width,
          height: loadedImg.height,
          status: 'original',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          historyCount: 0,
        };

        const targetProjId = activeProjectIdRef.current;
        setProjects((prev) =>
          prev.map((p) =>
            p.id === targetProjId
              ? {
                  ...p,
                  updatedAt: Date.now(),
                  images: [newProjImage, ...p.images],
                }
              : p
          )
        );

        loadNewImage(loadedImg, `${sample.name}.jpg`, sampleImageId);
        setIsLoadingSample(false);
        setIsProcessing(false);
        setStatusMessage('');
      };

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setupLoadedSample(img);
      };
      img.onerror = () => {
        console.error('Failed to load sample image with anonymous CORS, falling back');
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          setupLoadedSample(fallbackImg);
        };
        fallbackImg.src = sample.url;
      };
      img.src = sample.url;
    },
    [loadNewImage]
  );

  // Clipboard paste listener (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleImageFile]);

  // Keyboard shortcuts (Undo, Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const targetIdx = historyIndex - 1;
      const item = history[targetIdx];
      const img = new Image();
      img.onload = () => {
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            canvasRef.current.width = item.width;
            canvasRef.current.height = item.height;
            ctx.drawImage(img, 0, 0);
          }
        }
        setHistoryIndex(targetIdx);
      };
      img.src = item.canvasDataUrl;
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const targetIdx = historyIndex + 1;
      const item = history[targetIdx];
      const img = new Image();
      img.onload = () => {
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            canvasRef.current.width = item.width;
            canvasRef.current.height = item.height;
            ctx.drawImage(img, 0, 0);
          }
        }
        setHistoryIndex(targetIdx);
      };
      img.src = item.canvasDataUrl;
    }
  };

  // Reset all edits back to original image
  const handleReset = () => {
    if (!sourceImage) return;
    const newMask = new Uint8Array(sourceImage.width * sourceImage.height).fill(255);
    maskRef.current = newMask;
    setRotation(0);
    setCropRect({
      x: 0,
      y: 0,
      width: sourceImage.width,
      height: sourceImage.height,
    });
    setResizeSettings({
      width: sourceImage.width,
      height: sourceImage.height,
      maintainAspectRatio: true,
    });
    redrawCanvas();
    pushHistory('Reset to Original');
  };

  // ================= ACTION 1: AUTO REMOVE COMMON BACKGROUND =================
  const handleAutoRemove = () => {
    if (!sourceImage) return;
    setIsProcessing(true);
    setStatusMessage('Identifying common areas and edge gradients...');

    setTimeout(() => {
      try {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = sourceImage.width;
        offCanvas.height = sourceImage.height;
        const ctx = offCanvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(sourceImage, 0, 0);
        const imgData = ctx.getImageData(0, 0, offCanvas.width, offCanvas.height);

        const newMask = autoIdentifyAndRemoveBackground(imgData, autoSettings);
        maskRef.current = newMask;
        redrawCanvas();
        pushHistory('Auto Background Removal');
      } catch (err) {
        console.error('Auto remove error:', err);
      } finally {
        setIsProcessing(false);
        setStatusMessage('');
      }
    }, 50);
  };

  // ================= ACTION 2: MAGIC WAND REMOVE COMMON AREA =================
  const handleWandClick = (imgX: number, imgY: number) => {
    if (!sourceImage || !maskRef.current) return;
    setIsProcessing(true);
    setStatusMessage('Sampling color area...');

    setTimeout(() => {
      try {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = sourceImage.width;
        offCanvas.height = sourceImage.height;
        const ctx = offCanvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(sourceImage, 0, 0);
        const imgData = ctx.getImageData(0, 0, offCanvas.width, offCanvas.height);

        const updatedMask = magicWandRemove(
          imgData,
          maskRef.current!,
          imgX,
          imgY,
          wandSettings
        );
        maskRef.current = updatedMask;
        redrawCanvas();
        pushHistory(`Wand Removed Color at (${imgX}, ${imgY})`);
      } catch (err) {
        console.error('Magic wand error:', err);
      } finally {
        setIsProcessing(false);
        setStatusMessage('');
      }
    }, 20);
  };

  // ================= ACTION 3: BRUSH PAINT (ERASE / RESTORE) =================
  const handleBrushPaint = (imgX: number, imgY: number, isRestore: boolean) => {
    if (!sourceImage || !maskRef.current) return;

    const updated = applyBrushToMask(
      maskRef.current,
      sourceImage.width,
      sourceImage.height,
      imgX,
      imgY,
      brushSettings.size,
      brushSettings.hardness,
      isRestore ? 'restore' : 'erase'
    );
    maskRef.current = updated;
    redrawCanvas();
  };

  const handleBrushEnd = () => {
    pushHistory('Brush Mask Edit');
  };

  // ================= ACTION 4: INVERT & RESET MASK =================
  const handleInvertMask = () => {
    if (!maskRef.current) return;
    const mask = maskRef.current;
    for (let i = 0; i < mask.length; i++) {
      mask[i] = 255 - mask[i];
    }
    redrawCanvas();
    pushHistory('Invert Cutout');
  };

  const handleResetMask = () => {
    if (!sourceImage) return;
    maskRef.current = new Uint8Array(sourceImage.width * sourceImage.height).fill(255);
    redrawCanvas();
    pushHistory('Reset Mask');
  };

  // ================= ACTION 5: AI CUTOUT (GEMINI API) =================
  const handleAiRemove = async () => {
    if (!sourceImage) return;
    setIsProcessing(true);
    setStatusMessage('Analyzing subject contours and common background areas...');

    try {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = sourceImage.width;
      offCanvas.height = sourceImage.height;
      const ctx = offCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not create offscreen canvas');

      ctx.drawImage(sourceImage, 0, 0);
      const base64Image = offCanvas.toDataURL('image/png');

      const response = await fetch('/api/ai-remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });

      const data = await response.json().catch(() => ({}));

      if (data && data.success && data.imageUrl) {
        // Load AI image output and key out the chroma backdrop
        const aiImg = new Image();
        aiImg.onload = () => {
          const aiCanvas = document.createElement('canvas');
          aiCanvas.width = sourceImage.width;
          aiCanvas.height = sourceImage.height;
          const aiCtx = aiCanvas.getContext('2d');
          if (aiCtx) {
            aiCtx.drawImage(aiImg, 0, 0, sourceImage.width, sourceImage.height);
            const aiData = aiCtx.getImageData(0, 0, sourceImage.width, sourceImage.height);
            const aiMask = keyOutGreenScreen(aiData);
            maskRef.current = aiMask;
            redrawCanvas();
            pushHistory('AI Subject Cutout');
          }
          setIsProcessing(false);
          setStatusMessage('');
        };
        aiImg.onerror = () => {
          handleAutoRemove();
        };
        aiImg.src = data.imageUrl;
        return;
      }

      // If AI service is not configured or unavailable, use smart edge-preserving segmentation
      console.info('Using high-precision local segmentation:', data?.error || 'Local mode');
      setStatusMessage('Applying edge-preserving background segmentation...');
      handleAutoRemove();
    } catch (err: any) {
      console.info('Using smart local segmentation fallback:', err?.message || err);
      handleAutoRemove();
    }
  };

  // ================= ACTION 6: CROP & ROTATE =================
  const handleSetAspectRatio = (ratio: AspectRatio) => {
    if (!sourceImage) return;
    const w = sourceImage.width;
    const h = sourceImage.height;

    if (ratio === 'free') {
      setCropRect({ x: 0, y: 0, width: w, height: h });
      return;
    }

    let targetRatio = 1;
    if (ratio === '1:1') targetRatio = 1;
    else if (ratio === '4:3') targetRatio = 4 / 3;
    else if (ratio === '16:9') targetRatio = 16 / 9;
    else if (ratio === '9:16') targetRatio = 9 / 16;
    else if (ratio === '3:2') targetRatio = 3 / 2;
    else if (ratio === '2:3') targetRatio = 2 / 3;

    let cropW = w;
    let cropH = Math.round(w / targetRatio);

    if (cropH > h) {
      cropH = h;
      cropW = Math.round(h * targetRatio);
    }

    const startX = Math.round((w - cropW) / 2);
    const startY = Math.round((h - cropH) / 2);

    setCropRect({
      x: startX,
      y: startY,
      width: cropW,
      height: cropH,
    });
  };

  const handleRotate90 = (dir: 'cw' | 'ccw') => {
    setRotation((r) => r + (dir === 'cw' ? 90 : -90));
  };

  const handleFlip = (dir: 'h' | 'v') => {
    if (!canvasRef.current) return;
    const workingCanvas = canvasRef.current;
    const transformed = applyCropAndTransform(
      workingCanvas,
      { x: 0, y: 0, width: workingCanvas.width, height: workingCanvas.height },
      0,
      dir === 'h',
      dir === 'v'
    );

    const newImg = new Image();
    newImg.onload = () => {
      setSourceImage(newImg);
      maskRef.current = new Uint8Array(newImg.width * newImg.height).fill(255);
      setImageWidth(newImg.width);
      setImageHeight(newImg.height);
      setResizeSettings((s) => ({ ...s, width: newImg.width, height: newImg.height }));
      setCropRect({ x: 0, y: 0, width: newImg.width, height: newImg.height });
      pushHistory(`Flipped ${dir === 'h' ? 'Horizontal' : 'Vertical'}`);
    };
    newImg.src = transformed.toDataURL('image/png');
  };

  const handleApplyCrop = () => {
    if (!canvasRef.current) return;
    const workingCanvas = canvasRef.current;

    const croppedCanvas = applyCropAndTransform(
      workingCanvas,
      cropRect,
      rotation,
      false,
      false
    );

    const newImg = new Image();
    newImg.onload = () => {
      setSourceImage(newImg);
      // Reset mask to opaque for newly cropped bounds (since canvas already baked previous mask)
      maskRef.current = new Uint8Array(newImg.width * newImg.height).fill(255);
      setImageWidth(newImg.width);
      setImageHeight(newImg.height);
      setRotation(0);
      setCropRect({ x: 0, y: 0, width: newImg.width, height: newImg.height });
      setResizeSettings((s) => ({
        ...s,
        width: newImg.width,
        height: newImg.height,
      }));
      setTool('auto');
      pushHistory(`Applied Crop (${newImg.width} × ${newImg.height} px)`);
    };
    newImg.src = croppedCanvas.toDataURL('image/png');
  };

  const handleCancelCrop = () => {
    if (!sourceImage) return;
    setCropRect({
      x: 0,
      y: 0,
      width: sourceImage.width,
      height: sourceImage.height,
    });
    setRotation(0);
  };

  // ================= ACTION 7: RESIZE =================
  const handleApplyResize = () => {
    if (!canvasRef.current) return;
    const workingCanvas = canvasRef.current;

    const resizedCanvas = applyResize(
      workingCanvas,
      resizeSettings.width,
      resizeSettings.height
    );

    const newImg = new Image();
    newImg.onload = () => {
      setSourceImage(newImg);
      maskRef.current = new Uint8Array(newImg.width * newImg.height).fill(255);
      setImageWidth(newImg.width);
      setImageHeight(newImg.height);
      setCropRect({ x: 0, y: 0, width: newImg.width, height: newImg.height });
      pushHistory(`Resized to ${newImg.width} × ${newImg.height} px`);
    };
    newImg.src = resizedCanvas.toDataURL('image/png');
  };

  const handlePresetResize = (w: number, h: number) => {
    setResizeSettings({
      width: w,
      height: h,
      maintainAspectRatio: false,
    });
  };

  const handlePercentResize = (pct: number) => {
    if (imageWidth > 0 && imageHeight > 0) {
      const scale = pct / 100;
      setResizeSettings({
        width: Math.round(imageWidth * scale),
        height: Math.round(imageHeight * scale),
        maintainAspectRatio: true,
      });
    }
  };

  // ================= ACTION 8: DOWNLOAD & COPY =================
  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadCanvas(
      canvasRef.current,
      backdrop,
      exportSettings.fileName,
      exportSettings.format,
      exportSettings.quality
    );
  };

  const handleCopy = async () => {
    if (!canvasRef.current) return;
    const success = await copyCanvasToClipboard(canvasRef.current, backdrop);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-900 text-slate-900 overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        hasImage={Boolean(sourceImage)}
        fileName={fileName}
        width={imageWidth}
        height={imageHeight}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onReset={handleReset}
        onNewImage={() => {
          setSourceImage(null);
          setActiveImageId(undefined);
          activeImageIdRef.current = undefined;
        }}
        onDownload={handleDownload}
        onCopy={handleCopy}
        isCopied={isCopied}
        onOpenSamples={() => setIsSamplesModalOpen(true)}
        backdrop={backdrop}
        isDashboardOpen={isSideDashboardOpen}
        onToggleDashboard={() => setIsSideDashboardOpen((v) => !v)}
        imageCount={(activeProject?.images || []).length}
        projectName={activeProject?.name || 'Project'}
        onOpenPreview={() => {
          setPreviewImageTarget(null);
          setIsProductionPreviewOpen(true);
        }}
        hasEdits={Boolean(currentProjectImage?.status === 'edited' || historyIndex > 0)}
      />

      {/* Main Body Area: Side Dashboard + Canvas Workspace / Uploader */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side Dashboard for Projects & Images */}
        <SideDashboard
          isOpen={isSideDashboardOpen}
          onToggle={() => setIsSideDashboardOpen((v) => !v)}
          onClose={() => setIsSideDashboardOpen(false)}
          projects={projects}
          activeProject={activeProject}
          activeProjectId={activeProjectId}
          activeImageId={activeImageId}
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
          onToggleProjectComplete={handleToggleProjectStatus}
          onToggleProjectStatus={handleToggleProjectStatus}
          onDeleteProject={handleDeleteProject}
          onSelectImage={handleSelectImage}
          onImportFiles={handleImportFiles}
          onImportImages={handleImportFiles}
          onDeleteImage={handleDeleteImage}
          onQuickPreviewImage={handleQuickPreviewImage}
          onQuickPreview={handleQuickPreviewImage}
          onOpenSamples={() => setIsSamplesModalOpen(true)}
        />

        {/* Central Workspace & Tools */}
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative bg-slate-950">
          {sourceImage ? (
            <>
              {/* Center Canvas Workspace */}
              <Workspace
                canvasRef={canvasRef}
                originalImage={sourceImage}
                tool={tool}
                brushSettings={brushSettings}
                cropRect={cropRect}
                onCropChange={setCropRect}
                onWandClick={handleWandClick}
                onBrushPaint={handleBrushPaint}
                onBrushEnd={handleBrushEnd}
                backdrop={backdrop}
                isProcessing={isProcessing}
                statusMessage={statusMessage}
                onOpenProductionPreview={() => {
                  setPreviewImageTarget(null);
                  setIsProductionPreviewOpen(true);
                }}
              />

              {/* Right Tool Sidebar */}
              <ToolPanel
                tool={tool}
                setTool={setTool}
                autoSettings={autoSettings}
                setAutoSettings={setAutoSettings}
                onAutoRemove={handleAutoRemove}
                onAiRemove={handleAiRemove}
                isAiAvailable={true}
                wandSettings={wandSettings}
                setWandSettings={setWandSettings}
                brushSettings={brushSettings}
                setBrushSettings={setBrushSettings}
                onInvertMask={handleInvertMask}
                onResetMask={handleResetMask}
                cropRect={cropRect}
                imageWidth={imageWidth}
                imageHeight={imageHeight}
                onSetAspectRatio={handleSetAspectRatio}
                onApplyCrop={handleApplyCrop}
                onCancelCrop={handleCancelCrop}
                rotation={rotation}
                setRotation={setRotation}
                onRotate90={handleRotate90}
                onFlip={handleFlip}
                resizeSettings={resizeSettings}
                setResizeSettings={setResizeSettings}
                onApplyResize={handleApplyResize}
                onPresetResize={handlePresetResize}
                onPercentResize={handlePercentResize}
                backdrop={backdrop}
                setBackdrop={setBackdrop}
                exportSettings={exportSettings}
                setExportSettings={setExportSettings}
                onDownload={handleDownload}
                onCopy={handleCopy}
                isCopied={isCopied}
                isProcessing={isProcessing}
              />
            </>
          ) : (
            <ImageUploader
              onImageSelected={handleImageFile}
              onImagesSelected={handleImportFiles}
              onSampleSelected={handleSampleSelected}
              isLoadingSample={isLoadingSample}
              projectName={activeProject?.name || 'Project'}
              hasExistingImages={(activeProject?.images || []).length > 0}
              onOpenDashboard={() => setIsSideDashboardOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Production Preview Modal */}
      <ProductionPreviewModal
        isOpen={isProductionPreviewOpen}
        onClose={() => {
          setIsProductionPreviewOpen(false);
          setPreviewImageTarget(null);
        }}
        canvasRef={canvasRef}
        originalImage={sourceImage}
        originalDataUrl={
          previewImageTarget?.originalDataUrl ||
          currentProjectImage?.originalDataUrl ||
          sourceImage?.src ||
          ''
        }
        currentDataUrl={
          previewImageTarget?.currentDataUrl ||
          (canvasRef.current ? canvasRef.current.toDataURL('image/png') : '') ||
          currentProjectImage?.currentDataUrl ||
          ''
        }
        imageName={previewImageTarget?.name || fileName}
        width={previewImageTarget?.width || imageWidth}
        height={previewImageTarget?.height || imageHeight}
        hasEdits={Boolean(
          previewImageTarget?.status === 'edited' ||
            currentProjectImage?.status === 'edited' ||
            historyIndex > 0
        )}
        backdrop={backdrop}
      />

      {/* Samples Modal */}
      <SamplesModal
        isOpen={isSamplesModalOpen}
        onClose={() => setIsSamplesModalOpen(false)}
        onSelectSample={handleSampleSelected}
        isLoading={isLoadingSample}
      />
    </div>
  );
};

export default App;
