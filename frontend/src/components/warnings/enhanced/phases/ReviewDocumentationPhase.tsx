// frontend/src/components/warnings/enhanced/phases/ReviewDocumentationPhase.tsx
//
// Review Documentation phase (phase 6) of UnifiedWarningWizard. Extracted
// in Phase 2 Tier 3C step 4. Renders a scannable summary with tappable
// rows that jump back to specific phases for edits. Co-locates the
// presentational `ReviewRow` sub-component (no other callers).

import React from 'react';
import { ChevronRight, Paperclip } from 'lucide-react';
import { Phase } from '../wizardTypes';
import type { Category, FormData, ActionCommitment } from '../wizardTypes';
import type { EvidenceItem } from '@/types/warning';

interface ReviewRowProps {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}

const ReviewRow: React.FC<ReviewRowProps> = ({ label, onClick, children }) => (
  <button
    onClick={onClick}
    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors group flex items-start gap-3"
    aria-label={`Edit ${label}`}
  >
    <span
      className="text-xs font-medium w-24 flex-shrink-0 pt-0.5"
      style={{ color: 'var(--color-text-secondary)' }}
    >
      {label}
    </span>
    <span
      className="flex-1 text-sm leading-relaxed"
      style={{
        color: 'var(--color-text-primary)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {children}
    </span>
    <ChevronRight
      className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-50 transition-opacity mt-0.5"
      style={{ color: 'var(--color-text-secondary)' }}
    />
  </button>
);

interface ReviewDocumentationPhaseProps {
  levelInfo: { label: string; color: string; requiresCommitments: boolean };
  employeeName: string;
  selectedCategory: Category | undefined;
  formData: FormData;
  pendingEvidenceItems: EvidenceItem[];
  employeeStatement: string;
  expectedBehavior: string;
  actionCommitments: ActionCommitment[];
  reviewDate: string;
  goToPhase: (phase: number) => void;
}

export const ReviewDocumentationPhase: React.FC<ReviewDocumentationPhaseProps> = ({
  levelInfo,
  employeeName,
  selectedCategory,
  formData,
  pendingEvidenceItems,
  employeeStatement,
  expectedBehavior,
  actionCommitments,
  reviewDate,
  goToPhase,
}) => (
  <div className="space-y-4">
    {/* Hero summary - the key facts at a glance */}
    <div
      className="p-4 rounded-xl text-center"
      style={{
        background: `linear-gradient(135deg, ${levelInfo.color}15, ${levelInfo.color}05)`,
        border: `1px solid ${levelInfo.color}30`,
      }}
    >
      <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: levelInfo.color }}>
        {levelInfo.label}
      </p>
      <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        {employeeName}
      </p>
      <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
        {selectedCategory?.name} • {formData.incidentDate}
      </p>
    </div>

    {/* Editable details list */}
    <div className="space-y-1">
      <ReviewRow
        label="What happened"
        onClick={() => goToPhase(Phase.INCIDENT_DETAILS)}
      >
        {formData.incidentDescription || 'No description'}
      </ReviewRow>

      <ReviewRow
        label="When & Where"
        onClick={() => goToPhase(Phase.INCIDENT_DETAILS)}
      >
        {formData.incidentDate} at {formData.incidentTime} • {formData.incidentLocation}
      </ReviewRow>

      {pendingEvidenceItems.length > 0 && (
        <ReviewRow
          label="Evidence"
          onClick={() => goToPhase(Phase.INCIDENT_DETAILS)}
        >
          <span className="flex items-center gap-1">
            <Paperclip className="w-3 h-3" />
            {pendingEvidenceItems.length} file{pendingEvidenceItems.length !== 1 ? 's' : ''} attached
          </span>
        </ReviewRow>
      )}

      {levelInfo.requiresCommitments && (
        <>
          <ReviewRow
            label="Employee said"
            onClick={() => goToPhase(Phase.EMPLOYEE_RESPONSE)}
          >
            "{employeeStatement || 'No response'}"
          </ReviewRow>

          <ReviewRow
            label="Expected standard"
            onClick={() => goToPhase(Phase.EXPECTED_STANDARDS)}
          >
            {expectedBehavior || 'Not specified'}
          </ReviewRow>

          <ReviewRow
            label="Improvement plan"
            onClick={() => goToPhase(Phase.IMPROVEMENT_PLAN)}
          >
            {actionCommitments.length} commitment{actionCommitments.length !== 1 ? 's' : ''} • Review: {reviewDate || 'Not set'}
          </ReviewRow>
        </>
      )}
    </div>

    {/* Footer hint */}
    <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
      Tap any row to edit
    </p>
  </div>
);
