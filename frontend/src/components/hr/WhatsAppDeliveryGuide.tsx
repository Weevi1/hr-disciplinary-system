// frontend/src/components/hr/WhatsAppDeliveryGuide.tsx
// 🚀 WHATSAPP DELIVERY GUIDE
// ✅ Pre-written script with copy functionality
// ✅ One-click WhatsApp Web opening with pre-filled message
// ✅ PDF download and progress tracking

import React, { useState, useCallback } from 'react';
import {
  MessageSquare,
  Copy,
  Download,
  ExternalLink,
  CheckCircle,
  Phone,
  FileText,
  AlertTriangle,
  Clock,
  Upload,
  Image,
  Check,
  Loader2,
  Eye
} from 'lucide-react';

// Import themed components
import { ThemedCard, ThemedBadge, ThemedAlert } from '../common/ThemedCard';
import { ThemedButton } from '../common/ThemedButton';

// Import PDF preview modal
import { PDFPreviewModal } from '../warnings/enhanced/PDFPreviewModal';

// ============================================
// INTERFACES
// ============================================

interface WhatsAppDeliveryGuideProps {
  notification: {
    id: string;
    warningId: string;
    employeeName: string;
    employeePhone?: string;
    warningLevel: string;
    warningCategory: string;
    contactDetails: {
      phone?: string;
    };
    pdfUrl?: string;
  };
  currentStep: number;
  onStepComplete: (stepIndex: number) => void;
  onDeliveryComplete: (proofData: any) => void;
  isProcessing: boolean;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const WhatsAppDeliveryGuide: React.FC<WhatsAppDeliveryGuideProps> = ({
  notification,
  currentStep,
  onStepComplete,
  onDeliveryComplete,
  isProcessing
}) => {
  const [scriptCopied, setScriptCopied] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [whatsappOpened, setWhatsappOpened] = useState(false);
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  // Generate WhatsApp message script
  const generateWhatsAppScript = useCallback(() => {
    const phoneNumber = notification.contactDetails.phone || notification.employeePhone || '';
    const cleanPhone = phoneNumber.replace(/[^\d]/g, '');

    return {
      message: `Hi ${notification.employeeName},

I hope this message finds you well. I'm writing to inform you that we need to discuss a ${notification.warningLevel.toLowerCase()} regarding ${notification.warningCategory.toLowerCase()}.

I've attached the formal warning document for your review. Please read through it carefully and let me know if you have any questions or would like to schedule a meeting to discuss this matter further.

This is an important workplace matter that requires your immediate attention. Please confirm receipt of this message and the attached document.

Thank you for your cooperation.

Best regards,
HR Department`,
      phoneNumber: cleanPhone,
      formattedPhone: phoneNumber
    };
  }, [notification]);

  const whatsappData = generateWhatsAppScript();

  // Copy script to clipboard
  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(whatsappData.message);
      setScriptCopied(true);
      setTimeout(() => setScriptCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy script:', err);
    }
  };

  // Handle PDF preview and download via PDFPreviewModal
  const openPDFPreview = () => {
    setShowPDFPreview(true);
  };

  const handlePDFDownload = () => {
    setPdfDownloaded(true);
  };

