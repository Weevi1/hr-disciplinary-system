import Logger from '../utils/logger';
// frontend/src/services/PDFStorageService.ts
// 🎯 PDF STORAGE SERVICE - Using the WORKING audio upload pattern
// ✅ Direct Firebase Storage upload like audio clips
// ✅ Generate public download URLs
// ✅ Simple QR code generation

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { addDoc, collection } from 'firebase/firestore';
import { storage, db } from '../config/firebase';

// ============================================
// TYPES
// ============================================

interface PDFUploadResult {
  downloadUrl: string;
  qrCodeData: string;
  expiresAt: string;
  storagePath: string;
  filename: string;
}

// ============================================
// PDF STORAGE SERVICE - USING WORKING AUDIO PATTERN
// ============================================

export class PDFStorageService {
  
  /**
   * Upload PDF to Firebase Storage (same pattern as audio uploads)
   */
  static async uploadPDF(
    pdfBlob: Blob,
    filename: string,
    organizationId: string,
    employeeId?: string,
    warningId?: string
  ): Promise<PDFUploadResult> {
    try {
      Logger.debug(1127)
      Logger.debug('📄 File details:', {
        filename,
        size: pdfBlob.size,
        type: pdfBlob.type,
        organizationId,
        employeeId,
        warningId
      });

      // Create storage path (similar to audio: temp-downloads/orgId/filename)
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 12);
      const storagePath = `temp-downloads/${organizationId}/${timestamp}_${randomId}_${filename}`;
      
      Logger.debug(1675)

      // Create Firebase Storage reference
      const storageRef = ref(storage, storagePath);
      
      // Create metadata (similar to audio metadata)
      const metadata = {
        contentType: 'application/pdf',
        customMetadata: {
          organizationId,
          employeeId: employeeId || '',
          warningId: warningId || '',
          filename,
          createdAt: new Date().toISOString(),
          size: pdfBlob.size.toString(),
          uploadedBy: 'pdf-storage-service'
        }
      };
      
      Logger.debug('☁️ Uploading PDF to Firebase Storage...')
      
      // Upload using the SAME pattern as audio
      await uploadBytes(storageRef, pdfBlob, metadata);
      const downloadUrl = await getDownloadURL(storageRef);
      
      Logger.success(2419)

      // Generate QR code for the download URL
      const qrCodeData = await this.generateQRCode(downloadUrl);
      
      // Set expiry to 1 hour (like the original design)
      const expiresAt = new Date(Date.now() + (60 * 60 * 1000));

      // 🗑️ TODO: Register for cleanup when Firestore permissions are fixed
      Logger.debug('📝 PDF upload complete, cleanup will be manual for now')

      return {
        downloadUrl,
        qrCodeData,
        expiresAt: expiresAt.toISOString(),
        storagePath,
        filename
      };

    } catch (error) {
      Logger.error('❌ Error uploading PDF:', error)
      throw new Error(`Failed to upload PDF: ${error.message}`);
    }
  }

  /**
   * Generate QR code for download URL
   */
  private static async generateQRCode(url: string): Promise<string> {
    try {
      Logger.debug(3389)
      
      // Use QR Server API (same as original design)
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/`;
      const params = new URLSearchParams({
        size: '300x300',
        data: url,
        format: 'png',
        ecc: 'M',
        margin: '10'
      });

      const qrUrl = `${qrApiUrl}?${params.toString()}`;
      
      const response = await fetch(qrUrl);
      if (!response.ok) {
        throw new Error('QR code generation failed');
      }

      const blob = await response.blob();
      
      // Convert to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

    } catch (error) {
      Logger.error('❌ QR Code generation failed:', error)
      // Fallback: return a text-based placeholder
      return `data:text/plain;base64,${btoa(url)}`;
    }
  }

  /**
   * Delete PDF from storage (for cleanup)
   */
  static async deletePDF(storagePath: string): Promise<boolean> {
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
      Logger.success(4548)
      return true;
    } catch (error) {
      Logger.error('❌ Error deleting PDF:', error)
      return false;
    }
  }

  /**
   * Format expiry time for display
   */
  static formatExpiryTime(expiresAt: string): string {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return 'Expired';
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;

    if (diffHours > 0) {
      return `${diffHours}h ${remainingMinutes}m remaining`;
    } else {
      return `${remainingMinutes}m remaining`;
    }
  }

  /**
   * Check if link has expired
   */
  static isExpired(expiresAt: string): boolean {
    return new Date(expiresAt).getTime() <= Date.now();
  }
}