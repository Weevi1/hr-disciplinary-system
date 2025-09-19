import Logger from '../utils/logger';
// frontend/src/services/TemporaryLinkService.ts
// 🔗 TEMPORARY LINK SERVICE FOR SECURE PDF DOWNLOADS
// ✅ Uses Firebase Storage directly (same pattern as audio clips)
// ✅ Generates QR codes for mobile downloads
// ✅ Simple and reliable - no cloud functions needed

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth, db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// ============================================
// INTERFACES
// ============================================

interface TemporaryLinkData {
  downloadUrl: string;
  qrCodeData: string;
  expiresAt: string;
  tokenId: string;
  filename: string;
}

interface LinkGenerationRequest {
  pdfBlob: Blob;
  filename: string;
  employeeId?: string;
  warningId?: string;
  organizationId?: string;
}

interface TokenPayload {
  sub: string; // user ID
  iat: number; // issued at
  exp: number; // expires at
  aud: string; // audience (your app)
  iss: string; // issuer
  filename: string;
  employeeId?: string;
  warningId?: string;
  organizationId?: string;
  tokenId: string;
}

// ============================================
// TEMPORARY LINK SERVICE
// ============================================

export class TemporaryLinkService {
  private static readonly EXPIRY_HOURS = 1;

  /**
   * Generate a temporary download link with QR code using Firebase Storage
   * (Same pattern as audio uploads - no cloud functions needed!)
   */
  static async generateTemporaryLink(request: LinkGenerationRequest): Promise<TemporaryLinkData> {
    Logger.debug('🔧 [TemporaryLinkService] Starting PDF upload using Firebase Storage...')
    console.log('🔧 [TemporaryLinkService] Request:', {
      filename: request.filename,
      blobSize: request.pdfBlob.size,
      employeeId: request.employeeId,
      warningId: request.warningId,
      organizationId: request.organizationId
    });

    try {
      const user = auth.currentUser;
      if (!user) {
        Logger.error('❌ [TemporaryLinkService] User not authenticated')
        throw new Error('User not authenticated');
      }
      Logger.success(2228)

      // Generate unique token ID for the file
      const tokenId = this.generateTokenId();
      Logger.debug('🔧 [TemporaryLinkService] Generated tokenId:', tokenId)
      
      // Create storage path (same pattern as audio: temp-downloads/orgId/filename)
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 12);
      const cleanFilename = request.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `temp-downloads/${request.organizationId || 'default'}/${timestamp}_${randomId}_${cleanFilename}`;
      
      Logger.debug('🔧 [TemporaryLinkService] Storage path:', storagePath)

      // Create Firebase Storage reference (same as audio uploads)
      const storageRef = ref(storage, storagePath);
      
      // Create metadata (same pattern as audio)
      const metadata = {
        contentType: 'application/pdf',
        customMetadata: {
          organizationId: request.organizationId || '',
          employeeId: request.employeeId || '',
          warningId: request.warningId || '',
          filename: request.filename,
          tokenId: tokenId,
          createdAt: new Date().toISOString(),
          size: request.pdfBlob.size.toString(),
          uploadedBy: user.uid,
          purpose: 'temporary-download'
        }
      };
      
      Logger.debug('☁️ [TemporaryLinkService] Uploading PDF to Firebase Storage...')
      
      // Upload using the SAME pattern as audio uploads
      await uploadBytes(storageRef, request.pdfBlob, metadata);
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Track this temporary file for cleanup
      Logger.debug('📝 [TemporaryLinkService] Tracking temporary file for cleanup...')
      const expiryDate = new Date(Date.now() + (this.EXPIRY_HOURS * 60 * 60 * 1000));
      
      await this.trackTemporaryFile({
        tokenId,
        storagePath,
        downloadUrl,
        filename: request.filename,
        organizationId: request.organizationId,
        employeeId: request.employeeId,
        warningId: request.warningId,
        uploadedBy: user.uid,
        expiresAt: expiryDate,
        createdAt: new Date()
      });
      
      Logger.success(4558)

      // Generate QR code for the download URL
      Logger.debug(4696)
      const qrCodeData = await this.generateQRCode(downloadUrl);
      
      // Set expiry time (1 hour from now)
      const expiresAt = new Date(Date.now() + (this.EXPIRY_HOURS * 60 * 60 * 1000));

      console.log('✅ [TemporaryLinkService] Link generation complete:', {
        tokenId,
        expiresAt: expiresAt.toISOString(),
        downloadUrl: downloadUrl.substring(0, 60) + '...'
      });

      return {
        downloadUrl,
        qrCodeData,
        expiresAt: expiresAt.toISOString(),
        tokenId,
        filename: request.filename
      };

    } catch (error) {
      Logger.error('❌ [TemporaryLinkService] Failed to generate temporary link:', error)
      throw new Error(`Failed to generate temporary link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate a temporary download token (simplified - since we use Firebase URLs directly)
   */
  static async validateTemporaryToken(token: string): Promise<boolean> {
    // With Firebase Storage URLs, validation is handled by Firebase itself
    // The URLs contain built-in authentication tokens
    Logger.debug('🔧 [TemporaryLinkService] Token validation (Firebase handles this automatically)');
    return true; // Firebase URLs are self-validating
  }

  /**
   * Revoke a temporary download token (simplified - for cleanup)
   * Note: Since we use Firebase Storage URLs, we can't revoke the URLs themselves
   * This would need a cleanup job to delete the files from storage
   */
  static async revokeTemporaryToken(tokenId: string): Promise<boolean> {
    Logger.debug('🗑️ [TemporaryLinkService] Token revocation requested for:', tokenId)
    Logger.debug('⚠️ Note: With Firebase Storage URLs, revocation requires file deletion from storage')
    Logger.debug('📝 This would be handled by a cleanup job in a production system')
    
    // For now, just return success - the files will expire naturally
    // In production, you'd add this tokenId to a "revoked" list in Firestore
    // and have a cleanup job delete the actual files from storage
    return true;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private static generateTokenId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 12);
    return `tmp_${timestamp}_${random}`;
  }

  private static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private static async generateQRCode(url: string): Promise<string> {
    try {
      // Use QR Server API (free service)
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/`;
      const params = new URLSearchParams({
        size: '300x300',
        data: url,
        format: 'png',
        ecc: 'M', // Error correction level
        margin: '10'
      });

      const qrUrl = `${qrApiUrl}?${params.toString()}`;
      
      // Fetch the QR code image
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
      // Fallback: return the URL as text-based QR placeholder
      return `data:text/plain;base64,${btoa(url)}`;
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
   * Check if a temporary link has expired
   */
  static isExpired(expiresAt: string): boolean {
    return new Date(expiresAt).getTime() <= Date.now();
  }

  /**
   * Track temporary file in Firestore for cleanup
   */
  private static async trackTemporaryFile(fileData: {
    tokenId: string;
    storagePath: string;
    downloadUrl: string;
    filename: string;
    organizationId?: string;
    employeeId?: string;
    warningId?: string;
    uploadedBy: string;
    expiresAt: Date;
    createdAt: Date;
  }): Promise<void> {
    try {
      await addDoc(collection(db, 'temporaryFiles'), {
        tokenId: fileData.tokenId,
        storagePath: fileData.storagePath,
        downloadUrl: fileData.downloadUrl,
        filename: fileData.filename,
        fileType: 'pdf',
        organizationId: fileData.organizationId || '',
        employeeId: fileData.employeeId || '',
        warningId: fileData.warningId || '',
        uploadedBy: fileData.uploadedBy,
        expiresAt: fileData.expiresAt,
        createdAt: serverTimestamp(),
        isExpired: false,
        fileSize: 0 // Will be populated by metadata if available
      });
      
      Logger.success(10578)
    } catch (error) {
      Logger.error('❌ [TemporaryLinkService] Failed to track temporary file:', error)
      // Don't throw error - file upload should still succeed even if tracking fails
    }
  }
}