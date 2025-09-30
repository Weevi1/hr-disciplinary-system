// frontend/src/components/warnings/enhanced/steps/CombinedIncidentStepV2.tsx
// 🎯 UNIFIED COMBINED INCIDENT STEP V2 - REFACTORED WITH THEMED COMPONENTS
// ✅ Unified theming with CSS variables and ThemedCard/ThemedButton system
// ✅ Samsung S8+ mobile optimization with proper touch targets
// ✅ Auto-save functionality, real-time validation, mobile-first design
// ✅ Memory leak fixes, performance optimizations

import React, { useMemo } from 'react';
import { CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';
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
  isAnalyzing = false
}) => {

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

      {/* Incident Details Form */}
      <IncidentDetailsForm
        formData={formData}
        onFormDataChange={updateFormData}
        disabled={isAnalyzing}
      />

      {/* Analysis Status - Simplified */}
      {isAnalyzing && (
        <ThemedAlert variant="info">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span className="text-sm">Analyzing incident...</span>
          </div>
        </ThemedAlert>
      )}

      {/* HR Intervention Alert - Simplified */}
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

      {/* LRA Recommendation - Simplified */}
      {lraRecommendation && !isAnalyzing && !lraRecommendation.requiresHRIntervention && (
        <ThemedAlert variant="success">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} />
            <div className="flex-1">
              <h4 className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                Recommended: {lraRecommendation.recommendedLevel}
              </h4>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {lraRecommendation.reason}
              </p>
            </div>
          </div>
        </ThemedAlert>
      )}

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