// frontend/src/components/public/PublicEvidenceUploader.tsx
// Evidence uploader for the public employee response page
// Uploads via Cloud Function (no Firebase Auth required)

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  Camera,
  X,
  FileText,
  Image,
  Loader2,
  AlertCircle,
  Paperclip,
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

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
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    setError(null);

    if (file.size > maxFileSize) {
      setError(`File too large. Maximum size is ${formatFileSize(maxFileSize)}.`);
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
      // Convert file to base64
      const base64 = await fileToBase64(file);

      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          file: base64,
          fileName: file.name,
          mimeType: file.type,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      // Create thumbnail for images
      let thumbnail: string | undefined;
      if (ACCEPTED_TYPES[file.type] === 'photo') {
        thumbnail = await createThumbnail(file);
      }

      const evidenceFile: EvidenceFile = {
        id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
        url: result.url,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        type: ACCEPTED_TYPES[file.type] || 'document',
        thumbnail,
      };

      onAdd(evidenceFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file. Please try again.');
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
        <div className="flex gap-2">
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
          Upload photos, PDFs, or documents to support your submission. Max {formatFileSize(maxFileSize)} per file.
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
              <div className="px-2 py-1.5">
                <p className="text-xs text-gray-700 truncate flex items-center gap-1">
                  <Paperclip className="w-3 h-3 flex-shrink-0" />
                  {item.fileName}
                </p>
                <p className="text-xs text-gray-400">{formatFileSize(item.fileSize)}</p>
              </div>
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

function createThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export default PublicEvidenceUploader;
