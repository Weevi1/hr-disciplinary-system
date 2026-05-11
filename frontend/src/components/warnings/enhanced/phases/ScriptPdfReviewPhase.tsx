// frontend/src/components/warnings/enhanced/phases/ScriptPdfReviewPhase.tsx
//
// Script & PDF Review phase (phase 7) of UnifiedWarningWizard. Extracted
// in Phase 2 Tier 3C step 5. Manager reads the multi-language warning
// script aloud, then employee acknowledges understanding.

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { ThemedCard } from '../../../common/ThemedCard';
import { MultiLanguageWarningScript } from '../steps/components/MultiLanguageWarningScript';
import type { Category, FormData } from '../wizardTypes';
import type { EscalationRecommendation } from '@/services/WarningService';

interface ScriptPdfReviewPhaseProps {
  employeeName: string;
  currentManagerName: string;
  selectedCategory: Category | undefined;
  formData: FormData;
  currentLevel: string;
  scriptReadConfirmed: boolean;
  setScriptReadConfirmed: (confirmed: boolean) => void;
  hasAcknowledged: boolean;
  setHasAcknowledged: (acknowledged: boolean) => void;
  lraRecommendation: EscalationRecommendation | null;
}

export const ScriptPdfReviewPhase: React.FC<ScriptPdfReviewPhaseProps> = ({
  employeeName,
  currentManagerName,
  selectedCategory,
  formData,
  currentLevel,
  scriptReadConfirmed,
  setScriptReadConfirmed,
  hasAcknowledged,
  setHasAcknowledged,
  lraRecommendation,
}) => (
  <div className="space-y-4">
    {/* Warning Script Section */}
    <ThemedCard padding="md" className="border" style={{ borderColor: 'var(--color-border-light)' }}>
      <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
        <strong>Read this completely to ensure your employee understands their rights.</strong> This script covers all legal requirements and communicates the warning clearly.
      </p>
      <MultiLanguageWarningScript
        employeeName={employeeName || 'Employee'}
        managerName={currentManagerName}
        categoryName={selectedCategory?.name || 'General Misconduct'}
        incidentDescription={formData.incidentDescription || 'Workplace incident requiring disciplinary action'}
        warningLevel={currentLevel}
        validityPeriod={formData.validityPeriod}
        onScriptRead={() => setScriptReadConfirmed(true)}
        disabled={scriptReadConfirmed}
        activeWarnings={lraRecommendation?.activeWarnings}
        issuedDate={formData.issueDate}
      />
    </ThemedCard>

    {/* Script read confirmation status */}
    {scriptReadConfirmed && (
      <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-alert-success-bg)' }}>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--color-alert-success-text)' }}>
            Script has been read to the employee
          </span>
        </div>
      </div>
    )}

    {/* Employee Acknowledgment */}
    <div
      className="p-3 rounded-lg border transition-all"
      style={{
        backgroundColor: hasAcknowledged ? 'var(--color-alert-success-bg)' : 'var(--color-card-background)',
        borderColor: hasAcknowledged ? 'var(--color-success)' : 'var(--color-border-light)',
        opacity: scriptReadConfirmed ? 1 : 0.6,
      }}
    >
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={hasAcknowledged}
          onChange={(e) => setHasAcknowledged(e.target.checked)}
          disabled={!scriptReadConfirmed}
          className="w-5 h-5 mt-0.5 rounded flex-shrink-0"
          style={{ accentColor: 'var(--color-success)' }}
        />
        <div className="flex-1">
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            I confirm the employee has reviewed and understands this warning
          </span>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            The employee understands the nature of the misconduct and their right to representation under the Labour Relations Act.
          </p>
        </div>
      </label>
    </div>
  </div>
);
