// frontend/src/components/warnings/enhanced/phases/CategoryRecommendationPhase.tsx
//
// Category & Recommendation phase (phase 1) of UnifiedWarningWizard.
// Extracted in Phase 2 Tier 3C step 6. Renders the category picker,
// LRA recommendation card (with clickable active-warnings list and
// escalation indicator), and the HR-intervention-required panel when
// the recommended level is dismissal or a final-written cap is hit.

import React from 'react';
import { Scale, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import { CategorySelector } from '../steps/components/CategorySelector';
import { ThemedCard } from '../../../common/ThemedCard';
import { ExplainerPanel } from '../../../common/ExplainerPanel';
import { WARNING_LEVEL_EXPLAINERS, PROGRESSIVE_DISCIPLINE_SUMMARY } from '../../../../constants/legalExplainers';
import { getWarningLevelInfo } from '../wizardHelpers';
import type { Category, FormData } from '../wizardTypes';
import type { EscalationRecommendation } from '@/services/WarningService';

type HrIntervention = false | 'final_warning' | 'dismissal';

interface CategoryRecommendationPhaseProps {
  categories: Category[];
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  selectedCategory: Category | undefined;
  setSelectedCategory: (category: Category | undefined) => void;
  lraRecommendation: EscalationRecommendation | null;
  setLraRecommendation: (rec: EscalationRecommendation | null) => void;
  isAnalyzing: boolean;
  hrInterventionRequired: HrIntervention;
  setHrInterventionRequired: (value: HrIntervention) => void;
  expectedBehavior: string;
  setExpectedBehavior: (value: string) => void;
  setSelectedWarningDetails: (warning: any) => void;
}

export const CategoryRecommendationPhase: React.FC<CategoryRecommendationPhaseProps> = ({
  categories,
  formData,
  setFormData,
  selectedCategory,
  setSelectedCategory,
  lraRecommendation,
  setLraRecommendation,
  isAnalyzing,
  hrInterventionRequired,
  setHrInterventionRequired,
  expectedBehavior,
  setExpectedBehavior,
  setSelectedWarningDetails,
}) => (
  <div className="space-y-4">
    <CategorySelector
      categories={categories}
      selectedCategoryId={formData.categoryId}
      onCategorySelect={(id) => {
        // Reset state and trigger analysis via useEffect
        setLraRecommendation(null);
        setHrInterventionRequired(false);
        // 🔥 FIX: Update selectedCategory BEFORE formData to avoid race condition
        // The generateLRARecommendation useEffect uses selectedCategory state
        const category = categories.find((c) => c.id === id);
        setSelectedCategory(category);
        setFormData((prev) => ({ ...prev, categoryId: id }));
        // Pre-populate expected standards template if available and field is empty
        if (category?.expectedStandardsTemplate && !expectedBehavior) {
          setExpectedBehavior(category.expectedStandardsTemplate);
        }
      }}
      lraRecommendation={lraRecommendation}
    />

    {/* Show spinner when analyzing OR when no recommendation yet (after category selected) */}
    {!hrInterventionRequired && (isAnalyzing || (!lraRecommendation && formData.categoryId)) && (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-gray-700">Analyzing warning history...</p>
        <p className="text-xs text-gray-500 mt-1">Please wait</p>
      </div>
    )}

    {lraRecommendation && !hrInterventionRequired && (
      <ThemedCard padding="md" className="border-l-4" style={{ borderLeftColor: 'var(--color-primary)' }}>
        <div className="flex items-start gap-3">
          <Scale className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
          <div className="flex-1">
            <h4 className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              Recommended: {lraRecommendation.recommendedLevel || getWarningLevelInfo(lraRecommendation.suggestedLevel).label}
            </h4>
            {selectedCategory?.name && (
              <p className="text-xs italic mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
                Based on your "{selectedCategory.name}" escalation path
              </p>
            )}
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {lraRecommendation.reason}
            </p>

            <ExplainerPanel label="Why this level?" variant="legal" className="mt-1">
              {WARNING_LEVEL_EXPLAINERS[lraRecommendation.suggestedLevel] && (
                <p className="mb-2">{WARNING_LEVEL_EXPLAINERS[lraRecommendation.suggestedLevel]}</p>
              )}
              {lraRecommendation.explanation && (
                <p className="mb-2">{lraRecommendation.explanation}</p>
              )}
              <p>{PROGRESSIVE_DISCIPLINE_SUMMARY}</p>
              {lraRecommendation.legalBasis && (
                <p className="mt-2 text-xs italic">Legal basis: {lraRecommendation.legalBasis}</p>
              )}
            </ExplainerPanel>

            {/* Active warnings on file - clickable for details */}
            {lraRecommendation.activeWarnings && lraRecommendation.activeWarnings.length > 0 && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Active Warnings ({lraRecommendation.activeWarnings.length}):
                </p>
                <div className="space-y-1.5">
                  {lraRecommendation.activeWarnings.slice(0, 3).map((warning: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedWarningDetails(warning)}
                      className="group w-full text-left text-xs flex items-center gap-2 p-2 rounded-lg border transition-all duration-150 cursor-pointer hover:shadow-sm active:scale-[0.98]"
                      style={{
                        backgroundColor: 'var(--color-card-background)',
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-secondary)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                        e.currentTarget.style.backgroundColor = 'var(--color-primary-bg)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                        e.currentTarget.style.backgroundColor = 'var(--color-card-background)';
                      }}
                      title="Tap to view warning details"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-warning)' }} />
                      <span className="flex-1 group-hover:text-blue-600 transition-colors">
                        {getWarningLevelInfo(warning.level || warning.suggestedLevel).label} - {warning.categoryName || warning.category || 'General'}
                        {warning.issueDate && ` (${new Date(warning.issueDate).toLocaleDateString('en-ZA')})`}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                  {lraRecommendation.activeWarnings.length > 3 && (
                    <p className="text-xs pl-2" style={{ color: 'var(--color-text-tertiary)' }}>
                      +{lraRecommendation.activeWarnings.length - 3} more warnings
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* No warnings - clean record */}
            {(!lraRecommendation.activeWarnings || lraRecommendation.activeWarnings.length === 0) && (
              <div className="mt-2 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" style={{ color: 'var(--color-success)' }} />
                <span className="text-xs" style={{ color: 'var(--color-success)' }}>
                  No active warnings on file
                </span>
              </div>
            )}

            {/* Escalation indicator */}
            {lraRecommendation.isEscalation && (
              <div
                className="mt-2 px-2 py-1 rounded text-xs inline-flex items-center gap-1"
                style={{
                  backgroundColor: 'var(--color-alert-warning-bg)',
                  color: 'var(--color-alert-warning-text)',
                }}
              >
                <AlertTriangle className="w-3 h-3" />
                Escalation from previous warning
              </div>
            )}

            {/* Manager-owns-the-decision reassurance — the recommendation
                applies the company's category settings, but the manager makes
                the call. */}
            <p
              className="text-xs italic mt-3 pt-3 border-t"
              style={{ color: 'var(--color-text-tertiary)', borderColor: 'var(--color-border-light)' }}
            >
              You can adjust this if your assessment of the incident differs from the suggestion.
            </p>
          </div>
        </div>
      </ThemedCard>
    )}

    {hrInterventionRequired && (
      <div
        className="rounded-xl border-2 p-5 space-y-4"
        style={{
          borderColor: '#dc2626',
          backgroundColor: 'rgba(220, 38, 38, 0.05)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#dc2626' }}
          >
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg" style={{ color: '#dc2626' }}>
              {hrInterventionRequired === 'final_warning'
                ? 'HR Intervention Required'
                : 'Serious Matter — Immediate HR Involvement Required'}
            </h3>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              This cannot be handled through the warning system
            </p>
          </div>
        </div>

        <div
          className="rounded-lg p-4 space-y-3"
          style={{ backgroundColor: 'var(--color-surface-secondary)' }}
        >
          <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
            What you must do:
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="font-bold text-sm mt-0.5" style={{ color: '#dc2626' }}>1.</span>
              <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                <strong>Take the employee to HR immediately</strong> to report this incident.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-sm mt-0.5" style={{ color: '#dc2626' }}>2.</span>
              <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                If the employee <strong>refuses or is unable to accompany you</strong>, report the incident to HR yourself immediately.
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          {hrInterventionRequired === 'final_warning'
            ? 'This employee already has a final written warning on file for this category. Any further action must be conducted by HR.'
            : "Based on the severity of this offense and the employee's disciplinary history, this matter may require formal dismissal proceedings which must be conducted by HR."}
        </p>
      </div>
    )}
  </div>
);
