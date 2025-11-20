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
  ExternalLink,
  FileWarning
} from 'lucide-react';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { measureAsync, TraceNames } from '../../../config/performance';
import { transformWarningDataForPDF } from '../../../utils/pdfDataTransformer';

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
    if (!warningData || !organization) return null;

    const wizardState = warningData.wizardState || warningData;
    const selectedEmployee = wizardState.selectedEmployee || warningData.selectedEmployee || warningData.employee;
    const selectedCategory = wizardState.selectedCategory || warningData.selectedCategory;
    const formData = wizardState.formData || warningData.formData || {};
    const signatures = wizardState.signatures || warningData.signatures || {};
    const lraRecommendation = wizardState.lraRecommendation || warningData.lraRecommendation;

    // Build data structure for UI display (not transformed yet - that happens in generatePDF)
    // This is synchronous and just for displaying employee name, category, etc.
    return {
      wizardState,
      selectedEmployee,
      selectedCategory,
      formData,
      signatures,
      lraRecommendation,
      employee: {
        firstName: selectedEmployee?.profile?.firstName || selectedEmployee?.firstName || 'Unknown',
        lastName: selectedEmployee?.profile?.lastName || selectedEmployee?.lastName || 'Employee'
      },
      category: selectedCategory?.name || formData.category || 'General Misconduct',
      description: formData.incidentDescription || formData.description || '',
      incidentLocation: formData.incidentLocation || '',
      additionalNotes: formData.additionalNotes || '',
      isComplete: !!(selectedEmployee && selectedCategory && (formData.incidentDescription || formData.description))
    };
  }, [warningData, deliveryChoice, organization]);

  // ============================================
  // FILENAME GENERATION
  // ============================================

  const generatedFilename = useMemo(() => {
    if (!extractedData) return 'Warning_Document.pdf';

    const employeeName = `${extractedData.employee.firstName}_${extractedData.employee.lastName}`;
    const date = new Date().toISOString().split('T')[0];
    // category is now a string, not an object
    const categoryShort = (extractedData.category || 'Warning').replace(/\s+/g, '_').substring(0, 20);

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

    const hasMinimumData = extractedData.description ||
                          extractedData.incidentLocation ||
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

      // 🔒 SECURITY-CRITICAL: Build warning data structure for transformation
      const warningDataStructure = {
        id: extractedData.formData.id || extractedData.formData.warningId || `WRN_${Date.now()}`,
        organizationId: extractedData.wizardState.organizationId || warningData.organizationId,
        level: extractedData.formData.level || extractedData.lraRecommendation?.suggestedLevel || 'counselling',
        category: extractedData.selectedCategory?.name || extractedData.formData.category || 'General Misconduct',
        description: extractedData.formData.incidentDescription || extractedData.formData.description || '',
        incidentDate: extractedData.formData.incidentDate,
        incidentTime: extractedData.formData.incidentTime || '09:00',
        incidentLocation: extractedData.formData.incidentLocation || '',
        issueDate: extractedData.formData.issueDate || extractedData.formData.issuedDate,
        validityPeriod: extractedData.formData.validityPeriod || 6,
        signatures: extractedData.signatures,
        additionalNotes: extractedData.formData.additionalNotes || '',
        status: extractedData.formData.status,
        disciplineRecommendation: extractedData.lraRecommendation,
        // 🎨 CRITICAL: Pass through pdfTemplateVersion from original warning (for fetching from versions collection)
        pdfTemplateVersion: extractedData.formData.pdfTemplateVersion || warningData.pdfTemplateVersion,
        // 🔒 CRITICAL: Pass through pdfGeneratorVersion from original warning (for version routing)
        pdfGeneratorVersion: extractedData.formData.pdfGeneratorVersion || warningData.pdfGeneratorVersion,
        legalCompliance: {
          isCompliant: true,
          framework: 'LRA Section 188',
          requirements: extractedData.lraRecommendation?.legalRequirements || []
        },
        deliveryChoice: deliveryChoice ? {
          method: deliveryChoice.method,
          timestamp: new Date(),
          chosenBy: 'Manager',
          contactDetails: deliveryChoice.contactDetails
        } : undefined,

        // 🆕 Corrective Discussion Fields (Step 2) - Pass to PDF generator
        employeeStatement: extractedData.formData.employeeStatement || warningData.employeeStatement,
        expectedBehaviorStandards: extractedData.formData.expectedBehaviorStandards || warningData.expectedBehaviorStandards,
        factsLeadingToDecision: extractedData.formData.factsLeadingToDecision || warningData.factsLeadingToDecision,
        actionSteps: extractedData.formData.actionSteps || warningData.actionSteps,
        reviewDate: extractedData.formData.reviewDate || warningData.reviewDate,
        interventionDetails: extractedData.formData.interventionDetails || warningData.interventionDetails,
        resourcesProvided: extractedData.formData.resourcesProvided || warningData.resourcesProvided
      };

      // 🔒 ASYNC TRANSFORMATION: Transform warning data for PDF (fetches template if needed)
      const transformedData = await transformWarningDataForPDF(
        warningDataStructure,
        extractedData.selectedEmployee,
        organization
      );

      const { PDFGenerationService } = await import('@/services/PDFGenerationService');

      // 🔒 VERSIONING: Pass stored version to ensure consistent regeneration
      // 🎨 TEMPLATE SETTINGS: Pass stored template settings for consistent styling
      const blob = await measureAsync(
        TraceNames.GENERATE_WARNING_PDF,
        () => PDFGenerationService.generateWarningPDF(
          transformedData,
          transformedData.pdfGeneratorVersion,
          transformedData.pdfSettings
        ),
        {
          employee: `${transformedData.employee.firstName} ${transformedData.employee.lastName}`,
          category: transformedData.category,
          pdfGeneratorVersion: transformedData.pdfGeneratorVersion // Log for traceability
        }
      );

      setPdfBlob(blob);
      setFilename(generatedFilename);

      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      Logger.success('✅ PDF generated:', {
        employee: `${transformedData.employee.firstName} ${transformedData.employee.lastName}`,
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
  }, [extractedData, organization, generatedFilename, deliveryChoice, onPDFGenerated, warningData]);

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
                        {!extractedData.description && <p>• Incident description missing</p>}
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
                          {extractedData.category}
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

                  {/* Action Button - Preview */}
                  <div className="space-y-3">
                    <button
                      onClick={openInNewTab}
                      className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      style={{ minHeight: '48px' }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-sm">Open in New Tab</span>
                    </button>
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
                  <p className="text-sm text-gray-600">{extractedData.category}</p>
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
                        {!extractedData.description && <p>• No incident description</p>}
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

              {/* Action Button */}
              {pdfBlob && !isGenerating && (
                <div className="space-y-3 pt-2">
                  <button
                    onClick={openInNewTab}
                    className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open in New Tab</span>
                  </button>
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
    </>
  );
};
