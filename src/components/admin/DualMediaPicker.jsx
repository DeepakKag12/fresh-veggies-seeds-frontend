import React, { useState, useRef } from 'react';
import {
  Upload,
  Link as LinkIcon,
  X,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Eye,
  RefreshCw,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

/**
 * Universal Dual-Mode Image Picker (Upload OR URL)
 * Reverse-engineered from Shopify Admin media management.
 *
 * Supports:
 * - Option A: Drag-and-drop file upload directly to Cloudinary via backend (/api/upload or custom endpoint)
 * - Option B: Direct image URL pasting with instant validation & live preview
 * - Single image mode or multi-image gallery mode
 * - Custom slot hints (e.g. desktop banner 16:6, mobile banner 4:3, square product 1:1)
 */
const DualMediaPicker = ({
  value = '',                 // String URL (single mode) or Array of URLs (multiple mode)
  onChange,                   // callback(url | urls)
  multiple = false,           // allow multiple images
  uploadEndpoint = '/upload', // backend upload endpoint
  aspectRatioHint = '1:1 square or 4:3 recommended',
  label = 'Media Asset',
  required = false,
  helperText = 'Upload an image file (PNG, JPG, WebP) or paste any image URL.',
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'url'
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const [urlPreviewValid, setUrlPreviewValid] = useState(null);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);

  const fileInputRef = useRef(null);

  // Normalize current images list
  const imageList = multiple
    ? Array.isArray(value) ? value : value ? [value] : []
    : value ? [value] : [];

  // Handle direct file upload via backend Cloudinary endpoint
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter((file) => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      if (!isImage) toast.error(`"${file.name}" is not an image file`);
      if (!isValidSize) toast.error(`"${file.name}" exceeds 10MB limit`);
      return isImage && isValidSize;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      if (multiple && validFiles.length > 1) {
        // Multi-file batch upload
        const formData = new FormData();
        validFiles.forEach((f) => formData.append('images', f));

        const res = await api.post('/upload/multiple', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (evt) => {
            if (evt.total) {
              setUploadProgress(Math.round((evt.loaded * 90) / evt.total));
            }
          },
        });

        const newUrls = (res.data?.data || []).map((item) => item.url || item);
        if (newUrls.length > 0) {
          const updated = [...imageList, ...newUrls];
          onChange?.(updated);
          toast.success(`Successfully uploaded ${newUrls.length} images!`);
        }
      } else {
        // Single file upload or one by one
        for (const file of validFiles) {
          const formData = new FormData();
          formData.append('image', file);

          const res = await api.post(uploadEndpoint, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (evt) => {
              if (evt.total) {
                setUploadProgress(Math.round((evt.loaded * 90) / evt.total));
              }
            },
          });

          const uploadedUrl = res.data?.data?.url || res.data?.url || res.data?.secure_url;
          if (uploadedUrl) {
            if (multiple) {
              const updated = [...imageList, uploadedUrl];
              onChange?.(updated);
            } else {
              onChange?.(uploadedUrl);
            }
            toast.success('Image uploaded successfully!');
          }
        }
      }
    } catch (err) {
      console.error('Media upload failed:', err);
      toast.error(err.response?.data?.message || 'Failed to upload image to server');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || isUploading) return;
    const droppedFiles = e.dataTransfer.files;
    handleFileUpload(droppedFiles);
  };

  // Handle URL Add
  const handleAddUrl = (e) => {
    e?.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) {
      toast.error('Please enter an image URL');
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      toast.error('Please enter a valid HTTP/HTTPS image URL');
      return;
    }

    if (multiple) {
      onChange?.([...imageList, trimmed]);
    } else {
      onChange?.(trimmed);
    }

    setUrlInput('');
    setUrlPreviewValid(null);
    toast.success('Image URL attached!');
  };

  // Handle Remove Image
  const handleRemoveImage = (indexToRemove) => {
    if (multiple) {
      const updated = imageList.filter((_, idx) => idx !== indexToRemove);
      onChange?.(updated);
    } else {
      onChange?.('');
    }
  };

  return (
    <div className="space-y-3">
      {/* Header with Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{label}</span>
          {required && <span className="text-red-500 font-bold">*</span>}
          {aspectRatioHint && (
            <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500 ml-1">
              ({aspectRatioHint})
            </span>
          )}
        </label>

        {/* Dual Mode Switcher: Option A (Upload) vs Option B (URL) */}
        <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200/80 dark:border-gray-700 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3 h-3" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'url'
                ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            <span>Image URL</span>
          </button>
        </div>
      </div>

      {/* OPTION A: DRAG & DROP FILE ZONE */}
      {activeTab === 'upload' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 ring-4 ring-emerald-500/10 scale-[1.005]'
              : 'border-slate-300 dark:border-gray-700 hover:border-emerald-500/80 bg-slate-50/50 dark:bg-gray-800/40 hover:bg-slate-50 dark:hover:bg-gray-800/70'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            multiple={multiple}
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
            disabled={disabled || isUploading}
          />

          {isUploading ? (
            <div className="py-4 space-y-2.5">
              <Loader2 className="w-8 h-8 mx-auto text-emerald-600 dark:text-emerald-400 animate-spin" />
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Uploading to Cloudinary CDN ({uploadProgress}%)...
              </div>
              <div className="w-48 max-w-full mx-auto bg-slate-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 py-2">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-700 shadow-2xs border border-slate-200/80 dark:border-gray-600 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                <span className="text-emerald-600 dark:text-emerald-400 hover:underline">
                  Click to upload
                </span>{' '}
                or drag & drop
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                PNG, JPG, WebP up to 10MB {multiple ? '· Multiple files supported' : ''}
              </p>
            </div>
          )}
        </div>
      )}

      {/* OPTION B: IMAGE URL INPUT */}
      {activeTab === 'url' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setUrlPreviewValid(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddUrl(e)}
                placeholder="Paste image URL (https://...)"
                disabled={disabled}
                className="block w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              {urlInput && (
                <button
                  type="button"
                  onClick={() => setUrlInput('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleAddUrl}
              disabled={disabled || !urlInput.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white shadow-2xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Attach</span>
            </button>
          </div>

          {/* Quick URL Live Tester Preview */}
          {urlInput.trim() && (
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/60 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-gray-700 overflow-hidden shrink-0 border border-slate-300/60 dark:border-gray-600 flex items-center justify-center">
                <img
                  src={urlInput.trim()}
                  alt="URL Preview"
                  className="w-full h-full object-cover"
                  onLoad={() => setUrlPreviewValid(true)}
                  onError={() => setUrlPreviewValid(false)}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {urlPreviewValid === true && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Valid Image URL
                    </span>
                  )}
                  {urlPreviewValid === false && (
                    <span className="text-[11px] font-bold text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Unable to load image
                    </span>
                  )}
                  {urlPreviewValid === null && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Verifying image URL...
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{urlInput.trim()}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ATTACHED IMAGE(S) PREVIEW GALLERY */}
      {imageList.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>
              Attached Media ({imageList.length} {imageList.length === 1 ? 'image' : 'images'})
            </span>
            {multiple && (
              <span className="text-[10px] text-emerald-600 font-semibold normal-case">
                First image will be used as primary thumbnail
              </span>
            )}
          </div>

          <div
            className={`grid gap-2.5 ${
              multiple
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
                : 'grid-cols-1 max-w-sm'
            }`}
          >
            {imageList.map((imgUrl, idx) => (
              <div
                key={idx}
                className="group relative rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-2xs hover:shadow-xs transition-all"
              >
                <div className="aspect-square bg-slate-100 dark:bg-gray-900 overflow-hidden relative">
                  <img
                    src={imgUrl}
                    alt={`Asset ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/400x400?text=Invalid+Image';
                    }}
                  />

                  {/* Primary Badge for Multi mode */}
                  {multiple && idx === 0 && (
                    <div className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                      Primary
                    </div>
                  )}

                  {/* Hover Actions Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedPreviewImage(imgUrl)}
                      className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 hover:text-black transition-all shadow-xs"
                      title="Inspect full image"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={imgUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 hover:text-black transition-all shadow-xs"
                      title="Open source URL"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all shadow-xs"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subtitle with URL snippet */}
                <div className="p-1.5 px-2 bg-slate-50 dark:bg-gray-850 border-t border-slate-100 dark:border-gray-750 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="truncate max-w-[120px] font-mono">
                    {imgUrl.split('/').pop() || 'image'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="text-red-500 hover:text-red-700 font-bold ml-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Helper text */}
      {helperText && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500">{helperText}</p>
      )}

      {/* Fullscreen Image Preview Lightbox */}
      {selectedPreviewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPreviewImage(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={selectedPreviewImage}
              alt="Full Preview"
              className="max-h-[80vh] w-auto rounded-xl object-contain mx-auto"
            />
            <div className="p-2 text-center">
              <a
                href={selectedPreviewImage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
              >
                <span>Open high-resolution original</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DualMediaPicker;
