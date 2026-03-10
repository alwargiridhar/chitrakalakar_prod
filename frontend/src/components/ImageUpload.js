import React, { useState, useRef } from 'react';
import { uploadFile } from '../lib/upload';
import { compressImage } from '../lib/image';
import { BUCKETS } from '../lib/supabase';

/**
 * Image Upload Component (AWS S3 via signed URLs)
 * @param {string} bucket - Logical bucket name (avatars, artworks, exhibitions)
 * @param {function} onUpload - Callback with uploaded image URL
 * @param {string} currentImage - Current image URL (optional)
 * @param {string} label - Label for the upload button
 */
export function ImageUpload({
  bucket,
  folder,
  onUpload,
  currentImage,
  label = "Upload Image",
  entityId = null,
  enableProjectionEditor = true,
  maxFileSizeMB = 5,
  enforceAspectRatios = [],
  outputMaxSizeMB = null,
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || null);
  const [localPreview, setLocalPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [projection, setProjection] = useState({
    zoom: 1,
    focus_x: 50,
    focus_y: 50,
    fit_mode: 'auto',
  });
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const getAdaptiveFitMode = (width, height) => {
    const ratio = (width || 1) / (height || 1);
    return ratio > 0.9 && ratio < 1.7 ? 'cover' : 'contain';
  };

  const parseRatio = (ratioLabel) => {
    if (!ratioLabel || !ratioLabel.includes(':')) return null;
    const [w, h] = ratioLabel.split(':').map(Number);
    if (!w || !h) return null;
    return w / h;
  };

  const getNearestTargetRatio = (imageRatio) => {
    if (!enforceAspectRatios || enforceAspectRatios.length === 0) return null;
    const parsed = enforceAspectRatios.map(parseRatio).filter(Boolean);
    if (!parsed.length) return null;
    return parsed.reduce((best, current) => {
      return Math.abs(current - imageRatio) < Math.abs(best - imageRatio) ? current : best;
    }, parsed[0]);
  };

  const loadImageFromFile = (file) =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    });

  const applyProjectionToFile = async (file, settings) => {
    const img = await loadImageFromFile(file);

    const canvas = document.createElement('canvas');
    const isAvatar = folder === 'avatars' || bucket === BUCKETS.AVATARS;

    let canvasWidth = isAvatar ? 800 : img.naturalWidth;
    let canvasHeight = isAvatar ? 800 : img.naturalHeight;

    const imageRatio = img.naturalWidth / img.naturalHeight;
    const targetRatio = getNearestTargetRatio(imageRatio);
    if (targetRatio) {
      if (imageRatio > targetRatio) {
        canvasWidth = Math.round(canvasHeight * targetRatio);
      } else {
        canvasHeight = Math.round(canvasWidth / targetRatio);
      }
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const fitMode = settings.fit_mode === 'auto'
      ? getAdaptiveFitMode(img.naturalWidth, img.naturalHeight)
      : settings.fit_mode;

    const baseScale = fitMode === 'cover'
      ? Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight)
      : Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);

    const totalScale = baseScale * Number(settings.zoom || 1);
    const drawWidth = img.naturalWidth * totalScale;
    const drawHeight = img.naturalHeight * totalScale;
    const x = (canvas.width - drawWidth) * (Number(settings.focus_x || 50) / 100);
    const y = (canvas.height - drawHeight) * (Number(settings.focus_y || 50) / 100);

    ctx.drawImage(img, x, y, drawWidth, drawHeight);

    const mimeType = file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg';
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, mimeType, 0.92)
    );

    return new File([blob], file.name, { type: mimeType });
  };

  const compressToTargetSize = async (file, targetMB) => {
    if (!targetMB || file.size <= targetMB * 1024 * 1024) return file;

    let quality = 0.85;
    let maxWidth = 1600;
    let current = file;
    for (let i = 0; i < 6; i += 1) {
      current = await compressImage(current, maxWidth, quality);
      if (current.size <= targetMB * 1024 * 1024) return current;
      quality = Math.max(0.5, quality - 0.08);
      maxWidth = Math.max(900, Math.floor(maxWidth * 0.9));
    }
    return current;
  };

  const uploadProcessedFile = async (file, projectionSettings = null) => {
    setError('');
    setUploading(true);

    try {
      let processedFile = file;
      if (projectionSettings) {
        processedFile = await applyProjectionToFile(file, projectionSettings);
      }

      // Compress image based on logical bucket
      let compressedFile = processedFile;
      if (bucket === BUCKETS.AVATARS) {
        compressedFile = await compressImage(processedFile, 400, 0.8);
      } else if (bucket === BUCKETS.ARTWORKS || bucket === BUCKETS.ARTIST_ARTWORKS) {
        compressedFile = await compressImage(processedFile, 1200, 0.85);
      } else {
        compressedFile = await compressImage(processedFile, 1000, 0.8);
      }

      const finalFile = await compressToTargetSize(compressedFile, outputMaxSizeMB);

      const imageUrl = await uploadFile({
        file: finalFile,
        bucketKey: bucket,
        folder,
        entityId,
      });

      setPreview(imageUrl);
      setSelectedFile(null);
      setLocalPreview(null);
      onUpload(imageUrl, projectionSettings || null);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      setError(`Image size should be less than ${maxFileSizeMB}MB`);
      return;
    }

    setError('');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64Preview = evt.target.result;
      setLocalPreview(base64Preview);
      setSelectedFile(file);
      setProjection({ zoom: 1, focus_x: 50, focus_y: 50, fit_mode: 'auto' });

      if (!enableProjectionEditor) {
        await uploadProcessedFile(file, null);
      }
    };
    reader.readAsDataURL(file);
  };

  const activePreview = selectedFile && localPreview ? localPreview : preview;

  const saveProjectionAndUpload = async () => {
    if (!selectedFile) return;
    await uploadProcessedFile(selectedFile, projection);
  };

  const cancelProjection = () => {
    setSelectedFile(null);
    setLocalPreview(null);
    setProjection({ zoom: 1, focus_x: 50, focus_y: 50, fit_mode: 'auto' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {activePreview && (
        <div className="relative inline-block">
          <img
            src={activePreview}
            alt="Preview"
            className={`rounded-lg object-cover shadow-md ${
              folder === 'avatars'
                ? 'w-32 h-32 rounded-full'
                : 'max-w-sm max-h-64'
            }`}
            style={{
              transform: selectedFile ? `scale(${projection.zoom})` : undefined,
              transformOrigin: `${projection.focus_x}% ${projection.focus_y}%`,
              objectPosition: `${projection.focus_x}% ${projection.focus_y}%`,
            }}
          />
          {!uploading && !selectedFile && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
              title="Change image"
            >
              ✏️
            </button>
          )}
        </div>
      )}

      {selectedFile && enableProjectionEditor && (
        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-3" data-testid="image-projection-editor">
          <p className="text-sm font-medium text-gray-800">Adjust image projection</p>
          <div>
            <label className="text-xs text-gray-600 block">Zoom ({Math.round(projection.zoom * 100)}%)</label>
            <input
              type="range"
              min="1"
              max="2"
              step="0.05"
              value={projection.zoom}
              onChange={(e) => setProjection((prev) => ({ ...prev, zoom: Number(e.target.value) }))}
              className="w-full"
              data-testid="projection-zoom-slider"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 block">Focus Horizontal</label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={projection.focus_x}
              onChange={(e) => setProjection((prev) => ({ ...prev, focus_x: Number(e.target.value) }))}
              className="w-full"
              data-testid="projection-focus-x-slider"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 block">Focus Vertical</label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={projection.focus_y}
              onChange={(e) => setProjection((prev) => ({ ...prev, focus_y: Number(e.target.value) }))}
              className="w-full"
              data-testid="projection-focus-y-slider"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 block">Fit Mode</label>
            <select
              value={projection.fit_mode}
              onChange={(e) => setProjection((prev) => ({ ...prev, fit_mode: e.target.value }))}
              className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
              data-testid="projection-fit-mode-select"
            >
              <option value="auto">Adaptive (Default)</option>
              <option value="contain">Contain</option>
              <option value="cover">Cover</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveProjectionAndUpload}
              disabled={uploading}
              className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              data-testid="projection-upload-button"
            >
              {uploading ? 'Uploading...' : 'Apply & Upload'}
            </button>
            <button
              type="button"
              onClick={cancelProjection}
              disabled={uploading}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              data-testid="projection-cancel-button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!activePreview && (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : label}
        </button>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full"></div>
          <span>Optimizing and uploading...</span>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Supported: JPG, PNG, WebP (Max 5MB). Images will be automatically optimized.
      </p>
    </div>
  );
}

export default ImageUpload;
