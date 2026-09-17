import React, { useState, useRef } from 'react';
import {
  FolderPlus,
  Folder,
  CheckCircle2,
  Clock,
  Upload,
  Plus,
  Trash2,
  Eye,
  Download,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Layers,
  Sparkles,
  Check,
  FolderCheck,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { Project, ProjectImage } from '../types';

interface SideDashboardProps {
  isOpen: boolean;
  onToggle?: () => void;
  onClose?: () => void;
  projects: Project[];
  activeProject?: Project;
  activeProjectId?: string;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (name: string, category: string) => void;
  onToggleProjectComplete?: (projectId: string) => void;
  onToggleProjectStatus?: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onSelectImage: (imageId: string) => void;
  activeImageId?: string;
  onImportFiles?: (files: FileList | File[]) => void;
  onImportImages?: (files: FileList | File[]) => void;
  onDeleteImage: (imageId: string) => void;
  onQuickPreviewImage?: (image: ProjectImage) => void;
  onQuickPreview?: (image: ProjectImage) => void;
  onOpenSamples?: () => void;
}

export const SideDashboard: React.FC<SideDashboardProps> = ({
  isOpen,
  onToggle,
  onClose,
  projects = [],
  activeProject,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onToggleProjectComplete,
  onToggleProjectStatus,
  onDeleteProject,
  onSelectImage,
  activeImageId,
  onImportFiles,
  onImportImages,
  onDeleteImage,
  onQuickPreviewImage,
  onQuickPreview,
  onOpenSamples,
}) => {
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState('E-Commerce / Products');
  const [showProjectsList, setShowProjectsList] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'edited' | 'original'>('all');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize toggle / close handler
  const handleToggle = onToggle || onClose || (() => {});

  // Normalize project complete toggle
  const handleToggleComplete = (projId: string) => {
    if (onToggleProjectComplete) onToggleProjectComplete(projId);
    else if (onToggleProjectStatus) onToggleProjectStatus(projId);
  };

  // Normalize import files handler
  const handleImport = (files: FileList | File[]) => {
    if (onImportFiles) onImportFiles(files);
    else if (onImportImages) onImportImages(files);
  };

  // Normalize preview handler
  const handlePreview = (img: ProjectImage) => {
    if (onQuickPreviewImage) onQuickPreviewImage(img);
    else if (onQuickPreview) onQuickPreview(img);
  };

  // Safe active project resolution with fallback
  const safeActiveProject: Project =
    activeProject ||
    (activeProjectId ? projects.find((p) => p.id === activeProjectId) : undefined) ||
    projects[0] || {
      id: 'default-project',
      name: 'Cutouts Project',
      category: 'General',
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      images: [],
    };

  const projectImages = Array.isArray(safeActiveProject.images) ? safeActiveProject.images : [];

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName.trim(), newProjectCategory);
    setNewProjectName('');
    setShowNewProjectModal(false);
    setShowProjectsList(false);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    handleImport(files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImport(e.dataTransfer.files);
    }
  };

  const filteredImages = projectImages.filter((img) => {
    if (filterMode === 'edited') return img.status === 'edited';
    if (filterMode === 'original') return img.status === 'original';
    return true;
  });

  const editedCount = projectImages.filter((i) => i.status === 'edited').length;
  const totalCount = projectImages.length;

  if (!isOpen) {
    return (
      <div className="fixed left-0 top-14 bottom-0 z-30 flex items-center pointer-events-none">
        <button
          onClick={handleToggle}
          title="Open Image & Project Dashboard"
          className="pointer-events-auto bg-white/95 hover:bg-white text-slate-700 hover:text-indigo-600 border-r border-y border-slate-200/90 shadow-md py-4 px-1.5 rounded-r-xl flex flex-col items-center gap-2 group transition-all cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          <span className="text-[11px] font-semibold [writing-mode:vertical-lr] tracking-wide uppercase text-slate-500 group-hover:text-indigo-600">
            Dashboard ({totalCount})
          </span>
          {editedCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          )}
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden backdrop-blur-xs"
        onClick={handleToggle}
      />

      <aside className="w-80 sm:w-88 h-[calc(100vh-3.5rem)] bg-white border-r border-slate-200 flex flex-col z-30 shrink-0 shadow-lg lg:shadow-none select-none relative animate-in slide-in-from-left-4 duration-150">
        {/* Dashboard Top Header & Project Switcher */}
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Folder className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Current Project
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowNewProjectModal(true)}
                title="Create New Project"
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 px-2 py-1 rounded-md transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>New Project</span>
              </button>
              <button
                onClick={handleToggle}
                title="Collapse Dashboard"
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Project Card / Dropdown Trigger */}
          <div className="relative">
            <div
              onClick={() => setShowProjectsList(!showProjectsList)}
              className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-2.5 shadow-xs cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-800 truncate">
                    {safeActiveProject.name}
                  </h2>
                  {safeActiveProject.status === 'completed' ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Check className="w-2.5 h-2.5" />
                      Done
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {totalCount} images • {editedCount} edited
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleComplete(safeActiveProject.id);
                  }}
                  title={
                    safeActiveProject.status === 'completed'
                      ? 'Mark project as in-progress'
                      : 'Mark project as completed'
                  }
                  className={`p-1 rounded-md transition-colors ${
                    safeActiveProject.status === 'completed'
                      ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                      : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-400">▾</span>
              </div>
            </div>

            {/* Switch Project Dropdown Menu */}
            {showProjectsList && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-40 max-h-64 overflow-y-auto p-1.5">
                <div className="text-[10px] font-semibold text-slate-400 uppercase px-2 py-1">
                  All Projects ({projects.length})
                </div>
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => {
                      onSelectProject(proj.id);
                      setShowProjectsList(false);
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                      proj.id === safeActiveProject.id
                        ? 'bg-indigo-50/80 text-indigo-900 font-medium'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{proj.name}</span>
                        {proj.status === 'completed' && (
                          <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1 rounded">
                            Done
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {(proj.images || []).length} images
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {proj.id === safeActiveProject.id && (
                        <Check className="w-3.5 h-3.5 text-indigo-600" />
                      )}
                      {projects.length > 1 && (
                        <button
                          type="button"
                          id={`delete-project-${proj.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onDeleteProject(proj.id);
                          }}
                          title={`Delete project "${proj.name}"`}
                          aria-label={`Delete project ${proj.name}`}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setShowNewProjectModal(true);
                      setShowProjectsList(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Another Project</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Import Images Dropzone & Buttons */}
        <div className="p-3 border-b border-slate-100">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/avif,image/bmp"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-50/60 scale-[1.01]'
                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-indigo-600 mb-1">
              <Upload className="w-4 h-4" />
              <span className="text-xs font-semibold">Import Images</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Drag & drop multiple files, or click to browse
            </p>
          </div>

          <div className="flex items-center justify-between mt-2 text-[11px]">
            <span className="text-slate-400">Want quick test assets?</span>
            <button
              onClick={onOpenSamples}
              className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Import Samples</span>
            </button>
          </div>
        </div>

        {/* Gallery / Filter Bar */}
        <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/40 text-xs">
          <span className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
            Project Images ({filteredImages.length})
          </span>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px]">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setFilterMode('edited')}
              className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                filterMode === 'edited'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Edited ({editedCount})
            </button>
          </div>
        </div>

        {/* Images List Container */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredImages.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-700">No images yet</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                Import your product photos or pictures above to start cutting out backgrounds.
              </p>
            </div>
          ) : (
            filteredImages.map((img) => {
              const isActive = img.id === activeImageId;
              const isEdited = img.status === 'edited';

              return (
                <div
                  key={img.id}
                  onClick={() => onSelectImage(img.id)}
                  className={`group relative rounded-xl border p-2 flex items-center gap-2.5 transition-all cursor-pointer ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {/* Thumbnail */}
                  <div
                    className="w-14 h-14 rounded-lg border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative"
                    style={{
                      backgroundImage: isEdited
                        ? `linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
                           linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
                           linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
                           linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)`
                        : 'none',
                      backgroundSize: '10px 10px',
                      backgroundColor: '#f8fafc',
                    }}
                  >
                    <img
                      src={img.currentDataUrl || img.originalDataUrl}
                      alt={img.name}
                      className="w-full h-full object-contain"
                    />
                    {isEdited && (
                      <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                    )}
                  </div>

                  {/* Image Details */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p
                        className={`text-xs font-semibold truncate ${
                          isActive ? 'text-indigo-900' : 'text-slate-800'
                        }`}
                        title={img.name}
                      >
                        {img.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span className="font-mono">
                        {img.width} × {img.height}
                      </span>
                      <span>•</span>
                      {isEdited ? (
                        <span className="font-medium text-emerald-600 flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" />
                          Edited
                        </span>
                      ) : (
                        <span className="text-slate-400">Original</span>
                      )}
                    </div>

                    {img.historyCount > 0 && (
                      <span className="text-[9px] text-indigo-600 font-medium">
                        {img.historyCount} edit {img.historyCount === 1 ? 'step' : 'steps'}
                      </span>
                    )}
                  </div>

                  {/* Actions on hover or active */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Quick Preview Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(img);
                      }}
                      title="Inspect Cutout Preview"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Image */}
                    <button
                      type="button"
                      id={`delete-image-${img.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onDeleteImage(img.id);
                      }}
                      title="Delete Image"
                      aria-label={`Delete ${img.name}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-70 group-hover:opacity-100 hover:!opacity-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Dashboard Bottom Summary */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="font-semibold text-slate-900">{editedCount}</span>
            <span>of</span>
            <span className="font-semibold text-slate-900">{totalCount}</span>
            <span>images completed</span>
          </div>

          {safeActiveProject.status === 'completed' ? (
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            >
              Start Next Project →
            </button>
          ) : (
            <button
              onClick={() => handleToggleComplete(safeActiveProject.id)}
              className="text-[11px] font-medium text-emerald-700 hover:underline cursor-pointer"
            >
              Mark Done
            </button>
          )}
        </div>
      </aside>

      {/* Create Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create New Project</h3>
                  <p className="text-xs text-slate-500">
                    Group photos, organize cutouts, and manage batches
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Catalog, Shoes Collection, Social Avatars"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category / Preset
                </label>
                <select
                  value={newProjectCategory}
                  onChange={(e) => setNewProjectCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="E-Commerce / Products">E-Commerce & Product Photos</option>
                  <option value="Portrait / Headshots">Portraits & Headshots</option>
                  <option value="Social Media & Marketing">Social Media & Marketing</option>
                  <option value="Graphic Design / Assets">Graphic Design & Assets</option>
                  <option value="General Cutouts">General Cutouts</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
