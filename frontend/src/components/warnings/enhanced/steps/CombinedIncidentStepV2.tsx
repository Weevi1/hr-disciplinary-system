// frontend/src/components/warnings/enhanced/steps/CombinedIncidentStepV2.tsx
// 🎯 UNIFIED COMBINED INCIDENT STEP V2 - REFACTORED WITH THEMED COMPONENTS
// ✅ Unified theming with CSS variables and ThemedCard/ThemedButton system
// ✅ Samsung S8+ mobile optimization with proper touch targets
// ✅ Auto-save functionality, real-time validation, mobile-first design
// ✅ Memory leak fixes, performance optimizations

import React, { useMemo, useState } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Scale,
  Shield,
  Clock,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  TrendingUp
} from 'lucide-react';
import type {
  EscalationRecommendation,
  EmployeeWithContext,
  WarningCategory,
  EnhancedWarningFormData
} from '../../../../services/WarningService';

// Import unified theming components
import { ThemedCard } from '../../../common/ThemedCard';
import { ThemedAlert } from '../../../common/ThemedCard';
import { ThemedBadge } from '../../../common/ThemedCard';
import { ThemedButton } from '../../../common/ThemedButton';

// Import the focused components
import { EmployeeSelector } from './components/EmployeeSelector';
import { CategorySelector } from './components/CategorySelector';
import { IncidentDetailsForm } from './components/IncidentDetailsForm';

// ============================================
// TYPES & INTERFACES
// ============================================

type Employee = EmployeeWithContext;
type Category = WarningCategory;
type FormData = EnhancedWarningFormData;

