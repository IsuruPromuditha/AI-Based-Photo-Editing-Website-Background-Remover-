import React, { useState } from 'react';
import {
  Scissors,
  Wand2,
  Eraser,
  Paintbrush,
  Sparkles,
  Crop as CropIcon,
  Maximize2,
  Palette,
  Download,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Link,
  Unlink,
  Check,
  Copy,
  Sliders,
  RefreshCw,
} from 'lucide-react';
import {
  ActiveTool,
  AspectRatio,
  AutoRemoveSettings,
  BackdropConfig,
  BrushSettings,
  CropRect,
  ExportSettings,
  ResizeSettings,
  WandSettings,
} from '../types';

interface ToolPanelProps {
  tool: ActiveTool;
  setTool: (tool: ActiveTool) => void;
  // Auto remove
  autoSettings: AutoRemoveSettings;
  setAutoSettings: React.Dispatch<React.SetStateAction<AutoRemoveSettings>>;
  onAutoRemove: () => void;
  onAiRemove: () => void;
  isAiAvailable: boolean;
  // Wand
  wandSettings: WandSettings;
  setWandSettings: React.Dispatch<React.SetStateAction<WandSettings>>;
  // Brush
  brushSettings: BrushSettings;
  setBrushSettings: React.Dispatch<React.SetStateAction<BrushSettings>>;
  // Mask actions
  onInvertMask: () => void;
  onResetMask: () => void;
  // Crop
  cropRect: CropRect;
  imageWidth: number;
  imageHeight: number;
  onSetAspectRatio: (ratio: AspectRatio) => void;
  onApplyCrop: () => void;
  onCancelCrop: () => void;
  rotation: number;
  setRotation: (r: number) => void;
  onRotate90: (dir: 'cw' | 'ccw') => void;
  onFlip: (dir: 'h' | 'v') => void;
  // Resize
  resizeSettings: ResizeSettings;
  setResizeSettings: React.Dispatch<React.SetStateAction<ResizeSettings>>;
  onApplyResize: () => void;
  onPresetResize: (w: number, h: number) => void;
  onPercentResize: (pct: number) => void;
  // Backdrop
  backdrop: BackdropConfig;
  setBackdrop: React.Dispatch<React.SetStateAction<BackdropConfig>>;
  // Export
  exportSettings: ExportSettings;
  setExportSettings: React.Dispatch<React.SetStateAction<ExportSettings>>;
  onDownload: () => void;
  onCopy: () => void;
  isCopied: boolean;
  isProcessing: boolean;
}

