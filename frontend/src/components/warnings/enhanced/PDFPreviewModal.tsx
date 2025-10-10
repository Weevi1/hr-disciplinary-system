import Logger from '../../../utils/logger';
// frontend/src/components/warnings/enhanced/PDFPreviewModal.tsx
// ✨ MOBILE-FIRST PDF PREVIEW MODAL - REDESIGNED
// 📱 Bottom sheet on mobile, sidebar layout on desktop
// 🎯 Single action location, clear hierarchy, no duplicate buttons

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { usePreventBodyScroll } from '../../../hooks/usePreventBodyScroll';
import { Z_INDEX } from '../../../constants/zIndex';
import {
  X,
  Download,
  Eye,
  FileText,
  Loader2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  QrCode,
  ExternalLink,
  FileWarning
} from 'lucide-react';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { QRCodeDownloadModal } from '../modals/QRCodeDownloadModal';
import { measureAsync, TraceNames } from '../../../config/performance';

// ============================================
// INTERFACES
// ============================================

interface WarningWizardData {
  wizardState?: {
    currentStep: number;
    selectedEmployee: any;
    selectedCategory: any;
    formData: any;
    signatures: any;
    lraRecommendation: any;
    organizationId: string;
  };
  selectedEmployee?: any;
  selectedCategory?: any;
  formData?: any;
  signatures?: any;
  lraRecommendation?: any;
  organizationId?: string;
}

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  warningData: WarningWizardData;
  deliveryChoice?: {
    method: string;
    contactDetails?: any;
  };
  onPDFGenerated?: (blob: Blob, filename: string) => void;
  showPreview?: boolean;
  title?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  isOpen,
  onClose,
  warningData,
  deliveryChoice,
  onPDFGenerated,
  showPreview = true,
  title = "Warning Document"
}) => {
  const { organization } = useOrganization();

  // Prevent body scroll when modal is open
  usePreventBodyScroll(isOpen);

  // PDF State
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState<string>('');

  // QR Code State
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrPdfBlob, setQrPdfBlob] = useState<Blob | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ============================================
  // DATA EXTRACTION
  // ============================================

  const extractedData = useMemo(() => {
    if (!warningData) return null;

    const wizardState = warningData.wizardState || warningData;
    const selectedEmployee = wizardState.selectedEmployee || warningData.selectedEmployee || warningData.employee;
    const selectedCategory = wizardState.selectedCategory || warningData.selectedCategory;
    const formData = wizardState.formData || warningData.formData || {};
    const signatures = wizardState.signatures || warningData.signatures || {};
    const lraRecommendation = wizardState.lraRecommendation || warningData.lraRecommendation;

    // Extract employee data from profile structure
    const employeeData = selectedEmployee ? {
      id: selectedEmployee.id,
      firstName: selectedEmployee.profile?.firstName || selectedEmployee.firstName || 'Unknown',
      lastName: selectedEmployee.profile?.lastName || selectedEmployee.lastName || 'Employee',
      employeeId: selectedEmployee.profile?.employeeNumber || selectedEmployee.employeeId || selectedEmployee.id || 'N/A',
      position: selectedEmployee.employment?.position || selectedEmployee.position || 'Unknown Position',
      department: selectedEmployee.employment?.department || selectedEmployee.profile?.department || selectedEmployee.department || 'Unknown Department',
      email: selectedEmployee.profile?.email || selectedEmployee.email || '',
      phone: selectedEmployee.profile?.phoneNumber || selectedEmployee.phone || ''
    } : {
      id: formData.employeeId || 'unknown',
      firstName: 'Employee',
      lastName: 'Not Selected',
      employeeId: formData.employeeId || 'N/A',
      position: 'Unknown Position',
      department: 'Unknown Department',
      email: '',
      phone: ''
    };

    const categoryData = selectedCategory ? {
      id: selectedCategory.id,
      name: selectedCategory.name || 'General Misconduct',
      severity: selectedCategory.severity || 'medium'
    } : {
      id: formData.categoryId || 'unknown',
      name: 'Category Not Selected',
      severity: 'medium'
    };

    // Helper function to convert Firestore Timestamp to Date
    const convertTimestampToDate = (timestamp: any): Date => {
      if (!timestamp) return new Date();
      // Check if it's a Firestore Timestamp with seconds property
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000);
      }
      // Check if it's already a Date object
      if (timestamp instanceof Date) {
        return timestamp;
      }
      // Try to parse as date string
      const parsed = new Date(timestamp);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    };

    return {
      warningId: `WRN_${Date.now()}`,
      organizationId: wizardState.organizationId || warningData.organizationId,
      employee: employeeData,
      category: categoryData,
      isComplete: !!(selectedEmployee && selectedCategory),
      incident: {
        date: formData.incidentDate || new Date().toISOString().split('T')[0],
        time: formData.incidentTime || '09:00',
        location: formData.incidentLocation || '',
        description: formData.incidentDescription || ''
      },
      additionalNotes: formData.additionalNotes || '',
      validityPeriod: formData.validityPeriod || 6,
      signatures: {
        manager: signatures.manager,
        employee: signatures.employee
      },
      recommendation: lraRecommendation,
      // ✅ Use the actual warning level from formData (which includes manual overrides)
      warningLevel: formData.level || lraRecommendation?.suggestedLevel || 'counselling',
      issueDate: convertTimestampToDate(formData.issueDate || formData.issuedDate),
      deliveryMethod: deliveryChoice?.method || 'email',
      status: formData.status // Extract status for PDF watermarking
    };
  }, [warningData, deliveryChoice]);

  // ============================================
  // FILENAME GENERATION
  // ============================================

  const generatedFilename = useMemo(() => {
    if (!extractedData) return 'Warning_Document.pdf';

    const employeeName = `${extractedData.employee.firstName}_${extractedData.employee.lastName}`;
    const date = new Date().toISOString().split('T')[0];
    const categoryShort = extractedData.category.name.replace(/\s+/g, '_').substring(0, 20);

    return `Warning_${categoryShort}_${employeeName}_${date}.pdf`;
  }, [extractedData]);

  // ============================================
  // PDF GENERATION
  // ============================================

  const generatePDF = useCallback(async () => {
    if (!extractedData || !organization) {
      setError('Missing required data for PDF generation');
      return;
    }

    const hasMinimumData = extractedData.incident.description ||
                          extractedData.incident.location ||
                          extractedData.additionalNotes;

    if (!hasMinimumData) {
      setError('Insufficient incident data. Please complete the form first.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    const steps = [
      'Preparing document...',
      'Applying branding...',
      'Formatting content...',
      'Finalizing PDF...'
    ];

    try {
      for (let i = 0; i < steps.length; i++) {
        setGenerationStep(steps[i]);
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      const pdfData = {
        warningId: extractedData.warningId,
        issuedDate: extractedData.issueDate,
        status: extractedData.status, // Include status for OVERTURNED watermark
        employee: {
          firstName: extractedData.employee.firstName,
          lastName: extractedData.employee.lastName,
          employeeNumber: extractedData.employee.employeeId,
          department: extractedData.employee.department,
          position: extractedData.employee.position,
          email: extractedData.employee.email
        },
        // ✅ Use the actual warning level (includes manual overrides from Step 2)
        warningLevel: extractedData.warningLevel || 'counselling',
        category: extractedData.category.name,
        description: extractedData.incident.description,
        incidentDate: new Date(extractedData.incident.date),
        incidentTime: extractedData.incident.time,
        incidentLocation: extractedData.incident.location,
        organization: organization,
        signatures: extractedData.signatures,
        additionalNotes: extractedData.additionalNotes,
        validityPeriod: extractedData.validityPeriod,
        legalCompliance: {
          isCompliant: true,
          framework: 'LRA Section 188',
          requirements: extractedData.recommendation?.legalRequirements || []
        },
        disciplineRecommendation: extractedData.recommendation ? {
          suggestedLevel: extractedData.recommendation.suggestedLevel,
          reason: extractedData.recommendation.reason || 'Progressive discipline escalation',
          warningCount: extractedData.recommendation.warningCount || 0,
          activeWarnings: extractedData.recommendation.previousWarnings || [],
          legalRequirements: extractedData.recommendation.legalRequirements || []
        } : undefined,
        deliveryChoice: deliveryChoice ? {
          method: deliveryChoice.method,
          timestamp: new Date(),
          chosenBy: 'Manager',
          contactDetails: deliveryChoice.contactDetails
        } : undefined
      };

      const { PDFGenerationService } = await import('@/services/PDFGenerationService');

      const blob = await measureAsync(
        TraceNames.GENERATE_WARNING_PDF,
        () => PDFGenerationService.generateWarningPDF(pdfData),
        {
          employee: `${extractedData.employee.firstName} ${extractedData.employee.lastName}`,
          category: extractedData.category.name
        }
      );

      setPdfBlob(blob);
      setFilename(generatedFilename);

      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      Logger.success('✅ PDF generated:', {
        employee: `${extractedData.employee.firstName} ${extractedData.employee.lastName}`,
        size: `${(blob.size / 1024).toFixed(1)} KB`
      });

      if (onPDFGenerated) {
        await onPDFGenerated(blob, generatedFilename);
      }

    } catch (error) {
      Logger.error('❌ PDF generation failed:', error)
      setError(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  }, [extractedData, organization, generatedFilename, deliveryChoice, onPDFGenerated]);

  // ============================================
  // DOWNLOAD HANDLERS
  // ============================================

  const downloadPDF = useCallback(() => {
    if (!pdfBlob || !filename) return;

    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show success feedback
    Logger.success('📥 PDF downloaded successfully');
  }, [pdfBlob, filename]);

  const handleQRDownload = useCallback(async () => {
    if (!extractedData || !organization) {
      setError('Missing required data for QR code generation');
      return;
    }

    setIsGeneratingQR(true);

    try {
      const pdfData = {
        warningId: extractedData.warningId,
        issuedDate: extractedData.issueDate,
        status: extractedData.status, // Include status for OVERTURNED watermark
        employee: {
          firstName: extractedData.employee.firstName,
          lastName: extractedData.employee.lastName,
          employeeNumber: extractedData.employee.employeeId,
          department: extractedData.employee.department,
          position: extractedData.employee.position,
          email: extractedData.employee.email
        },
        // ✅ Use the actual warning level (includes manual overrides from Step 2)
        warningLevel: extractedData.warningLevel || 'counselling',
        category: extractedData.category.name,
        description: extractedData.incident.description,
        incidentDate: new Date(extractedData.incident.date),
        incidentTime: extractedData.incident.time,
        incidentLocation: extractedData.incident.location,
        organization: organization,
        signatures: extractedData.signatures,
        additionalNotes: extractedData.additionalNotes,
        validityPeriod: extractedData.validityPeriod,
        legalCompliance: {
          isCompliant: true,
          framework: 'LRA Section 188',
          requirements: extractedData.recommendation?.legalRequirements || []
        },
        disciplineRecommendation: extractedData.recommendation ? {
          suggestedLevel: extractedData.recommendation.suggestedLevel,
          reason: extractedData.recommendation.reason || 'Progressive discipline escalation',
          warningCount: extractedData.recommendation.warningCount || 0,
          activeWarnings: extractedData.recommendation.previousWarnings || [],
          legalRequirements: extractedData.recommendation.legalRequirements || []
        } : undefined
      };

      const { PDFGenerationService } = await import('@/services/PDFGenerationService');
      const qrBlob = await PDFGenerationService.generateWarningPDF(pdfData);

      setQrPdfBlob(qrBlob);
      setShowQRModal(true);

    } catch (error) {
      Logger.error('❌ QR PDF generation failed:', error)
      setError(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingQR(false);
    }
  }, [extractedData, organization]);

  const openInNewTab = useCallback(() => {
    if (!pdfUrl) return;
    window.open(pdfUrl, '_blank');
  }, [pdfUrl]);

  // ============================================
  // AUTO-GENERATE ON OPEN
  // ============================================

  const hasPDFGenerated = useRef(false);

  useEffect(() => {
    // Only auto-generate if we have complete data
    if (isOpen && extractedData && extractedData.isComplete && !pdfBlob && !isGenerating && !hasPDFGenerated.current) {
      hasPDFGenerated.current = true;
      generatePDF();
    }

    if (!isOpen) {
      hasPDFGenerated.current = false;
    }
  }, [isOpen, extractedData, pdfBlob, isGenerating, generatePDF]);

  // ============================================
  // SCROLL TO TOP ON OPEN
  // ============================================

  useEffect(() => {
    if (isOpen) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isOpen]);

  // ============================================
  // CLEANUP
  // ============================================

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // ============================================
  // RENDER
  // ============================================

  if (!isOpen) return null;

  // MOBILE LAYOUT - Centered Modal
  if (isMobile) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: Z_INDEX.modal }} onClick={onClose}>
          <div
            className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>{title}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                  <button
                    onClick={generatePDF}
                    className="mt-2 text-sm text-red-700 hover:text-red-900 font-medium flex items-center gap-1"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              )}

              {/* Loading State */}
              {isGenerating && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    <div>
                      <p className="text-blue-800 font-medium">Generating PDF</p>
                      {generationStep && (
                        <p className="text-blue-600 text-sm">{generationStep}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Incomplete Data Warning */}
              {extractedData && !extractedData.isComplete && !isGenerating && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-amber-800 mb-2">Incomplete Warning Data</h3>
                      <div className="text-sm text-amber-700 space-y-1">
                        {!extractedData.hasEmployee && <p>• Employee not selected</p>}
                        {!extractedData.hasCategory && <p>• Category not selected</p>}
                        {!extractedData.incident.description && <p>• Incident description missing</p>}
                      </div>
                      <p className="text-sm text-amber-800 mt-3 font-medium">
                        Please complete the warning wizard before generating the PDF.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-3 w-full bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors font-medium"
                  >
                    Return to Wizard
                  </button>
                </div>
              )}

              {/* Success State */}
              {pdfBlob && !isGenerating && extractedData && (
                <>
                  {/* Document Info Card */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-base mb-1">
                          {extractedData.employee.firstName} {extractedData.employee.lastName}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {extractedData.category.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <FileText className="w-3 h-3" />
                          <span className="truncate">{filename}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {(pdfBlob.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {/* Action Buttons - QR Code & Preview */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleQRDownload}
                        disabled={isGeneratingQR}
                        className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                        style={{ minHeight: '48px' }}
                      >
                        {isGeneratingQR ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <QrCode className="w-4 h-4" />
                        )}
                        <span className="text-sm">QR Code</span>
                      </button>

                      <button
                        onClick={openInNewTab}
                        className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        style={{ minHeight: '48px' }}
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-sm">Preview</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* No Data State */}
              {!extractedData && !isGenerating && (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Data Available</h3>
                  <p className="text-gray-500 mb-4">
                    Complete the warning wizard first.
                  </p>
                  <button
                    onClick={onClose}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Return to Wizard
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* QR Modal */}
        {qrPdfBlob && (
          <QRCodeDownloadModal
            isOpen={showQRModal}
            onClose={() => {
              setShowQRModal(false);
              setQrPdfBlob(null);
            }}
            pdfBlob={qrPdfBlob}
            filename={filename}
            employeeId={extractedData?.employee?.id}
            warningId={extractedData?.warningId}
            organizationId={extractedData?.organizationId || organization?.id}
            employeeName={
              extractedData &&
              `${extractedData.employee.firstName} ${extractedData.employee.lastName}`.trim()
            }
            onLinkGenerated={(linkData) => {
              Logger.debug('🔗 QR download link generated:', linkData)
            }}
          />
        )}
      </>
    );
  }

  // DESKTOP LAYOUT - Sidebar + Preview
  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: Z_INDEX.modal }}>
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full h-[90vh] overflow-hidden flex">

          {/* Left Sidebar - Actions */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <FileWarning className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              </div>
              {extractedData && (
                <div className="mt-3">
                  <p className="font-medium text-gray-900 text-base">
                    {extractedData.employee.firstName} {extractedData.employee.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{extractedData.category.name}</p>
                </div>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <p className="text-xs text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                  <button
                    onClick={generatePDF}
                    className="mt-2 text-sm text-red-700 hover:text-red-900 font-medium flex items-center gap-1"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              )}

              {/* Loading State */}
              {isGenerating && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-800 font-medium text-sm">Generating PDF</p>
                      {generationStep && (
                        <p className="text-blue-600 text-xs mt-1">{generationStep}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Incomplete Data Warning */}
              {extractedData && !extractedData.isComplete && !isGenerating && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-amber-800 mb-2">Incomplete Data</h3>
                      <div className="text-xs text-amber-700 space-y-1">
                        {!extractedData.hasEmployee && <p>• No employee selected</p>}
                        {!extractedData.hasCategory && <p>• No category selected</p>}
                        {!extractedData.incident.description && <p>• No incident description</p>}
                      </div>
                      <p className="text-xs text-amber-800 mt-2 font-medium">
                        Complete the wizard first.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success State - File Info */}
              {pdfBlob && !isGenerating && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900 text-sm">Ready to Download</h3>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 truncate" title={filename}>
                      {filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(pdfBlob.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {pdfBlob && !isGenerating && (
                <div className="space-y-3 pt-2">
                  {/* Action Buttons - QR Code & Preview */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleQRDownload}
                      disabled={isGeneratingQR}
                      className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                    >
                      {isGeneratingQR ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <QrCode className="w-4 h-4" />
                          <span>QR Code</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={openInNewTab}
                      className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open in New Tab</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>

          {/* Right Side - PDF Preview */}
          <div className="flex-1 bg-gray-50 flex flex-col">
            {/* Close Button */}
            <div className="p-4 flex justify-end">
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Area */}
            <div className="flex-1 p-6 pt-0">
              {pdfUrl && showPreview ? (
                <div className="h-full bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full border-0"
                    title="PDF Preview"
                  />
                </div>
              ) : isGenerating ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Generating preview...</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No preview available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* QR Modal */}
      {qrPdfBlob && (
        <QRCodeDownloadModal
          isOpen={showQRModal}
          onClose={() => {
            setShowQRModal(false);
            setQrPdfBlob(null);
          }}
          pdfBlob={qrPdfBlob}
          filename={filename}
          employeeId={extractedData?.employee?.id}
          warningId={extractedData?.warningId}
          organizationId={extractedData?.organizationId || organization?.id}
          employeeName={
            extractedData &&
            `${extractedData.employee.firstName} ${extractedData.employee.lastName}`.trim()
          }
          onLinkGenerated={(linkData) => {
            Logger.debug('🔗 QR download link generated:', linkData)
          }}
        />
      )}
    </>
  );
};
