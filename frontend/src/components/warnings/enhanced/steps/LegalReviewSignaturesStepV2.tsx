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
  Loader2, RefreshCw, MessageCircle, Volume2, Send, Play, Pause, TrendingUp
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
  audioUploadStatus
}) => {
  // State management
  const [showDetails, setShowDetails] = useState(false);
  const [scriptReadConfirmed, setScriptReadConfirmed] = useState(false);
  const [readingScript, setReadingScript] = useState(false);
  const [showSignatureSection, setShowSignatureSection] = useState(false);
  const [signatures, setSignatures] = useState<SignatureData>(
    currentSignatures || { manager: null, employee: null }
  );

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

  const handleEmployeeSignature = useCallback((signature: string | null) => {
    setSignatures(prev => ({ ...prev, employee: signature }));
  }, []);

  // Handle complete signatures and finalize
  const handleCompleteSignatures = useCallback(() => {
    if (!allSignaturesComplete || signaturesFinalized) return;
    
    const finalSignatures: SignatureData = {
      ...signatures,
      timestamp: new Date().toISOString(),
      managerName: currentManagerName,
      employeeName: `${safeEmployee.firstName} ${safeEmployee.lastName}`
    };
    
    onSignaturesComplete(finalSignatures, true);
  }, [signatures, allSignaturesComplete, signaturesFinalized, currentManagerName, safeEmployee, onSignaturesComplete]);

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
              <strong>Conduct a private meeting</strong> with the employee
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-base">4️⃣</span>
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
              {/* Primary Badge */}
              <ThemedBadge variant="primary" size="sm" className="font-semibold">
                {safeText(lraRecommendation?.recommendedLevel)}
              </ThemedBadge>

              {/* Escalation Indicator */}
              {lraRecommendation?.isEscalation && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" style={{ color: 'var(--color-warning)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--color-warning)' }}>Escalation</span>
                </div>
              )}

              {/* Warning Count Visual - Category Specific */}
              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}></div>
                <span className="font-medium" style={{ color: 'var(--color-primary)' }}>{lraRecommendation?.categoryWarningCount ?? 0}</span>
                <span>in category</span>
              </div>
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
            employeeName={`${safeEmployee.firstName} ${safeEmployee.lastName}`}
            managerName={currentManagerName}
            incidentDescription={formData.incidentDescription || 'Workplace incident requiring disciplinary action'}
            warningLevel={lraRecommendation?.level || 'disciplinary'}
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
            <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--color-alert-success-bg)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>Employee</span>
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{safeEmployee.firstName} {safeEmployee.lastName}</span>
                </div>
                {signatures.employee && <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-success)' }} />}
              </div>
              <DigitalSignaturePad
                onSignatureComplete={handleEmployeeSignature}
                disabled={signaturesFinalized}
                label="Employee Signature"
                placeholder="Employee signature"
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