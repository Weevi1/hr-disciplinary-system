// frontend/src/components/warnings/enhanced/steps/LegalReviewSignaturesStepV2.tsx
// 🎯 UNIFIED LEGAL REVIEW & SIGNATURES STEP V2 - THEMED COMPONENTS
// ✅ Uses unified theming with CSS variables and ThemedCard/ThemedButton system
// ✅ Samsung S8+ mobile optimization with proper touch targets
// ✅ Fixed memory leaks using new DigitalSignaturePad component
// ✅ Improved mobile UX, signature validation, better error handling
// ✅ Cleaner code structure, proper cleanup

import React, { useState, useEffect, useCallback } from 'react';
import {
  Scale, FileText, CheckCircle, Users, Clock, Shield,
  Eye, EyeOff, ChevronDown, ChevronUp, Info, Calendar, User,
  Loader2, RefreshCw, MessageCircle, Volume2, Send, Play, Pause, TrendingUp, X, AlertTriangle
} from 'lucide-react';
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
  onLevelOverride
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

  // Handle signature completion from DigitalSignaturePad
  const handleManagerSignature = useCallback((signature: string | null) => {
    setSignatures(prev => ({ ...prev, manager: signature }));
  }, []);

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
      {/* Sanction Summary Badge */}
      <div className="flex items-center gap-2">
        <ThemedBadge variant="warning" size="lg" className="font-semibold">
          ⚠️ {lraRecommendation?.isEscalation ? 'Escalated Action' : 'Recommended Sanction'}
        </ThemedBadge>
      </div>

      {/* System Recommendation - Step 1 Style Consistency */}
      <div className="space-y-2">
        {/* Clean Header - Natural Language */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
            <h3 className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
              {lraRecommendation?.isEscalation ? 'Discipline Level' : 'Severity Assessment'}
            </h3>
          </div>
          <ThemedButton
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {showDetails ? 'Hide' : 'Details'}
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </ThemedButton>
        </div>

        {/* Recommendation Card */}
        <ThemedCard padding="sm" hover className="border-l-4" style={{ borderLeftColor: 'var(--color-primary)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Action Badge - CLICKABLE to override */}
              <button
                onClick={() => setShowOverrideSelector(!showOverrideSelector)}
                className="transition-all hover:opacity-80 active:scale-95"
                disabled={signaturesFinalized}
              >
                <ThemedBadge variant="primary" size="sm" className="font-semibold cursor-pointer">
                  {overrideLevel
                    ? (overrideLevel === 'counselling' ? 'Counselling' :
                       overrideLevel === 'verbal' ? 'Verbal' :
                       overrideLevel === 'first_written' ? 'First Written' :
                       overrideLevel === 'final_written' ? 'Final Written' : overrideLevel)
                    : (lraRecommendation?.recommendedLevel === 'Counselling Session' ? 'Counselling' : safeText(lraRecommendation?.recommendedLevel))
                  }
                </ThemedBadge>
              </button>

              {/* Escalation Indicator */}
              {lraRecommendation?.isEscalation && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" style={{ color: 'var(--color-warning)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--color-warning)' }}>Escalation</span>
                </div>
              )}

              {/* History Count - CLICKABLE */}
              <button
                onClick={() => setShowOverrideSelector(!showOverrideSelector)}
                className="flex items-center gap-1 text-xs hover:opacity-80 active:scale-95 transition-all"
                style={{ color: 'var(--color-text-secondary)' }}
                disabled={signaturesFinalized}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}></div>
                <span className="font-medium" style={{ color: 'var(--color-primary)' }}>{lraRecommendation?.categoryWarningCount ?? 0}</span>
                <span>previous</span>
              </button>
            </div>
          </div>

          {/* Natural Explanation - No Redundancy */}
          <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {lraRecommendation?.isEscalation
                ? `Based on ${lraRecommendation.categoryWarningCount ?? 0} previous incident${(lraRecommendation.categoryWarningCount ?? 0) === 1 ? '' : 's'}, escalating to maintain consistent discipline standards.`
                : 'No prior incidents in this category. Starting with a supportive, corrective approach.'
              }
            </p>
          </div>
        </ThemedCard>
      </div>


      {/* Expandable Details - Step 1 Style */}
      {showDetails && (
        <ThemedCard padding="sm" className="border" style={{ backgroundColor: 'var(--color-alert-info-bg)', borderColor: 'var(--color-alert-info-border)' }}>
          <div className="space-y-3">
            {/* Analysis Details */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-3 h-3" style={{ color: 'var(--color-info)' }} />
                <h4 className="font-medium text-xs" style={{ color: 'var(--color-alert-info-text)' }}>Analysis Summary</h4>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-alert-info-text)' }}>
                {safeText(lraRecommendation?.explanation || lraRecommendation?.reason, 'Progressive discipline assessment completed based on employee warning history and incident severity.')}
              </p>
            </div>

            {/* Legal Requirements */}
            {lraRecommendation?.legalRequirements && lraRecommendation.legalRequirements.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Scale className="w-3 h-3" style={{ color: 'var(--color-info)' }} />
                  <h4 className="font-medium text-xs" style={{ color: 'var(--color-alert-info-text)' }}>Legal Compliance</h4>
                </div>
                <div className="space-y-1">
                  {lraRecommendation.legalRequirements.slice(0, 2).map((requirement, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: 'var(--color-info)' }}></div>
                      <span className="text-xs leading-relaxed" style={{ color: 'var(--color-alert-info-text)' }}>{requirement}</span>
                    </div>
                  ))}
                  {lraRecommendation.legalRequirements.length > 2 && (
                    <p className="text-xs ml-3.5" style={{ color: 'var(--color-info)' }}>
                      + {lraRecommendation.legalRequirements.length - 2} more requirements
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Warning History Context - Category Specific - INTERACTIVE */}
            <div className="rounded-lg p-2 border" style={{ backgroundColor: 'var(--color-card-background)', borderColor: 'var(--color-card-border)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3 h-3" style={{ color: 'var(--color-text-secondary)' }} />
                <h4 className="font-medium text-xs" style={{ color: 'var(--color-text)' }}>Warning History (This Category)</h4>
              </div>
              <div className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Employee has <strong>{lraRecommendation?.categoryWarningCount ?? 0}</strong> active warning(s) in this category.
              </div>

              {/* Interactive Warning List */}
              {lraRecommendation?.activeWarnings && lraRecommendation.activeWarnings.length > 0 && (
                <div className="space-y-1 mt-2">
                  {lraRecommendation.activeWarnings.map((warning: any, index: number) => (
                    <WarningHistoryItem
                      key={warning.id || index}
                      warning={warning}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </ThemedCard>
      )}

      {/* Override Warning Level - Shows only when clicked */}
      {showOverrideSelector && (
        <ThemedCard padding="md" className="border-2" style={{ borderColor: 'var(--color-warning-light)', backgroundColor: 'var(--color-alert-warning-bg)' }}>
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1">
                <Info className="w-4 h-4 mt-0.5" style={{ color: 'var(--color-warning)' }} />
                <div className="flex-1">
                  <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--color-text)' }}>
                    ⚖️ Override Recommendation
                  </h3>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                    The system recommends <strong style={{ color: 'var(--color-text)' }}>{safeText(lraRecommendation?.recommendedLevel)}</strong>.
                    You may override this to escalate faster or re-issue the same level if circumstances warrant it.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOverrideSelector(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                disabled={signaturesFinalized}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Select Warning Level:
              </label>
              <select
                value={overrideLevel || lraRecommendation?.suggestedLevel || ''}
                onChange={(e) => {
                  const newLevel = e.target.value === (lraRecommendation?.suggestedLevel || '') ? null : e.target.value;
                  setOverrideLevel(newLevel);
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border-2 transition-colors"
                style={{
                  borderColor: overrideLevel ? 'var(--color-warning)' : 'var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text)'
                }}
                disabled={signaturesFinalized}
              >
                <option value="">-- Use System Recommendation --</option>
                {lraRecommendation?.escalationPath?.map((level: string) => {
                  const labels: Record<string, string> = {
                    'counselling': 'Counselling Session',
                    'verbal': 'Verbal Warning',
                    'first_written': 'Written Warning',
                    'final_written': 'Final Written Warning'
                  };
                  return (
                    <option key={level} value={level}>
                      {labels[level] || level}
                      {level === lraRecommendation.suggestedLevel ? ' (Recommended)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {overrideLevel && (
              <ThemedAlert variant="warning" className="text-xs">
                <strong>Override Active:</strong> This warning will be issued as <strong>{
                  overrideLevel === 'counselling' ? 'Counselling Session' :
                  overrideLevel === 'verbal' ? 'Verbal Warning' :
                  overrideLevel === 'first_written' ? 'Written Warning' :
                  overrideLevel === 'final_written' ? 'Final Written Warning' : overrideLevel
                }</strong> instead of the recommended level. Future warnings will consider this custom escalation path.
              </ThemedAlert>
            )}
          </div>
        </ThemedCard>
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

            {/* Employee Row */}
            <div className="rounded-lg p-2" style={{
              backgroundColor: 'var(--color-alert-success-bg)',
              opacity: !signatures.manager ? 0.6 : 1
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

              {/* Manager signature required notice */}
              {!signatures.manager && !signaturesFinalized && (
                <div className="mb-3 p-2 rounded border" style={{
                  backgroundColor: 'var(--color-alert-warning-bg)',
                  borderColor: 'var(--color-warning)'
                }}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--color-alert-warning-text)' }}>
                      Manager must save their signature first
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
                disabled={signaturesFinalized || !signatures.manager}
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