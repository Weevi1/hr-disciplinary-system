// frontend/src/components/hr/EmailDeliveryGuide.tsx
// 🚀 EMAIL DELIVERY GUIDE
// ✅ Professional email template with copy functionality
// ✅ Mailto integration with pre-filled content
// ✅ PDF generation and progress tracking

import React, { useState, useCallback } from 'react';
import {
  Mail,
  Copy,
  Download,
  ExternalLink,
  CheckCircle,
  User,
  FileText,
  AlertTriangle,
  Clock,
  Upload,
  Image,
  Check,
  Loader2,
  Eye,
  Send
} from 'lucide-react';

// Import themed components
import { ThemedCard, ThemedBadge, ThemedAlert } from '../common/ThemedCard';
import { ThemedButton } from '../common/ThemedButton';

// Import PDF preview modal
import { PDFPreviewModal } from '../warnings/enhanced/PDFPreviewModal';

// ============================================
// INTERFACES
// ============================================

interface EmailDeliveryGuideProps {
  notification: {
    id: string;
    warningId: string;
    employeeName: string;
    employeeEmail?: string;
    warningLevel: string;
    warningCategory: string;
    contactDetails: {
      email?: string;
    };
    pdfUrl?: string;
    createdByName: string;
  };
  currentStep: number;
  onStepComplete: (stepIndex: number) => void;
  onDeliveryComplete: (proofData: any) => void;
  isProcessing: boolean;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const EmailDeliveryGuide: React.FC<EmailDeliveryGuideProps> = ({
  notification,
  currentStep,
  onStepComplete,
  onDeliveryComplete,
  isProcessing
}) => {
  const [templateCopied, setTemplateCopied] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [emailOpened, setEmailOpened] = useState(false);
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  // Generate email template
  const generateEmailTemplate = useCallback(() => {
    const employeeEmail = notification.contactDetails.email || notification.employeeEmail || '';
    const subject = `Important: ${notification.warningLevel} - ${notification.warningCategory}`;

    const body = `Dear ${notification.employeeName},

I hope this email finds you well. I am writing to formally notify you of a disciplinary matter that requires your immediate attention.

Subject: ${notification.warningLevel}
Category: ${notification.warningCategory}

Please find attached the formal warning document that outlines the details of this matter. It is crucial that you review this document thoroughly and understand its contents.

Key Points:
• This is a formal disciplinary action
• Please read the attached document carefully
• You have the right to respond or appeal this decision
• Further incidents may result in additional disciplinary action

If you have any questions or wish to discuss this matter, please do not hesitate to contact me or schedule a meeting with HR.

Please confirm receipt of this email and the attached document by replying to this message.

Thank you for your attention to this matter.

Best regards,
${notification.createdByName || 'HR Department'}
Human Resources Department`;

    return {
      subject,
      body,
      to: employeeEmail
    };
  }, [notification]);

  const emailTemplate = generateEmailTemplate();

  // Copy template to clipboard
  const copyTemplate = async () => {
    try {
      const fullTemplate = `To: ${emailTemplate.to}
Subject: ${emailTemplate.subject}

${emailTemplate.body}`;

      await navigator.clipboard.writeText(fullTemplate);
      setTemplateCopied(true);
      setTimeout(() => setTemplateCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy template:', err);
    }
  };

  // Copy just the email body
  const copyEmailBody = async () => {
    try {
      await navigator.clipboard.writeText(emailTemplate.body);
      setTemplateCopied(true);
      setTimeout(() => setTemplateCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy email body:', err);
    }
  };

  // Handle PDF preview and download via PDFPreviewModal
  const openPDFPreview = () => {
    setShowPDFPreview(true);
  };

  const handlePDFDownload = () => {
    setPdfDownloaded(true);
  };

  // Open email client with pre-filled content
  const openEmailClient = () => {
    const subject = encodeURIComponent(emailTemplate.subject);
    const body = encodeURIComponent(emailTemplate.body);
    const to = encodeURIComponent(emailTemplate.to);

    const mailtoUrl = `mailto:${to}?subject=${subject}&body=${body}`;

    // Open email client
    window.location.href = mailtoUrl;
    setEmailOpened(true);
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
    if (templateCopied && pdfDownloaded) {
      onStepComplete(0);
    }
  };

  // Complete step 2 (sending)
  const completeSending = () => {
    if (emailOpened) {
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
        deliveryMethod: 'email',
        deliveredAt: new Date(),
        proofImage: proofImage,
        emailAddress: emailTemplate.to
      });
    } catch (err) {
      console.error('Failed to complete delivery:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Prepare Email */}
      {currentStep === 0 && (
        <ThemedCard padding="lg" className="border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                Step 1: Prepare Email
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Copy the professional email template and download the PDF attachment
              </p>
            </div>
          </div>

          {/* Email Address Display */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Employee Email:</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {emailTemplate.to || (
                <span className="text-red-500 text-sm">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  No email address on file
                </span>
              )}
            </div>
          </div>

          {/* Email Subject */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Subject:
            </label>
            <div className="relative">
              <input
                value={emailTemplate.subject}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm font-medium"
                style={{ color: 'var(--color-text)' }}
              />
            </div>
          </div>

          {/* Email Body Template */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Message Template:
            </label>
            <div className="relative">
              <textarea
                value={emailTemplate.body}
                readOnly
                className="w-full h-64 p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm resize-none"
                style={{ color: 'var(--color-text)' }}
              />
              <div className="absolute top-2 right-2 space-x-2">
                <ThemedButton
                  variant={templateCopied ? "success" : "primary"}
                  size="sm"
                  onClick={copyTemplate}
                >
                  {templateCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy Full Email
                    </>
                  )}
                </ThemedButton>
                <ThemedButton
                  variant="secondary"
                  size="sm"
                  onClick={copyEmailBody}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Body Only
                </ThemedButton>
              </div>
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
              Use the preview to download the PDF, then attach it to your email
            </p>
          </div>

          {/* Progress Indicators */}
          <div className="space-y-2 mb-6">
            <div className={`flex items-center gap-2 text-sm ${
              templateCopied ? 'text-green-600' : 'text-gray-500'
            }`}>
              {templateCopied ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              Email template copied to clipboard
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
            disabled={!templateCopied || !pdfDownloaded}
            className="w-full"
          >
            {templateCopied && pdfDownloaded ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Continue to Send Email
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

      {/* Step 2: Send Email */}
      {currentStep === 1 && (
        <ThemedCard padding="lg" className="border-l-4 border-l-green-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Send className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                Step 2: Send Email
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Open your email client and send the message with PDF attachment
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <ThemedAlert variant="info">
              <div className="text-sm">
                <strong>Instructions:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Click "Open Email Client" below</li>
                  <li>Your default email application will open with pre-filled content</li>
                  <li>Attach the downloaded PDF file</li>
                  <li>Review the email content and recipient</li>
                  <li>Send the email</li>
                  <li>Wait for delivery confirmation if available</li>
                </ol>
              </div>
            </ThemedAlert>

            {/* Email Details Preview */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex gap-2">
                <span className="font-medium text-gray-700">To:</span>
                <span className="text-gray-900">{emailTemplate.to}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-medium text-gray-700">Subject:</span>
                <span className="text-gray-900">{emailTemplate.subject}</span>
              </div>
            </div>

            <ThemedButton
              variant="primary"
              onClick={openEmailClient}
              disabled={!emailTemplate.to}
              size="lg"
              className="w-full"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Open Email Client
            </ThemedButton>

            {emailOpened && (
              <div className="mt-4">
                <div className="flex items-center gap-2 text-green-600 text-sm mb-4">
                  <CheckCircle className="w-4 h-4" />
                  Email client opened
                </div>

                <ThemedButton
                  variant="primary"
                  onClick={completeSending}
                  className="w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  I've sent the email
                </ThemedButton>
              </div>
            )}
          </div>
        </ThemedCard>
      )}

      {/* Step 3: Confirm Delivery */}
      {currentStep === 2 && (
        <ThemedCard padding="lg" className="border-l-4 border-l-purple-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Upload className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                Step 3: Confirm Delivery
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Upload screenshot proof of successful email delivery
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <ThemedAlert variant="info">
              <div className="text-sm">
                <strong>Screenshot Requirements:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Show the sent email in your "Sent" folder</li>
                  <li>Display recipient email address clearly</li>
                  <li>Include timestamp/date sent</li>
                  <li>Show PDF attachment in the email</li>
                  <li>Capture any delivery confirmation if available</li>
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
                  Complete Email Delivery
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

export default EmailDeliveryGuide;