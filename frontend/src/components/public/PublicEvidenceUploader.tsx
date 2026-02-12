// frontend/src/components/public/PublicEvidenceUploader.tsx
// Evidence uploader for the public employee response page
// Uploads via Cloud Function (no Firebase Auth required)
// Images are automatically optimized client-side before upload

import React, { useState, useRef, useCallback } from 'react';
import { optimizeImage, createOptimizedThumbnail, isOptimizableImage } from '../../utils/imageOptimizer';
import {
  Upload,
  Camera,
  X,
  FileText,
  Image,
  Loader2,
  AlertCircle,
  Paperclip,
  CheckCircle2,
} from 'lucide-react';

interface EvidenceFile {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  type: 'photo' | 'document';
  thumbnail?: string;
}

interface PublicEvidenceUploaderProps {
  items: EvidenceFile[];
  onAdd: (item: EvidenceFile) => void;
  onRemove: (itemId: string) => void;
  token: string;
  maxItems?: number;
  maxFileSize?: number; // bytes
  disabled?: boolean;
  uploadEndpoint: string; // Full URL to uploadResponseEvidence function
}

const ACCEPTED_TYPES: Record<string, 'photo' | 'document'> = {
  'image/jpeg': 'photo',
  'image/jpg': 'photo',
  'image/png': 'photo',
  'image/webp': 'photo',
  'image/heic': 'photo',
  'application/pdf': 'document',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
};

const ACCEPT_STRING = Object.keys(ACCEPTED_TYPES).join(',');
const DEFAULT_MAX_ITEMS = 5;
const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const PublicEvidenceUploader: React.FC<PublicEvidenceUploaderProps> = ({
  items,
  onAdd,
  onRemove,
  token,
  maxItems = DEFAULT_MAX_ITEMS,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  disabled = false,
  uploadEndpoint,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentlySavedIds, setRecentlySavedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    setError(null);

    if (file.size > maxFileSize) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    if (!Object.keys(ACCEPTED_TYPES).includes(file.type)) {
      setError('Unsupported file type. Please upload images or PDF/DOC files.');
      return;
    }

    if (items.length >= maxItems) {
      setError(`Maximum ${maxItems} files allowed.`);
      return;
    }

    setIsUploading(true);
    try {
      // Optimize images client-side before upload
      let processedFile = file;
      if (isOptimizableImage(file)) {
        setUploadStatus('Optimizing...');
        processedFile = await optimizeImage(file);
      }

      // Convert optimized file to base64
      setUploadStatus('Uploading...');
      const base64 = await fileToBase64(processedFile);

      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          file: base64,
          fileName: processedFile.name,
          mimeType: processedFile.type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      // Create small thumbnail for images
      let thumbnail: string | undefined;
      if (ACCEPTED_TYPES[processedFile.type] === 'photo') {
        thumbnail = await createOptimizedThumbnail(processedFile);
      }

      const evidenceId = `ev_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

      const evidenceFile: EvidenceFile = {
        id: evidenceId,
        url: result.url,
        fileName: file.name,
        fileSize: processedFile.size,
        mimeType: processedFile.type,
        type: ACCEPTED_TYPES[processedFile.type] || 'document',
        thumbnail,
      };

      onAdd(evidenceFile);
      setUploadStatus(null);

      // Show "Saved" indicator briefly
      setRecentlySavedIds(prev => new Set(prev).add(evidenceId));
      setTimeout(() => {
        setRecentlySavedIds(prev => {
          const next = new Set(prev);
          next.delete(evidenceId);
          return next;
        });
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file. Please try again.');
      setUploadStatus(null);
    } finally {
      setIsUploading(false);
    }
  }, [token, items.length, maxFileSize, maxItems, onAdd, uploadEndpoint]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = '';
  }, [handleFileUpload]);

  const canAddMore = items.length < maxItems && !disabled;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-900">
          Supporting Evidence (Optional)
        </label>
        <span className="text-xs text-gray-500">
          {items.length}/{maxItems} files
        </span>
      </div>

      {canAddMore && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Upload
          </button>
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
            Photo
          </button>

          {/* Upload status */}
          {uploadStatus && (
            <span className="text-xs text-blue-600 font-medium animate-pulse">
              {uploadStatus}
            </span>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_STRING}
            onChange={handleFileInputChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      )}

      {items.length === 0 && !isUploading && (
        <p className="text-xs text-gray-500">
          Upload photos, PDFs, or documents to support your submission. Max 5MB per file.
        </p>
      )}

      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative group bg-gray-50 border border-gray-200 rounded-lg overflow-hidden"
            >
              {item.type === 'photo' && item.thumbnail ? (
                <img src={item.thumbnail} alt={item.fileName} className="w-full h-20 object-cover" />
              ) : (
                <div className="w-full h-20 flex items-center justify-center bg-gray-100">
                  {item.type === 'photo' ? (
                    <Image className="w-8 h-8 text-gray-400" />
                  ) : (
                    <FileText className="w-8 h-8 text-gray-400" />
                  )}
                </div>
              )}

              {/* File info - name only, no size */}
              <div className="px-2 py-1.5 flex items-center gap-1">
                {recentlySavedIds.has(item.id) ? (
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0 text-green-500" />
                ) : (
                  <Paperclip className="w-3 h-3 flex-shrink-0 text-gray-400" />
                )}
                <p className="text-xs text-gray-700 truncate">
                  {item.fileName}
                </p>
              </div>

              {/* Saved badge */}
              {recentlySavedIds.has(item.id) && (
                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-semibold rounded-full">
                  Saved
                </div>
              )}

              {!disabled && (
                <button
                  onClick={() => onRemove(item.id)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove ${item.fileName}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default PublicEvidenceUploader;
