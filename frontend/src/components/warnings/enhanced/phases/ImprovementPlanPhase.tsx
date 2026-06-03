// frontend/src/components/warnings/enhanced/phases/ImprovementPlanPhase.tsx
//
// Improvement Plan phase (phase 5) of UnifiedWarningWizard. Extracted in
// Phase 2 Tier 3C step 5. Action commitments list editor + follow-up
// review date + issue date / validity period.

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
}) => (
  <div className="space-y-4">
    {!levelInfo.requiresCommitments && (
      <ThemedAlert variant="info">
        For {levelInfo.label} warnings, improvement commitments are optional.
      </ThemedAlert>
    )}

    {/* Commitments */}
    <div>
      <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-text-primary)' }}>
        Action Commitments
      </label>
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
              <label className="text-xs text-gray-500 mb-1 block">What will be done</label>
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
            <label className="text-xs text-gray-500 mb-1 block">By when</label>
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
      <ThemedButton
        variant="outline"
        size="sm"
        onClick={() =>
          setActionCommitments([...actionCommitments, { id: generateId(), commitment: '', timeline: '' }])
        }
      >
        + Add Commitment
      </ThemedButton>
    </div>

    {/* Review Date */}
    <div>
      <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-text-primary)' }}>
        Follow-up Review Date
      </label>
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

    {/* Issue Date & Validity */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-text-primary)' }}>
          Issue Date
        </label>
        <input
          type="date"
          value={formData.issueDate}
          onChange={(e) => setFormData((prev) => ({ ...prev, issueDate: e.target.value }))}
          className="w-full px-3 py-2 rounded border"
          style={{
            backgroundColor: 'var(--color-background)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-text-primary)' }}>
          Validity Period
        </label>
        <select
          value={formData.validityPeriod}
          onChange={(e) => setFormData((prev) => ({ ...prev, validityPeriod: parseInt(e.target.value) as 3 | 6 | 12 }))}
          className="w-full px-3 py-2 rounded border"
          style={{
            backgroundColor: 'var(--color-background)',
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
);