export const ToolPanel: React.FC<ToolPanelProps> = ({
  tool,
  setTool,
  autoSettings,
  setAutoSettings,
  onAutoRemove,
  onAiRemove,
  isAiAvailable,
  wandSettings,
  setWandSettings,
  brushSettings,
  setBrushSettings,
  onInvertMask,
  onResetMask,
  cropRect,
  imageWidth,
  imageHeight,
  onSetAspectRatio,
  onApplyCrop,
  onCancelCrop,
  rotation,
  setRotation,
  onRotate90,
  onFlip,
  resizeSettings,
  setResizeSettings,
  onApplyResize,
  onPresetResize,
  onPercentResize,
  backdrop,
  setBackdrop,
  exportSettings,
  setExportSettings,
  onDownload,
  onCopy,
  isCopied,
  isProcessing,
}) => {
  const [activeTab, setActiveTab] = useState<'remove' | 'crop' | 'resize' | 'backdrop' | 'export'>(
    'remove'
  );

  // Sync activeTab with tool
  const handleTabChange = (tab: 'remove' | 'crop' | 'resize' | 'backdrop' | 'export') => {
    setActiveTab(tab);
    if (tab === 'remove') setTool('auto');
    else if (tab === 'crop') setTool('crop');
    else if (tab === 'resize') setTool('resize');
    else if (tab === 'backdrop') setTool('backdrop');
    else if (tab === 'export') setTool('export');
  };

  return (
    <aside className="w-full lg:w-84 xl:w-92 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white flex flex-col h-auto lg:h-[calc(100vh-3.5rem)] select-none">
      {/* Top Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-slate-50/80 p-1.5 gap-1 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => handleTabChange('remove')}
          className={`flex-1 py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'remove'
              ? 'bg-white text-indigo-700 font-semibold shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>Cutout</span>
        </button>

        <button
          onClick={() => handleTabChange('crop')}
          className={`flex-1 py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'crop'
              ? 'bg-white text-indigo-700 font-semibold shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <CropIcon className="w-3.5 h-3.5" />
          <span>Crop</span>
        </button>

        <button
          onClick={() => handleTabChange('resize')}
          className={`flex-1 py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'resize'
              ? 'bg-white text-indigo-700 font-semibold shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Resize</span>
        </button>

        <button
          onClick={() => handleTabChange('backdrop')}
          className={`flex-1 py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'backdrop'
              ? 'bg-white text-indigo-700 font-semibold shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Backdrop</span>
        </button>

        <button
          onClick={() => handleTabChange('export')}
          className={`flex-1 py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'export'
              ? 'bg-white text-indigo-700 font-semibold shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ==================== TAB 1: BACKGROUND REMOVAL ==================== */}
        {activeTab === 'remove' && (
          <div className="space-y-5">
            {/* Automatic Common Area Removal */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  Automatic Cutout
                </span>
                <span className="text-[11px] text-indigo-600 font-medium">Smart Detection</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Analyzes perimeter colors and edge gradients to remove common background areas.
              </p>
              <button
                onClick={onAutoRemove}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Scissors className="w-4 h-4" />
                <span>Auto Identify & Remove Background</span>
              </button>

              {/* Sensitivity Slider */}
              <div className="mt-3.5 pt-3 border-t border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Color Sensitivity</span>
                  <span className="font-mono text-slate-800 font-medium">
                    {autoSettings.sensitivity}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={autoSettings.sensitivity}
                  onChange={(e) =>
                    setAutoSettings((s) => ({ ...s, sensitivity: Number(e.target.value) }))
                  }
                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-600">Edge Feathering</span>
                  <span className="font-mono text-slate-800 font-medium">
                    {autoSettings.feather} px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6"
                  step="0.5"
                  value={autoSettings.feather}
                  onChange={(e) =>
                    setAutoSettings((s) => ({ ...s, feather: Number(e.target.value) }))
                  }
                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* AI Smart Cutout (Gemini Integration) */}
            <div className="bg-linear-to-br from-indigo-50/70 to-purple-50/60 border border-indigo-100 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-xs font-semibold text-slate-900">
                    AI Subject Cutout
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-semibold">
                  Gemini
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Uses Google Gemini model to segment subjects with intricate silhouettes.
              </p>
              <button
                onClick={onAiRemove}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-indigo-50/80 active:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>AI Background Removal</span>
              </button>
            </div>

            {/* Interactive Magic Wand: Common Area Picker */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-xs font-semibold text-slate-800">
                    Magic Wand (Color Picker)
                  </span>
                </div>
                <button
                  onClick={() => setTool('wand')}
                  className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                    tool === 'wand'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {tool === 'wand' ? 'Active' : 'Select'}
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Click on any background area on the canvas to identify and erase matching colors.
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Tolerance</span>
                  <span className="font-mono text-slate-800 font-medium">
                    {wandSettings.tolerance}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={wandSettings.tolerance}
                  onChange={(e) =>
                    setWandSettings((w) => ({ ...w, tolerance: Number(e.target.value) }))
                  }
                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />

                <div className="flex items-center justify-between pt-1">
                  <label className="text-xs text-slate-600 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wandSettings.contiguous}
                      onChange={(e) =>
                        setWandSettings((w) => ({ ...w, contiguous: e.target.checked }))
                      }
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Contiguous Area Only</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {wandSettings.contiguous ? 'Connected pixels' : 'Global color'}
                  </span>
                </div>
              </div>
            </div>

            {/* Manual Brushes (Erase & Restore) */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider block mb-2">
                Precision Brushes
              </span>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => setTool('erase')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    tool === 'erase'
                      ? 'bg-red-50 border-red-300 text-red-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5 text-red-500" />
                  <span>Erase Brush</span>
                </button>

                <button
                  onClick={() => setTool('restore')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    tool === 'restore'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Paintbrush className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Restore Brush</span>
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Brush Size</span>
                  <span className="font-mono text-slate-800 font-medium">
                    {brushSettings.size} px
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="120"
                  value={brushSettings.size}
                  onChange={(e) =>
                    setBrushSettings((b) => ({ ...b, size: Number(e.target.value) }))
                  }
                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Edge Hardness</span>
                  <span className="font-mono text-slate-800 font-medium">
                    {brushSettings.hardness}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={brushSettings.hardness}
                  onChange={(e) =>
                    setBrushSettings((b) => ({ ...b, hardness: Number(e.target.value) }))
                  }
                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Invert & Reset Mask */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={onInvertMask}
                className="flex-1 py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors cursor-pointer text-center"
              >
                Invert Cutout
              </button>
              <button
                onClick={onResetMask}
                className="flex-1 py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors cursor-pointer text-center"
              >
                Reset Mask
              </button>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: CROP & ROTATE ==================== */}
        {activeTab === 'crop' && (
          <div className="space-y-5">
            {/* Aspect Ratio Presets */}
            <div>
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider block mb-2">
                Aspect Ratio
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { id: 'free', label: 'Free' },
                  { id: '1:1', label: '1:1 (Square)' },
                  { id: '4:3', label: '4:3 (Photo)' },
                  { id: '16:9', label: '16:9 (Video)' },
                  { id: '9:16', label: '9:16 (Story)' },
                  { id: '3:2', label: '3:2 (35mm)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSetAspectRatio(item.id as AspectRatio)}
                    className="py-1.5 px-2 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 rounded-lg font-medium text-slate-700 hover:text-indigo-700 transition-all text-center cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Crop Dimensions */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="text-xs text-slate-500 mb-1">Crop Selection</div>
              <div className="flex items-center justify-between font-mono text-sm font-semibold text-slate-800">
                <span>{cropRect.width} px</span>
                <span className="text-slate-400">×</span>
                <span>{cropRect.height} px</span>
              </div>
            </div>

            {/* Rotation & Flip Controls */}
            <div>
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider block mb-2">
                Orientation
              </span>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => onRotate90('ccw')}
                  title="Rotate 90° Counter-Clockwise"
                  className="py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 mb-0.5" />
                  <span className="text-[10px]">-90°</span>
                </button>

                <button
                  onClick={() => onRotate90('cw')}
                  title="Rotate 90° Clockwise"
                  className="py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <RotateCw className="w-4 h-4 mb-0.5" />
                  <span className="text-[10px]">+90°</span>
                </button>

                <button
                  onClick={() => onFlip('h')}
                  title="Flip Horizontal"
                  className="py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <FlipHorizontal className="w-4 h-4 mb-0.5" />
                  <span className="text-[10px]">Flip H</span>
                </button>

                <button
                  onClick={() => onFlip('v')}
                  title="Flip Vertical"
                  className="py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <FlipVertical className="w-4 h-4 mb-0.5" />
                  <span className="text-[10px]">Flip V</span>
                </button>
              </div>

              {/* Free Rotation Slider */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Free Rotation</span>
                  <span className="font-mono text-slate-800 font-medium">{rotation}°</span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Apply & Cancel Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={onApplyCrop}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Apply Crop</span>
              </button>
              <button
                onClick={onCancelCrop}
                className="w-full py-2 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer text-center"
              >
                Reset Crop Area
              </button>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: RESIZE ==================== */}
        {activeTab === 'resize' && (
          <div className="space-y-5">
            {/* Dimensions Inputs */}
            <div>
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider block mb-2">
                Custom Dimensions
              </span>
              <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Width (px)</label>
                  <input
                    type="number"
                    min="10"
                    max="8000"
                    value={resizeSettings.width || ''}
                    onChange={(e) => {
                      const val = Math.max(1, Number(e.target.value));
                      if (resizeSettings.maintainAspectRatio && imageWidth > 0) {
                        const ratio = imageHeight / imageWidth;
                        setResizeSettings({
                          width: val,
                          height: Math.round(val * ratio),
                          maintainAspectRatio: true,
                        });
                      } else {
                        setResizeSettings((s) => ({ ...s, width: val }));
                      }
                    }}
                    className="w-full font-mono text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <button
                  onClick={() =>
                    setResizeSettings((s) => ({
                      ...s,
                      maintainAspectRatio: !s.maintainAspectRatio,
                    }))
                  }
                  title={
                    resizeSettings.maintainAspectRatio
                      ? 'Aspect Ratio Locked'
                      : 'Aspect Ratio Unlocked'
                  }
                  className={`mt-4 p-2 rounded-lg border transition-colors cursor-pointer ${
                    resizeSettings.maintainAspectRatio
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  {resizeSettings.maintainAspectRatio ? (
                    <Link className="w-4 h-4" />
                  ) : (
                    <Unlink className="w-4 h-4" />
                  )}
                </button>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Height (px)</label>
                  <input
                    type="number"
                    min="10"
                    max="8000"
                    value={resizeSettings.height || ''}
                    onChange={(e) => {
                      const val = Math.max(1, Number(e.target.value));
                      if (resizeSettings.maintainAspectRatio && imageHeight > 0) {
                        const ratio = imageWidth / imageHeight;
                        setResizeSettings({
                          width: Math.round(val * ratio),
                          height: val,
                          maintainAspectRatio: true,
                        });
                      } else {
                        setResizeSettings((s) => ({ ...s, height: val }));
                      }
                    }}
                    className="w-full font-mono text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Quick Percentage Scaling */}
            <div>
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider block mb-2">
                Quick Scale
              </span>
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                {[25, 50, 75, 150].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => onPercentResize(pct)}
                    className="py-1.5 px-2 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 rounded-lg font-mono text-slate-700 hover:text-indigo-700 text-center transition-colors cursor-pointer"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Standard Preset Resolutions */}
            <div>
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider block mb-2">
                Popular Presets
              </span>
              <div className="space-y-1.5 text-xs">
                {[
                  { label: 'Instagram Square', w: 1080, h: 1080 },
                  { label: 'Full HD 1080p', w: 1920, h: 1080 },
                  { label: 'Instagram Story / TikTok', w: 1080, h: 1920 },
                  { label: 'Profile Avatar', w: 512, h: 512 },
                  { label: 'App Icon / Favicon', w: 128, h: 128 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => onPresetResize(preset.w, preset.h)}
                    className="w-full flex items-center justify-between p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer text-left"
                  >
                    <span className="text-slate-800 font-medium">{preset.label}</span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      {preset.w} × {preset.h}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Apply Resize Button */}
            <div className="pt-2">
              <button
                onClick={onApplyResize}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Apply Resize</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: BACKDROP ==================== */}
        {activeTab === 'backdrop' && (
          <div className="space-y-5">
            {/* Transparent Checkerboard */}
            <div>
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider block mb-2">
                Transparency
              </span>
              <button
                onClick={() => setBackdrop({ type: 'transparent', color: '', gradient: '' })}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                  backdrop.type === 'transparent'
                    ? 'border-indigo-500 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-lg border border-slate-300"
                  style={{
                    backgroundImage: `linear-gradient(45deg, #cbd5e1 25%, transparent 25%),
                                      linear-gradient(-45deg, #cbd5e1 25%, transparent 25%),
                                      linear-gradient(45deg, transparent 75%, #cbd5e1 75%),
                                      linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)`,
                    backgroundSize: '8px 8px',
                    backgroundColor: '#fff',
                  }}
                />
                <div className="text-left">
                  <div className="text-xs font-semibold text-slate-900">
                    Transparent Background
                  </div>
                  <div className="text-[11px] text-slate-500">Pure alpha cutout for PNG / WebP</div>
                </div>
              </button>
            </div>

            {/* Solid Colors */}
            <div>
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider block mb-2">
                Solid Colors
              </span>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { name: 'White', hex: '#FFFFFF' },
                  { name: 'Black', hex: '#000000' },
                  { name: 'Chroma Green', hex: '#00FF00' },
                  { name: 'Studio Gray', hex: '#E2E8F0' },
                  { name: 'Electric Blue', hex: '#2563EB' },
                  { name: 'Warm Amber', hex: '#F59E0B' },
                  { name: 'Ruby Red', hex: '#EF4444' },
                  { name: 'Soft Mint', hex: '#A7F3D0' },
                ].map((color) => (
                  <button
                    key={color.name}
                    onClick={() =>
                      setBackdrop({ type: 'color', color: color.hex, gradient: '' })
                    }
                    title={color.name}
                    className={`h-9 rounded-lg border transition-all cursor-pointer relative shadow-xs flex items-center justify-center ${
                      backdrop.type === 'color' && backdrop.color === color.hex
                        ? 'ring-2 ring-indigo-500 ring-offset-1 border-indigo-500'
                        : 'border-slate-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    {backdrop.type === 'color' && backdrop.color === color.hex && (
                      <Check
                        className={`w-4 h-4 ${
                          color.hex === '#FFFFFF' || color.hex === '#00FF00' || color.hex === '#A7F3D0' || color.hex === '#E2E8F0'
                            ? 'text-slate-900'
                            : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Color Input */}
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="color"
                  value={backdrop.type === 'color' ? backdrop.color : '#FFFFFF'}
                  onChange={(e) =>
                    setBackdrop({ type: 'color', color: e.target.value, gradient: '' })
                  }
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                />
                <div className="text-xs">
                  <div className="font-medium text-slate-800">Custom Color</div>
                  <div className="font-mono text-[11px] text-slate-500">
                    {backdrop.type === 'color' ? backdrop.color.toUpperCase() : '#FFFFFF'}
                  </div>
                </div>
              </div>
            </div>

            {/* Studio Gradients */}
            <div>
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider block mb-2">
                Studio Gradients
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'studio', name: 'Clean Studio', style: 'linear-gradient(to bottom right, #f1f5f9, #cbd5e1)' },
                  { id: 'sunset', name: 'Sunset Glow', style: 'linear-gradient(to bottom right, #f97316, #ec4899)' },
                  { id: 'cyber', name: 'Cyber Neon', style: 'linear-gradient(to bottom right, #06b6d4, #3b82f6)' },
                  { id: 'slate', name: 'Slate Dusk', style: 'linear-gradient(to bottom right, #1e293b, #0f172a)' },
                  { id: 'peach', name: 'Warm Peach', style: 'linear-gradient(to bottom right, #fbcfe8, #fed7aa)' },
                ].map((grad) => (
                  <button
                    key={grad.id}
                    onClick={() =>
                      setBackdrop({ type: 'gradient', color: '', gradient: grad.id })
                    }
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      backdrop.type === 'gradient' && backdrop.gradient === grad.id
                        ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className="w-full h-8 rounded-lg mb-1.5 shadow-inner"
                      style={{ background: grad.style }}
                    />
                    <div className="text-[11px] font-medium text-slate-800">{grad.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 5: EXPORT & DOWNLOAD ==================== */}
        {activeTab === 'export' && (
          <div className="space-y-5">
            {/* Format Selection */}
            <div>
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider block mb-2">
                File Format
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'png', label: 'PNG', desc: 'Transparent' },
                  { id: 'webp', label: 'WebP', desc: 'Compact' },
                  { id: 'jpeg', label: 'JPEG', desc: 'Standard' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() =>
                      setExportSettings((s) => ({ ...s, format: fmt.id as any }))
                    }
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      exportSettings.format === fmt.id
                        ? 'border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-500 text-indigo-900 font-semibold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{fmt.label}</div>
                    <div className="text-[10px] text-slate-500">{fmt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Slider (for WebP and JPEG) */}
            {exportSettings.format !== 'png' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Export Quality</span>
                  <span className="font-mono text-slate-800 font-medium">
                    {Math.round(exportSettings.quality * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={exportSettings.quality}
                  onChange={(e) =>
                    setExportSettings((s) => ({ ...s, quality: Number(e.target.value) }))
                  }
                  className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* File Name */}
            <div>
              <label className="text-xs font-semibold text-slate-800 uppercase tracking-wider block mb-1.5">
                File Name
              </label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden focus-within:border-indigo-500">
                <input
                  type="text"
                  value={exportSettings.fileName}
                  onChange={(e) =>
                    setExportSettings((s) => ({ ...s, fileName: e.target.value }))
                  }
                  className="w-full text-xs px-3 py-2 bg-transparent focus:outline-hidden text-slate-800"
                />
                <span className="text-xs text-slate-400 font-mono pr-3">
                  .{exportSettings.format}
                </span>
              </div>
            </div>

            {/* Summary Box */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Output Resolution:</span>
                <span className="font-mono font-medium text-slate-800">
                  {imageWidth} × {imageHeight} px
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Backdrop Mode:</span>
                <span className="capitalize font-medium text-slate-800">
                  {backdrop.type}
                </span>
              </div>
            </div>

            {/* Download & Copy Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={onDownload}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-200 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Image</span>
              </button>

              <button
                onClick={onCopy}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
