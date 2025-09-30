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
  currentSignatures
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
    <div className="space-y-2">
      {/* LRA Recommendation - Step 1 Style Consistency */}
      <div className="space-y-2">
        {/* Compact Header with Inline Action - Step 1 Pattern */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
            <div>
              <h3 className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>LRA Recommendation</h3>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Legal analysis complete</p>
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

              {/* Warning Count Visual */}
              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}></div>
                <span className="font-medium" style={{ color: 'var(--color-primary)' }}>{lraRecommendation?.warningCount || 0}</span>
                <span>total</span>
              </div>
            </div>

            {/* Status Indicator - Step 1 Style */}
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--color-success)' }}>Analyzed</span>
            </div>
          </div>

          {/* Reason Text - Clean Typography */}
          <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {safeText(lraRecommendation?.reason, 'Progressive discipline policy requires escalation based on employee history.')}
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

            {/* Warning History Context */}
            <div className="rounded-lg p-2 border" style={{ backgroundColor: 'var(--color-card-background)', borderColor: 'var(--color-card-border)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3 h-3" style={{ color: 'var(--color-text-secondary)' }} />
                <h4 className="font-medium text-xs" style={{ color: 'var(--color-text)' }}>Warning History</h4>
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Employee has <strong>{lraRecommendation?.warningCount || 0}</strong> active warning record.
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

      {/* Multi-Language Warning Script - Compact Integration */}
      <MultiLanguageWarningScript
        employeeName={`${safeEmployee.firstName} ${safeEmployee.lastName}`}
        managerName={currentManagerName}
        incidentDescription={formData.incidentDescription || 'Workplace incident requiring disciplinary action'}
        warningLevel={lraRecommendation?.level || 'disciplinary'}
        onScriptRead={() => setScriptReadConfirmed(true)}
        disabled={scriptReadConfirmed}
      />

      {/* STRATEGIC LAYOUT: Compact Signature Section */}
      {showSignatureSection && (
        <ThemedCard padding="sm">
          {/* Ultra-compact header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>Signatures</span>
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
            <div className="mt-3 p-2 rounded-lg flex items-center justify-between" style={{ backgroundColor: 'var(--color-alert-success-bg)' }}>
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
                Finalize
              </ThemedButton>
            </div>
          )}

          {signaturesFinalized && (
            <div className="mt-3 p-2 rounded-lg flex items-center gap-2" style={{ backgroundColor: 'var(--color-alert-info-bg)' }}>
              <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-info)' }} />
              <div className="text-sm">
                <span className="font-medium" style={{ color: 'var(--color-alert-info-text)' }}>Finalized</span>
                {signatures.timestamp && (
                  <span className="ml-2" style={{ color: 'var(--color-alert-info-text)' }}>
                    {new Date(signatures.timestamp).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}
        </ThemedCard>
      )}
    </div>
  );
};