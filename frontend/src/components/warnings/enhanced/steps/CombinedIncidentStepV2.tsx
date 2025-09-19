// frontend/src/components/warnings/enhanced/steps/CombinedIncidentStepV2.tsx
// 🎯 COMBINED INCIDENT STEP V2 - REFACTORED WITH FOCUSED COMPONENTS
// ✅ Split into focused, reusable components for better maintainability
// ✅ Auto-save functionality, real-time validation, mobile-first design
// ✅ Memory leak fixes, performance optimizations

import React, { useMemo } from 'react';
import type { 
  EscalationRecommendation,
  EmployeeWithContext,
  WarningCategory,
  EnhancedWarningFormData
} from '../../../../services/WarningService';

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
    <div className="space-y-8 pb-8">
      {/* Progress Indicator */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900">Form Completion</h4>
          <span className="text-sm font-medium text-blue-600">
            {completionStatus.completed}/{completionStatus.total} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionStatus.percentage}%` }}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3 text-xs">
          {Object.entries(completionStatus.checks).map(([key, completed]) => (
            <div key={key} className={`flex items-center gap-1 ${completed ? 'text-green-600' : 'text-gray-500'}`}>
              <div className={`w-2 h-2 rounded-full ${completed ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="capitalize">{key}</span>
            </div>
          ))}
        </div>
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

      {/* Analysis Status */}
      {isAnalyzing && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <div>
              <h4 className="font-medium text-purple-900">Analyzing Incident</h4>
              <p className="text-sm text-purple-700">
                Generating LRA-compliant recommendation based on employee history and incident details...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* LRA Recommendation Preview */}
      {lraRecommendation && !isAnalyzing && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-green-900 mb-1">
                LRA Analysis Complete
              </h4>
              <p className="text-sm text-green-700 mb-2">
                Recommended action: <span className="font-medium">{lraRecommendation.recommendedLevel}</span>
                {lraRecommendation.isEscalation && (
                  <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                    Escalation Required
                  </span>
                )}
              </p>
              <p className="text-sm text-green-600">
                {lraRecommendation.reason}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps Hint */}
      {completionStatus.percentage === 100 && !isAnalyzing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Ready for Next Step</h4>
              <p className="text-sm text-blue-700">
                All incident details have been completed. Click "Next" to proceed to legal review and signatures.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};