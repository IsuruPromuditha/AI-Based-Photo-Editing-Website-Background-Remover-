import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Scissors,
  Crop as CropIcon,
  Maximize2,
  Download,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { SAMPLE_IMAGES, SampleImage } from '../data/sampleImages';

interface ImageUploaderProps {
  onImageSelected: (file: File) => void;
  onImagesSelected?: (files: File[]) => void;
  onSampleSelected: (sample: SampleImage) => void;
  isLoadingSample?: boolean;
  projectName?: string;
  hasExistingImages?: boolean;
  onOpenDashboard?: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  onImagesSelected,
  onSampleSelected,
  isLoadingSample = false,
  projectName,
  hasExistingImages = false,
  onOpenDashboard,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileList = Array.from(e.dataTransfer.files) as File[];
      const files = fileList.filter((f: File) => f.type.startsWith('image/'));
      if (files.length > 1 && onImagesSelected) {
        onImagesSelected(files);
      } else if (files.length > 0) {
        onImageSelected(files[0]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      if (files.length > 1 && onImagesSelected) {
        onImagesSelected(files);
      } else {
        onImageSelected(files[0]);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-5xl mx-auto w-full">
      {/* Hero Header */}
      <div className="text-center max-w-xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Identify Common Areas & Remove Background</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
          Remove Background, Crop & Resize
        </h2>
        <p className="text-sm text-slate-600">
          Upload any image to automatically detect common background areas, refine with magic wand or brushes, crop to custom dimensions, resize, and export.
        </p>
      </div>

      {/* Main Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full max-w-2xl border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer bg-white ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 shadow-lg scale-[1.01]'
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60 shadow-xs'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/avif,image/bmp,image/svg+xml"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-xs">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-base font-semibold text-slate-900 mb-1">
          Drag & drop images here, or{' '}
          <span className="text-indigo-600 hover:underline">browse files</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Select one or multiple images for {projectName || 'your project'} • PNG, JPG, WebP supported (Up to 25MB)
        </p>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-mono">
          <span>Tip:</span> You can also press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded shadow-xs text-slate-700">Ctrl + V</kbd> to paste
        </div>
      </div>

      {/* Feature Capabilities row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl mt-6">
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-xs">
            <Scissors className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-slate-900 leading-none mb-0.5">Common Areas</div>
            <div className="text-[11px] text-slate-500">Auto BG Detection</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-xs">
            <CropIcon className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-slate-900 leading-none mb-0.5">Crop & Rotate</div>
            <div className="text-[11px] text-slate-500">Aspect Ratios</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-xs">
            <Maximize2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-slate-900 leading-none mb-0.5">Resize Image</div>
            <div className="text-[11px] text-slate-500">Exact Dimensions</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-xs">
            <Download className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-slate-900 leading-none mb-0.5">Transparent PNG</div>
            <div className="text-[11px] text-slate-500">WebP & JPEG</div>
          </div>
        </div>
      </div>

      {/* Sample Images Section */}
      <div className="w-full max-w-2xl mt-8">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Or try with sample images</span>
          </div>
          <span className="text-[11px] text-slate-400">Click any image to test</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => onSampleSelected(sample)}
              disabled={isLoadingSample}
              className="group relative flex flex-col items-center rounded-xl overflow-hidden border border-slate-200 hover:border-indigo-400 bg-white shadow-xs hover:shadow-md transition-all text-left cursor-pointer disabled:opacity-50"
            >
              <div className="w-full h-24 bg-slate-100 overflow-hidden relative">
                <img
                  src={sample.url}
                  alt={sample.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[10px] rounded font-medium">
                  {sample.category}
                </span>
              </div>
              <div className="p-2 w-full">
                <div className="text-xs font-medium text-slate-800 truncate group-hover:text-indigo-600 flex items-center justify-between">
                  <span>{sample.name}</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
