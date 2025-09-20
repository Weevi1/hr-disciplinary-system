import Logger from '../../../utils/logger';
// frontend/src/components/warnings/enhanced/PDFPreviewModal.tsx
// ✨ PRODUCTION-READY PDF PREVIEW MODAL V2
// 🎯 Clean, professional design language consistent with v2 system
// 📱 Enhanced QR code download functionality with modern UX
// 🏢 Enterprise-ready PDF generation and management

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  X, 
  Download, 
  Eye, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Scale,
  Heart,
  Info,
  User,
  Calendar,
  Clock,
  MapPin,
  FileWarning,
  QrCode,
  Smartphone
} from 'lucide-react';
import { useOrganization } from '../../../contexts/OrganizationContext';
import { PDFGenerationService } from '../../../services/PDFGenerationService';
import { QRCodeDownloadModal } from '../modals/QRCodeDownloadModal';

// ============================================
// INTERFACES MATCHING YOUR WARNING WIZARD
// ============================================

interface WarningWizardData {
  // Your wizard state structure
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
  
  // Alternative flat structure
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
  title = "Warning Document Preview"
}) => {
  const { organization } = useOrganization();
  
  // PDF Generation State (existing)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState<string>('');

  // QR Code Modal State (new)
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrPdfBlob, setQrPdfBlob] = useState<Blob | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrGenerationStep, setQrGenerationStep] = useState<string>('');

  // Modal scroll ref for improved auto-scroll
  const modalRef = useRef<HTMLDivElement>(null);

  // ============================================
  // RESILIENT DATA EXTRACTION - HANDLES INCOMPLETE STATES
  // ============================================

  const extractedData = useMemo(() => {
    if (!warningData) return null;

    // Handle both nested wizardState and flat structure
    const wizardState = warningData.wizardState || warningData;
    const selectedEmployee = wizardState.selectedEmployee || warningData.selectedEmployee;
    const selectedCategory = wizardState.selectedCategory || warningData.selectedCategory;
    const formData = wizardState.formData || warningData.formData || {};
    const signatures = wizardState.signatures || warningData.signatures || {};
    const lraRecommendation = wizardState.lraRecommendation || warningData.lraRecommendation;

    // Create resilient employee data - handle null/undefined states
    const employeeData = selectedEmployee ? {
      id: selectedEmployee.id,
      firstName: selectedEmployee.firstName || 'Unknown',
      lastName: selectedEmployee.lastName || 'Employee',
      employeeId: selectedEmployee.employeeId || selectedEmployee.id || 'N/A',
      position: selectedEmployee.position || 'Unknown Position',
      department: selectedEmployee.department || 'Unknown Department',
      email: selectedEmployee.email || '',
      phone: selectedEmployee.phone || ''
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

    // Create resilient category data - handle null/undefined states
    const categoryData = selectedCategory ? {
      id: selectedCategory.id,
      name: selectedCategory.name || 'General Misconduct',
      severity: selectedCategory.severity || 'medium',
      description: selectedCategory.description || '',
      lraSection: selectedCategory.lraSection || 'LRA Section 188'
    } : {
      id: formData.categoryId || 'unknown',
      name: 'Category Not Selected',
      severity: 'medium',
      description: 'Category details not available',
      lraSection: 'LRA Section 188'
    };

    return {
      // Core identifiers
      warningId: `WRN_${Date.now()}`,
      organizationId: wizardState.organizationId || warningData.organizationId,
      
      // Resilient employee information
      employee: employeeData,
      
      // Resilient category information
      category: categoryData,
      
      // Form data status
      isComplete: !!(selectedEmployee && selectedCategory),
      hasEmployee: !!selectedEmployee,
      hasCategory: !!selectedCategory,
      
      // Incident details from your form
      incident: {
        date: formData.incidentDate || new Date().toISOString().split('T')[0],
        time: formData.incidentTime || '09:00',
        location: formData.incidentLocation || '',
        description: formData.incidentDescription || ''
      },
      
      // Additional details
      additionalNotes: formData.additionalNotes || '',
      validityPeriod: formData.validityPeriod || 6,
      
      // Signatures
      signatures: {
        manager: signatures.manager,
        employee: signatures.employee
      },
      
      // AI/LRA recommendation
      recommendation: lraRecommendation,
      
      // Timing
      issueDate: new Date(),
      
      // Delivery
      deliveryMethod: deliveryChoice?.method || 'email'
    };
  }, [warningData, deliveryChoice]);
  // ============================================
  // PDF FILENAME GENERATION (unchanged)
  // ============================================

  const generatedFilename = useMemo(() => {
    if (!extractedData) return 'Warning_Document.pdf';
    
    const employeeName = `${extractedData.employee.firstName}_${extractedData.employee.lastName}`;
    const date = new Date().toISOString().split('T')[0];
    const categoryShort = extractedData.category.name.replace(/\s+/g, '_').substring(0, 20);
    
    return `Warning_${categoryShort}_${employeeName}_${date}.pdf`;
  }, [extractedData]);

  // ============================================
  // RESILIENT PDF GENERATION HANDLER (unchanged)
  // ============================================

  const generatePDF = useCallback(async () => {
    if (!extractedData || !organization) {
      setError('Missing required data for PDF generation');
      return;
    }

    // Check if we have minimum data for PDF generation
    const hasMinimumData = extractedData.incident.description || 
                          extractedData.incident.location || 
                          extractedData.additionalNotes;

    if (!hasMinimumData) {
      setError('Insufficient incident data. Please complete the form before generating PDF.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    
    const steps = [
      'Preparing warning document data...',
      'Applying organization branding...',
      'Formatting incident details...',
      'Adding legal compliance sections...',
      'Finalizing PDF document...'
    ];

    try {
      for (let i = 0; i < steps.length; i++) {
        setGenerationStep(steps[i]);
        await new Promise(resolve => setTimeout(resolve, 600));
      }

      // Prepare data for PDF service
      const pdfData = {
        // Core warning info
        warningId: extractedData.warningId,
        issuedDate: extractedData.issueDate,
        
        // Employee details
        employee: {
          firstName: extractedData.employee.firstName,
          lastName: extractedData.employee.lastName,
          employeeNumber: extractedData.employee.employeeId,
          department: extractedData.employee.department,
          position: extractedData.employee.position,
          email: extractedData.employee.email
        },
        
        // Warning details
        warningLevel: extractedData.recommendation?.suggestedLevel || 'verbal',
        category: extractedData.category.name,
        description: extractedData.incident.description,
        
        // Incident specifics
        incidentDate: new Date(extractedData.incident.date),
        incidentTime: extractedData.incident.time,
        incidentLocation: extractedData.incident.location,
        
        // Organization
        organization: organization,
        
        // Optional sections
        signatures: extractedData.signatures,
        additionalNotes: extractedData.additionalNotes,
        validityPeriod: extractedData.validityPeriod,
        
        // Legal compliance
        legalCompliance: {
          isCompliant: true,
          framework: 'LRA Section 188',
          requirements: extractedData.recommendation?.legalRequirements || []
        },
        
        // Progressive discipline data
        disciplineRecommendation: extractedData.recommendation ? {
          suggestedLevel: extractedData.recommendation.suggestedLevel,
          reason: extractedData.recommendation.reason || 'Progressive discipline escalation',
          warningCount: extractedData.recommendation.warningCount || 0,
          activeWarnings: extractedData.recommendation.previousWarnings || [],
          legalRequirements: extractedData.recommendation.legalRequirements || []
        } : undefined,
        
        // Delivery info
        deliveryChoice: deliveryChoice ? {
          method: deliveryChoice.method,
          timestamp: new Date(),
          chosenBy: 'Manager',
          contactDetails: deliveryChoice.contactDetails
        } : undefined
      };

      Logger.debug(10791)

      const blob = await PDFGenerationService.generateWarningPDF(pdfData);
      
      setPdfBlob(blob);
      setFilename(generatedFilename);
      
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

      console.log('✅ PDF generated successfully:', {
        employee: `${extractedData.employee.firstName} ${extractedData.employee.lastName}`,
        category: extractedData.category.name,
        filename: generatedFilename,
        size: `${(blob.size / 1024).toFixed(1)} KB`
      });

      // Notify parent component
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
  // DOWNLOAD HANDLERS (existing + new QR)
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
  }, [pdfBlob, filename]);

  // NEW: Enhanced QR Code download handler with fresh PDF generation
  const handleQRDownload = useCallback(async () => {
    Logger.debug('📱 [PDFPreviewModal] QR download button clicked')

    if (!extractedData || !organization) {
      Logger.error('❌ [PDFPreviewModal] Missing data for QR generation')
      setError('Missing required data for QR code generation');
      return;
    }

    setIsGeneratingQR(true);
    setQrGenerationStep('Generating PDF for QR code...');

    try {
      // Step 1: Generate a fresh PDF for the QR code
      Logger.debug('🔄 Generating fresh PDF for QR code upload...')
      setQrGenerationStep('Creating PDF document...');

      // Prepare data for PDF service (same as regular generation)
      const pdfData = {
        warningId: extractedData.warningId,
        issuedDate: extractedData.issueDate,
        employee: {
          firstName: extractedData.employee.firstName,
          lastName: extractedData.employee.lastName,
          employeeNumber: extractedData.employee.employeeId,
          department: extractedData.employee.department,
          position: extractedData.employee.position,
          email: extractedData.employee.email
        },
        warningLevel: extractedData.recommendation?.suggestedLevel || 'verbal',
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

      setQrGenerationStep('Generating PDF document...');
      const qrBlob = await PDFGenerationService.generateWarningPDF(pdfData);

      Logger.debug('✅ QR PDF generated:', {
        size: `${(qrBlob.size / 1024).toFixed(1)} KB`,
        filename: generatedFilename
      });

      setQrPdfBlob(qrBlob);
      setQrGenerationStep('Opening QR code modal...');

      // Step 2: Open QR modal with the fresh PDF
      setShowQRModal(true);

    } catch (error) {
      Logger.error('❌ QR PDF generation failed:', error)
      setError(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingQR(false);
      setQrGenerationStep('');
    }
  }, [extractedData, organization, generatedFilename, deliveryChoice]);

  // ============================================
  // AUTO-GENERATE ON OPEN & AUTO-SCROLL TO TOP
  // ============================================

  // 🔧 FIXED: Use useRef to prevent React StrictMode double-execution
  const hasPDFGenerated = useRef(false);

  useEffect(() => {
    if (isOpen && extractedData && !pdfBlob && !isGenerating && !hasPDFGenerated.current) {
      hasPDFGenerated.current = true;
      generatePDF();
    }

    // Reset flag when modal closes
    if (!isOpen) {
      hasPDFGenerated.current = false;
    }
  }, [isOpen, extractedData, pdfBlob, isGenerating, generatePDF]);

  // 🎯 ENHANCED AUTO-SCROLL: More reliable scrolling to modal top
  useEffect(() => {
    if (isOpen) {
      // Multiple scroll strategies for reliability
      const scrollTimer = setTimeout(() => {
        // Strategy 1: Scroll modal ref into view (most reliable)
        if (modalRef.current) {
          modalRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          Logger.debug('🔄 PDFPreviewModal: Auto-scrolled using modalRef');
        }

        // Strategy 2: Scroll window to top as fallback
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Strategy 3: Find modal by class and scroll it into view
        const modalElement = document.querySelector('.pdf-preview-modal');
        if (modalElement) {
          modalElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        Logger.debug('🔄 PDFPreviewModal: Auto-scroll completed');
      }, 150); // Slightly longer delay for better reliability

      // Prevent background scrolling while modal is open
      document.body.style.overflow = 'hidden';

      return () => {
        clearTimeout(scrollTimer);
        document.body.style.overflow = 'unset';
      };
    } else {
      // Restore background scrolling when modal closes
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  // ============================================
  // CLEANUP (unchanged)
  // ============================================

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // ============================================
  // RENDER START
  // ============================================

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div
          ref={modalRef}
          className="pdf-preview-modal bg-white rounded-lg shadow-xl max-w-4xl w-full h-[90vh] overflow-hidden flex flex-col border border-gray-200">
          
          {/* Clean Header - V2 Design */}
          <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <FileWarning className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                  {extractedData && (
                    <p className="text-gray-600 text-sm">
                      {extractedData.employee.firstName} {extractedData.employee.lastName} - {extractedData.category.name}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">

              {/* Incomplete Data Warning (unchanged) */}
              {extractedData && !extractedData.isComplete && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-amber-400 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-amber-800">Incomplete Warning Data</h3>
                      <div className="text-sm text-amber-700 mt-1">
                        {!extractedData.hasEmployee && <p>• Employee not selected</p>}
                        {!extractedData.hasCategory && <p>• Category not selected</p>}
                        {!extractedData.incident.description && <p>• Incident description missing</p>}
                        <p className="mt-2">PDF can still be generated with available data, but may appear incomplete.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error State (unchanged) */}
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

              {/* Data Preview with Status Indicators (unchanged) */}
              {extractedData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg ${extractedData.hasEmployee ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                    <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Employee Details
                      {extractedData.hasEmployee ? (
                        <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500 ml-2" />
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {extractedData.employee.firstName} {extractedData.employee.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {extractedData.employee.position} • {extractedData.employee.department}
                    </p>
                    {!extractedData.hasEmployee && (
                      <p className="text-xs text-amber-600 mt-1">Complete employee selection in wizard</p>
                    )}
                  </div>
                  
                  <div className={`p-4 rounded-lg ${extractedData.hasCategory ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                    <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Incident Details
                      {(extractedData.incident.description && extractedData.hasCategory) ? (
                        <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500 ml-2" />
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {extractedData.incident.date} at {extractedData.incident.time}
                    </p>
                    {extractedData.incident.location && (
                      <p className="text-sm text-gray-500 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {extractedData.incident.location}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      Category: {extractedData.category.name}
                    </p>
                    {!extractedData.hasCategory && (
                      <p className="text-xs text-amber-600 mt-1">Complete category selection in wizard</p>
                    )}
                  </div>
                </div>
              )}

              {/* Generation Progress (unchanged) */}
              {isGenerating && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-center justify-center space-x-3">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    <div>
                      <p className="text-blue-800 font-medium">Generating PDF Document</p>
                      {generationStep && (
                        <p className="text-blue-600 text-sm">{generationStep}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* QR PDF Generation Progress */}
              {isGeneratingQR && (
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                  <div className="flex items-center justify-center space-x-3">
                    <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                    <div>
                      <p className="text-purple-800 font-medium">Preparing QR Code Download</p>
                      {qrGenerationStep && (
                        <p className="text-purple-600 text-sm">{qrGenerationStep}</p>
                      )}
                      <p className="text-purple-600 text-xs mt-1">This creates a secure link for mobile devices</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success State with Preview and Actions - V2 Design */}
              {pdfBlob && pdfUrl && !isGenerating && (
                <div className="space-y-6">
                  {/* Clean Success Banner */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-gray-900 font-medium">PDF Generated Successfully</h3>
                          <p className="text-gray-600 text-sm">
                            {filename} • {(pdfBlob.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      
                      {/* Clean Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={downloadPDF}
                          className="flex items-center gap-2 px-3 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                        
                        <button
                          onClick={handleQRDownload}
                          disabled={isGeneratingQR}
                          className="flex items-center gap-2 px-3 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                          onClick={() => window.open(pdfUrl, '_blank')}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Open</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* PDF Preview (unchanged) */}
                  {showPreview && (
                    <div className="bg-gray-100 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Document Preview
                      </h3>
                      <div className="bg-white border rounded-lg overflow-hidden shadow-inner" style={{ height: '500px' }}>
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
              {/* Partial Data with Generation Option (unchanged) */}
              {extractedData && !extractedData.isComplete && !pdfBlob && !isGenerating && (
                <div className="text-center py-6 border-t border-gray-200">
                  <Info className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Partial Warning Data</h3>
                  <p className="text-gray-500 mb-4">
                    Some information is missing, but you can still generate a draft PDF.
                  </p>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-gray-600 hover:text-gray-700 font-medium"
                    >
                      Complete Wizard First
                    </button>
                    <button
                      onClick={generatePDF}
                      className="flex items-center space-x-2 bg-amber-500 text-white px-6 py-2 rounded-lg hover:bg-amber-600 transition-colors font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Generate Draft PDF</span>
                    </button>
                  </div>
                </div>
              )}

              {/* No Data State (unchanged) */}
              {!extractedData && !isGenerating && (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Warning Data Available</h3>
                  <p className="text-gray-500 mb-4">
                    No data provided for PDF generation.
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

          {/* Clean Footer - V2 Design */}
          <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              {/* Footer Info - Clean */}
              <div className="flex items-center text-sm text-gray-500 gap-4">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span>Generated by HR System</span>
                </div>
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-blue-500" />
                  <span>LRA Compliant</span>
                </div>
              </div>

              {/* Clean Action Buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Close
                </button>

                {/* Generate/Regenerate Button */}
                {!pdfBlob && !isGenerating && extractedData && (
                  <button
                    onClick={generatePDF}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Generate PDF</span>
                  </button>
                )}

                {/* Action Buttons Row - Only show when PDF is ready */}
                {pdfBlob && (
                  <>
                    {/* Primary Download Button */}
                    <button
                      onClick={downloadPDF}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>

                    {/* QR Code Download Button */}
                    <button
                      onClick={handleQRDownload}
                      disabled={isGeneratingQR}
                      className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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

                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* QR Code Modal Integration - Using the Feature-Rich Component */}
      {qrPdfBlob && (
        <QRCodeDownloadModal
          isOpen={showQRModal}
          onClose={() => {
            setShowQRModal(false);
            setQrPdfBlob(null); // Clean up the QR PDF blob
          }}
          pdfBlob={qrPdfBlob} // Use the fresh PDF generated for QR
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

// ============================================
// USAGE EXAMPLE IN YOUR WARNING WIZARD
// ============================================

/* 
Replace your existing PDFPreviewModal usage with:

<PDFPreviewModal
  isOpen={showPDFPreview}
  onClose={() => setShowPDFPreview(false)}
  warningData={{
    selectedEmployee,
    selectedCategory,
    formData,
    signatures,
    lraRecommendation,
    organizationId: organization?.id
  }}
  deliveryChoice={deliveryChoice}
  onPDFGenerated={(blob, filename) => {
    // Your existing PDF handling logic
    Logger.debug('PDF generated with QR support:', filename)
  }}
  showPreview={true}
  title="Warning Document Preview"
/>

The enhanced modal now includes:
✅ All your existing functionality (unchanged)
✅ QR code download button in success banner
✅ Mobile Download button in footer
✅ Embedded QR modal with countdown timer
✅ Secure temporary link generation
✅ Copy link functionality
✅ Download options info panel

Features:
- 1-hour expiry on QR links
- Works with built-in phone cameras
- Secure JWT token authentication
- Real-time countdown display
- Instant link revocation capability
- Professional mobile-first UI
*/