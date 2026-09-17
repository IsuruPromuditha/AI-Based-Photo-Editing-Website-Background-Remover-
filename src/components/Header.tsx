import React from 'react';
import {
  Scissors,
  Undo2,
  Redo2,
  RotateCcw,
  Upload,
  Download,
  Copy,
  Check,
  Sparkles,
  LayoutDashboard,
  Eye,
  Folder,
} from 'lucide-react';
import { BackdropConfig } from '../types';

interface HeaderProps {
  hasImage: boolean;
  fileName: string;
  width: number;
  height: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onNewImage: () => void;
  onDownload: () => void;
  onCopy: () => void;
  isCopied: boolean;
  onOpenSamples: () => void;
  backdrop: BackdropConfig;
  isDashboardOpen: boolean;
  onToggleDashboard: () => void;
  imageCount: number;
  projectName: string;
  onOpenPreview: () => void;
  hasEdits?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  hasImage,
  fileName,
  width,
  height,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  onNewImage,
  onDownload,
  onCopy,
  isCopied,
  onOpenSamples,
  isDashboardOpen,
  onToggleDashboard,
  imageCount,
  projectName,
  onOpenPreview,
  hasEdits = false,
}) => {
  return (
    <header className="h-14 border-b border-slate-200 bg-white/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between z-30 select-none">
      {/* Left: Brand & Dashboard Toggle & Project Name */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Side Dashboard Toggle Button */}
        <button
          onClick={onToggleDashboard}
          title="Toggle Image & Project Dashboard"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
            isDashboardOpen
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">Images</span>
          {imageCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
              {imageCount}
            </span>
          )}
        </button>

        <div className="w-px h-5 bg-slate-200 hidden sm:block" />

        {/* Brand & Title */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Scissors className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xs sm:text-sm font-semibold text-slate-900 tracking-tight hidden md:inline">
              Background Remover
            </h1>
            {projectName && (
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 max-w-[120px] sm:max-w-[180px] truncate">
                <Folder className="w-3 h-3 text-indigo-500 shrink-0" />
                <span className="truncate">{projectName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center: Image metadata or Samples prompt */}
      <div className="hidden lg:flex items-center gap-3 text-xs text-slate-500">
        {hasImage ? (
          <>
            <span className="font-medium text-slate-700 max-w-[140px] truncate" title={fileName}>
              {fileName}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              {width} × {height} px
            </span>
          </>
        ) : (
          <button
            onClick={onOpenSamples}
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Try sample images
          </button>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {hasImage && (
          <>
            {/* History Controls */}
            <div className="hidden sm:flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-600 rounded hover:bg-white transition-colors"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
                className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-600 rounded hover:bg-white transition-colors"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            {/* Reset */}
            <button
              onClick={onReset}
              title="Reset all edits"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Change image */}
            <button
              onClick={onNewImage}
              className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>

            {/* Production Preview Button */}
            <button
              onClick={onOpenPreview}
              title="Inspect Production Preview"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-700 bg-white hover:bg-indigo-50/50 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 shadow-xs transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Preview</span>
              {hasEdits && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </button>

            {/* Copy to clipboard */}
            <button
              onClick={onCopy}
              title="Copy transparent PNG to clipboard"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-xs transition-colors cursor-pointer"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Primary Download Button */}
            <button
              onClick={onDownload}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-3 sm:px-3.5 py-1.5 rounded-lg shadow-sm shadow-indigo-300 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </>
        )}

        {!hasImage && (
          <button
            onClick={onOpenSamples}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Try Samples</span>
          </button>
        )}
      </div>
    </header>
  );
};
