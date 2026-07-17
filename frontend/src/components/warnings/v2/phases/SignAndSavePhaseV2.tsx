// frontend/src/components/warnings/v2/phases/SignAndSavePhaseV2.tsx
//
// V2 Sign & Save phase. Merges V1 Phases 6 (Review), 7 (Script & PDF
// Review), and 8 (Signatures) into one scrollable screen with three
// clearly-labelled sections. The orchestrator owns the "Save Warning"
// button (via PhaseNavigation) — clicking it fires the same
// handleSaveWarning that V1 uses, which writes to Firestore and uploads
// audio + evidence.
//
// goToPhase mapping: the Review summary uses V1 Phase enum values to
// request jumps to earlier phases. Since V2's INCIDENT phase happens to
// share the numeric value (2) with V1's INCIDENT_DETAILS, that case
// passes through. The other V1 phases (EMPLOYEE_RESPONSE,
// EXPECTED_STANDARDS, IMPROVEMENT_PLAN) all live in V2's merged
// CONVERSATION phase, so they get redirected together.

import React from 'react';
import { CheckCircle, ScrollText, PenTool } from 'lucide-react';
import { ReviewDocumentationPhase } from '../../enhanced/phases/ReviewDocumentationPhase';
import { ScriptPdfReviewPhase } from '../../enhanced/phases/ScriptPdfReviewPhase';
import { SignaturesPhase } from '../../enhanced/phases/SignaturesPhase';
import { Phase as PhaseV1 } from '../../enhanced/wizardTypes';
import { PhaseV2 } from '../wizardTypesV2';
import type { Category, FormData, ActionCommitment, SignatureData } from '../wizardTypesV2';
import type { EvidenceItem } from '@/types/warning';
import type { EscalationRecommendation } from '@/services/WarningService';

interface SignAndSavePhaseV2Props {
  // Review section
  levelInfo: { label: string; color: string; requiresCommitments: boolean };
  employeeName: string;
  selectedCategory: Category | undefined;
  formData: FormData;
  pendingEvidenceItems: EvidenceItem[];
  employeeStatement: string;
  expectedBehavior: string;
  actionCommitments: ActionCommitment[];
  reviewDate: string;
  goToPhase: (phase: PhaseV2) => void;

  // Script section
  currentManagerName: string;
  currentLevel: string;
  scriptReadConfirmed: boolean;
  setScriptReadConfirmed: (confirmed: boolean) => void;
  hasAcknowledged: boolean;
  setHasAcknowledged: (acknowledged: boolean) => void;
  lraRecommendation: EscalationRecommendation | null;

  // Signatures section
  signatures: SignatureData;
  signatureType: 'employee' | 'witness';
  setSignatureType: (type: 'employee' | 'witness') => void;
  employeeViewedPDF: boolean;
  setEmployeeViewedPDF: (viewed: boolean) => void;
  setShowPDFPreview: (show: boolean) => void;
  activeSignatureModal: 'manager' | 'employee' | null;
  setActiveSignatureModal: (modal: 'manager' | 'employee' | null) => void;
  handleManagerSignature: (signature: string | null) => void;
  handleEmployeeSignature: (signature: string | null) => void;
  handleWitnessSignature: (signature: string | null) => Promise<void>;
}

// Map V1 phase requests from ReviewDocumentationPhase to V2 phases.
const mapV1ToV2Phase = (v1Phase: number): PhaseV2 => {
  switch (v1Phase) {
    case PhaseV1.EMPLOYEE_SELECTION:
    case PhaseV1.CATEGORY_RECOMMENDATION:
      return PhaseV2.SETUP;
    case PhaseV1.INCIDENT_DETAILS:
      return PhaseV2.INCIDENT;
    case PhaseV1.EMPLOYEE_RESPONSE:
    case PhaseV1.EXPECTED_STANDARDS:
    case PhaseV1.IMPROVEMENT_PLAN:
      return PhaseV2.CONVERSATION;
    default:
      return PhaseV2.SIGN_AND_SAVE;
  }
};

interface SectionHeadingProps {
  letter: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  subtitle: string;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({ letter, icon: Icon, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-3">
    <div
      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
      style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
    >
      {letter}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
        <h4 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </h4>
      </div>
      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
        {subtitle}
      </p>
    </div>
  </div>
);

export const SignAndSavePhaseV2: React.FC<SignAndSavePhaseV2Props> = (props) => (
  <div className="space-y-6 divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
    {/* === Section A: Review === */}
    <div>
      <SectionHeading
        letter="A"
        icon={CheckCircle}
        title="Review"
        subtitle="Check everything reads correctly. Tap any row to step back and edit."
      />
      <ReviewDocumentationPhase
        levelInfo={props.levelInfo}
        employeeName={props.employeeName}
        selectedCategory={props.selectedCategory}
        formData={props.formData}
        pendingEvidenceItems={props.pendingEvidenceItems}
        employeeStatement={props.employeeStatement}
        expectedBehavior={props.expectedBehavior}
        actionCommitments={props.actionCommitments}
        reviewDate={props.reviewDate}
        goToPhase={(v1Phase) => props.goToPhase(mapV1ToV2Phase(v1Phase))}
      />
    </div>

    {/* === Section B: Read script + acknowledge === */}
    <div className="pt-5">
      <SectionHeading
        letter="B"
        icon={ScrollText}
        title="Read the script aloud"
        subtitle="Required by the LRA. The employee then confirms they understand."
      />
      <ScriptPdfReviewPhase
        employeeName={props.employeeName}
        currentManagerName={props.currentManagerName}
        selectedCategory={props.selectedCategory}
        formData={props.formData}
        currentLevel={props.currentLevel}
        scriptReadConfirmed={props.scriptReadConfirmed}
        setScriptReadConfirmed={props.setScriptReadConfirmed}
        hasAcknowledged={props.hasAcknowledged}
        setHasAcknowledged={props.setHasAcknowledged}
        lraRecommendation={props.lraRecommendation}
      />
    </div>

    {/* === Section C: Sign === */}
    <div className="pt-5">
      <SectionHeading
        letter="C"
        icon={PenTool}
        title="Capture signatures"
        subtitle="Manager first, then the PDF preview, then employee (or witness if employee refuses)."
      />
      <SignaturesPhase
        currentManagerName={props.currentManagerName}
        employeeName={props.employeeName}
        signatures={props.signatures}
        signatureType={props.signatureType}
        setSignatureType={props.setSignatureType}
        employeeViewedPDF={props.employeeViewedPDF}
        setEmployeeViewedPDF={props.setEmployeeViewedPDF}
        setShowPDFPreview={props.setShowPDFPreview}
        activeSignatureModal={props.activeSignatureModal}
        setActiveSignatureModal={props.setActiveSignatureModal}
        handleManagerSignature={props.handleManagerSignature}
        handleEmployeeSignature={props.handleEmployeeSignature}
        handleWitnessSignature={props.handleWitnessSignature}
      />

      {/* Manager confirmation footer — reinforces that the manager owns the
          decision and the company's policy backs it. */}
      <p
        className="text-xs italic text-center mt-4 px-4"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        By signing, you confirm this warning was issued in line with your company's code of conduct and disciplinary procedures.
      </p>
    </div>
  </div>
);
