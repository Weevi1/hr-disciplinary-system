// frontend/src/components/warnings/enhanced/phases/ImprovementPlanPhase.tsx
//
// Improvement Plan phase (phase 5) of UnifiedWarningWizard, also rendered as
// Section C of V2's merged Conversation phase. Captures the employee's
// commitments to improve, a follow-up review date, and the warning's
// effective period. Pure label / help-text scaffolding — Firestore field
// names and shape are unchanged.

import React from 'react';
import { X } from 'lucide-react';
import { ThemedAlert } from '../../../common/ThemedCard';
import { ThemedButton } from '../../../common/ThemedButton';
import { generateId } from '../wizardHelpers';
import type { FormData, ActionCommitment } from '../wizardTypes';

interface ImprovementPlanPhaseProps {
  levelInfo: { label: string; requiresCommitments: boolean };
  actionCommitments: ActionCommitment[];
  setActionCommitments: (commitments: ActionCommitment[]) => void;
  reviewDate: string;
  setReviewDate: (date: string) => void;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export const ImprovementPlanPhase: React.FC<ImprovementPlanPhaseProps> = ({
  levelInfo,
  actionCommitments,
  setActionCommitments,
  reviewDate,
  setReviewDate,
  formData,
  setFormData,
}) => {
  const hasCommitments = actionCommitments.length > 0;

  return (
    <div className="space-y-5">
      {/* Intro — frames the whole section so users know what they're filling in */}
      <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        Set what the employee will do to fix this, when you'll check in on them, and how long
        the warning stays on their record
        {!levelInfo.requiresCommitments && (
          <> &nbsp;(optional for {levelInfo.label} warnings)</>
        )}
        .
      </p>

      {!levelInfo.requiresCommitments && (
        <ThemedAlert variant="info">
          For {levelInfo.label} warnings, improvement commitments are optional.
        </ThemedAlert>
      )}

      {/* ===== Commitments ===== */}
      <div>
        <label className="text-sm font-semibold mb-1 block" style={{ color: 'var(--color-text-primary)' }}>
          What the employee will do
        </label>
        <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          List the specific changes they commit to. Add as many as needed.
        </p>

        {actionCommitments.map((commitment, index) => (
          <div
            key={commitment.id}
            className="mb-3 p-3 rounded-lg border"
            style={{
              backgroundColor: 'var(--color-background)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex items-start gap-2 mb-2">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Action</label>
                <input
                  type="text"
                  value={commitment.commitment}
                  onChange={(e) => {
                    const updated = [...actionCommitments];
                    updated[index].commitment = e.target.value;
                    setActionCommitments(updated);
                  }}
                  placeholder="e.g., Arrive 10 minutes early"
                  className="w-full px-3 py-2 rounded border text-sm"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
              <button
                onClick={() => setActionCommitments(actionCommitments.filter((c) => c.id !== commitment.id))}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                aria-label="Remove commitment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Timeline</label>
              <input
                type="text"
                value={commitment.timeline}
                onChange={(e) => {
                  const updated = [...actionCommitments];
                  updated[index].timeline = e.target.value;
                  setActionCommitments(updated);
                }}
                placeholder="e.g., Immediately, Within 1 week"
                className="w-full px-3 py-2 rounded border text-sm"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
          </div>
        ))}

        {/* Empty-state example so first-time users know what a commitment looks like */}
        {!hasCommitments && (
          <div
            className="mb-3 p-3 rounded-lg border-dashed border text-xs leading-relaxed"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-text-secondary)',
            }}
          >
            💡 <strong>Example:</strong> Action: <em>"Arrive 10 minutes before shift start"</em> — Timeline: <em>"Immediately"</em>
          </div>
        )}

        <ThemedButton
          variant="outline"
          size="sm"
          className="!px-2.5 !py-1 !text-xs"
          onClick={() =>
            setActionCommitments([...actionCommitments, { id: generateId(), commitment: '', timeline: '' }])
          }
        >
          {hasCommitments ? '+ Another Commitment' : '+ Add Commitment'}
        </ThemedButton>
      </div>

      {/* ===== Follow-up Review Date ===== */}
      <div>
        <label className="text-sm font-semibold mb-1 block" style={{ color: 'var(--color-text-primary)' }}>
          When will you check in?
        </label>
        <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          A meeting date to review progress with the employee.
        </p>
        <input
          type="date"
          value={reviewDate}
          onChange={(e) => setReviewDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 rounded border"
          style={{
            backgroundColor: 'var(--color-background)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>

      {/* ===== Warning record (Issue Date + Validity Period grouped) ===== */}
      <div
        className="rounded-lg border p-3"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-background)',
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Warning record
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold mb-1 block" style={{ color: 'var(--color-text-primary)' }}>
              Date issued
            </label>
            <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Usually today. Editable if you're recording a past discussion.
            </p>
            <input
              type="date"
              value={formData.issueDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, issueDate: e.target.value }))}
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1 block" style={{ color: 'var(--color-text-primary)' }}>
              Stays active for
            </label>
            <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              After this period the warning expires from the employee's active record.
            </p>
            <select
              value={formData.validityPeriod}
              onChange={(e) => setFormData((prev) => ({ ...prev, validityPeriod: parseInt(e.target.value) as 3 | 6 | 12 }))}
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
