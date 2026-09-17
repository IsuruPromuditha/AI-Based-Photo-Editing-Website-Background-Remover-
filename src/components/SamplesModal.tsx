import React from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { SAMPLE_IMAGES, SampleImage } from '../data/sampleImages';

interface SamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: SampleImage) => void;
  isLoading: boolean;
}

export const SamplesModal: React.FC<SamplesModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Choose a Sample Image</h3>
        </div>
        <p className="text-xs text-slate-500 mb-5">
          Select any of these curated photos to test background identification, cutout, cropping, and resizing.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => {
                onSelectSample(sample);
                onClose();
              }}
              disabled={isLoading}
              className="group flex flex-col items-center rounded-xl overflow-hidden border border-slate-200 hover:border-indigo-500 bg-white hover:shadow-md transition-all text-left cursor-pointer disabled:opacity-50"
            >
              <div className="w-full h-28 bg-slate-100 overflow-hidden relative">
                <img
                  src={sample.url}
                  alt={sample.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[10px] rounded font-medium">
                  {sample.category}
                </span>
              </div>
              <div className="p-2.5 w-full">
                <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-600 flex items-center justify-between">
                  <span>{sample.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {sample.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
