export type ActiveTool = 'auto' | 'wand' | 'erase' | 'restore' | 'crop' | 'resize' | 'backdrop' | 'export';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type AspectRatio = 'free' | '1:1' | '4:3' | '16:9' | '9:16' | '3:2' | '2:3' | 'circle';

export interface AutoRemoveSettings {
  sensitivity: number; // 10 to 90
  edgePreserve: number; // 0 to 50
  feather: number; // 0 to 10
  defringe: boolean;
}

export interface WandSettings {
  tolerance: number; // 1 to 100
  contiguous: boolean;
  feather: number; // 0 to 8
}

export interface BrushSettings {
  size: number; // 5 to 150
  hardness: number; // 0 to 100
}

export type BackdropType = 'transparent' | 'color' | 'gradient';

export interface BackdropConfig {
  type: BackdropType;
  color: string;
  gradient: string;
}

export interface ResizeSettings {
  width: number;
  height: number;
  maintainAspectRatio: boolean;
}

export interface ExportSettings {
  format: 'png' | 'webp' | 'jpeg';
  quality: number; // 0.1 to 1.0
  fileName: string;
}

export interface ImageState {
  originalImage: HTMLImageElement | null;
  originalWidth: number;
  originalHeight: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface HistoryItem {
  id: string;
  description: string;
  canvasDataUrl: string;
  maskDataUrl?: string;
  width: number;
  height: number;
  timestamp: number;
}

export interface ProjectImage {
  id: string;
  name: string;
  originalDataUrl: string;
  currentDataUrl: string;
  width: number;
  height: number;
  status: 'original' | 'edited' | 'processing';
  createdAt: number;
  updatedAt: number;
  historyCount: number;
}

export interface Project {
  id: string;
  name: string;
  category?: string;
  status: 'active' | 'completed';
  createdAt: number;
  updatedAt: number;
  images: ProjectImage[];
  activeImageId?: string;
}

export type PreviewComparisonMode = 'cutout' | 'split' | 'side-by-side';
