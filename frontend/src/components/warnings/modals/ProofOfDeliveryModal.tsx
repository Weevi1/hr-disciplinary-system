// frontend/src/components/warnings/modals/ProofOfDeliveryModal.tsx
// 🚀 PROOF OF DELIVERY MODAL
// ✅ Screenshot upload for email/WhatsApp deliveries
// ✅ Simple "printed" confirmation for print deliveries
// ✅ Screenshot capture instructions

import React, { useState, useRef, useCallback } from 'react';
import {
  X,
  Upload,
  Image,
  Check,
  AlertTriangle,
  Info,
  Mail,
  MessageSquare,
  Printer,
  Camera,
  FileImage,
  Loader2,
  CheckCircle,
  Download,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useOrganization } from '../../../contexts/OrganizationContext';
import Logger from '../../../utils/logger';
import { usePreventBodyScroll } from '../../../hooks/usePreventBodyScroll';
import { Z_INDEX } from '../../../constants/zIndex';
import { transformWarningDataForPDF } from '../../../utils/pdfDataTransformer';

interface ProofOfDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  warningId: string;
  employeeName: string;
  employeeEmail?: string;
  deliveryMethod: 'email' | 'whatsapp' | 'printed';
  warningData?: any; // Full warning data for PDF generation
  onDeliveryConfirmed: (proofData: {
    warningId: string;
    deliveryMethod: string;
    deliveredAt: Date;
    proofImage?: File;
  }) => void;
}

const deliveryMethodConfig = {
  email: {
    icon: Mail,
    name: 'Email',
    color: 'blue',
    requiresProof: true,
    instructions: [
      'Send the warning document via email',
      'Take a screenshot of the sent email',
      'Include timestamp and recipient email visible',
      'Upload the screenshot as proof of delivery'
    ],
    screenshotTips: [
      'Windows: Press Ctrl + Shift + S',
      'Mac: Press Cmd + Shift + 4', 
      'Chrome: Press Ctrl + Shift + Alt + 3'
    ]
  },
  whatsapp: {
    icon: MessageSquare,
    name: 'WhatsApp Business',
    color: 'green',
    requiresProof: true,
    instructions: [
      'Send the warning document via WhatsApp Business',
      'Wait for delivery confirmation (double blue ticks)',
      'Take a screenshot showing the sent message',
      'Include timestamp and delivery status visible',
      'Upload the screenshot as proof of delivery'
    ],
    screenshotTips: [
      'Windows: Press Ctrl + Shift + S',
      'Mac: Press Cmd + Shift + 4',
      'Phone: Use screenshot function (varies by device)'
    ]
  },
  printed: {
    icon: Printer,
    name: 'Print & Hand Delivery',
    color: 'purple',
    requiresProof: false,
    instructions: [
      'Print the warning document',
      'Hand deliver to the employee',
      'Get employee acknowledgment signature on physical copy',
      'File the signed copy in employee records',
      'Confirm delivery completion below'
    ]
  }
};

