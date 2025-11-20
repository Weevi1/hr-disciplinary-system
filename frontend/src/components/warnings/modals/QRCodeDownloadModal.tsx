import Logger from '../../../utils/logger';
// frontend/src/components/warnings/QRCodeDownloadModal.tsx
// 📱 QR CODE DOWNLOAD MODAL FOR PDF ACCESS
// ✅ Displays QR code for mobile device scanning
// ✅ Shows expiry countdown and link management
// ✅ Integrates with TemporaryLinkService
// ✅ REDESIGNED: Matches PDFPreviewModal design system

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePreventBodyScroll } from '../../../hooks/usePreventBodyScroll';
import { Z_INDEX } from '../../../constants/zIndex';
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
  Timer
} from 'lucide-react';
import { TemporaryLinkService } from '@/services/TemporaryLinkService';
import { ThemedButton } from '../../common/ThemedButton';
import { ThemedCard } from '../../common/ThemedCard';
import { ThemedAlert } from '../../common/ThemedCard';

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

  // Prevent body scroll when modal is open
  usePreventBodyScroll(isOpen);

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
  const hasGeneratedRef = React.useRef(false);

  // ============================================
  // GENERATE QR CODE LINK
  // ============================================

  const generateQRLink = useCallback(async () => {
    Logger.debug('🔧 [QRCodeDownloadModal] generateQRLink called')
    Logger.debug('🔧 [QRCodeDownloadModal] pdfBlob:', pdfBlob ? `${(pdfBlob.size / 1024).toFixed(1)} KB` : 'null');
    
    if (!pdfBlob) {
      Logger.error('❌ [QRCodeDownloadModal] No PDF blob provided')
      return;
    }

    try {
      Logger.debug('🔧 [QRCodeDownloadModal] Starting QR link generation...')
      setIsGenerating(true);
      setError(null);

      const linkData = await TemporaryLinkService.generateTemporaryLink({
        pdfBlob,
        filename,
        employeeId,
        warningId,
        organizationId
      });

      Logger.success(2764)
      setLinkData(linkData);
      onLinkGenerated?.(linkData);

    } catch (error: any) {
      Logger.error('❌ QR link generation failed:', error)
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
      Logger.error('❌ Failed to copy link:', error)
    }
  }, [linkData?.downloadUrl]);

  // ============================================
  // AUTO-GENERATE ON OPEN
  // ============================================

  useEffect(() => {
    if (isOpen && pdfBlob && !linkData && !isGenerating && !hasGeneratedRef.current) {
      hasGeneratedRef.current = true;
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
      hasGeneratedRef.current = false; // Reset for next open
    }
  }, [isOpen]);

  // ============================================
  // RENDER
  // ============================================

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Clean Header - Matches PDFPreviewModal */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-light)' }}>
              <QrCode className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Mobile Download</h3>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Scan to download on your phone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Document Info - Using ThemedCard */}
          <ThemedCard padding="md" className="border" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-success-light)' }}>
                <Download className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate" style={{ color: 'var(--color-text)' }}>{filename}</h4>
                {employeeName && (
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>For: {employeeName}</p>
                )}
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Size: {(pdfBlob.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          </ThemedCard>

          {/* Loading State */}
          {isGenerating && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 mx-auto mb-4" style={{ borderWidth: '2px', borderColor: 'transparent', borderTopColor: 'var(--color-primary)' }}></div>
              <p className="text-sm" style={{ color: 'var(--color-text)' }}>Generating secure download link...</p>
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>This may take a moment</p>
            </div>
          )}

          {/* Error State - Using ThemedAlert */}
          {error && (
            <ThemedAlert variant="error">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Generation Failed</h4>
                  <p className="text-xs mt-1">{error}</p>
                </div>
              </div>
              <ThemedButton
                variant="danger"
                size="sm"
                onClick={generateQRLink}
                disabled={isGenerating}
                className="mt-3"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </div>
              </ThemedButton>
            </ThemedAlert>
          )}

          {/* Success State with QR Code */}
          {linkData && !countdown.expired && (
            <div className="space-y-4">

              {/* Expiry Warning - Using ThemedAlert */}
              <ThemedAlert variant="warning" className="border-l-4" style={{ borderLeftColor: 'var(--color-warning)' }}>
                <div className="flex items-center gap-3">
                  <Timer className="w-5 h-5" />
                  <div>
                    <h4 className="font-medium text-sm">Time-Limited Access</h4>
                    <p className="text-xs mt-1">
                      Link expires in: {countdown.hours > 0 && `${countdown.hours}h `}
                      {countdown.minutes}m {countdown.seconds}s
                    </p>
                  </div>
                </div>
              </ThemedAlert>

              {/* QR Code Display */}
              <div className="text-center">
                <div className="bg-white p-6 rounded-lg border-2 inline-block" style={{ borderColor: 'var(--color-border)' }}>
                  <img
                    src={linkData.qrCodeData}
                    alt="Download QR Code"
                    className="w-64 h-64 mx-auto"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-center gap-2 mb-2" style={{ color: 'var(--color-text)' }}>
                    <Smartphone className="w-4 h-4" />
                    <span className="text-sm">Point your camera at the QR code</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    No app needed - works with built-in camera on iOS & Android
                  </p>
                </div>
              </div>

              {/* Actions - Using ThemedButton */}
              <div className="space-y-3">

                {/* Copy Link */}
                <ThemedButton
                  variant={copySuccess ? "success" : "secondary"}
                  size="md"
                  fullWidth
                  onClick={handleCopyLink}
                >
                  <div className="flex items-center justify-center gap-2">
                    {copySuccess ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        <span>Copy Download Link</span>
                      </>
                    )}
                  </div>
                </ThemedButton>
              </div>

              {/* Security Notice - Using ThemedAlert */}
              <ThemedAlert variant="info" className="border-l-4" style={{ borderLeftColor: 'var(--color-info)' }}>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm">Security Features</h4>
                    <ul className="text-xs mt-1 space-y-1">
                      <li>• Link expires automatically in 1 hour</li>
                      <li>• Single-use download link</li>
                      <li>• Encrypted token authentication</li>
                      <li>• No app needed - works with any camera</li>
                    </ul>
                  </div>
                </div>
              </ThemedAlert>
            </div>
          )}

          {/* Expired State */}
          {linkData && countdown.expired && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--color-error-light)' }}>
                <Clock className="w-8 h-8" style={{ color: 'var(--color-error)' }} />
              </div>
              <h4 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text)' }}>Link Expired</h4>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                The download link has expired for security reasons.
              </p>
              <ThemedButton
                variant="primary"
                size="md"
                onClick={generateQRLink}
                disabled={isGenerating}
              >
                Generate New Link
              </ThemedButton>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};