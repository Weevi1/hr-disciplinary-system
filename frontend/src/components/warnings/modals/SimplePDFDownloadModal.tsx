import Logger from '../../../utils/logger';
// frontend/src/components/warnings/modals/SimplePDFDownloadModal.tsx
// 🔄 SIMPLE PDF DOWNLOAD MODAL - FALLBACK WITHOUT QR COMPLEXITY
// ✅ Provides reliable PDF download without QR code complications
// ✅ Simple, straightforward download functionality
// ✅ Can be used as fallback when QR system has issues

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  FileWarning,
  ExternalLink,
  Printer
} from 'lucide-react';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { transformWarningDataForPDF } from '../../../utils/pdfDataTransformer';

// ============================================
// INTERFACES MATCHING YOUR WARNING WIZARD
// ============================================

interface WarningWizardData {
  wizardState?: {
    currentStep: number;
    selectedEmployee: any;
    selectedCategory: any;
    formData: {
      incidentDate: string;
      incidentTime: string;
      incidentLocation: string;
      incidentDescription: string;
      additionalNotes: string;
      validityPeriod: number;
    };
    signatures: {
      manager: string | null;
      employee: string | null;
    };
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

interface SimplePDFDownloadModalProps {
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

export const SimplePDFDownloadModal: React.FC<SimplePDFDownloadModalProps> = ({
  isOpen,
  onClose,
  warningData,
  deliveryChoice,
  onPDFGenerated,
  showPreview = true,
  title = "Warning Document Download"
}) => {
  const { organization } = useOrganization();

  // Prevent body scroll when modal is open
  usePreventBodyScroll(isOpen);

  // PDF Generation State
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [downloadCount, setDownloadCount] = useState(0);

  // 🔒 SECURITY-CRITICAL: Use unified PDF data transformer
  const extractedData = useMemo(() => {
    if (!warningData || !organization) return null;

    const wizardState = warningData.wizardState || warningData;
    const selectedEmployee = wizardState.selectedEmployee || warningData.selectedEmployee;
    const selectedCategory = wizardState.selectedCategory || warningData.selectedCategory;
    const formData = wizardState.formData || warningData.formData || {};
    const signatures = wizardState.signatures || warningData.signatures || {};
    const lraRecommendation = wizardState.lraRecommendation || warningData.lraRecommendation;

    // Map wizard data to warning data structure
    const warningDataStructure = {
      id: formData.id || formData.warningId || `WRN_${Date.now()}`,
      organizationId: wizardState.organizationId || warningData.organizationId,
      level: formData.level || lraRecommendation?.suggestedLevel || 'counselling',
      category: selectedCategory?.name || formData.category || 'General Misconduct',
      description: formData.incidentDescription || formData.description || '',
      incidentDate: formData.incidentDate,
      incidentTime: formData.incidentTime || '09:00',
      incidentLocation: formData.incidentLocation || '',
      issueDate: formData.issueDate || formData.issuedDate,
      validityPeriod: formData.validityPeriod || 6,
      signatures: signatures,
      additionalNotes: formData.additionalNotes || '',
      status: formData.status,
      disciplineRecommendation: lraRecommendation,
      // 🔥 CRITICAL FIX: Extract manager name from signatures or warning data
      issuedByName: signatures?.managerName || formData.issuedByName || warningData.issuedByName || 'Manager',
      // 🔒 VERSIONING: Pass stored PDF code version to ensure consistent regeneration
      pdfGeneratorVersion: formData.pdfGeneratorVersion || warningData.pdfGeneratorVersion,
      // 🎨 TEMPLATE SETTINGS: Pass stored template settings for consistent styling
      pdfSettings: formData.pdfSettings || warningData.pdfSettings
    };

    // Use unified transformer to ensure consistency
    try {
      const pdfData = transformWarningDataForPDF(
        warningDataStructure,
        selectedEmployee,
        organization
      );

      // Add UI flags for template
      return {
        ...pdfData,
        isComplete: !!(selectedEmployee && selectedCategory),
        hasEmployee: !!selectedEmployee,
        hasCategory: !!selectedCategory
      };
    } catch (error) {
      Logger.error('❌ Failed to transform wizard data for PDF:', error);
      return null;
    }
  }, [warningData, deliveryChoice, organization]);

  // PDF filename generation
  const generatedFilename = useMemo(() => {
    if (!extractedData) return 'Warning_Document.pdf';

    const employeeName = `${extractedData.employee.firstName}_${extractedData.employee.lastName}`;
    const date = new Date().toISOString().split('T')[0];
    // category is now a string, not an object
    const categoryShort = (extractedData.category || 'Warning').replace(/\s+/g, '_').substring(0, 20);

    return `Warning_${categoryShort}_${employeeName}_${date}.pdf`;
  }, [extractedData]);

  // Generate PDF
  const generatePDF = useCallback(async () => {
    if (!extractedData || !organization) {
      setError('Missing required data for PDF generation');
      return;
    }

    const hasMinimumData = extractedData.description ||
                          extractedData.incidentLocation ||
                          extractedData.additionalNotes;

    if (!hasMinimumData) {
      setError('Insufficient incident data. Please complete the form before generating PDF.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    const steps = [
      'Preparing document data...',
      'Applying organization branding...',
      'Formatting content sections...',
      'Adding legal compliance elements...',
      'Finalizing PDF document...'
    ];

    try {
      for (let i = 0; i < steps.length; i++) {
        setGenerationStep(steps[i]);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // 🔒 SECURITY-CRITICAL: extractedData is already transformed by the unified transformer
      // No need to rebuild the structure - use it directly to ensure consistency
      Logger.debug('📄 Generating PDF with unified transformer data:', {
        warningId: extractedData.warningId,
        employee: `${extractedData.employee.firstName} ${extractedData.employee.lastName}`,
        category: extractedData.category,
        pdfGeneratorVersion: extractedData.pdfGeneratorVersion // Log version for traceability
      });

      // Lazy-load PDF generation service (reduces initial bundle by ~578 KB)
      const { PDFGenerationService } = await import('@/services/PDFGenerationService');

      // 🔒 VERSIONING: Pass stored version to ensure consistent regeneration
      // If this warning was created with v1.0.0, it will use v1.0.0 code to regenerate
      // If this warning was created with v1.1.0, it will use v1.1.0 code to regenerate
      // 🎨 TEMPLATE SETTINGS: Pass stored template settings for consistent styling
      const blob = await PDFGenerationService.generateWarningPDF(
        extractedData,
        extractedData.pdfGeneratorVersion,
        extractedData.pdfSettings
      );

      setPdfBlob(blob);
      setFilename(generatedFilename);

      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      Logger.success('✅ PDF generated for simple download:', {
        filename: generatedFilename,
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

  // Download PDF
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
    
    setDownloadCount(prev => prev + 1);
    Logger.debug('📥 PDF downloaded:', filename)
  }, [pdfBlob, filename]);

  // Open PDF in new tab
  const openPDF = useCallback(() => {
    if (!pdfUrl) return;
    
    const newWindow = window.open(pdfUrl, '_blank');
    if (newWindow) {
      newWindow.focus();
    }
  }, [pdfUrl]);

  // Print PDF
  const printPDF = useCallback(() => {
    if (!pdfUrl) return;
    
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
    }
  }, [pdfUrl]);

  // Auto-generate on open
  useEffect(() => {
    if (isOpen && extractedData && !pdfBlob && !isGenerating) {
      generatePDF();
    }
  }, [isOpen, extractedData, pdfBlob, isGenerating, generatePDF]);

  // Cleanup URLs
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: Z_INDEX.modal }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileWarning className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">{title}</h2>
                {extractedData && (
                  <p className="text-green-100">
                    {extractedData.employee.firstName} {extractedData.employee.lastName} - {extractedData.category}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Incomplete Data Warning */}
          {extractedData && !extractedData.isComplete && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-amber-400 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-amber-800">Incomplete Warning Data</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    PDF can be generated with available data, but may appear incomplete.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-400 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">PDF Generation Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
              <button
                onClick={generatePDF}
                className="mt-3 text-sm text-red-700 hover:text-red-900 font-medium flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry Generation
              </button>
            </div>
          )}

          {/* Generation Progress */}
          {isGenerating && (
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <div>
                  <p className="text-blue-800 font-medium text-lg">Generating PDF Document</p>
                  {generationStep && (
                    <p className="text-blue-600 text-sm">{generationStep}</p>
                  )}
                </div>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
              </div>
            </div>
          )}

          {/* Success State with Actions */}
          {pdfBlob && pdfUrl && !isGenerating && (
            <div className="space-y-6">
              
              {/* Success Banner */}
              <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-4" />
                    <div>
                      <h3 className="text-green-800 font-medium text-lg">PDF Ready for Download</h3>
                      <p className="text-green-700 text-sm">
                        {filename} ({(pdfBlob.size / 1024).toFixed(1)} KB)
                        {downloadCount > 0 && ` • Downloaded ${downloadCount} time${downloadCount > 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={downloadPDF}
                  className="flex items-center justify-center space-x-3 bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors font-medium text-lg"
                >
                  <Download className="w-6 h-6" />
                  <span>Download PDF</span>
                </button>
                
                <button
                  onClick={openPDF}
                  className="flex items-center justify-center space-x-3 bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
                >
                  <Eye className="w-6 h-6" />
                  <span>Open in Tab</span>
                </button>

                <button
                  onClick={printPDF}
                  className="flex items-center justify-center space-x-3 bg-purple-600 text-white px-6 py-4 rounded-lg hover:bg-purple-700 transition-colors font-medium text-lg"
                >
                  <Printer className="w-6 h-6" />
                  <span>Print</span>
                </button>
              </div>

              {/* PDF Preview */}
              {showPreview && (
                <div className="bg-gray-100 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Document Preview
                  </h3>
                  <div className="bg-white border rounded-lg overflow-hidden shadow-inner" style={{ height: '400px' }}>
                    <iframe
                      src={pdfUrl}
                      className="w-full h-full border-0"
                      title="PDF Preview"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex-shrink-0 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Simple PDF download without QR complexity
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Close
              </button>
              
              {!pdfBlob && !isGenerating && extractedData && (
                <button
                  onClick={generatePDF}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <FileText className="w-4 h-4" />
                  <span>Generate PDF</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};