interface CombinedIncidentStepV2Props {
  employees: Employee[];
  categories: Category[];
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  selectedEmployee?: Employee;
  selectedCategory?: Category;
  warningHistory?: any[];
  isLoadingWarningHistory?: boolean;
  loadWarningHistory?: (employeeId: string) => void;
  lraRecommendation?: EscalationRecommendation | null;
  isAnalyzing?: boolean;
  analysisStep?: number;
  analysisSteps?: string[];
  // Override functionality
  overrideLevel?: string | null;
  setOverrideLevel?: (level: string | null) => void;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const CombinedIncidentStepV2: React.FC<CombinedIncidentStepV2Props> = ({
  employees,
  categories,
  formData,
  updateFormData,
  selectedEmployee,
  selectedCategory,
  warningHistory = [],
  isLoadingWarningHistory = false,
  loadWarningHistory,
  lraRecommendation,
  isAnalyzing = false,
  analysisStep = 0,
  analysisSteps = [],
  overrideLevel,
  setOverrideLevel
}) => {

  // Local state for expanded sections
  const [showDetails, setShowDetails] = useState(false);
  const [showOverrideSelector, setShowOverrideSelector] = useState(false);

  // Helper function for safe text rendering
  const safeText = (text: string | undefined | null, fallback: string = ''): string => {
    return text || fallback;
  };

  // Handlers for child components
  const handleEmployeeSelect = (employeeId: string) => {
    updateFormData({ employeeId });
    
    // Load warning history for selected employee
    if (loadWarningHistory) {
      loadWarningHistory(employeeId);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    updateFormData({ categoryId });
  };

  // Form completion status
  const completionStatus = useMemo(() => {
    const checks = {
      employee: !!formData.employeeId,
      category: !!formData.categoryId,
      date: !!formData.incidentDate,
      time: !!formData.incidentTime,
      location: !!formData.incidentLocation && formData.incidentLocation.length >= 3,
      description: !!formData.incidentDescription && formData.incidentDescription.length >= 20
    };

    const completed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    const percentage = Math.round((completed / total) * 100);

    return { checks, completed, total, percentage };
  }, [formData]);

  return (
    <div className="space-y-3">
      {/* Progress Indicator - Mobile Optimized */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
          Progress
        </span>
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {completionStatus.completed}/{completionStatus.total}
        </span>
      </div>
      <div className="w-full rounded h-1" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div
          className="h-1 rounded transition-all duration-300"
          style={{
            width: `${completionStatus.percentage}%`,
            backgroundColor: 'var(--color-primary)'
          }}
        />
      </div>

      {/* Employee Selection */}
      <EmployeeSelector
        employees={employees}
        selectedEmployeeId={formData.employeeId}
        onEmployeeSelect={handleEmployeeSelect}
        warningHistory={warningHistory}
        isLoadingWarningHistory={isLoadingWarningHistory}
        disabled={isAnalyzing}
      />

      {/* Category Selection */}
      <CategorySelector
        categories={categories}
        selectedCategoryId={formData.categoryId}
        onCategorySelect={handleCategorySelect}
        lraRecommendation={lraRecommendation}
        disabled={isAnalyzing}
      />

      {/* Analysis Status - Progressive Steps */}
      {isAnalyzing && (
        <ThemedAlert variant="info">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span className="text-sm">
              {analysisSteps[analysisStep] || 'Analyzing incident...'}
            </span>
          </div>
        </ThemedAlert>
      )}

      {/* HR Intervention Alert - Shows when employee has final warning */}
      {lraRecommendation && !isAnalyzing && lraRecommendation.requiresHRIntervention && (
        <ThemedAlert variant="error">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-error)' }} />
            <div className="flex-1">
              <h4 className="font-semibold mb-1" style={{ color: 'var(--color-error)' }}>
                Contact HR Required
              </h4>
              <p className="text-sm mb-2" style={{ color: 'var(--color-text)' }}>
                {lraRecommendation.interventionReason}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Employee has final warning on record - HR intervention required before proceeding
              </p>
            </div>
          </div>
        </ThemedAlert>
      )}

      {/* LRA Recommendation - Enhanced Display - Shows after category selection */}
      {lraRecommendation && !isAnalyzing && !lraRecommendation.requiresHRIntervention && (
        <div className="space-y-3">
          {/* Sanction Summary Badge */}
          <div className="flex items-center gap-2">
            <ThemedBadge variant="warning" size="lg" className="font-semibold">
              ⚠️ {lraRecommendation?.isEscalation ? 'Escalated Action' : 'Recommended Sanction'}
            </ThemedBadge>
          </div>

          {/* System Recommendation Card */}
          <div className="space-y-2">
            {/* Header with Details Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Scale className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                <h3 className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                  {lraRecommendation?.isEscalation ? 'Discipline Level' : 'Severity Assessment'}
                </h3>
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

            {/* Recommendation Card */}
            <ThemedCard padding="sm" hover className="border-l-4" style={{ borderLeftColor: 'var(--color-primary)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Action Badge - CLICKABLE to override */}
                  <button
                    onClick={() => setShowOverrideSelector(!showOverrideSelector)}
                    className="transition-all hover:opacity-80 active:scale-95"
                  >
                    <ThemedBadge variant="primary" size="sm" className="font-semibold cursor-pointer">
                      {overrideLevel
                        ? (overrideLevel === 'counselling' ? 'Counselling' :
                           overrideLevel === 'verbal' ? 'Verbal' :
                           overrideLevel === 'first_written' ? 'Written' :
                           overrideLevel === 'final_written' ? 'Final Written' : overrideLevel)
                        : (lraRecommendation?.recommendedLevel === 'Counselling Session' ? 'Counselling' : safeText(lraRecommendation?.recommendedLevel))
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

                  {/* History Count - CLICKABLE */}
                  <button
                    onClick={() => setShowOverrideSelector(!showOverrideSelector)}
                    className="flex items-center gap-1 text-xs hover:opacity-80 active:scale-95 transition-all"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}></div>
                    <span className="font-medium" style={{ color: 'var(--color-primary)' }}>{lraRecommendation?.categoryWarningCount ?? 0}</span>
                    <span>previous</span>
                  </button>
                </div>
              </div>

              {/* Natural Explanation */}
              <div className="mt-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {lraRecommendation?.isEscalation
                    ? `Based on ${lraRecommendation.categoryWarningCount ?? 0} previous incident${(lraRecommendation.categoryWarningCount ?? 0) === 1 ? '' : 's'}, escalating to maintain consistent discipline standards.`
                    : 'No prior incidents in this category. Starting with a supportive, corrective approach.'
                  }
                </p>
              </div>
            </ThemedCard>
          </div>

          {/* Expandable Details */}
          {showDetails && (
            <ThemedCard padding="sm" className="border" style={{ backgroundColor: 'var(--color-alert-info-bg)', borderColor: 'var(--color-alert-info-border)' }}>
              <div className="space-y-3">
                {/* Analysis Summary */}
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
                    <h4 className="font-medium text-xs" style={{ color: 'var(--color-text)' }}>Warning History (This Category)</h4>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Employee has <strong>{lraRecommendation?.categoryWarningCount ?? 0}</strong> active warning(s) in this category.
                  </div>
                </div>
              </div>
            </ThemedCard>
          )}

          {/* Override Warning Level Selector */}
          {showOverrideSelector && setOverrideLevel && (
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
                        You may override this based on specific circumstances.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOverrideSelector(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
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
                  >
                    <option value="counselling">Counselling Session</option>
                    <option value="verbal">Verbal Warning</option>
                    <option value="first_written">Written Warning</option>
                    <option value="final_written">Final Written Warning</option>
                  </select>
                </div>

                {overrideLevel && overrideLevel !== lraRecommendation?.suggestedLevel && (
                  <ThemedAlert variant="warning">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p className="text-xs">
                        You are overriding the system recommendation. Ensure this is justified and documented.
                      </p>
                    </div>
                  </ThemedAlert>
                )}
              </div>
            </ThemedCard>
          )}
        </div>
      )}

      {/* Incident Details Form - After seeing recommendation, capture the details */}
      <IncidentDetailsForm
        formData={formData}
        onFormDataChange={updateFormData}
        disabled={isAnalyzing}
      />

      {/* Ready for Next Step - Simplified */}
      {completionStatus.percentage === 100 && !isAnalyzing && (
        <ThemedAlert variant="info">
          <div className="flex items-start gap-3">
            <ChevronRight className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
            <div className="flex-1">
              <h4 className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                Ready for Legal Review
              </h4>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                All details completed. Click "Next" to proceed.
              </p>
            </div>
          </div>
        </ThemedAlert>
      )}
    </div>
  );
};