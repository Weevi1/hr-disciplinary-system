// frontend/src/components/warnings/enhanced/steps/LegalReviewSignaturesStepV2.tsx
// 🎯 UNIFIED LEGAL REVIEW & SIGNATURES STEP V2 - THEMED COMPONENTS
// ✅ Uses unified theming with CSS variables and ThemedCard/ThemedButton system
// ✅ Samsung S8+ mobile optimization with proper touch targets
// ✅ Fixed memory leaks using new DigitalSignaturePad component
// ✅ Improved mobile UX, signature validation, better error handling
// ✅ Cleaner code structure, proper cleanup

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Scale, FileText, CheckCircle, Users, Clock, Shield,
  Eye, EyeOff, ChevronDown, ChevronUp, Info, Calendar, User,
  Loader2, RefreshCw, MessageCircle, Volume2, Send, Play, Pause, TrendingUp, X, AlertTriangle,
  Maximize2, ZoomIn, ZoomOut, Download
} from 'lucide-react';
import { useOrganization } from '../../../../contexts/OrganizationContext';
import { transformWarningDataForPDF } from '../../../../utils/pdfDataTransformer';
import type { EscalationRecommendation } from '../../../../services/WarningService';

// Import unified theming components
import { ThemedCard } from '../../../common/ThemedCard';
import { ThemedButton } from '../../../common/ThemedButton';
import { ThemedBadge } from '../../../common/ThemedCard';
import { ThemedAlert } from '../../../common/ThemedCard';

// Import specialized components
import { DigitalSignaturePad } from './DigitalSignaturePad';
import { MultiLanguageWarningScript } from './components/MultiLanguageWarningScript';

// Import SVG signature utilities
import { applyWitnessWatermarkToSVG } from '../../../../utils/signatureSVG';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  deliveryPreference: 'email' | 'whatsapp' | 'print';
  recentWarnings: { count: number; lastDate?: Date; lastCategory?: string; level?: string; };
  riskIndicators: { highRisk: boolean; reasons: string[]; };
}

interface FormData {
  employeeId: string | null;
  categoryId: string | null;
  incidentDate: string;
  incidentTime: string;
  incidentLocation: string;
  incidentDescription: string;
  additionalNotes?: string;
  issueDate: string;
  validityPeriod: 3 | 6 | 12;
}

interface SignatureData {
  manager: string | null;
  employee: string | null;
  witness: string | null;
  timestamp?: string;
  managerName?: string;
  employeeName?: string;
  witnessName?: string;
}

interface WarningCategory {
  id: string;
  name: string;
  severity: string;
  description?: string;
}

// Corrective Discussion data structure
interface CorrectiveDiscussionData {
  employeeStatement: string;
  expectedBehavior: string;
  actionCommitments: Array<{ id: string; commitment: string; timeline: string }>;
  reviewDate: string;
  interventionDetails?: string;
  resourcesProvided?: string[];
}

interface LegalReviewSignaturesStepV2Props {
  lraRecommendation: EscalationRecommendation | null;
  selectedEmployee: Employee | undefined;
  selectedCategory?: WarningCategory;
  formData: FormData;
  currentManagerName: string;
  onSignaturesComplete: (signatures: SignatureData, finalized?: boolean) => void;
  isAnalyzing?: boolean;
  signaturesFinalized?: boolean;
  currentSignatures?: SignatureData;
  warningId?: string | null;
  audioUploadStatus?: 'recording' | 'stopping' | 'uploading' | 'complete' | null;
  onLevelOverride?: (level: string | null) => void;
  correctiveDiscussionData?: CorrectiveDiscussionData; // Corrective Discussion fields for PDF sections
}

const safeText = (value: any, fallback: string = 'Unknown'): string => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.name) return String(value.name);
  return String(value);
};

// Helper function: Format relative time
const getRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const warningDate = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - warningDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

