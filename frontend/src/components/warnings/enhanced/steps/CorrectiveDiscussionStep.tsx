// frontend/src/components/warnings/enhanced/steps/CorrectiveDiscussionStep.tsx
// 🎯 CORRECTIVE DISCUSSION & ACTION PLAN STEP
// ✅ Captures corrective counselling elements within warning workflow
// ✅ Uses unified theming with CSS variables and ThemedCard/ThemedButton system
// ✅ Samsung S8+ mobile optimization with proper touch targets
// ✅ Conditional logic based on warning level (Verbal/Written vs Final/Dismissal)
// ✅ Dynamic action commitments list with add/remove functionality

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MessageSquare,
  ClipboardList,
  FileText,
  User,
  Target,
  Calendar,
  Plus,
  X,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  Package,
  Info,
  Scale,
  TrendingUp,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

// Import unified theming components
import { ThemedCard } from '../../../common/ThemedCard';
import { ThemedButton } from '../../../common/ThemedButton';
import { ThemedBadge } from '../../../common/ThemedCard';
import { ThemedAlert } from '../../../common/ThemedCard';
import { ThemedSectionHeader } from '../../../common/ThemedCard';

// Import types
import type { WarningLevel } from '../../../../types/core';

// ============================================
// INTERFACES
// ============================================

export interface ActionCommitment {
  id: string;
  commitment: string;
  timeline: string;
}

export interface CorrectiveDiscussionData {
  employeeStatement: string;
  expectedBehavior: string;
  factsAndReasoning: string;
  actionCommitments: ActionCommitment[];
  reviewDate: string;
  interventionDetails?: string;
  resourcesProvided?: string[];
}

