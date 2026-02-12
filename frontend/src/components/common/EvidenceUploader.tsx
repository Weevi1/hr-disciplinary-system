// frontend/src/components/common/EvidenceUploader.tsx
// Reusable evidence upload component for appeals and responses
// Supports photo, document upload with camera capture and preview
// Images are automatically optimized client-side before upload

import React, { useState, useRef, useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';
import type { EvidenceItem } from '../../types/warning';
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

interface EvidenceUploaderProps {
  items: EvidenceItem[];
  onAdd: (item: EvidenceItem) => void;
  onRemove: (itemId: string) => void;
  organizationId: string;
  warningId?: string; // Optional when deferUpload is true
  storagePath?: string; // Override default path
  maxItems?: number;
  maxFileSize?: number; // bytes
  disabled?: boolean;
  compact?: boolean;
  deferUpload?: boolean; // When true, skip Firebase upload and return File objects for later upload
  hintText?: string; // Custom hint text for empty state
}

const ACCEPTED_TYPES = {
  'image/jpeg': 'photo',
  'image/jpg': 'photo',
  'image/png': 'photo',
  'image/webp': 'photo',
  'image/heic': 'photo',
  'application/pdf': 'document',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
} as const;

const ACCEPT_STRING = Object.keys(ACCEPTED_TYPES).join(',');
const DEFAULT_MAX_ITEMS = 5;
const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function getFileType(mimeType: string): 'photo' | 'document' {
  return (ACCEPTED_TYPES as Record<string, string>)[mimeType] === 'photo' ? 'photo' : 'document';
}

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({
  items,
  onAdd,
  onRemove,
  organizationId,
  warningId,
  storagePath,
  maxItems = DEFAULT_MAX_ITEMS,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  disabled = false,
  compact = false,
  deferUpload = false,
  hintText,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentlySavedIds, setRecentlySavedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const basePath = storagePath || `appeals/${organizationId}/${warningId || 'pending'}`;

  const handleFileUpload = useCallback(async (file: File, captureMethod: 'upload' | 'camera') => {
    setError(null);

    // Validate file size (before optimization)
    if (file.size > maxFileSize) {
      setError(`File too large. Maximum size is 5MB.`);
      return;
    }

    // Validate file type
    if (!Object.keys(ACCEPTED_TYPES).includes(file.type)) {
      setError('Unsupported file type. Please upload images or PDF/DOC files.');
      return;
    }

    // Validate max items
    if (items.length >= maxItems) {
      setError(`Maximum ${maxItems} files allowed.`);
      return;
    }

    setIsUploading(true);
    try {
      // Optimize images client-side (resize + compress)
      let processedFile = file;
      if (isOptimizableImage(file)) {
        setUploadStatus('Optimizing...');
        processedFile = await optimizeImage(file);
      }

      const evidenceId = `ev_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

      // Generate thumbnail for images (small 200px version)
      let thumbnail: string | undefined;
      if (getFileType(processedFile.type) === 'photo') {
        thumbnail = await createOptimizedThumbnail(processedFile);
      }

      // Deferred upload mode: collect files locally, skip Firebase upload
      if (deferUpload) {
        const evidenceItem: EvidenceItem = {
          id: evidenceId,
          type: getFileType(processedFile.type),
          file: processedFile,
          thumbnail,
          description: file.name,
          capturedAt: new Date(),
          captureMethod,
          metadata: {
            filename: file.name,
            fileSize: processedFile.size,
            mimeType: processedFile.type,
          },
        };

        onAdd(evidenceItem);
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
        return;
      }

      // Standard upload mode: upload to Firebase Storage immediately
      setUploadStatus('Uploading...');
      const extension = processedFile.name.split('.').pop() || 'file';
      const fileName = `${evidenceId}.${extension}`;
      const fullPath = `${basePath}/${fileName}`;
      const storageRef = ref(storage, fullPath);

      const metadata = {
        contentType: processedFile.type,
        customMetadata: {
          organizationId,
          warningId: warningId || '',
          evidenceId,
          originalFilename: file.name,
          captureMethod,
          createdAt: new Date().toISOString(),
        },
      };

      await uploadBytes(storageRef, processedFile, metadata);
      const downloadUrl = await getDownloadURL(storageRef);

      const evidenceItem: EvidenceItem = {
        id: evidenceId,
        type: getFileType(processedFile.type),
        url: downloadUrl,
        thumbnail,
        description: file.name,
        capturedAt: new Date(),
        captureMethod,
        metadata: {
          filename: file.name,
          fileSize: processedFile.size,
          mimeType: processedFile.type,
        },
      };

      onAdd(evidenceItem);
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
      setError('Failed to upload file. Please try again.');
      setUploadStatus(null);
      console.error('Evidence upload error:', err);
    } finally {
      setIsUploading(false);
    }
  }, [basePath, items.length, maxFileSize, maxItems, onAdd, organizationId, warningId, deferUpload]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'upload');
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [handleFileUpload]);

  const handleCameraCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'camera');
    }
    e.target.value = '';
  }, [handleFileUpload]);

  const canAddMore = items.length < maxItems && !disabled;

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-900">
          Supporting Evidence
        </label>
        <span className="text-xs text-gray-500">
          {items.length}/{maxItems} files
        </span>
      </div>

      {/* Upload Buttons */}
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
            {compact ? 'Upload' : 'Upload File'}
          </button>
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
            {compact ? 'Photo' : 'Take Photo'}
          </button>

          {/* Upload status */}
          {uploadStatus && (
            <span className="text-xs text-blue-600 font-medium animate-pulse">
              {uploadStatus}
            </span>
          )}

          {/* Hidden file inputs */}
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
            onChange={handleCameraCapture}
            className="hidden"
          />
        </div>
      )}

      {/* Hint */}
      {items.length === 0 && !isUploading && (
        <p className="text-xs text-gray-500">
          {hintText || `Upload photos, PDFs, or Word documents to support your ${compact ? 'submission' : 'appeal'}. Max 5MB per file.`}
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Uploaded Items */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative group bg-gray-50 border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Preview */}
              {item.type === 'photo' && item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt={item.description}
                  className="w-full h-20 object-cover"
                />
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
                  {item.metadata?.filename || item.description}
                </p>
              </div>

              {/* Saved badge */}
              {recentlySavedIds.has(item.id) && (
                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-semibold rounded-full">
                  Saved
                </div>
              )}

              {/* Remove button */}
              {!disabled && (
                <button
                  onClick={() => onRemove(item.id)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove ${item.description}`}
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

export default EvidenceUploader;