export const ProofOfDeliveryModal: React.FC<ProofOfDeliveryModalProps> = ({
  isOpen,
  onClose,
  warningId,
  employeeName,
  employeeEmail,
  deliveryMethod,
  warningData,
  onDeliveryConfirmed
}) => {
  const { organization } = useOrganization();
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prevent body scroll when modal is open
  usePreventBodyScroll(isOpen);

  const config = deliveryMethodConfig[deliveryMethod];

  // Email template for warning delivery
  const emailSubject = `Warning Notice - ${warningData?.category || 'Disciplinary Action'}`;
  const emailBody = `Dear ${employeeName},

Please find attached your formal warning notice regarding ${warningData?.category || 'the recent incident'}.

This document outlines:
- The incident details and circumstances
- The warning level issued
- Your rights and the next steps
- The validity period of this warning

Please review the attached PDF carefully. If you have any questions or wish to discuss this matter, please contact your HR department.

This is an official HR document and should be kept for your records.

Best regards,
${organization?.companyName || 'HR Department'}`;

  // Generate mailto link
  const mailtoLink = employeeEmail
    ? `mailto:${employeeEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    : '#';

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError(null);
    setProofImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const syntheticEvent = {
          target: { files: [file] }
        } as React.ChangeEvent<HTMLInputElement>;
        handleFileSelect(syntheticEvent);
      }
    }
  }, [handleFileSelect]);

  const handleConfirmDelivery = useCallback(async () => {
    if (config.requiresProof && !proofImage) {
      setError('Please upload proof of delivery screenshot');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await onDeliveryConfirmed({
        warningId,
        deliveryMethod,
        deliveredAt: new Date(),
        proofImage: proofImage || undefined
      });
      
      // Success - modal will close from parent
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm delivery');
    } finally {
      setIsUploading(false);
    }
  }, [config.requiresProof, proofImage, onDeliveryConfirmed, warningId, deliveryMethod]);

  const removeImage = useCallback(() => {
    setProofImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Copy email script to clipboard
  const handleCopyScript = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(emailBody);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      Logger.error('Failed to copy to clipboard:', err);
    }
  }, [emailBody]);

  // Download PDF
  const handleDownloadPDF = useCallback(async () => {
    if (!warningData || !organization) {
      setError('Missing warning data or organization information');
      return;
    }

    setIsDownloadingPDF(true);
    setError(null);

    try {
      // 🔒 SECURITY-CRITICAL: Use unified PDF data transformer
      // Build employee object from warning data
      const employeeData = {
        firstName: warningData.employeeName?.split(' ')[0] || 'Unknown',
        lastName: warningData.employeeName?.split(' ').slice(1).join(' ') || 'Employee',
        employeeNumber: warningData.employeeNumber || 'N/A',
        department: warningData.department || 'Unknown',
        position: warningData.position || 'Unknown',
        email: employeeEmail || ''
      };

      // Use unified transformer to ensure consistency
      const pdfData = transformWarningDataForPDF(
        warningData,
        employeeData,
        organization
      );

      Logger.debug('📄 Generating PDF with unified transformer data:', {
        warningId: pdfData.warningId,
        employee: `${pdfData.employee.firstName} ${pdfData.employee.lastName}`,
        category: pdfData.category,
        pdfGeneratorVersion: pdfData.pdfGeneratorVersion
      });

      // Lazy-load PDF generation service
      const { PDFGenerationService } = await import('@/services/PDFGenerationService');

      // 🔒 VERSIONING: Pass stored version for consistent regeneration
      // 🎨 TEMPLATE SETTINGS: Pass stored template settings for consistent styling
      const blob = await PDFGenerationService.generateWarningPDF(
        pdfData,
        pdfData.pdfGeneratorVersion,
        pdfData.pdfSettings
      );

      // Generate filename
      const date = new Date().toISOString().split('T')[0];
      const filename = `Warning_${(warningData.category || 'Document').replace(/\s+/g, '_')}_${employeeName.replace(/\s+/g, '_')}_${date}.pdf`;

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      Logger.success('✅ PDF downloaded:', filename);
    } catch (err) {
      Logger.error('❌ PDF download failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to download PDF');
    } finally {
      setIsDownloadingPDF(false);
    }
  }, [warningData, organization, warningId, employeeName, employeeEmail]);

  if (!isOpen) return null;

  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: Z_INDEX.modalNested1 }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r from-${config.color}-600 to-${config.color}-700 p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl">
                <IconComponent className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Confirm Delivery</h2>
                <p className="text-sm opacity-90">
                  {config.name} delivery for {employeeName}
                </p>
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
        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Instructions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              📋 Step-by-Step Instructions
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <ol className="space-y-2">
                <li className="flex items-start gap-3 text-sm">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <span className="text-gray-700">Download the warning PDF document using the button below</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <span className="text-gray-700">Copy the email message text below</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <span className="text-gray-700">Click "Open Email" to launch your email client with pre-filled message</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                    4
                  </span>
                  <span className="text-gray-700">Attach the downloaded PDF to your email and send</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                    5
                  </span>
                  <span className="text-gray-700">Take a screenshot of the sent email (timestamp and recipient visible)</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                    6
                  </span>
                  <span className="text-gray-700">Upload the screenshot as proof of delivery below</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Email Tools Section (for email delivery only) */}
          {deliveryMethod === 'email' && (
            <>
              {/* Download PDF Button */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-600" />
                  Step 1: Download Warning PDF
                </h4>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloadingPDF}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloadingPDF ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download Warning PDF
                    </>
                  )}
                </button>
              </div>

              {/* Email Script Section */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Copy className="w-4 h-4 text-blue-600" />
                  Step 2: Copy Email Message
                </h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600">EMAIL SUBJECT:</span>
                    <button
                      onClick={handleCopyScript}
                      className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {copySuccess ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy Message
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-white border border-gray-300 rounded p-2 mb-3">
                    <p className="text-sm font-medium text-gray-900">{emailSubject}</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-600 block mb-2">EMAIL BODY:</span>
                  <div className="bg-white border border-gray-300 rounded p-3 max-h-48 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{emailBody}</pre>
                  </div>
                </div>
              </div>

              {/* Mailto Link Button */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                  Step 3: Open Your Email Client
                </h4>
                {employeeEmail ? (
                  <a
                    href={mailtoLink}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                  >
                    <Mail className="w-5 h-5" />
                    Open Email to {employeeEmail}
                  </a>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-amber-700">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">Employee email not available. Please send email manually.</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Screenshot Instructions (for email/whatsapp) */}
          {config.requiresProof && deliveryMethod === 'email' && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4 text-gray-600" />
                Step 5: Screenshot Instructions
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {config.screenshotTips?.map((tip, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <kbd className="bg-gray-200 px-2 py-1 rounded text-xs font-mono">
                        {tip.split(': ')[1]}
                      </kbd>
                      <span className="text-xs">{tip.split(': ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Upload Area (for email/whatsapp) */}
          {config.requiresProof && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                {deliveryMethod === 'email' ? 'Step 6: Upload Proof of Delivery' : 'Upload Proof of Delivery'}
              </h4>
              
              {!proofImage ? (
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">
                    Drop screenshot here or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    PNG, JPG up to 5MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Proof of delivery"
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{proofImage.name}</p>
                          <p className="text-sm text-gray-500">
                            {(proofImage.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          onClick={removeImage}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700">Ready to upload</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              onClick={handleConfirmDelivery}
              disabled={isUploading || (config.requiresProof && !proofImage)}
              className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-${config.color}-600 to-${config.color}-700 hover:from-${config.color}-700 hover:to-${config.color}-800 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm Delivery
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};