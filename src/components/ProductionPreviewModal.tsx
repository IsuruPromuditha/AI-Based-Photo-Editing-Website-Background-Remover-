import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Columns,
  Maximize2,
  ZoomIn,
  Eye,
  Sliders,
  Sparkles,
  Layers,
} from 'lucide-react';
import { BackdropConfig, BackdropType, PreviewComparisonMode } from '../types';
import { copyCanvasToClipboard, downloadCanvas } from '../lib/imageTransform';

export interface ProductionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  originalImage?: HTMLImageElement | null;
  originalDataUrl?: string;
  currentDataUrl?: string;
  fileName?: string;
  imageName?: string;
  width?: number;
  height?: number;
  hasEdits?: boolean;
  backdrop?: BackdropConfig;
}

const PREVIEW_BACKDROPS: { id: string; label: string; config: BackdropConfig }[] = [
  { id: 'transparent', label: 'Checkerboard', config: { type: 'transparent', color: '#ffffff', gradient: 'studio' } },
  { id: 'white', label: 'E-commerce White', config: { type: 'color', color: '#ffffff', gradient: 'studio' } },
  { id: 'dark', label: 'Studio Dark', config: { type: 'color', color: '#0f172a', gradient: 'studio' } },
  { id: 'gray', label: 'Clean Gray', config: { type: 'color', color: '#f1f5f9', gradient: 'studio' } },
  { id: 'green', label: 'Chroma Green', config: { type: 'color', color: '#00ff00', gradient: 'studio' } },
  { id: 'sunset', label: 'Sunset Glow', config: { type: 'gradient', color: '#ffffff', gradient: 'sunset' } },
  { id: 'neon', label: 'Neon Cyber', config: { type: 'gradient', color: '#ffffff', gradient: 'neon' } },
];

