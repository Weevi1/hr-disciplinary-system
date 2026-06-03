// frontend/src/components/warnings/v2/phases/SetupPhaseV2.tsx
//
// V2 Setup phase. Merges V1 Phase 0 (Employee Selection) + Phase 1
// (Category & Recommendation) into one screen. Adds an early escalation
// risk indicator that surfaces active-warning count the moment an
// employee is picked — before category selection — so the HR Intervention
// gate isn't a surprise later.

import React from 'react';
import { AlertTriangle, CheckCircle, ChevronDown } from 'lucide-react';
import { EmployeeSelector } from '../../enhanced/steps/components/EmployeeSelector';
import { CategoryRecommendationPhase } from '../../enhanced/phases/CategoryRecommendationPhase';
import type { Category, FormData } from '../wizardTypesV2';
import type { EscalationRecommendation } from '@/services/WarningService';
import type { EmployeeWithContext } from '@/services/WarningService';

type HrIntervention = false | 'final_warning' | 'dismissal';

interface SetupPhaseV2Props {
  // Employee selection
  employees: EmployeeWithContext[];
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  warningHistory: any[];

  // Category + LRA (passes straight through to CategoryRecommendationPhase)
  categories: Category[];
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

export const SetupPhaseV2: React.FC<SetupPhaseV2Props> = ({
  employees,
  formData,
  setFormData,
  warningHistory,
  categories,
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
}) => {
  const employeeSelected = !!formData.employeeId;
  const activeWarningCount = warningHistory.length;

  return (
    <div className="space-y-5">
      {/* === Section A: Employee === */}
      <div>
        <EmployeeSelector
          employees={employees}
          selectedEmployeeId={formData.employeeId}
          onEmployeeSelect={(id) => setFormData((prev) => ({ ...prev, employeeId: id }))}
          warningHistory={warningHistory}
        />
      </div>

      {/* === Early escalation indicator (only after employee picked, before category) === */}
      {employeeSelected && !formData.categoryId && (
        <>
          {activeWarningCount > 0 ? (
            <div
              className="rounded-lg border-l-4 p-3 flex items-start gap-3"
              style={{
                borderLeftColor: 'var(--color-warning)',
                backgroundColor: 'var(--color-alert-warning-bg)',
              }}
            >
              <AlertTriangle
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                style={{ color: 'var(--color-warning)' }}
              />
              <div className="text-xs" style={{ color: 'var(--color-alert-warning-text)' }}>
                <strong>
                  {activeWarningCount} active warning{activeWarningCount !== 1 ? 's' : ''} on file.
                </strong>{' '}
                The recommended level will depend on the category you choose below. If a Final
                Written has already been issued in the same category, you'll be asked to escalate
                to HR instead.
              </div>
            </div>
          ) : (
            <div
              className="rounded-lg border-l-4 p-3 flex items-start gap-3"
              style={{
                borderLeftColor: 'var(--color-success)',
                backgroundColor: 'var(--color-alert-success-bg)',
              }}
            >
              <CheckCircle
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                style={{ color: 'var(--color-success)' }}
              />
              <div className="text-xs" style={{ color: 'var(--color-alert-success-text)' }}>
                <strong>Clean record.</strong> No active warnings on file. This will likely be a
                Counselling or Verbal warning.
              </div>
            </div>
          )}
        </>
      )}

      {/* === Section B: Category + LRA + HR Intervention === */}
      {employeeSelected && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary-light)' }}
            >
              <ChevronDown className="w-3 h-3" style={{ color: 'var(--color-primary)' }} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
              Now pick the misconduct category
            </p>
          </div>
          <CategoryRecommendationPhase
            categories={categories}
            formData={formData}
            setFormData={setFormData}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            lraRecommendation={lraRecommendation}
            setLraRecommendation={setLraRecommendation}
            isAnalyzing={isAnalyzing}
            hrInterventionRequired={hrInterventionRequired}
            setHrInterventionRequired={setHrInterventionRequired}
            expectedBehavior={expectedBehavior}
            setExpectedBehavior={setExpectedBehavior}
            setSelectedWarningDetails={setSelectedWarningDetails}
          />
        </div>
      )}
    </div>
  );
};
