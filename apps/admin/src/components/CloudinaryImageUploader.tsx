import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Loader2, Settings, Check, AlertCircle, Link as LinkIcon } from 'lucide-react';

interface CloudinaryImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  presets?: { name: string; url: string }[];
}

export const CloudinaryImageUploader: React.FC<CloudinaryImageUploaderProps> = ({
  value,
  onChange,
  folder = 'dailyfresh',
  label = 'Product Image',
  presets = [],
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Read config from Vite env or localStorage
  const savedConfig = (() => {
    try {
      const stored = localStorage.getItem('dailyfresh_cloudinary_config');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const defaultCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || savedConfig?.cloudName || 'colasfg8';
  const defaultUploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || savedConfig?.uploadPreset || 'dailyfresh_preset';

  const [cloudName, setCloudName] = useState(defaultCloudName);
  const [uploadPreset, setUploadPreset] = useState(defaultUploadPreset);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(
      'dailyfresh_cloudinary_config',
      JSON.stringify({ cloudName: cloudName.trim(), uploadPreset: uploadPreset.trim() })
    );
    setShowConfigModal(false);
    setUploadError(null);
  };

  const uploadFile = async (file: File) => {
    const activeCloudName = cloudName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const activePreset = uploadPreset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!activeCloudName || !activePreset) {
      setShowConfigModal(true);
      setUploadError('Please configure your Cloudinary Cloud Name and Unsigned Upload Preset first.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP, etc.).');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', activePreset);
      if (folder) {
        formData.append('folder', folder);
      }

      const res = await fetch(`https://api.cloudinary.com/v1_1/${activeCloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to upload image to Cloudinary.');
      }

      onChange(data.secure_url);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      setUploadError(err.message || 'Image upload failed. Check your cloud name & upload preset.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      {/* Label & Header */}
      <div className="flex items-center justify-between">
        <label className="block font-bold text-slate-700 text-xs">{label}</label>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-100 border border-slate-200 p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                mode === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Upload / Drop
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                mode === 'url' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Manual URL
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            title="Configure Cloudinary API keys"
            className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Upload Box Mode */}
      {mode === 'upload' ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {value ? (
            /* Image Preview & Change actions */
            <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-white border border-slate-200">
                <img
                  src={value}
                  alt="Preview"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200';
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-0.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Image Uploaded / Ready</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono truncate">{value}</p>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                  >
                    Replace Image
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => onChange('')}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {isUploading && (
                <div className="absolute inset-0 rounded-2xl bg-white/90 backdrop-blur-xs flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">Uploading to Cloudinary...</span>
                </div>
              )}
            </div>
          ) : (
            /* Drag and Drop Zone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-5 text-center transition-all ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100/70'
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center justify-center py-2 space-y-2">
                  <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
                  <p className="text-xs font-bold text-slate-900">Uploading to Cloudinary...</p>
                  <p className="text-[10px] text-slate-500">Optimizing and storing image</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-1.5">
                  <div className="rounded-full bg-slate-200/80 p-2.5 text-emerald-700">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Click to upload or <span className="text-emerald-700">drag & drop</span>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    PNG, JPG, WebP, GIF (Auto-optimized on Cloudinary)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Manual URL Mode */
        <div>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://images.unsplash.com/... or https://res.cloudinary.com/..."
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-slate-900 outline-none focus:border-emerald-500 font-mono text-[11px]"
            />
          </div>
        </div>
      )}

      {/* Preset Suggestions */}
      {presets.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
            <ImageIcon className="h-3 w-3" /> Quick Presets:
          </span>
          {presets.slice(0, 6).map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => onChange(preset.url)}
              className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600 hover:text-emerald-700 hover:border-slate-300 shadow-xs transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}

      {/* Status Messages */}
      {uploadError && (
        <div className="flex items-start gap-1.5 rounded-xl border border-rose-200 bg-rose-50 p-2 text-[11px] text-rose-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1">
            <span>{uploadError}</span>
            {(!cloudName || !uploadPreset) && (
              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="ml-1.5 underline font-bold text-slate-900 hover:text-emerald-700"
              >
                Configure Cloudinary
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cloudinary Settings Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-100 p-1.5 text-emerald-700">
                  <UploadCloud className="h-4 w-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Cloudinary Settings</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Provide your Cloudinary credentials for instant browser-based drag & drop uploads.
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cloud Name *</label>
                <input
                  type="text"
                  required
                  value={cloudName}
                  onChange={(e) => setCloudName(e.target.value)}
                  placeholder="e.g. dailyfresh-cloud"
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 text-slate-900 outline-none focus:border-emerald-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Upload Preset (Unsigned) *
                </label>
                <input
                  type="text"
                  required
                  value={uploadPreset}
                  onChange={(e) => setUploadPreset(e.target.value)}
                  placeholder="e.g. dailyfresh_unsigned"
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 text-slate-900 outline-none focus:border-emerald-500 font-mono text-xs"
                />
                <span className="block mt-1 text-[10px] text-slate-500">
                  Found in Cloudinary Dashboard ➔ Settings ➔ Upload ➔ Upload presets (Signing Mode: Unsigned).
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-1.5 font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