// Helper function: Calculate days until expiry
const getDaysUntilExpiry = (issueDate: Date | string, validityMonths: number): number => {
  const issue = typeof issueDate === 'string' ? new Date(issueDate) : issueDate;
  const expiry = new Date(issue);
  expiry.setMonth(expiry.getMonth() + validityMonths);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

// Helper function: Get warning level display info
const getWarningLevelInfo = (level: string): { label: string; color: string; bgColor: string } => {
  const levelMap: Record<string, { label: string; color: string; bgColor: string }> = {
    'counselling': { label: 'Counselling', color: '#0ea5e9', bgColor: 'rgba(14, 165, 233, 0.1)' },
    'verbal': { label: 'Verbal', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
    'first_written': { label: 'Written', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.1)' },
    'final_written': { label: 'Final Written', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' }
  };
  return levelMap[level] || { label: level, color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)' };
};

// 🎯 WARNING HISTORY ITEM COMPONENT - Mobile-optimized tappable card
interface WarningHistoryItemProps {
  warning: any;
}

const WarningHistoryItem: React.FC<WarningHistoryItemProps> = ({ warning }) => {
  const [showModal, setShowModal] = useState(false);

  const levelInfo = getWarningLevelInfo(warning.level || 'verbal');
  const relativeTime = getRelativeTime(warning.issueDate || warning.createdAt);

  return (
    <>
      {/* Tappable Warning Card */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full text-left p-2 rounded border transition-all hover:shadow-sm active:scale-[0.98]"
        style={{
          backgroundColor: 'var(--color-background)',
          borderColor: 'var(--color-border-light)',
          minHeight: '44px' // iOS/Android minimum touch target
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Level Badge */}
            <span
              className="px-2 py-0.5 rounded text-xs font-medium flex-shrink-0"
              style={{
                backgroundColor: levelInfo.bgColor,
                color: levelInfo.color
              }}
            >
              {levelInfo.label}
            </span>

            {/* Date */}
            <span className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
              {relativeTime}
            </span>
          </div>

          {/* Chevron indicator */}
          <ChevronDown className="w-3.5 h-3.5 rotate-[-90deg] flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
        </div>
      </button>

      {/* Mini Modal */}
      {showModal && (
        <WarningDetailModal
          warning={warning}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

// 🎯 WARNING DETAIL MODAL - Lightweight mobile-optimized modal
interface WarningDetailModalProps {
  warning: any;
  onClose: () => void;
}

const WarningDetailModal: React.FC<WarningDetailModalProps> = ({ warning, onClose }) => {
  const levelInfo = getWarningLevelInfo(warning.level || 'verbal');
  const issueDate = warning.issueDate || warning.createdAt;
  const formattedDate = issueDate ? new Date(issueDate).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Unknown date';

  const validityMonths = warning.validityPeriod || 6;
  const daysRemaining = getDaysUntilExpiry(issueDate, validityMonths);
  const expiryDate = new Date(new Date(issueDate).setMonth(new Date(issueDate).getMonth() + validityMonths));
  const formattedExpiry = expiryDate.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Expiry urgency color
  const expiryColor = daysRemaining < 30 ? '#ef4444' : daysRemaining < 60 ? '#f59e0b' : '#10b981';

  // Get incident details - matching field names from WarningDetailsModal PDF preview
  const incidentDescription = warning.incidentDescription || warning.description || '';
  const incidentLocation = warning.incidentLocation || '';
  const incidentTime = warning.incidentTime || '';
  const categoryName = warning.categoryName || warning.category || '';
  const issuedByName = warning.issuedByName || warning.managerName || warning.issuerName || 'Manager';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[9500] animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9600] w-[90vw] max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="rounded-lg shadow-xl overflow-hidden"
          style={{
            backgroundColor: 'var(--color-card-background)',
            border: '1px solid var(--color-card-border)'
          }}
        >
          {/* Header */}
          <div
            className="p-4 border-b flex items-center justify-between"
            style={{
              backgroundColor: levelInfo.bgColor,
              borderColor: 'var(--color-border)'
            }}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" style={{ color: levelInfo.color }} />
              <h3 className="font-bold text-base" style={{ color: 'var(--color-text)' }}>
                Warning Details
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-black/5 active:scale-95 transition-all"
            >
              <X className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Warning Level */}
            <div>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Warning Level
              </div>
              <div
                className="inline-block px-3 py-1.5 rounded-lg text-sm font-bold"
                style={{
                  backgroundColor: levelInfo.bgColor,
                  color: levelInfo.color
                }}
              >
                {levelInfo.label}
              </div>
            </div>

            {/* Issue Date */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--color-text-secondary)' }} />
                <div className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Issue Date
                </div>
              </div>
              <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {formattedDate}
              </div>
            </div>

            {/* Category */}
            {categoryName && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5" style={{ color: 'var(--color-text-secondary)' }} />
                  <div className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    Category
                  </div>
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  {categoryName}
                </div>
              </div>
            )}

            {/* Issued By */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5" style={{ color: 'var(--color-text-secondary)' }} />
                <div className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Issued By
                </div>
              </div>
              <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {issuedByName}
              </div>
            </div>

            {/* Incident Date */}
            {warning.incidentDate && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--color-text-secondary)' }} />
                  <div className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    Incident Date
                  </div>
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  {new Date(warning.incidentDate).toLocaleDateString('en-ZA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  {incidentTime && (
                    <span className="ml-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      at {incidentTime}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Incident Location */}
            {incidentLocation && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Info className="w-3.5 h-3.5" style={{ color: 'var(--color-text-secondary)' }} />
                  <div className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    Location
                  </div>
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  {incidentLocation}
                </div>
              </div>
            )}

            {/* Incident Details */}
            {incidentDescription && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <MessageCircle className="w-3.5 h-3.5" style={{ color: 'var(--color-text-secondary)' }} />
                  <div className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    Incident Details
                  </div>
                </div>
                <div
                  className="text-sm leading-relaxed p-3 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    borderColor: 'var(--color-border-light)',
                    color: 'var(--color-text)'
                  }}
                >
                  {incidentDescription}
                </div>
              </div>
            )}

            {/* Expiry Date with Urgency */}
            <div
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: daysRemaining < 30 ? 'rgba(239, 68, 68, 0.05)' : 'var(--color-background)',
                borderColor: expiryColor
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5" style={{ color: expiryColor }} />
                <div className="text-xs font-medium" style={{ color: expiryColor }}>
                  Expiry Date
                </div>
              </div>
              <div className="text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                {formattedExpiry}
              </div>
              <div className="text-xs" style={{ color: expiryColor }}>
                {daysRemaining > 0 ? (
                  <>⏳ {daysRemaining} days remaining</>
                ) : (
                  <>⚠️ Expired</>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="p-4 border-t"
            style={{
              backgroundColor: 'var(--color-background)',
              borderColor: 'var(--color-border)'
            }}
          >
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export const LegalReviewSignaturesStepV2: React.FC<LegalReviewSignaturesStepV2Props> = ({
  lraRecommendation,
  selectedEmployee,
  selectedCategory,
  formData,
  currentManagerName,
  onSignaturesComplete,
  isAnalyzing = false,
  signaturesFinalized = false,
  currentSignatures,
  warningId,
  audioUploadStatus,
  onLevelOverride,
  correctiveDiscussionData
}) => {
  // State management
  const [showDetails, setShowDetails] = useState(false);
  const [scriptReadConfirmed, setScriptReadConfirmed] = useState(false);
  const [readingScript, setReadingScript] = useState(false);
  const [showSignatureSection, setShowSignatureSection] = useState(false);
  const [signatures, setSignatures] = useState<SignatureData>(
    currentSignatures || { manager: null, employee: null, witness: null }
  );
  const [overrideLevel, setOverrideLevel] = useState<string | null>(null);
  const [showOverrideSelector, setShowOverrideSelector] = useState(false);
  const [signatureType, setSignatureType] = useState<'employee' | 'witness'>('employee'); // Employee or Witness signature

  // PDF Preview & Acknowledgment State
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [showFullScreenPdf, setShowFullScreenPdf] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Get organization context for PDF generation
  const { organization } = useOrganization();

  // Update signatures when currentSignatures prop changes
  useEffect(() => {
    if (currentSignatures) {
      setSignatures(currentSignatures);
    }
  }, [currentSignatures]);

  // Show signature section after script is confirmed
  useEffect(() => {
    if (scriptReadConfirmed) {
      setShowSignatureSection(true);
    }
  }, [scriptReadConfirmed]);

  // Notify parent when override level changes
  useEffect(() => {
    if (onLevelOverride) {
      onLevelOverride(overrideLevel);
    }
  }, [overrideLevel, onLevelOverride]);

  // Auto-scroll to success alert when signatures are finalized
  useEffect(() => {
    if (signaturesFinalized) {
      setTimeout(() => {
        const successAlert = document.querySelector('.warning-success-alert');
        if (successAlert) {
          successAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [signaturesFinalized]);

  // Safe employee fallback
  const safeEmployee = selectedEmployee || {
    id: 'unknown',
    firstName: 'Unknown',
    lastName: 'Employee',
    position: 'Unknown Position',
    department: 'Unknown Department',
    email: 'unknown@email.com',
    phone: 'Unknown',
    deliveryPreference: 'email' as const,
    recentWarnings: { count: 0 },
    riskIndicators: { highRisk: false, reasons: [] }
  };

  // Check if all signatures are complete
  // Manager is always required, plus either employee OR witness signature
  const allSignaturesComplete = !!(signatures.manager && (signatures.employee || signatures.witness));

  // Handle script reading confirmation
  const handleScriptReadConfirmation = useCallback(() => {
    setReadingScript(true);
    setTimeout(() => {
      setScriptReadConfirmed(true);
      setReadingScript(false);
    }, 1500);
  }, []);

  // Generate PDF for employee preview
  const generatePdfPreview = useCallback(async (managerSignature: string) => {
    if (!organization?.id || isGeneratingPdf) return;

    setIsGeneratingPdf(true);
    setPdfError(null);

    try {
      // Dynamically import PDF service to avoid loading it upfront
      const { PDFGenerationService } = await import('../../../../services/PDFGenerationService');

      // Prepare warning data for PDF
      const warningData = {
        id: `preview_${Date.now()}`,
        organizationId: organization.id,
        employeeId: selectedEmployee?.id || formData.employeeId,
        categoryId: selectedCategory?.id || formData.categoryId,
        level: overrideLevel || lraRecommendation?.suggestedLevel || 'verbal',
        incidentDate: formData.incidentDate,
        incidentTime: formData.incidentTime,
        incidentLocation: formData.incidentLocation,
        incidentDescription: formData.incidentDescription,
        issueDate: formData.issueDate || new Date().toISOString().split('T')[0],
        validityPeriod: formData.validityPeriod || 6,
        status: 'preview',
        signatures: {
          manager: managerSignature,
          employee: null,
          witness: null,
          managerName: currentManagerName
        },
        // Include category name for PDF
        category: selectedCategory?.name || 'General Misconduct',
        // 🔥 Include corrective discussion data for PDF sections
        // These fields map to pdfDataTransformer expectations
        employeeStatement: correctiveDiscussionData?.employeeStatement || undefined,
        expectedBehaviorStandards: correctiveDiscussionData?.expectedBehavior || undefined,
        // Map actionCommitments to improvementCommitments/actionSteps format
        actionSteps: correctiveDiscussionData?.actionCommitments && correctiveDiscussionData.actionCommitments.length > 0
          ? correctiveDiscussionData.actionCommitments.map(c => ({
              action: c.commitment,
              timeline: c.timeline
            }))
          : undefined,
        reviewDate: correctiveDiscussionData?.reviewDate || undefined,
        interventionDetails: correctiveDiscussionData?.interventionDetails || undefined,
        resourcesProvided: correctiveDiscussionData?.resourcesProvided && correctiveDiscussionData.resourcesProvided.length > 0
          ? correctiveDiscussionData.resourcesProvided
          : undefined,
        // Include LRA recommendation data for previous warnings section
        disciplineRecommendation: lraRecommendation
      };

      // Transform data for PDF generation - pass all 3 required arguments
      const pdfData = await transformWarningDataForPDF(
        warningData,
        selectedEmployee,
        organization
      );

      // 🎨 Extract pdfSettings from transformed data for template customization
      const templateSettings = pdfData.pdfSettings || organization?.pdfSettings;

      // Generate the PDF with template settings
      // Pass undefined for version (use default), and templateSettings for customization
      const pdfBlob = await PDFGenerationService.generateWarningPDF(
        pdfData,
        undefined, // Use default version
        templateSettings // Pass organization's template settings
      );

      // Create URL for preview
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    } catch (error) {
      console.error('Failed to generate PDF preview:', error);
      setPdfError(error instanceof Error ? error.message : 'Failed to generate PDF preview');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [organization, selectedEmployee, selectedCategory, formData, overrideLevel, lraRecommendation, currentManagerName, isGeneratingPdf, correctiveDiscussionData]);

  // Cleanup PDF URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Handle signature completion from DigitalSignaturePad
  const handleManagerSignature = useCallback((signature: string | null) => {
    setSignatures(prev => ({ ...prev, manager: signature }));

    // Trigger PDF generation when manager saves signature
    if (signature) {
      generatePdfPreview(signature);
    } else {
      // Clear PDF preview if signature is cleared
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
      setHasScrolledToBottom(false);
      setHasAcknowledged(false);
      setScrollProgress(0);
    }
  }, [generatePdfPreview, pdfUrl]);

  // Helper function to add "WITNESS" watermark to SVG signature
  const addWitnessWatermark = useCallback((signatureDataUrl: string): Promise<string> => {
    return Promise.resolve(applyWitnessWatermarkToSVG(signatureDataUrl));
  }, []);

  const handleEmployeeSignature = useCallback(async (signature: string | null) => {
    if (signatureType === 'witness') {
      // Witness signature - apply watermark and save to witness field
      if (signature) {
        try {
          const watermarkedSignature = await addWitnessWatermark(signature);
          setSignatures(prev => ({ ...prev, witness: watermarkedSignature }));
        } catch (error) {
          console.error('Failed to apply witness watermark:', error);
          // Fall back to original signature if watermarking fails
          setSignatures(prev => ({ ...prev, witness: signature }));
        }
      } else {
        setSignatures(prev => ({ ...prev, witness: null }));
      }
    } else {
      // Normal employee signature - no watermark, save to employee field
      setSignatures(prev => ({ ...prev, employee: signature }));
    }
  }, [signatureType, addWitnessWatermark]);

  // Handle complete signatures and finalize
  const handleCompleteSignatures = useCallback(() => {
    if (!allSignaturesComplete || signaturesFinalized) return;

    const employeeName = selectedEmployee ? `${(selectedEmployee as any).profile?.firstName || 'Unknown'} ${(selectedEmployee as any).profile?.lastName || 'Employee'}` : 'Unknown Employee';

    const finalSignatures: SignatureData = {
      ...signatures,
      timestamp: new Date().toISOString(),
      managerName: currentManagerName,
      employeeName: signatures.employee ? employeeName : undefined,
      witnessName: signatures.witness ? employeeName : undefined
    };

    onSignaturesComplete(finalSignatures, true);
  }, [signatures, allSignaturesComplete, signaturesFinalized, currentManagerName, selectedEmployee, onSignaturesComplete]);

  // Show loading state during analysis - Themed
  if (isAnalyzing) {
    return (
      <ThemedCard padding="xl" className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: 'var(--color-primary)' }} />
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Analyzing legal requirements...</p>
      </ThemedCard>
    );
  }

  return (
    <div className="space-y-3">
      {/* Note: Recommendation display moved to Step 1 (CombinedIncidentStepV2) */}

      {/* Show current warning level for context */}
      {lraRecommendation && (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <Scale className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          <span>
            Warning Level: <strong style={{ color: 'var(--color-text)' }}>
              {overrideLevel
                ? (overrideLevel === 'counselling' ? 'Counselling Session' :
                   overrideLevel === 'verbal' ? 'Verbal Warning' :
                   overrideLevel === 'first_written' ? 'Written Warning' :
                   overrideLevel === 'final_written' ? 'Final Written Warning' : overrideLevel)
                : lraRecommendation?.recommendedLevel
              }
            </strong>
            {overrideLevel && overrideLevel !== lraRecommendation?.suggestedLevel && (
              <span className="ml-2 text-xs" style={{ color: 'var(--color-warning)' }}>(Override)</span>
            )}
          </span>
        </div>
      )}

      {/* Employee Warning Script Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          <h3 className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>📖 Employee Warning Script</h3>
        </div>
        <ThemedCard padding="sm" className="border" style={{ borderColor: 'var(--color-border-light)' }}>
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            <strong>Read this completely to ensure your employee understands their rights.</strong> This script covers all legal requirements and communicates the warning clearly.
          </p>
          <MultiLanguageWarningScript
            employeeName={selectedEmployee ? `${(selectedEmployee as any).profile?.firstName || 'Unknown'} ${(selectedEmployee as any).profile?.lastName || 'Employee'}` : 'Unknown Employee'}
            managerName={currentManagerName}
            categoryName={selectedCategory?.name || 'General Misconduct'}
            incidentDescription={formData.incidentDescription || 'Workplace incident requiring disciplinary action'}
            warningLevel={overrideLevel || lraRecommendation?.recommendedLevel || 'verbal'}
            validityPeriod={formData.validityPeriod}
            onScriptRead={() => setScriptReadConfirmed(true)}
            disabled={scriptReadConfirmed}
            activeWarnings={lraRecommendation?.activeWarnings}
            issuedDate={formData.issueDate}
          />
        </ThemedCard>
      </div>

      {/* Audio Upload Status Indicator */}
      {audioUploadStatus && audioUploadStatus !== 'complete' && (
        <div className="mb-3 p-3 rounded-lg border flex items-center gap-3" style={{
          backgroundColor: 'var(--color-alert-info-bg)',
          borderColor: 'var(--color-alert-info-border)'
        }}>
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-info)' }} />
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: 'var(--color-alert-info-text)' }}>
              {audioUploadStatus === 'stopping' && '🎤 Stopping recording...'}
              {audioUploadStatus === 'uploading' && '☁️ Uploading audio to Firebase...'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
              Please wait while we save your warning
            </p>
          </div>
        </div>
      )}

      {/* STRATEGIC LAYOUT: Compact Signature Section */}
      {showSignatureSection && (
        <ThemedCard padding="sm">
          {/* Ultra-compact header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>✍️ Collect Signatures</span>
            </div>
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <span>{allSignaturesComplete ? 'Complete' : 'Pending'}</span>
            </div>
          </div>

          {/* Signature Grid - Mobile Optimized */}
          <div className="grid grid-cols-1 gap-3">
            {/* Manager Row */}
            <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--color-alert-info-bg)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>Manager</span>
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{currentManagerName}</span>
                </div>
                {signatures.manager && <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-success)' }} />}
              </div>
              <DigitalSignaturePad
                onSignatureComplete={handleManagerSignature}
                disabled={signaturesFinalized}
                label="Manager Signature"
                placeholder="Manager signature"
                initialSignature={signatures.manager}
                width={300}
                height={80}
                signerName={currentManagerName}
              />
            </div>

            {/* PDF Preview & Employee Acknowledgment Section */}
            {signatures.manager && !signaturesFinalized && (
              <div className="rounded-lg p-3 border-2" style={{
                backgroundColor: 'var(--color-alert-info-bg)',
                borderColor: hasAcknowledged ? 'var(--color-success)' : 'var(--color-primary)'
              }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                      📄 Employee Document Review
                    </span>
                  </div>
                  {hasAcknowledged && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--color-success)' }}>Reviewed</span>
                    </div>
                  )}
                </div>

                <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                  The employee must review the warning document before signing. This ensures they understand the contents.
                </p>

                {/* PDF Loading State */}
                {isGeneratingPdf && (
                  <div className="flex items-center justify-center gap-3 py-8 rounded-lg border" style={{
                    backgroundColor: 'var(--color-card-background)',
                    borderColor: 'var(--color-border-light)'
                  }}>
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-primary)' }} />
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      Generating warning document...
                    </span>
                  </div>
                )}

                {/* PDF Error State */}
                {pdfError && (
                  <div className="p-3 rounded-lg border mb-3" style={{
                    backgroundColor: 'var(--color-alert-error-bg)',
                    borderColor: 'var(--color-error)'
                  }}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5" style={{ color: 'var(--color-error)' }} />
                      <div className="flex-1">
                        <p className="text-xs font-medium" style={{ color: 'var(--color-alert-error-text)' }}>
                          Failed to generate preview
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                          {pdfError}
                        </p>
                        <button
                          onClick={() => signatures.manager && generatePdfPreview(signatures.manager)}
                          className="flex items-center gap-1 mt-2 text-xs font-medium hover:opacity-80"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          <RefreshCw className="w-3 h-3" />
                          Retry
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* PDF Preview */}
                {pdfUrl && !isGeneratingPdf && (
                  <>
                    {/* PDF Viewer Container */}
                    <div
                      ref={pdfContainerRef}
                      className="relative rounded-lg border overflow-hidden mb-3"
                      style={{
                        backgroundColor: 'white',
                        borderColor: 'var(--color-border)',
                        height: '280px'
                      }}
                    >
                      <iframe
                        src={`${pdfUrl}#toolbar=0&navpanes=0`}
                        className="w-full h-full"
                        title="Warning Document Preview"
                        onLoad={() => {
                          // Mark as scrolled when PDF loads (simple approach)
                          setTimeout(() => setHasScrolledToBottom(true), 2000);
                        }}
                      />

                      {/* Floating Controls */}
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        <button
                          onClick={() => setShowFullScreenPdf(true)}
                          className="p-2 rounded-lg shadow-lg hover:opacity-90 active:scale-95 transition-all"
                          style={{ backgroundColor: 'white' }}
                          title="View Full Screen"
                        >
                          <Maximize2 className="w-4 h-4" style={{ color: 'var(--color-text)' }} />
                        </button>
                        <a
                          href={pdfUrl}
                          download="warning-document.pdf"
                          className="p-2 rounded-lg shadow-lg hover:opacity-90 active:scale-95 transition-all"
                          style={{ backgroundColor: 'white' }}
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" style={{ color: 'var(--color-text)' }} />
                        </a>
                      </div>
                    </div>

                    {/* Scroll Progress Indicator */}
                    {!hasScrolledToBottom && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span style={{ color: 'var(--color-text-secondary)' }}>Review progress</span>
                          <span style={{ color: 'var(--color-primary)' }}>Please review document</span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                          <div
                            className="h-full transition-all duration-300"
                            style={{
                              backgroundColor: 'var(--color-primary)',
                              width: hasScrolledToBottom ? '100%' : '30%'
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Acknowledgment Checkbox */}
                    <div
                      className="p-3 rounded-lg border transition-all"
                      style={{
                        backgroundColor: hasAcknowledged ? 'var(--color-alert-success-bg)' : 'var(--color-card-background)',
                        borderColor: hasAcknowledged ? 'var(--color-success)' : 'var(--color-border-light)',
                        opacity: hasScrolledToBottom ? 1 : 0.6
                      }}
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasAcknowledged}
                          onChange={(e) => setHasAcknowledged(e.target.checked)}
                          disabled={!hasScrolledToBottom}
                          className="w-5 h-5 mt-0.5 rounded flex-shrink-0"
                          style={{ accentColor: 'var(--color-success)' }}
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                            I confirm I have reviewed this warning document
                          </span>
                          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                            I understand the nature of the misconduct and my right to representation under the Labour Relations Act.
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Proceed to Signature Button */}
                    {hasAcknowledged && (
                      <div className="mt-3 p-2 rounded-lg flex items-center justify-center gap-2" style={{
                        backgroundColor: 'var(--color-alert-success-bg)'
                      }}>
                        <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--color-alert-success-text)' }}>
                          Employee may now sign below
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Full Screen PDF Modal */}
            {showFullScreenPdf && pdfUrl && (
              <>
                <div
                  className="fixed inset-0 bg-black/80 z-[9500]"
                  onClick={() => setShowFullScreenPdf(false)}
                />
                <div className="fixed inset-4 z-[9600] flex flex-col rounded-lg overflow-hidden" style={{ backgroundColor: 'white' }}>
                  <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                      <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Warning Document</span>
                    </div>
                    <button
                      onClick={() => setShowFullScreenPdf(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 active:scale-95 transition-all"
                    >
                      <X className="w-5 h-5" style={{ color: 'var(--color-text)' }} />
                    </button>
                  </div>
                  <iframe
                    src={pdfUrl}
                    className="flex-1 w-full"
                    title="Warning Document Full View"
                  />
                </div>
              </>
            )}

            {/* Employee Row */}
            <div className="rounded-lg p-2" style={{
              backgroundColor: 'var(--color-alert-success-bg)',
              opacity: (!signatures.manager || (signatures.manager && !hasAcknowledged && !signaturesFinalized)) ? 0.6 : 1
            }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                    {signatureType === 'employee' ? 'Employee' : 'Witness'}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {selectedEmployee ? `${(selectedEmployee as any).profile?.firstName || 'Unknown'} ${(selectedEmployee as any).profile?.lastName || 'Employee'}` : 'Unknown Employee'}
                  </span>
                </div>
                {signatures.employee && <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-success)' }} />}
              </div>

              {/* Signature prerequisites notice */}
              {!signaturesFinalized && (!signatures.manager || !hasAcknowledged) && (
                <div className="mb-3 p-2 rounded border" style={{
                  backgroundColor: 'var(--color-alert-warning-bg)',
                  borderColor: 'var(--color-warning)'
                }}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--color-alert-warning-text)' }}>
                      {!signatures.manager
                        ? 'Manager must save their signature first'
                        : 'Employee must review and acknowledge the document above'
                      }
                    </span>
                  </div>
                </div>
              )}

              {/* Signature Type Toggle */}
              {!signaturesFinalized && signatures.manager && (
                <div className="mb-3 p-2 rounded border" style={{
                  backgroundColor: 'var(--color-card-background)',
                  borderColor: 'var(--color-border-light)'
                }}>
                  <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Signature Type:
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="signatureType"
                        value="employee"
                        checked={signatureType === 'employee'}
                        onChange={(e) => setSignatureType(e.target.value as 'employee' | 'witness')}
                        className="w-4 h-4"
                        style={{ accentColor: 'var(--color-success)' }}
                      />
                      <span className="text-xs" style={{ color: 'var(--color-text)' }}>Employee Signature</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="signatureType"
                        value="witness"
                        checked={signatureType === 'witness'}
                        onChange={(e) => setSignatureType(e.target.value as 'employee' | 'witness')}
                        className="w-4 h-4"
                        style={{ accentColor: 'var(--color-warning)' }}
                      />
                      <span className="text-xs" style={{ color: 'var(--color-text)' }}>Witness Signature</span>
                    </label>
                  </div>
                  <div className="mt-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {signatureType === 'employee'
                      ? 'Employee signs to acknowledge notification'
                      : 'Witness confirms this warning was explained to the employee'
                    }
                  </div>
                </div>
              )}

              <DigitalSignaturePad
                onSignatureComplete={handleEmployeeSignature}
                disabled={signaturesFinalized || !signatures.manager || !hasAcknowledged}
                label={signatureType === 'employee' ? 'Employee Signature' : 'Witness Signature'}
                placeholder={signatureType === 'employee' ? 'Employee signature' : 'Witness signature'}
                initialSignature={signatures.employee}
                width={300}
                height={80}
                signerName={selectedEmployee ? `${(selectedEmployee as any).profile?.firstName || 'Unknown'} ${(selectedEmployee as any).profile?.lastName || 'Employee'}` : 'Unknown Employee'}
              />
            </div>
          </div>

          {/* Compact Action States */}
          {allSignaturesComplete && !signaturesFinalized && (
            <>
              {/* Desktop: Inline button */}
              <div className="hidden md:block mt-3 p-2 rounded-lg flex items-center justify-between" style={{ backgroundColor: 'var(--color-alert-success-bg)' }}>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--color-alert-success-text)' }}>Ready to finalize</span>
                </div>
                <ThemedButton
                  onClick={handleCompleteSignatures}
                  size="sm"
                  className="px-3 py-1.5"
                >
                  <Send className="w-3 h-3 mr-1" />
                  Upload Signatures & Continue
                </ThemedButton>
              </div>

              {/* Mobile: Sticky footer */}
              <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t-2 shadow-lg z-50" style={{ borderColor: 'var(--color-success)' }}>
                <ThemedButton
                  onClick={handleCompleteSignatures}
                  className="w-full h-12 text-base font-semibold"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Upload Signatures & Continue
                </ThemedButton>
              </div>
            </>
          )}

          {signaturesFinalized && (
            <div className="warning-success-alert mt-4">
              <ThemedAlert variant="success" className="border-l-4" style={{ borderLeftColor: 'var(--color-success)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-success-light)' }}>
                    <CheckCircle className="w-6 h-6" style={{ color: 'var(--color-success)' }} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-base mb-2" style={{ color: 'var(--color-text)' }}>
                      ✅ Warning Officially Recorded
                    </h4>
                    <div className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                      <p>• Signatures captured and saved</p>
                      <p>• Audio recording uploaded to Firebase</p>
                      {warningId && (
                        <p>• Warning <span className="font-mono font-semibold">#{warningId.slice(-8)}</span> created in database</p>
                      )}
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--color-primary)' }} />
                        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                          Advancing to delivery setup...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </ThemedAlert>
            </div>
          )}
        </ThemedCard>
      )}
    </div>
  );
};