interface CorrectiveDiscussionStepProps {
  warningLevel: WarningLevel;
  currentData?: CorrectiveDiscussionData;
  onDataChange: (data: CorrectiveDiscussionData) => void;
  onValidationChange?: (isValid: boolean) => void;
  issueDate?: string;
  validityPeriod?: 3 | 6 | 12;
  onIssueDateChange?: (date: string) => void;
  onValidityPeriodChange?: (months: 3 | 6 | 12) => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get warning level display info
 */
const getWarningLevelInfo = (level: WarningLevel): { label: string; color: string; requiresCommitments: boolean } => {
  const levelMap: Record<WarningLevel, { label: string; color: string; requiresCommitments: boolean }> = {
    'counselling': { label: 'Counselling', color: '#0ea5e9', requiresCommitments: true },
    'verbal': { label: 'Verbal', color: '#f59e0b', requiresCommitments: true },
    'first_written': { label: 'Written', color: '#f97316', requiresCommitments: true },
    'second_written': { label: 'Second Written', color: '#f97316', requiresCommitments: true },
    'final_written': { label: 'Final Written', color: '#ef4444', requiresCommitments: false },
    'suspension': { label: 'Suspension', color: '#dc2626', requiresCommitments: false },
    'dismissal': { label: 'Ending of Service', color: '#991b1b', requiresCommitments: false }
  };
  return levelMap[level] || { label: level, color: '#6b7280', requiresCommitments: true };
};

/**
 * Generate unique ID for action commitments
 */
const generateId = (): string => {
  return `commitment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get minimum review date (tomorrow)
 */
const getMinReviewDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

// ============================================
// MAIN COMPONENT
// ============================================

export const CorrectiveDiscussionStep: React.FC<CorrectiveDiscussionStepProps> = ({
  warningLevel,
  currentData,
  onDataChange,
  onValidationChange,
  issueDate,
  validityPeriod = 6,
  onIssueDateChange,
  onValidityPeriodChange
}) => {

  // ============================================
  // STATE
  // ============================================

  const [formData, setFormData] = useState<CorrectiveDiscussionData>(() => ({
    employeeStatement: currentData?.employeeStatement || '',
    expectedBehavior: currentData?.expectedBehavior || '',
    factsAndReasoning: currentData?.factsAndReasoning || '',
    actionCommitments: currentData?.actionCommitments || [],
    reviewDate: currentData?.reviewDate || '',
    interventionDetails: currentData?.interventionDetails || '',
    resourcesProvided: currentData?.resourcesProvided || []
  }));

  const [resourceInput, setResourceInput] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Get level info for conditional rendering
  const levelInfo = useMemo(() => getWarningLevelInfo(warningLevel), [warningLevel]);

  // Collapsible sections state - default collapsed for Final warnings
  const [isEmployeeStatementCollapsed, setIsEmployeeStatementCollapsed] = useState(!levelInfo.requiresCommitments);
  const [isImprovementCommitmentsCollapsed, setIsImprovementCommitmentsCollapsed] = useState(!levelInfo.requiresCommitments);

  // ============================================
  // VALIDATION
  // ============================================

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    // Employee statement - required for Counselling/Verbal/Written, optional for Final/Dismissal
    if (levelInfo.requiresCommitments && (!formData.employeeStatement || formData.employeeStatement.trim().length < 20)) {
      errors.employeeStatement = 'Employee statement required (min 20 characters)';
      isValid = false;
    }

    // Expected behavior - always required
    if (!formData.expectedBehavior || formData.expectedBehavior.trim().length < 20) {
      errors.expectedBehavior = 'Expected behavior required (min 20 characters)';
      isValid = false;
    }

    // Facts and reasoning - always required
    if (!formData.factsAndReasoning || formData.factsAndReasoning.trim().length < 20) {
      errors.factsAndReasoning = 'Facts and reasoning required (min 20 characters)';
      isValid = false;
    }

    // Action commitments - required for Counselling/Verbal/Written
    if (levelInfo.requiresCommitments && formData.actionCommitments.length === 0) {
      errors.actionCommitments = 'At least 1 improvement commitment required';
      isValid = false;
    }

    // Validate each commitment
    formData.actionCommitments.forEach((commitment, index) => {
      if (!commitment.commitment || commitment.commitment.trim().length < 10) {
        errors[`commitment_${index}`] = 'Commitment text required (min 10 characters)';
        isValid = false;
      }
      if (!commitment.timeline || commitment.timeline.trim().length < 3) {
        errors[`timeline_${index}`] = 'Timeline required (e.g., "Within 2 weeks")';
        isValid = false;
      }
    });

    // Review date - required for Counselling/Verbal/Written
    if (levelInfo.requiresCommitments && !formData.reviewDate) {
      errors.reviewDate = 'Follow-up review date required';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  }, [formData, levelInfo]);

  // ============================================
  // EFFECTS
  // ============================================

  // Validate and notify parent on data change
  useEffect(() => {
    const isValid = validateForm();
    onValidationChange?.(isValid);
    onDataChange(formData);
  }, [formData, validateForm, onDataChange, onValidationChange]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleFieldChange = useCallback((field: keyof CorrectiveDiscussionData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleAddCommitment = useCallback(() => {
    const newCommitment: ActionCommitment = {
      id: generateId(),
      commitment: '',
      timeline: ''
    };
    setFormData(prev => ({
      ...prev,
      actionCommitments: [...prev.actionCommitments, newCommitment]
    }));
  }, []);

  const handleRemoveCommitment = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      actionCommitments: prev.actionCommitments.filter(c => c.id !== id)
    }));
  }, []);

  const handleCommitmentChange = useCallback((id: string, field: 'commitment' | 'timeline', value: string) => {
    setFormData(prev => ({
      ...prev,
      actionCommitments: prev.actionCommitments.map(c =>
        c.id === id ? { ...c, [field]: value } : c
      )
    }));
  }, []);

  const handleAddResource = useCallback(() => {
    if (resourceInput.trim()) {
      setFormData(prev => ({
        ...prev,
        resourcesProvided: [...(prev.resourcesProvided || []), resourceInput.trim()]
      }));
      setResourceInput('');
    }
  }, [resourceInput]);

  const handleRemoveResource = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      resourcesProvided: (prev.resourcesProvided || []).filter((_, i) => i !== index)
    }));
  }, []);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-4">

      {/* Header */}
      <ThemedCard padding="md">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Meeting Documentation
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              Record the discussion details and improvement commitments
            </p>
          </div>
        </div>
      </ThemedCard>

      {/* Section B: Employee's Statement */}
      <ThemedCard padding="md">
        {/* Collapsible Header */}
        <div
          onClick={() => setIsEmployeeStatementCollapsed(!isEmployeeStatementCollapsed)}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isEmployeeStatementCollapsed ? (
                <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              ) : (
                <ChevronDown className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              )}
              <User className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              <div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Employee Statement
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Section B: The employee's side of the story and response
                </p>
              </div>
            </div>
            {levelInfo.requiresCommitments ? (
              <span className="text-xs font-medium" style={{ color: '#ef4444' }}>Required</span>
            ) : (
              <span className="text-xs font-medium" style={{ color: '#6b7280' }}>Optional</span>
            )}
          </div>
        </div>

        {/* Helper text when collapsed for Final warnings */}
        {isEmployeeStatementCollapsed && !levelInfo.requiresCommitments && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-alert-info-bg)', border: '1px solid var(--color-alert-info-border)' }}>
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-alert-info-text)' }} />
            <div className="text-sm" style={{ color: 'var(--color-alert-info-text)' }}>
              <strong>For {levelInfo.label} warnings,</strong> employee statement is optional. Focus on documenting facts and expected standards. Click to expand if you need to record their statement.
            </div>
          </div>
        )}

        {/* Form fields - shown when expanded */}
        {!isEmployeeStatementCollapsed && (
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                Employee Statement
              </label>
            </div>

            <textarea
              value={formData.employeeStatement}
              onChange={(e) => handleFieldChange('employeeStatement', e.target.value)}
              placeholder={levelInfo.requiresCommitments
                ? "Document the employee's explanation of what happened and their response to the incident..."
                : "If the employee provides a statement, document it here (optional for serious warnings)..."
              }
              rows={5}
              className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: validationErrors.employeeStatement ? '#ef4444' : 'var(--color-border)',
                color: 'var(--color-text-primary)',
                minHeight: '44px'
              }}
            />

            {validationErrors.employeeStatement && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: '#ef4444' }}>
                <AlertTriangle className="w-3 h-3" />
                <span>{validationErrors.employeeStatement}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              <span>Character count: {formData.employeeStatement.trim().length}</span>
              {formData.employeeStatement.trim().length >= 20 && (
                <CheckCircle className="w-3 h-3" style={{ color: '#10b981' }} />
              )}
            </div>
          </div>
        )}
      </ThemedCard>

      {/* Section C: Expected Behavior & Standards */}
      <ThemedCard padding="md">
        <ThemedSectionHeader
          icon={Target}
          title="Expected Behavior Standards"
          subtitle="Section C: Clearly explain what correct behavior or performance is expected"
          className="mb-4"
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
              Expected Standards
            </label>
            <span className="text-xs font-medium" style={{ color: '#ef4444' }}>Required</span>
          </div>

          <textarea
            value={formData.expectedBehavior}
            onChange={(e) => handleFieldChange('expectedBehavior', e.target.value)}
            placeholder="Clearly describe the expected behavior, performance standards, and company policies that should be followed going forward..."
            rows={5}
            className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--color-background)',
              borderColor: validationErrors.expectedBehavior ? '#ef4444' : 'var(--color-border)',
              color: 'var(--color-text-primary)',
              minHeight: '44px'
            }}
          />

          {validationErrors.expectedBehavior && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#ef4444' }}>
              <AlertTriangle className="w-3 h-3" />
              <span>{validationErrors.expectedBehavior}</span>
            </div>
          )}

          {/* Helper Text */}
          <div className="flex items-start gap-1.5 text-xs p-2 rounded" style={{ backgroundColor: 'var(--color-alert-info-bg)', color: 'var(--color-alert-info-text)' }}>
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>
              <strong>Tip:</strong> Clearly state what the employee should do instead. Reference specific company policies, performance standards, or behavioral expectations they must follow going forward.
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            <span>Character count: {formData.expectedBehavior.trim().length}</span>
            {formData.expectedBehavior.trim().length >= 20 && (
              <CheckCircle className="w-3 h-3" style={{ color: '#10b981' }} />
            )}
          </div>
        </div>
      </ThemedCard>

      {/* Section E: Facts & Reasoning */}
      <ThemedCard padding="md">
        <ThemedSectionHeader
          icon={Scale}
          title="Decision Reasoning"
          subtitle="Section E: Explain why this warning level is appropriate based on the facts"
          className="mb-4"
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
              Facts & Decision Rationale
            </label>
            <span className="text-xs font-medium" style={{ color: '#ef4444' }}>Required</span>
          </div>

          <textarea
            value={formData.factsAndReasoning}
            onChange={(e) => handleFieldChange('factsAndReasoning', e.target.value)}
            placeholder="Explain WHY this warning level is appropriate: What policies were violated? Why was this incident serious? What aggravating or mitigating factors did you consider? How does the employee's history affect this decision?"
            rows={5}
            className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--color-background)',
              borderColor: validationErrors.factsAndReasoning ? '#ef4444' : 'var(--color-border)',
              color: 'var(--color-text-primary)',
              minHeight: '44px'
            }}
          />

          {validationErrors.factsAndReasoning && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#ef4444' }}>
              <AlertTriangle className="w-3 h-3" />
              <span>{validationErrors.factsAndReasoning}</span>
            </div>
          )}

          {/* Helper Text */}
          <div className="flex items-start gap-1.5 text-xs p-2 rounded" style={{ backgroundColor: 'var(--color-alert-info-bg)', color: 'var(--color-alert-info-text)' }}>
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>
              <strong>Tip:</strong> This is different from describing what happened (Step 0). Here, explain your reasoning for choosing this warning level based on the incident severity, company policy, and employee history.
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            <span>Character count: {formData.factsAndReasoning.trim().length}</span>
            {formData.factsAndReasoning.trim().length >= 20 && (
              <CheckCircle className="w-3 h-3" style={{ color: '#10b981' }} />
            )}
          </div>
        </div>
      </ThemedCard>

      {/* Section F: Improvement Commitments */}
      <ThemedCard padding="md">
        {/* Collapsible Header */}
        <div
          onClick={() => setIsImprovementCommitmentsCollapsed(!isImprovementCommitmentsCollapsed)}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isImprovementCommitmentsCollapsed ? (
                <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              ) : (
                <ChevronDown className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              )}
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              <div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Improvement Commitments
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Section F: Specific actions the employee commits to take
                </p>
              </div>
            </div>
            {levelInfo.requiresCommitments ? (
              <span className="text-xs font-medium" style={{ color: '#ef4444' }}>Required</span>
            ) : (
              <span className="text-xs font-medium" style={{ color: '#6b7280' }}>Optional</span>
            )}
          </div>
        </div>

        {/* Helper text when collapsed for Final warnings */}
        {isImprovementCommitmentsCollapsed && !levelInfo.requiresCommitments && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-alert-info-bg)', border: '1px solid var(--color-alert-info-border)' }}>
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-alert-info-text)' }} />
            <div className="text-sm" style={{ color: 'var(--color-alert-info-text)' }}>
              <strong>For {levelInfo.label} warnings,</strong> improvement commitments are optional. Focus on documenting facts and expected standards. Click to expand if you need to record commitments.
            </div>
          </div>
        )}

        {/* Form fields - shown when expanded */}
        {!isImprovementCommitmentsCollapsed && (
          <div className="space-y-3 mt-4">
            {formData.actionCommitments.length === 0 ? (
              <ThemedAlert variant="warning" className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <strong>No Commitments Added:</strong> Add at least one improvement commitment with a timeline.
                </div>
              </ThemedAlert>
            ) : (
              <div className="space-y-3">
                {formData.actionCommitments.map((commitment, index) => (
                  <div
                    key={commitment.id}
                    className="p-3 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      borderColor: 'var(--color-border)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                        Commitment {index + 1}
                      </span>
                      <button
                        onClick={() => handleRemoveCommitment(commitment.id)}
                        className="p-1 rounded hover:bg-red-50 transition-colors"
                        title="Remove commitment"
                      >
                        <X className="w-4 h-4" style={{ color: '#ef4444' }} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {/* Commitment Text */}
                      <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                          Action/Commitment
                        </label>
                        <input
                          type="text"
                          value={commitment.commitment}
                          onChange={(e) => handleCommitmentChange(commitment.id, 'commitment', e.target.value)}
                          placeholder="e.g., Attend time management training and improve punctuality"
                          className="w-full px-3 py-2 rounded border transition-all focus:outline-none focus:ring-2"
                          style={{
                            backgroundColor: 'var(--color-background)',
                            borderColor: validationErrors[`commitment_${index}`] ? '#ef4444' : 'var(--color-border)',
                            color: 'var(--color-text-primary)',
                            minHeight: '44px'
                          }}
                        />
                        {validationErrors[`commitment_${index}`] && (
                          <div className="flex items-center gap-1.5 text-xs mt-1" style={{ color: '#ef4444' }}>
                            <AlertTriangle className="w-3 h-3" />
                            <span>{validationErrors[`commitment_${index}`]}</span>
                          </div>
                        )}
                      </div>

                      {/* Timeline */}
                      <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                          Timeline/Deadline
                        </label>
                        <input
                          type="text"
                          value={commitment.timeline}
                          onChange={(e) => handleCommitmentChange(commitment.id, 'timeline', e.target.value)}
                          placeholder="e.g., Within 2 weeks, By end of month"
                          className="w-full px-3 py-2 rounded border transition-all focus:outline-none focus:ring-2"
                          style={{
                            backgroundColor: 'var(--color-background)',
                            borderColor: validationErrors[`timeline_${index}`] ? '#ef4444' : 'var(--color-border)',
                            color: 'var(--color-text-primary)',
                            minHeight: '44px'
                          }}
                        />
                        {validationErrors[`timeline_${index}`] && (
                          <div className="flex items-center gap-1.5 text-xs mt-1" style={{ color: '#ef4444' }}>
                            <AlertTriangle className="w-3 h-3" />
                            <span>{validationErrors[`timeline_${index}`]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Commitment Button */}
            <ThemedButton
              variant="outline"
              onClick={handleAddCommitment}
              className="w-full"
              icon={Plus}
            >
              Add Improvement Commitment
            </ThemedButton>
          </div>
        )}
      </ThemedCard>

      {/* Follow-up Review Date */}
      {levelInfo.requiresCommitments && (
        <ThemedCard padding="md">
          <ThemedSectionHeader
            icon={Calendar}
            title="Follow-up Review Date"
            subtitle="When will progress on these commitments be reviewed?"
            className="mb-4"
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                Review Date
              </label>
              <span className="text-xs font-medium" style={{ color: '#ef4444' }}>Required</span>
            </div>

            <input
              type="date"
              value={formData.reviewDate}
              onChange={(e) => handleFieldChange('reviewDate', e.target.value)}
              min={getMinReviewDate()}
              className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: validationErrors.reviewDate ? '#ef4444' : 'var(--color-border)',
                color: 'var(--color-text-primary)',
                minHeight: '44px'
              }}
            />

            {validationErrors.reviewDate && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: '#ef4444' }}>
                <AlertTriangle className="w-3 h-3" />
                <span>{validationErrors.reviewDate}</span>
              </div>
            )}

            <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Select a date when you will meet with the employee to review their progress on the improvement commitments.
            </div>
          </div>
        </ThemedCard>
      )}

      {/* Optional: Training/Coaching Provided */}
      <ThemedCard padding="md">
        <ThemedSectionHeader
          icon={BookOpen}
          title="Training/Coaching Provided (Optional)"
          subtitle="Describe any support provided during this discussion"
          className="mb-4"
        />

        <div className="space-y-2">
          <textarea
            value={formData.interventionDetails || ''}
            onChange={(e) => handleFieldChange('interventionDetails', e.target.value)}
            placeholder="Describe any training, coaching, mentoring, or other support provided to help the employee improve (optional)..."
            rows={4}
            className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--color-background)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
              minHeight: '44px'
            }}
          />

          <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Examples: Job shadowing arrangement, additional training scheduled, coaching sessions planned, etc.
          </div>
        </div>
      </ThemedCard>

      {/* Optional: Resources Provided */}
      <ThemedCard padding="md">
        <ThemedSectionHeader
          icon={Package}
          title="Resources Provided (Optional)"
          subtitle="List any tools, documents, or resources given"
          className="mb-4"
        />

        <div className="space-y-2">
          {/* Resource Tags */}
          {formData.resourcesProvided && formData.resourcesProvided.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.resourcesProvided.map((resource, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)'
                  }}
                >
                  {resource}
                  <button
                    onClick={() => handleRemoveResource(index)}
                    className="hover:opacity-70 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add Resource Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={resourceInput}
              onChange={(e) => setResourceInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddResource();
                }
              }}
              placeholder="e.g., Company policy handbook, Training manual"
              className="flex-1 px-3 py-2 rounded border transition-all focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
                minHeight: '44px'
              }}
            />
            <ThemedButton
              variant="outline"
              onClick={handleAddResource}
              icon={Plus}
              disabled={!resourceInput.trim()}
            >
              Add
            </ThemedButton>
          </div>

          <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Press Enter or click Add to include a resource. Examples: Policy documents, job aids, reference materials, etc.
          </div>
        </div>
      </ThemedCard>

      {/* Warning Parameters Section */}
      <ThemedCard padding="md">
        <ThemedSectionHeader
          icon={Calendar}
          title="Warning Parameters"
          subtitle="Set the issue date and validity period for this warning"
          className="mb-4"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Issue Date */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
              Issue Date
            </label>
            <input
              type="date"
              value={issueDate || new Date().toISOString().split('T')[0]}
              onChange={(e) => onIssueDateChange?.(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
                minHeight: '44px'
              }}
            />
          </div>

          {/* Validity Period */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
              Validity Period
            </label>
            <select
              value={validityPeriod}
              onChange={(e) => onValidityPeriodChange?.(parseInt(e.target.value) as 3 | 6 | 12)}
              className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
                minHeight: '44px'
              }}
            >
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
            </select>
          </div>
        </div>
      </ThemedCard>

    </div>
  );
};
