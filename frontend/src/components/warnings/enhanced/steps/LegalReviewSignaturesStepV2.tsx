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
  timestamp?: string;
  managerName?: string;
  employeeName?: string;
}

interface LegalReviewSignaturesStepV2Props {
  lraRecommendation: EscalationRecommendation | null;
  selectedEmployee: Employee | undefined;
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

export const LegalReviewSignaturesStepV2: React.FC<LegalReviewSignaturesStepV2Props> = ({
  lraRecommendation,
  selectedEmployee,
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
    currentSignatures || { manager: null, employee: null }
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
  const allSignaturesComplete = !!(signatures.manager && signatures.employee);

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

  // Helper function to add "WITNESS" watermark to signature
  const addWitnessWatermark = useCallback((signatureDataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw the original signature
        ctx.drawImage(img, 0, 0);

        // Add "WITNESS" watermark - PROMINENT & CLEAR
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 6); // Rotate 30 degrees

        // Scale font size based on canvas width (minimum 48px, scales up for larger signatures)
        const fontSize = Math.max(48, canvas.width / 8);
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Add text stroke for better visibility
        ctx.strokeStyle = 'rgba(220, 38, 38, 0.8)'; // Dark red outline at 80% opacity
        ctx.lineWidth = fontSize / 16; // Scale stroke width with font size
        ctx.strokeText('WITNESS', 0, 0);

        // Fill text with semi-transparent red
        ctx.fillStyle = 'rgba(220, 38, 38, 0.55)'; // Semi-transparent red at 55% opacity
        ctx.fillText('WITNESS', 0, 0);

        ctx.restore();

        // Convert to data URL
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Failed to load signature image'));
      img.src = signatureDataUrl;
    });
  }, []);

  const handleEmployeeSignature = useCallback(async (signature: string | null) => {
    if (signature && signatureType === 'witness') {
      // Apply watermark if witness signature
      try {
        const watermarkedSignature = await addWitnessWatermark(signature);
        setSignatures(prev => ({ ...prev, employee: watermarkedSignature }));
      } catch (error) {
        console.error('Failed to apply witness watermark:', error);
        // Fall back to original signature if watermarking fails
        setSignatures(prev => ({ ...prev, employee: signature }));
      }
    } else {
      // Normal employee signature - no watermark
      setSignatures(prev => ({ ...prev, employee: signature }));
    }
  }, [signatureType, addWitnessWatermark]);

  // Handle complete signatures and finalize
  const handleCompleteSignatures = useCallback(() => {
    if (!allSignaturesComplete || signaturesFinalized) return;
    
    const finalSignatures: SignatureData = {
      ...signatures,
      timestamp: new Date().toISOString(),
      managerName: currentManagerName,
      employeeName: selectedEmployee ? `${(selectedEmployee as any).profile?.firstName || 'Unknown'} ${(selectedEmployee as any).profile?.lastName || 'Employee'}` : 'Unknown Employee'
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
      {/* Step Header with Clear Instructions */}
      <ThemedCard padding="md" className="border-l-4" style={{ borderLeftColor: 'var(--color-primary)' }}>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            📋 Review & Prepare for Warning Meeting
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          <Clock className="w-3 h-3" />
          <span>Takes 5-10 minutes to review</span>
        </div>
      </ThemedCard>

      {/* Workflow Guide */}
      <ThemedCard padding="md" className="border" style={{ borderColor: 'var(--color-primary-light)', backgroundColor: 'var(--color-alert-info-bg)' }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text)' }}>What You'll Do Next:</h3>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-base">1️⃣</span>
            <span className="text-sm" style={{ color: 'var(--color-text)' }}>
              <strong>Review the system recommendation</strong> below (legal analysis)
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-base">2️⃣</span>
            <span className="text-sm" style={{ color: 'var(--color-text)' }}>
              <strong>Read the employee warning script</strong> thoroughly
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-base">3️⃣</span>
            <span className="text-sm" style={{ color: 'var(--color-text)' }}>
              <strong>Collect both signatures</strong> (yours and employee's)
            </span>
          </div>
        </div>
      </ThemedCard>

      {/* Warning Severity Badge */}
      <div className="flex items-center gap-2">
        <ThemedBadge variant="warning" size="lg" className="font-semibold">
          ⚠️ {safeText(lraRecommendation?.recommendedLevel)} • {lraRecommendation?.isEscalation ? 'Escalated' : 'First Offense'}
        </ThemedBadge>
      </div>

      {/* System Recommendation - Step 1 Style Consistency */}
      <div className="space-y-2">
        {/* Compact Header with Inline Action - Step 1 Pattern */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
            <div>
              <h3 className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>🎯 System Recommendation</h3>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {lraRecommendation?.isEscalation
                  ? 'Escalation recommended based on history'
                  : 'Start with ' + safeText(lraRecommendation?.recommendedLevel).toLowerCase()
                }
              </p>
            </div>
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

        {/* Recommendation Card - Matching Step 1 Card Style */}
        <ThemedCard padding="sm" hover className="border-l-4" style={{ borderLeftColor: 'var(--color-primary)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Primary Badge - CLICKABLE to show override */}
              <button
                onClick={() => setShowOverrideSelector(!showOverrideSelector)}
                className="transition-all hover:opacity-80 active:scale-95"
                disabled={signaturesFinalized}
              >
                <ThemedBadge variant="primary" size="sm" className="font-semibold cursor-pointer">
                  {overrideLevel
                    ? (overrideLevel === 'counselling' ? 'Counselling Session' :
                       overrideLevel === 'verbal' ? 'Verbal Warning' :
                       overrideLevel === 'first_written' ? 'First Written Warning' :
                       overrideLevel === 'final_written' ? 'Final Written Warning' : overrideLevel)
                    : safeText(lraRecommendation?.recommendedLevel)
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

              {/* Warning Count Visual - Category Specific - ALSO CLICKABLE */}
              <button
                onClick={() => setShowOverrideSelector(!showOverrideSelector)}
                className="flex items-center gap-1 text-xs hover:opacity-80 active:scale-95 transition-all"
                style={{ color: 'var(--color-text-secondary)' }}
                disabled={signaturesFinalized}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}></div>
                <span className="font-medium" style={{ color: 'var(--color-primary)' }}>{lraRecommendation?.categoryWarningCount ?? 0}</span>
                <span>in category</span>
              </button>
            </div>

            {/* Status Indicator - Step 1 Style */}
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--color-success)' }}>Analyzed</span>
            </div>
          </div>

          {/* Friendly Explanation */}
          <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {lraRecommendation?.isEscalation
                ? `This employee has ${lraRecommendation.categoryWarningCount ?? 0} previous warning(s) in this category. We're escalating to ${safeText(lraRecommendation.recommendedLevel).toLowerCase()} to follow proper progressive discipline procedures.`
                : `Since this is a first offense in this category, we recommend starting with ${safeText(lraRecommendation.recommendedLevel).toLowerCase()} rather than a formal written warning. This follows best practice progressive discipline.`
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

            {/* Warning History Context - Category Specific */}
            <div className="rounded-lg p-2 border" style={{ backgroundColor: 'var(--color-card-background)', borderColor: 'var(--color-card-border)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3 h-3" style={{ color: 'var(--color-text-secondary)' }} />
                <h4 className="font-medium text-xs" style={{ color: 'var(--color-text)' }}>Warning History (This Category)</h4>
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Employee has <strong>{lraRecommendation?.categoryWarningCount ?? 0}</strong> active warning(s) in this category.
                {lraRecommendation?.activeWarnings && lraRecommendation.activeWarnings.length > 0 && (
                  <span className="ml-1">
                    Most recent warning was issued <strong>0 days ago</strong>.
                  </span>
                )}
              </div>
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
                    'first_written': 'First Written Warning',
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
                  overrideLevel === 'first_written' ? 'First Written Warning' :
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
            <strong>Read this script before your meeting.</strong> It ensures you cover all legal requirements and communicate clearly with the employee.
          </p>
          <MultiLanguageWarningScript
            employeeName={selectedEmployee ? `${(selectedEmployee as any).profile?.firstName || 'Unknown'} ${(selectedEmployee as any).profile?.lastName || 'Employee'}` : 'Unknown Employee'}
            managerName={currentManagerName}
            incidentDescription={formData.incidentDescription || 'Workplace incident requiring disciplinary action'}
            warningLevel={overrideLevel || lraRecommendation?.recommendedLevel || 'verbal'}
            validityPeriod={formData.validityPeriod}
            onScriptRead={() => setScriptReadConfirmed(true)}
            disabled={scriptReadConfirmed}
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

      {/* What Happens Next Callout */}
      {showSignatureSection && (
        <ThemedAlert variant="info" className="border-l-4" style={{ borderLeftColor: 'var(--color-info)' }}>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-info)' }} />
            <div>
              <h4 className="font-bold text-sm mb-2" style={{ color: 'var(--color-text)' }}>
                ℹ️ What Happens After Signatures?
              </h4>
              <div className="text-xs space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                <p>• ✅ Warning is officially recorded in the system</p>
                <p>• 📧 Employee receives their copy (email/WhatsApp/print)</p>
                <p>• 🔔 HR is notified automatically</p>
              </div>
            </div>
          </div>
        </ThemedAlert>
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
                  Finalize & Save Warning
                </ThemedButton>
              </div>

              {/* Mobile: Sticky footer */}
              <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t-2 shadow-lg z-50" style={{ borderColor: 'var(--color-success)' }}>
                <ThemedButton
                  onClick={handleCompleteSignatures}
                  className="w-full h-12 text-base font-semibold"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Finalize & Save Warning
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
                      <p className="text-xs mt-3 pt-2 border-t" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-tertiary)' }}>
                        🎯 Click "Next" to set up delivery for HR team
                      </p>
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