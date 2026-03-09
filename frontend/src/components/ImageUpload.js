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
  label = "Upload Image"
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Show local preview immediately
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);

      // Compress image based on logical bucket
      let compressedFile = file;
      if (bucket === BUCKETS.AVATARS) {
        compressedFile = await compressImage(file, 400, 0.8);
      } else if (bucket === BUCKETS.ARTWORKS) {
        compressedFile = await compressImage(file, 1200, 0.85);
      } else {
        compressedFile = await compressImage(file, 1000, 0.8);
      }

      /**
       * IMPORTANT CHANGE:
       * `bucket` is now used as an S3 FOLDER name
       * (avatars / artworks / exhibitions)
       */
     const imageUrl = await uploadFile({
       file: compressedFile,
       bucket: bucket,          // chitrakalakar-uploads
       folder: folder,          // avatars / artworks
     });

      setPreview(imageUrl);
      onUpload(imageUrl);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
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

      {preview && (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className={`rounded-lg object-cover shadow-md ${
              folder === 'avatars'
                ? 'w-32 h-32 rounded-full'
                : 'max-w-sm max-h-64'
            }`}
          />
          {!uploading && (
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

      {!preview && (
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
