// frontend/src/utils/imageOptimizer.ts
// Client-side image optimization to reduce storage costs
// Resizes large images and compresses quality before upload

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];

/**
 * Check if a file is an image that can be optimized
 */
export function isOptimizableImage(file: File): boolean {
  return IMAGE_TYPES.includes(file.type);
}

/**
 * Load a File into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Optimize an image file by resizing and compressing.
 * - Resizes to fit within maxDimension (preserving aspect ratio)
 * - Compresses to JPEG at given quality
 * - Returns original file unchanged if it's not an image or if optimization fails
 */
export async function optimizeImage(
  file: File,
  maxDimension = 1920,
  quality = 0.8
): Promise<File> {
  if (!isOptimizableImage(file)) return file;

  try {
    const img = await loadImage(file);
    const { width, height } = img;

    // Skip if already small enough
    if (width <= maxDimension && height <= maxDimension) {
      // Still compress quality if it's a large file (> 500KB)
      if (file.size <= 500 * 1024) {
        URL.revokeObjectURL(img.src);
        return file;
      }
    }

    // Calculate new dimensions
    let newWidth = width;
    let newHeight = height;
    if (width > maxDimension || height > maxDimension) {
      const ratio = Math.min(maxDimension / width, maxDimension / height);
      newWidth = Math.round(width * ratio);
      newHeight = Math.round(height * ratio);
    }

    // Draw to canvas
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      URL.revokeObjectURL(img.src);
      return file;
    }
    ctx.drawImage(img, 0, 0, newWidth, newHeight);
    URL.revokeObjectURL(img.src);

    // Export as JPEG (best compression for evidence photos)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );

    if (!blob) return file;

    // Build filename with .jpg extension
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const optimizedFile = new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });

    return optimizedFile;
  } catch {
    // If optimization fails, return original
    return file;
  }
}

/**
 * Create a small thumbnail data URL for preview display.
 * Much more memory-efficient than storing full-size data URLs.
 */
export async function createOptimizedThumbnail(
  file: File,
  maxDimension = 200,
  quality = 0.6
): Promise<string> {
  if (!isOptimizableImage(file)) return '';

  try {
    const img = await loadImage(file);
    const { width, height } = img;

    const ratio = Math.min(maxDimension / width, maxDimension / height);
    const newWidth = Math.round(width * ratio);
    const newHeight = Math.round(height * ratio);

    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      URL.revokeObjectURL(img.src);
      return '';
    }
    ctx.drawImage(img, 0, 0, newWidth, newHeight);
    URL.revokeObjectURL(img.src);

    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    return '';
  }
}