  // Open WhatsApp Web with pre-filled message
  const openWhatsApp = () => {
    const message = encodeURIComponent(whatsappData.message);
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${whatsappData.phoneNumber}&text=${message}`;

    window.open(whatsappUrl, '_blank');
    setWhatsappOpened(true);
  };

  // Handle image upload for proof
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProofImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Complete step 1 (preparation)
  const completePreparation = () => {
    if (scriptCopied && pdfDownloaded) {
      onStepComplete(0);
    }
  };

  // Complete step 2 (sending)
  const completeSending = () => {
    if (whatsappOpened) {
      onStepComplete(1);
    }
  };

  // Complete final delivery
  const completeDelivery = async () => {
    if (!proofImage) return;

    setIsUploading(true);
    try {
      await onDeliveryComplete({
        warningId: notification.warningId,
        deliveryMethod: 'whatsapp',
        deliveredAt: new Date(),
        proofImage: proofImage,
        phoneNumber: whatsappData.formattedPhone
      });
    } catch (err) {
      console.error('Failed to complete delivery:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Prepare Message */}
      {currentStep === 0 && (
        <ThemedCard padding="lg" className="border-l-4 border-l-green-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                Step 1: Prepare WhatsApp Message
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Copy the pre-written script and download the PDF attachment
              </p>
            </div>
          </div>

          {/* Phone Number Display */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Employee Phone Number:</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {whatsappData.formattedPhone || (
                <span className="text-red-500 text-sm">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  No phone number on file
                </span>
              )}
            </div>
          </div>

          {/* Message Script */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp Message Script:
            </label>
            <div className="relative">
              <textarea
                value={whatsappData.message}
                readOnly
                className="w-full h-48 p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono resize-none"
                style={{ color: 'var(--color-text)' }}
              />
              <ThemedButton
                variant={scriptCopied ? "success" : "primary"}
                size="sm"
                onClick={copyScript}
                className="absolute top-2 right-2"
              >
                {scriptCopied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy Script
                  </>
                )}
              </ThemedButton>
            </div>
          </div>

          {/* PDF Preview and Download */}
          <div className="mb-6 space-y-3">
            <div className="flex gap-3">
              <ThemedButton
                variant="secondary"
                onClick={openPDFPreview}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview & Download PDF
              </ThemedButton>

              {pdfDownloaded && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">PDF Downloaded</span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500">
              Use the preview to download the PDF, then attach it to your WhatsApp message
            </p>
          </div>

          {/* Progress Indicators */}
          <div className="space-y-2 mb-6">
            <div className={`flex items-center gap-2 text-sm ${
              scriptCopied ? 'text-green-600' : 'text-gray-500'
            }`}>
              {scriptCopied ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              Script copied to clipboard
            </div>
            <div className={`flex items-center gap-2 text-sm ${
              pdfDownloaded ? 'text-green-600' : 'text-gray-500'
            }`}>
              {pdfDownloaded ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              PDF downloaded for attachment
            </div>
          </div>

          {/* Continue Button */}
          <ThemedButton
            variant="primary"
            onClick={completePreparation}
            disabled={!scriptCopied || !pdfDownloaded}
            className="w-full"
          >
            {scriptCopied && pdfDownloaded ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Continue to Send Message
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Complete preparation steps above
              </>
            )}
          </ThemedButton>
        </ThemedCard>
      )}

      {/* Step 2: Send Message */}
      {currentStep === 1 && (
        <ThemedCard padding="lg" className="border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ExternalLink className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                Step 2: Send via WhatsApp
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Open WhatsApp Web and send the message with PDF attachment
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <ThemedAlert variant="info">
              <div className="text-sm">
                <strong>Instructions:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Click "Open WhatsApp Web" below</li>
                  <li>The message will be pre-filled with the script</li>
                  <li>Attach the downloaded PDF file</li>
                  <li>Send the message</li>
                  <li>Wait for delivery confirmation (double blue ticks)</li>
                </ol>
              </div>
            </ThemedAlert>

            <ThemedButton
              variant="primary"
              onClick={openWhatsApp}
              disabled={!whatsappData.phoneNumber}
              size="lg"
              className="w-full"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Open WhatsApp Web
            </ThemedButton>

            {whatsappOpened && (
              <div className="mt-4">
                <div className="flex items-center gap-2 text-green-600 text-sm mb-4">
                  <CheckCircle className="w-4 h-4" />
                  WhatsApp Web opened
                </div>

                <ThemedButton
                  variant="primary"
                  onClick={completeSending}
                  className="w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  I've sent the message
                </ThemedButton>
              </div>
            )}
          </div>
        </ThemedCard>
      )}

      {/* Step 3: Confirm Delivery */}
      {currentStep === 2 && (
        <ThemedCard padding="lg" className="border-l-4 border-l-green-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Upload className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                Step 3: Confirm Delivery
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Upload screenshot proof of successful delivery
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <ThemedAlert variant="info">
              <div className="text-sm">
                <strong>Screenshot Requirements:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Show the sent message with timestamp</li>
                  <li>Display delivery confirmation (double blue ticks)</li>
                  <li>Include employee's phone number visible</li>
                  <li>Capture PDF attachment in the message</li>
                </ul>
              </div>
            </ThemedAlert>

            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="proof-upload"
              />
              <label htmlFor="proof-upload" className="cursor-pointer">
                {imagePreview ? (
                  <div className="space-y-3">
                    <img
                      src={imagePreview}
                      alt="Delivery proof"
                      className="max-w-full max-h-64 mx-auto rounded-lg shadow-sm"
                    />
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Screenshot uploaded</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Image className="w-12 h-12 mx-auto text-gray-400" />
                    <div>
                      <div className="text-lg font-medium text-gray-700">Upload Screenshot</div>
                      <div className="text-sm text-gray-500">Click to select image file</div>
                    </div>
                  </div>
                )}
              </label>
            </div>

            {/* Complete Delivery Button */}
            <ThemedButton
              variant="success"
              onClick={completeDelivery}
              disabled={!proofImage || isUploading}
              size="lg"
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Completing Delivery...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete WhatsApp Delivery
                </>
              )}
            </ThemedButton>
          </div>
        </ThemedCard>
      )}

      {/* PDF Preview Modal */}
      {showPDFPreview && (
        <PDFPreviewModal
          isOpen={showPDFPreview}
          onClose={() => setShowPDFPreview(false)}
          warningData={{
            employee: {
              firstName: notification.employeeName.split(' ')[0] || notification.employeeName,
              lastName: notification.employeeName.split(' ').slice(1).join(' ') || '',
              employeeNumber: 'EMP001', // This should come from notification data
              department: 'N/A' // This should come from notification data
            },
            category: notification.warningCategory,
            level: notification.warningLevel,
            description: 'Warning document details',
            incidentDate: new Date(),
            issueDate: new Date()
          }}
          onDownload={handlePDFDownload}
        />
      )}
    </div>
  );
};

export default WhatsAppDeliveryGuide;