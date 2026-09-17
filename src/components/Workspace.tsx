import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Columns,
  Eye,
  Crosshair,
  Crop as CropIcon,
  Eraser,
  Paintbrush,
  Move,
} from 'lucide-react';
import {
  ActiveTool,
  BackdropConfig,
  BrushSettings,
  CropRect,
} from '../types';

interface WorkspaceProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  originalImage: HTMLImageElement | null;
  tool: ActiveTool;
  brushSettings: BrushSettings;
  cropRect: CropRect;
  onCropChange: (rect: CropRect) => void;
  onWandClick: (imgX: number, imgY: number) => void;
  onBrushPaint: (imgX: number, imgY: number, isRestore: boolean) => void;
  onBrushEnd: () => void;
  backdrop: BackdropConfig;
  isProcessing: boolean;
  statusMessage?: string;
  onOpenProductionPreview?: () => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  canvasRef,
  originalImage,
  tool,
  brushSettings,
  cropRect,
  onCropChange,
  onWandClick,
  onBrushPaint,
  onBrushEnd,
  backdrop,
  isProcessing,
  statusMessage,
  onOpenProductionPreview,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Compare mode: 'none' | 'split'
  const [compareMode, setCompareMode] = useState<'none' | 'split'>('none');
  const [splitPos, setSplitPos] = useState(50); // percentage 0-100
  const isDraggingSplit = useRef(false);

  // Crop drag state
  const [cropDragMode, setCropDragMode] = useState<string | null>(null);
  const [cropStart, setCropStart] = useState<{
    mouseX: number;
    mouseY: number;
    rect: CropRect;
  } | null>(null);

  // Fit to screen on initial image load
  useEffect(() => {
    if (!originalImage || !containerRef.current) return;
    const container = containerRef.current;
    const padding = 60;
    const availWidth = container.clientWidth - padding;
    const availHeight = container.clientHeight - padding;

    if (availWidth > 0 && availHeight > 0) {
      const scaleX = availWidth / originalImage.width;
      const scaleY = availHeight / originalImage.height;
      const initialScale = Math.min(scaleX, scaleY, 1);
      setZoom(Math.max(0.1, Number(initialScale.toFixed(2))));
      setPan({ x: 0, y: 0 });
    }
  }, [originalImage]);

  // Convert client coordinates to image coordinates
  const clientToImageCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef?.current) return null;
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const imgX = Math.round((clientX - rect.left) * scaleX);
      const imgY = Math.round((clientY - rect.top) * scaleY);

      if (
        imgX < 0 ||
        imgX >= canvas.width ||
        imgY < 0 ||
        imgY >= canvas.height
      ) {
        return null;
      }

      return { imgX, imgY };
    },
    [canvasRef]
  );

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoom((prev) => Math.min(4, Math.max(0.15, Number((prev + delta).toFixed(2)))));
    }
  };

  // Mouse event handlers on workspace
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Pan with middle click or Alt+Click
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (isDraggingSplit.current) return;

    if (tool === 'wand') {
      const coords = clientToImageCoords(e.clientX, e.clientY);
      if (coords) {
        onWandClick(coords.imgX, coords.imgY);
      }
    } else if (tool === 'erase' || tool === 'restore') {
      const coords = clientToImageCoords(e.clientX, e.clientY);
      if (coords) {
        onBrushPaint(coords.imgX, coords.imgY, tool === 'restore');
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Track cursor for custom brush indicator
    if (containerRef.current) {
      const b = containerRef.current.getBoundingClientRect();
      setCursorPos({ x: e.clientX - b.left, y: e.clientY - b.top });
    }

    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
      return;
    }

    if (isDraggingSplit.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const pct = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
      setSplitPos(pct);
      return;
    }

    // Painting with brush
    if (e.buttons === 1 && (tool === 'erase' || tool === 'restore')) {
      const coords = clientToImageCoords(e.clientX, e.clientY);
      if (coords) {
        onBrushPaint(coords.imgX, coords.imgY, tool === 'restore');
      }
      return;
    }

    // Crop dragging
    if (cropDragMode && cropStart && canvasRef?.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const dx = (e.clientX - cropStart.mouseX) * scaleX;
      const dy = (e.clientY - cropStart.mouseY) * scaleY;
      const orig = cropStart.rect;
      const maxW = canvas.width;
      const maxH = canvas.height;

      let newRect = { ...orig };

      if (cropDragMode === 'move') {
        newRect.x = Math.max(0, Math.min(maxW - orig.width, orig.x + dx));
        newRect.y = Math.max(0, Math.min(maxH - orig.height, orig.y + dy));
      } else {
        if (cropDragMode.includes('e')) {
          newRect.width = Math.max(20, Math.min(maxW - orig.x, orig.width + dx));
        }
        if (cropDragMode.includes('s')) {
          newRect.height = Math.max(20, Math.min(maxH - orig.y, orig.height + dy));
        }
        if (cropDragMode.includes('w')) {
          const clampedX = Math.max(0, Math.min(orig.x + orig.width - 20, orig.x + dx));
          newRect.width = orig.width + (orig.x - clampedX);
          newRect.x = clampedX;
        }
        if (cropDragMode.includes('n')) {
          const clampedY = Math.max(0, Math.min(orig.y + orig.height - 20, orig.y + dy));
          newRect.height = orig.height + (orig.y - clampedY);
          newRect.y = clampedY;
        }
      }

      onCropChange({
        x: Math.round(newRect.x),
        y: Math.round(newRect.y),
        width: Math.round(newRect.width),
        height: Math.round(newRect.height),
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    isDraggingSplit.current = false;
    if (cropDragMode) {
      setCropDragMode(null);
      setCropStart(null);
    }
    if (tool === 'erase' || tool === 'restore') {
      onBrushEnd();
    }
  };

  // Zoom control helpers
  const handleZoomIn = () => setZoom((z) => Math.min(4, Number((z + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.15, Number((z - 0.25).toFixed(2))));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Calculate crop overlay pixel coordinates relative to the canvas display
  const getCropDisplayBounds = () => {
    if (!canvasRef?.current) return null;
    const canvas = canvasRef.current;
    const displayW = canvas.width * zoom;
    const displayH = canvas.height * zoom;

    const scaleX = displayW / canvas.width;
    const scaleY = displayH / canvas.height;

    return {
      left: cropRect.x * scaleX,
      top: cropRect.y * scaleY,
      width: cropRect.width * scaleX,
      height: cropRect.height * scaleY,
      canvasW: displayW,
      canvasH: displayH,
    };
  };

  const cropDisplay = tool === 'crop' ? getCropDisplayBounds() : null;

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        handleMouseUp();
        setCursorPos(null);
      }}
      className={`relative flex-1 h-full w-full overflow-hidden bg-slate-900 select-none flex items-center justify-center ${
        tool === 'wand'
          ? 'cursor-crosshair'
          : tool === 'erase' || tool === 'restore'
          ? 'cursor-none'
          : isPanning
          ? 'cursor-grabbing'
          : 'cursor-default'
      }`}
    >
      {/* Background Checkerboard pattern for workspace canvas container */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Main Scaled & Panned Canvas Viewport */}
      <div
        className="relative transition-transform duration-75 origin-center shadow-2xl"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* Checkerboard Backdrop underneath transparent parts */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              backdrop.type === 'transparent'
                ? `linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
                   linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
                   linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
                   linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)`
                : backdrop.type === 'color'
                ? 'none'
                : 'none',
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
            backgroundColor:
              backdrop.type === 'color'
                ? backdrop.color
                : backdrop.type === 'transparent'
                ? '#f8fafc'
                : 'transparent',
          }}
        />

        {/* Primary Working Canvas */}
        <canvas
          ref={canvasRef}
          className="relative block max-w-none shadow-lg"
          style={{
            imageRendering: zoom > 2 ? 'pixelated' : 'auto',
          }}
        />

        {/* Before / After Split View Comparison Overlay */}
        {compareMode === 'split' && originalImage && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{
              clipPath: `polygon(0 0, ${splitPos}% 0, ${splitPos}% 100%, 0 100%)`,
            }}
          >
            <img
              src={originalImage.src}
              alt="Original"
              className="w-full h-full object-fill pointer-events-none"
            />
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[11px] px-2 py-0.5 rounded font-mono font-medium tracking-wide">
              Original
            </div>
          </div>
        )}

        {/* Split Divider Handle */}
        {compareMode === 'split' && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-ew-resize z-20"
            style={{ left: `${splitPos}%` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              isDraggingSplit.current = true;
            }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-slate-800 shadow-md flex items-center justify-center text-[10px] font-bold">
              ↔
            </div>
          </div>
        )}

        {/* Interactive Crop Overlay Box */}
        {tool === 'crop' && cropDisplay && (
          <div
            className="absolute inset-0 z-20"
            style={{ width: cropDisplay.canvasW, height: cropDisplay.canvasH }}
          >
            {/* Darkened mask around the crop rectangle */}
            <div
              className="absolute bg-black/60 backdrop-blur-xs pointer-events-none"
              style={{
                top: 0,
                left: 0,
                right: 0,
                height: cropDisplay.top,
              }}
            />
            <div
              className="absolute bg-black/60 backdrop-blur-xs pointer-events-none"
              style={{
                top: cropDisplay.top,
                left: 0,
                width: cropDisplay.left,
                height: cropDisplay.height,
              }}
            />
            <div
              className="absolute bg-black/60 backdrop-blur-xs pointer-events-none"
              style={{
                top: cropDisplay.top,
                right: 0,
                left: cropDisplay.left + cropDisplay.width,
                height: cropDisplay.height,
              }}
            />
            <div
              className="absolute bg-black/60 backdrop-blur-xs pointer-events-none"
              style={{
                top: cropDisplay.top + cropDisplay.height,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />

            {/* Active Crop Box with grid and handles */}
            <div
              className="absolute border-2 border-white/90 shadow-2xl cursor-move"
              style={{
                left: cropDisplay.left,
                top: cropDisplay.top,
                width: cropDisplay.width,
                height: cropDisplay.height,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setCropDragMode('move');
                setCropStart({
                  mouseX: e.clientX,
                  mouseY: e.clientY,
                  rect: { ...cropRect },
                });
              }}
            >
              {/* Rule of Thirds Grid Lines */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30">
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-white" />
                <div className="border-r border-white" />
                <div />
              </div>

              {/* Crop Dimensions label */}
              <div className="absolute -top-7 left-0 px-2 py-0.5 rounded bg-black/80 text-white font-mono text-[10px] pointer-events-none">
                {cropRect.width} × {cropRect.height} px
              </div>

              {/* 8 Drag Handles */}
              {[
                { id: 'nw', cursor: 'nwse-resize', pos: '-top-1.5 -left-1.5' },
                { id: 'n', cursor: 'ns-resize', pos: '-top-1.5 left-1/2 -translate-x-1/2' },
                { id: 'ne', cursor: 'nesw-resize', pos: '-top-1.5 -right-1.5' },
                { id: 'e', cursor: 'ew-resize', pos: 'top-1/2 -translate-y-1/2 -right-1.5' },
                { id: 'se', cursor: 'nwse-resize', pos: '-bottom-1.5 -right-1.5' },
                { id: 's', cursor: 'ns-resize', pos: '-bottom-1.5 left-1/2 -translate-x-1/2' },
                { id: 'sw', cursor: 'nesw-resize', pos: '-bottom-1.5 -left-1.5' },
                { id: 'w', cursor: 'ew-resize', pos: 'top-1/2 -translate-y-1/2 -left-1.5' },
              ].map((h) => (
                <div
                  key={h.id}
                  className={`absolute w-3.5 h-3.5 bg-white border border-slate-700 shadow-md rounded-xs ${h.pos} ${h.cursor} z-30`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setCropDragMode(h.id);
                    setCropStart({
                      mouseX: e.clientX,
                      mouseY: e.clientY,
                      rect: { ...cropRect },
                    });
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Custom Circular Brush Cursor Follower for Erase/Restore */}
      {(tool === 'erase' || tool === 'restore') && cursorPos && (
        <div
          className="pointer-events-none fixed z-50 rounded-full border-2 transform -translate-x-1/2 -translate-y-1/2 shadow-xs transition-none"
          style={{
            left: cursorPos.x + (containerRef.current?.getBoundingClientRect().left || 0),
            top: cursorPos.y + (containerRef.current?.getBoundingClientRect().top || 0),
            width: Math.max(6, brushSettings.size * zoom),
            height: Math.max(6, brushSettings.size * zoom),
            borderColor: tool === 'erase' ? '#ef4444' : '#10b981',
            backgroundColor:
              tool === 'erase' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          }}
        />
      )}

      {/* Floating Processing Loader Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center z-40 text-white">
          <div className="w-12 h-12 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin mb-3" />
          <div className="text-sm font-medium tracking-tight">
            {statusMessage || 'Processing image...'}
          </div>
          <div className="text-xs text-slate-400 mt-1">Analyzing common areas and pixels</div>
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-1.5 flex items-center gap-2 text-white shadow-xl z-30">
        {/* Zoom Controls */}
        <button
          onClick={handleZoomOut}
          title="Zoom out"
          className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-300 hover:text-white"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span
          onClick={handleResetZoom}
          title="Click to reset zoom to 100%"
          className="text-xs font-mono w-12 text-center text-slate-300 cursor-pointer hover:text-white"
        >
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={handleZoomIn}
          title="Zoom in"
          className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-300 hover:text-white"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-700 mx-1" />

        {/* Fit to screen */}
        <button
          onClick={() => {
            if (originalImage && containerRef.current) {
              const availW = containerRef.current.clientWidth - 80;
              const availH = containerRef.current.clientHeight - 80;
              const s = Math.min(availW / originalImage.width, availH / originalImage.height, 1);
              setZoom(Math.max(0.1, Number(s.toFixed(2))));
              setPan({ x: 0, y: 0 });
            }
          }}
          title="Fit image to screen"
          className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-300 hover:text-white flex items-center gap-1 text-xs"
        >
          <Maximize className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Fit</span>
        </button>

        <div className="w-px h-4 bg-slate-700 mx-1" />

        {/* Compare / Split Mode Toggle */}
        <button
          onClick={() => setCompareMode((m) => (m === 'split' ? 'none' : 'split'))}
          title="Toggle Before / After Split Slider"
          className={`px-2 py-1 rounded text-xs flex items-center gap-1.5 transition-colors font-medium cursor-pointer ${
            compareMode === 'split'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'hover:bg-slate-700 text-slate-300'
          }`}
        >
          <Columns className="w-3.5 h-3.5" />
          <span>Compare</span>
        </button>

        {onOpenProductionPreview && (
          <>
            <div className="w-px h-4 bg-slate-700 mx-1" />
            <button
              onClick={onOpenProductionPreview}
              title="Inspect Production Cutout Preview"
              className="px-2 py-1 rounded text-xs flex items-center gap-1.5 text-indigo-300 hover:text-white hover:bg-slate-700 transition-colors font-medium cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span>Production Preview</span>
            </button>
          </>
        )}
      </div>

      {/* Top Left Tool Helper Toast */}
      <div className="absolute top-4 left-4 bg-slate-800/80 backdrop-blur-md border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-slate-300 flex items-center gap-2 pointer-events-none z-20">
        {tool === 'wand' && (
          <>
            <Crosshair className="w-3.5 h-3.5 text-indigo-400" />
            <span>Click on any common area or color to remove it</span>
          </>
        )}
        {tool === 'erase' && (
          <>
            <Eraser className="w-3.5 h-3.5 text-red-400" />
            <span>Brush to erase background remnants</span>
          </>
        )}
        {tool === 'restore' && (
          <>
            <Paintbrush className="w-3.5 h-3.5 text-emerald-400" />
            <span>Brush to restore foreground details</span>
          </>
        )}
        {tool === 'crop' && (
          <>
            <CropIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Drag corners to crop, then click Apply Crop</span>
          </>
        )}
        {tool === 'auto' && (
          <span>Click Auto Identify to segment background</span>
        )}
      </div>
    </div>
  );
};
