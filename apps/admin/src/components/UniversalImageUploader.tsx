import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  Loader2,
  Check,
  AlertCircle,
  Link as LinkIcon,
  Sparkles,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface UniversalImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
  presets?: { name: string; url: string }[];
  helperText?: string;
}

export const UniversalImageUploader: React.FC<UniversalImageUploaderProps> = ({
  value,
  onChange,
  label = 'Upload Image',
  folder = 'dailyfresh',
  presets = [],
  helperText,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [inputUrl, setInputUrl] = useState(value || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read Cloudinary config if present (optional enhancement)
  const savedConfig = (() => {
    try {
      const stored = localStorage.getItem('dailyfresh_cloudinary_config');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || savedConfig?.cloudName || '';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || savedConfig?.uploadPreset || '';

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP, GIF, SVG).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError('Image size exceeds 8MB. Please select a smaller file.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    // If Cloudinary is explicitly configured, try remote upload first; otherwise or on fallback, use FileReader
    if (cloudName && uploadPreset) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        if (folder) formData.append('folder', folder);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.secure_url) {
          onChange(data.secure_url);
          setInputUrl(data.secure_url);
          setIsUploading(false);
          return;
        }
      } catch (e) {
        console.warn('Cloudinary upload bypassed/failed, falling back to local file storage:', e);
      }
    }

    // Direct local FileReader data URL conversion (works offline, zero config, immediate high-res preview)
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onChange(result);
        setInputUrl(result);
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file from local device.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

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
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onChange(inputUrl.trim());
    }
  };

  const handleSelectPreset = (url: string) => {
    onChange(url);
    setInputUrl(url);
  };

  const handleClear = () => {
    onChange('');
    setInputUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {/* Label & Tabs Header */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">
          {label}
        </label>
        
        {/* Source Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
              activeTab === 'upload'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
              activeTab === 'url'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Web URL
          </button>
          {presets.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                activeTab === 'presets'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Presets ({presets.length})
            </button>
          )}
        </div>
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Mode 1: Drag & Drop File Upload */}
      {activeTab === 'upload' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01]'
              : 'border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-slate-50/80'
          }`}
        >
          {isUploading ? (
            <div className="py-4 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
              <span className="text-xs font-bold text-slate-700">Uploading & processing image...</span>
            </div>
          ) : (
            <div className="py-2 flex flex-col items-center justify-center gap-1.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-2xs">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Click to select from your device or drag & drop here
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  PNG, JPG, WebP, GIF or SVG up to 8MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Web URL input */}
      {activeTab === 'url' && (
        <form onSubmit={handleApplyUrl} className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-500 font-mono text-[11px]"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
          >
            Apply
          </button>
        </form>
      )}

      {/* Mode 3: Presets Picker */}
      {activeTab === 'presets' && presets.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50">
          {presets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleSelectPreset(preset.url)}
              className={`group relative rounded-lg border overflow-hidden p-1 text-left transition flex items-center gap-2 ${
                value === preset.url
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <img
                src={preset.url}
                alt={preset.name}
                className="h-8 w-8 rounded object-cover flex-shrink-0"
              />
              <span className="text-[10px] font-bold text-slate-700 truncate line-clamp-1">
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Image Preview Box */}
      {value && (
        <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <div className="relative h-16 w-16 rounded-xl border border-slate-200 overflow-hidden flex-shrink-0 bg-slate-100">
            <img
              src={value}
              alt="Preview"
              className="h-full w-full object-cover object-center"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
              <Check className="h-3.5 w-3.5" />
              <span>Image Attached</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
              {value.startsWith('data:') ? 'Local file uploaded (base64 image)' : value}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-slate-50 transition"
              title="Change Image"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Remove Image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
