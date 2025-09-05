// frontend/src/components/warnings/QRCodeDownloadModal.tsx
// 📱 QR CODE DOWNLOAD MODAL FOR PDF ACCESS
// ✅ Displays QR code for mobile device scanning
// ✅ Shows expiry countdown and link management
// ✅ Integrates with TemporaryLinkService

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  QrCode,
  Download,
  Copy,
  Clock,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Shield,
  Timer,
  Trash2,
  Eye
} from 'lucide-react';
import { TemporaryLinkService } from '@/services/TemporaryLinkService';

// ============================================
// INTERFACES
// ============================================

interface QRCodeDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBlob: Blob;
  filename: string;
  employeeId?: string;
  warningId?: string;
  organizationId?: string;
  employeeName?: string;
  onLinkGenerated?: (linkData: any) => void;
}

interface CountdownState {
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

// ============================================
// QR CODE DOWNLOAD MODAL
// ============================================

export const QRCodeDownloadModal: React.FC<QRCodeDownloadModalProps> = ({
  isOpen,
  onClose,
  pdfBlob,
  filename,
  employeeId,
  warningId,
  organizationId,
  employeeName,
  onLinkGenerated
}) => {
  
  // ============================================
  // STATE
  // ============================================
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [linkData, setLinkData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<CountdownState>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false
  });
  const [copySuccess, setCopySuccess] = useState(false);

  // ============================================
  // GENERATE QR CODE LINK
  // ============================================

  const generateQRLink = useCallback(async () => {
    console.log('🔧 [QRCodeDownloadModal] generateQRLink called');
    console.log('🔧 [QRCodeDownloadModal] pdfBlob:', pdfBlob ? `${(pdfBlob.size / 1024).toFixed(1)} KB` : 'null');
    
    if (!pdfBlob) {
      console.error('❌ [QRCodeDownloadModal] No PDF blob provided');
      return;
    }

    try {
      console.log('🔧 [QRCodeDownloadModal] Starting QR link generation...');
      setIsGenerating(true);
      setError(null);

      const linkData = await TemporaryLinkService.generateTemporaryLink({
        pdfBlob,
        filename,
        employeeId,
        warningId,
        organizationId
      });

      console.log('✅ [QRCodeDownloadModal] Link generated successfully:', linkData);
      setLinkData(linkData);
      onLinkGenerated?.(linkData);

    } catch (error: any) {
      console.error('❌ QR link generation failed:', error);
      setError(error.message || 'Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  }, [pdfBlob, filename, employeeId, warningId, organizationId, onLinkGenerated]);

  // ============================================
  // COUNTDOWN TIMER
  // ============================================

  useEffect(() => {
    if (!linkData?.expiresAt) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(linkData.expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setCountdown({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ hours, minutes, seconds, expired: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [linkData?.expiresAt]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleCopyLink = useCallback(async () => {
    if (!linkData?.downloadUrl) return;

    try {
      await navigator.clipboard.writeText(linkData.downloadUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('❌ Failed to copy link:', error);
    }
  }, [linkData?.downloadUrl]);

  const handleRevokeLink = useCallback(async () => {
    if (!linkData?.tokenId) return;

    try {
      await TemporaryLinkService.revokeTemporaryToken(linkData.tokenId);
      setLinkData(null);
      setCountdown({ hours: 0, minutes: 0, seconds: 0, expired: false });
    } catch (error) {
      console.error('❌ Failed to revoke link:', error);
    }
  }, [linkData?.tokenId]);

  const handleTestLink = useCallback(() => {
    if (linkData?.downloadUrl) {
      window.open(linkData.downloadUrl, '_blank');
    }
  }, [linkData?.downloadUrl]);

  // ============================================
  // AUTO-GENERATE ON OPEN
  // ============================================

  useEffect(() => {
    if (isOpen && pdfBlob && !linkData && !isGenerating) {
      generateQRLink();
    }
  }, [isOpen, pdfBlob, linkData, isGenerating, generateQRLink]);

  // ============================================
  // CLEANUP ON CLOSE
  // ============================================

  useEffect(() => {
    if (!isOpen) {
      setLinkData(null);
      setError(null);
      setCountdown({ hours: 0, minutes: 0, seconds: 0, expired: false });
      setCopySuccess(false);
    }
  }, [isOpen]);

  // ============================================
  // RENDER
  // ============================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Mobile Download</h3>
                <p className="text-blue-100 text-sm">Scan to download on your phone</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          
          {/* Document Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">{filename}</h4>
                {employeeName && (
                  <p className="text-sm text-gray-600">For: {employeeName}</p>
                )}
                <p className="text-xs text-gray-500">
                  Size: {(pdfBlob.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isGenerating && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Generating secure download link...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <h4 className="text-red-800 font-medium">Generation Failed</h4>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
              <button
                onClick={generateQRLink}
                className="mt-3 flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                disabled={isGenerating}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            </div>
          )}

          {/* Success State with QR Code */}
          {linkData && !countdown.expired && (
            <div className="space-y-6">
              
              {/* Expiry Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Timer className="w-5 h-5 text-amber-500" />
                  <div>
                    <h4 className="text-amber-800 font-medium">Time-Limited Access</h4>
                    <p className="text-amber-700 text-sm">
                      Link expires in: {countdown.hours > 0 && `${countdown.hours}h `}
                      {countdown.minutes}m {countdown.seconds}s
                    </p>
                  </div>
                </div>
              </div>

              {/* QR Code Display */}
              <div className="text-center">
                <div className="bg-white p-6 rounded-xl border-2 border-gray-200 inline-block">
                  <img 
                    src={linkData.qrCodeData} 
                    alt="Download QR Code"
                    className="w-64 h-64 mx-auto"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-center space-x-2 text-gray-600 mb-2">
                    <Smartphone className="w-4 h-4" />
                    <span className="text-sm">Point your camera at the QR code</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    No app needed - works with built-in camera on iOS & Android
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                
                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center space-x-3 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {copySuccess ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span>Copy Download Link</span>
                    </>
                  )}
                </button>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleTestLink}
                    className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Test Link</span>
                  </button>
                  
                  <button
                    onClick={handleRevokeLink}
                    className="flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Revoke</span>
                  </button>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-blue-800 font-medium text-sm">Security Features</h4>
                    <ul className="text-blue-700 text-xs mt-1 space-y-1">
                      <li>• Link expires automatically in 1 hour</li>
                      <li>• Single-use download link</li>
                      <li>• Encrypted token authentication</li>
                      <li>• Can be revoked instantly</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expired State */}
          {linkData && countdown.expired && (
            <div className="text-center py-8">
              <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                <Clock className="w-8 h-8 text-red-500 mx-auto" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Link Expired</h4>
              <p className="text-gray-600 mb-4">
                The download link has expired for security reasons.
              </p>
              <button
                onClick={generateQRLink}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                disabled={isGenerating}
              >
                Generate New Link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};