export const ProductionPreviewModal: React.FC<ProductionPreviewModalProps> = ({
  isOpen,
  onClose,
  canvasRef,
  originalImage,
  originalDataUrl,
  currentDataUrl,
  fileName,
  imageName,
  width,
  height,
  hasEdits,
  backdrop: defaultBackdrop = { type: 'transparent', color: '#ffffff', gradient: 'studio' },
}) => {
  const [activeBackdrop, setActiveBackdrop] = useState<BackdropConfig>(defaultBackdrop);
  const [viewMode, setViewMode] = useState<PreviewComparisonMode>('cutout');
  const [splitPos, setSplitPos] = useState<number>(50);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'webp' | 'jpeg'>('png');

  const isDraggingSplit = useRef(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const displayFileName = imageName || fileName || 'cutout.png';
  const displayWidth = width || 800;
  const displayHeight = height || 600;

  // Derive cutouts and original sources safely without crashing on missing canvasRef
  const editedDataUrl =
    currentDataUrl ||
    (canvasRef?.current ? canvasRef.current.toDataURL('image/png') : '') ||
    originalDataUrl ||
    originalImage?.src ||
    '';

  const originalSrc = originalDataUrl || originalImage?.src || '';

  const handleDownload = () => {
    const cleanName = displayFileName.replace(/\.[^/.]+$/, '');

    // If canvasRef is available and valid, use direct canvas download
    if (
      canvasRef?.current &&
      (!currentDataUrl || canvasRef.current.toDataURL('image/png') === currentDataUrl)
    ) {
      downloadCanvas(
        canvasRef.current,
        activeBackdrop,
        `${cleanName}-production-preview`,
        exportFormat,
        0.95
      );
      return;
    }

    // Otherwise render image into an offscreen canvas
    if (!editedDataUrl) return;
    const offscreenImg = new Image();
    offscreenImg.crossOrigin = 'anonymous';
    offscreenImg.onload = () => {
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = offscreenImg.naturalWidth || displayWidth;
      offscreenCanvas.height = offscreenImg.naturalHeight || displayHeight;
      const ctx = offscreenCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(offscreenImg, 0, 0);
        downloadCanvas(
          offscreenCanvas,
          activeBackdrop,
          `${cleanName}-production-preview`,
          exportFormat,
          0.95
        );
      }
    };
    offscreenImg.src = editedDataUrl;
  };

  const handleCopy = async () => {
    // If canvasRef is available and valid, use direct copy
    if (
      canvasRef?.current &&
      (!currentDataUrl || canvasRef.current.toDataURL('image/png') === currentDataUrl)
    ) {
      const ok = await copyCanvasToClipboard(canvasRef.current, activeBackdrop);
      if (ok) {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
      return;
    }

    // Otherwise render image into an offscreen canvas
    if (!editedDataUrl) return;
    const offscreenImg = new Image();
    offscreenImg.crossOrigin = 'anonymous';
    offscreenImg.onload = async () => {
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = offscreenImg.naturalWidth || displayWidth;
      offscreenCanvas.height = offscreenImg.naturalHeight || displayHeight;
      const ctx = offscreenCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(offscreenImg, 0, 0);
        const ok = await copyCanvasToClipboard(offscreenCanvas, activeBackdrop);
        if (ok) {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        }
      }
    };
    offscreenImg.src = editedDataUrl;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSplit.current && previewContainerRef.current) {
      const rect = previewContainerRef.current.getBoundingClientRect();
      const pos = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPos(Math.max(5, Math.min(95, pos)));
    }
  };

  const handleMouseUp = () => {
    isDraggingSplit.current = false;
  };

  const getBackdropStyle = () => {
    if (activeBackdrop.type === 'color') {
      return { backgroundColor: activeBackdrop.color };
    }
    if (activeBackdrop.type === 'gradient') {
      if (activeBackdrop.gradient === 'sunset') {
        return { background: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)' };
      }
      if (activeBackdrop.gradient === 'neon') {
        return { background: 'linear-gradient(135deg, #111827 0%, #312e81 50%, #4c1d95 100%)' };
      }
      return { background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' };
    }
    // Transparent pattern
    return {
      backgroundImage: `linear-gradient(45deg, #cbd5e1 25%, transparent 25%),
                        linear-gradient(-45deg, #cbd5e1 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #cbd5e1 75%),
                        linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)`,
      backgroundSize: '16px 16px',
      backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
      backgroundColor: '#f8fafc',
    };
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 select-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Production Preview
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Ready for Production
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">
                {displayFileName} • {displayWidth} × {displayHeight} px
              </p>
            </div>
          </div>

          {/* View Modes & Zoom */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-0.5 flex items-center text-xs">
              <button
                onClick={() => setViewMode('cutout')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  viewMode === 'cutout'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cutout
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'split'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Split Slider</span>
              </button>
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  viewMode === 'side-by-side'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Side-by-Side
              </button>
            </div>

            {/* Zoom Toggle */}
            <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-0.5 flex items-center text-xs text-slate-400">
              <button
                onClick={() => setZoomLevel(1)}
                className={`px-2 py-1 rounded hover:text-white cursor-pointer ${
                  zoomLevel === 1 ? 'bg-slate-700 text-white' : ''
                }`}
                title="Fit to Screen"
              >
                Fit
              </button>
              <button
                onClick={() => setZoomLevel(1.5)}
                className={`px-2 py-1 rounded hover:text-white cursor-pointer ${
                  zoomLevel === 1.5 ? 'bg-slate-700 text-white' : ''
                }`}
                title="150% Scale"
              >
                150%
              </button>
              <button
                onClick={() => setZoomLevel(2)}
                className={`px-2 py-1 rounded hover:text-white cursor-pointer ${
                  zoomLevel === 2 ? 'bg-slate-700 text-white' : ''
                }`}
                title="200% Pixel Inspection"
              >
                200%
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Backdrop Selector Ribbon */}
        <div className="px-5 py-2 border-b border-slate-800/80 bg-slate-900/50 flex items-center gap-2 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px] mr-1 shrink-0">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Test Backdrop:</span>
          </div>
          {PREVIEW_BACKDROPS.map((b) => {
            const isActive =
              activeBackdrop.type === b.config.type &&
              (b.config.type === 'transparent' ||
                (b.config.type === 'color' && activeBackdrop.color === b.config.color) ||
                (b.config.type === 'gradient' && activeBackdrop.gradient === b.config.gradient));
            return (
              <button
                key={b.id}
                onClick={() => setActiveBackdrop(b.config)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/40'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/30"
                  style={{
                    backgroundColor:
                      b.config.type === 'color'
                        ? b.config.color
                        : b.config.type === 'transparent'
                        ? '#cbd5e1'
                        : '#ff7e5f',
                  }}
                />
                {b.label}
              </button>
            );
          })}
        </div>

        {/* Main Preview Stage Area */}
        <div
          ref={previewContainerRef}
          className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/60 relative select-none"
        >
          {viewMode === 'side-by-side' ? (
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full h-full max-w-4xl">
              {/* Left: Original */}
              <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/80 rounded-xl border border-slate-800 p-3 h-full max-h-[500px]">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span>Original Image</span>
                </div>
                <div className="flex-1 flex items-center justify-center overflow-hidden w-full rounded-lg bg-black/40">
                  {originalSrc && (
                    <img
                      src={originalSrc}
                      alt="Original"
                      className="max-h-full max-w-full object-contain"
                    />
                  )}
                </div>
              </div>

              {/* Right: Edited Cutout */}
              <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/80 rounded-xl border border-slate-800 p-3 h-full max-h-[500px]">
                <div className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Production Cutout</span>
                </div>
                <div
                  className="flex-1 flex items-center justify-center overflow-hidden w-full rounded-lg shadow-inner"
                  style={getBackdropStyle()}
                >
                  <img
                    src={editedDataUrl}
                    alt="Edited Cutout"
                    className="max-h-full max-w-full object-contain drop-shadow-md"
                  />
                </div>
              </div>
            </div>
          ) : viewMode === 'split' ? (
            /* Split Slider View */
            <div
              className="relative rounded-xl overflow-hidden shadow-2xl border border-slate-700/60 max-w-3xl max-h-[560px] flex items-center justify-center"
              style={{
                width: `${Math.min(800, displayWidth)}px`,
                aspectRatio: `${displayWidth} / ${displayHeight}`,
              }}
            >
              {/* Backdrop underneath cutout */}
              <div className="absolute inset-0" style={getBackdropStyle()} />

              {/* Cutout Image (Right / base side) */}
              <img
                src={editedDataUrl}
                alt="Production Cutout"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                style={{ transform: `scale(${zoomLevel})` }}
              />

              {/* Original Image (Left side clipped) */}
              {originalSrc && (
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{
                    clipPath: `polygon(0 0, ${splitPos}% 0, ${splitPos}% 100%, 0 100%)`,
                  }}
                >
                  <img
                    src={originalSrc}
                    alt="Original"
                    className="w-full h-full object-contain"
                    style={{ transform: `scale(${zoomLevel})` }}
                  />
                  <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-xs text-white text-[11px] px-2 py-0.5 rounded font-mono font-medium">
                    Original
                  </div>
                </div>
              )}

              {/* Right label for cutout */}
              <div className="absolute top-3 right-3 bg-indigo-900/80 backdrop-blur-xs text-indigo-200 border border-indigo-500/40 text-[11px] px-2 py-0.5 rounded font-mono font-medium">
                Cutout
              </div>

              {/* Draggable Divider */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.6)] cursor-ew-resize z-20"
                style={{ left: `${splitPos}%` }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  isDraggingSplit.current = true;
                }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-slate-800 shadow-lg flex items-center justify-center text-[10px] font-bold">
                  ↔
                </div>
              </div>
            </div>
          ) : (
            /* Single Cutout Mode */
            <div
              className="relative rounded-xl overflow-hidden shadow-2xl border border-slate-700/60 max-w-3xl max-h-[560px] flex items-center justify-center p-2"
              style={getBackdropStyle()}
            >
              <img
                src={editedDataUrl}
                alt="Production Cutout"
                className="max-h-[500px] max-w-full object-contain drop-shadow-xl transition-transform duration-100"
                style={{ transform: `scale(${zoomLevel})` }}
              />
            </div>
          )}
        </div>

        {/* Bottom Bar: Quick Info & Actions */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div>
              <span className="text-slate-500">Dimensions: </span>
              <span className="font-mono text-white">{displayWidth} × {displayHeight} px</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-slate-500">Aspect Ratio: </span>
              <span className="text-white font-mono">{(displayWidth / (displayHeight || 1)).toFixed(2)}:1</span>
            </div>
            <div className="hidden md:block">
              <span className="text-slate-500">Transparency: </span>
              <span className="text-emerald-400 font-medium">Alpha Preserved</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Format Selector */}
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
            >
              <option value="png">PNG (Lossless Alpha)</option>
              <option value="webp">WebP (Optimized)</option>
              <option value="jpeg">JPEG (Solid Backdrop)</option>
            </select>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Download button */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-4 py-1.5 rounded-lg shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Cutout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
