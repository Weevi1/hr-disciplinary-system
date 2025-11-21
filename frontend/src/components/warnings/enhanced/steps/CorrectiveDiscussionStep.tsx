// frontend/src/components/warnings/enhanced/steps/CorrectiveDiscussionStep.tsx
// 🎯 CORRECTIVE DISCUSSION & ACTION PLAN STEP - PHASED UX
// ✅ Shows one section at a time to reduce cognitive overload
// ✅ Progress indicator with phase navigation
// ✅ Contextual guidance for each phase
// ✅ Summary review at the end
// ✅ Preserves all fields and validation from original

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MessageSquare,
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
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Check
} from 'lucide-react';

// Import unified theming components
import { ThemedCard } from '../../../common/ThemedCard';
import { ThemedButton } from '../../../common/ThemedButton';
import { ThemedAlert } from '../../../common/ThemedCard';

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
  onPhasesComplete?: (complete: boolean) => void; // Notify parent when all phases reviewed
  issueDate?: string;
  validityPeriod?: 3 | 6 | 12;
  onIssueDateChange?: (date: string) => void;
  onValidityPeriodChange?: (months: 3 | 6 | 12) => void;
}

// Phase definitions
enum Phase {
  EMPLOYEE_RESPONSE = 0,
  EXPECTED_STANDARDS = 1,
  IMPROVEMENT_PLAN = 2,
  SUPPORT_PARAMETERS = 3,
  REVIEW = 4
}

const PHASE_INFO = [
  { title: "Employee's Response", icon: User, section: 'B' },
  { title: 'Expected Standards', icon: Target, section: 'C' },
  { title: 'Improvement Plan', icon: TrendingUp, section: 'F' },
  { title: 'Support & Parameters', icon: BookOpen, section: '' },
  { title: 'Review & Confirm', icon: Check, section: '' }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

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

const generateId = (): string => {
  return `commitment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

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
  onPhasesComplete,
  issueDate,
  validityPeriod = 6,
  onIssueDateChange,
  onValidityPeriodChange
}) => {

  // ============================================
  // STATE
  // ============================================

  const [currentPhase, setCurrentPhase] = useState<Phase>(Phase.EMPLOYEE_RESPONSE);

  const [formData, setFormData] = useState<CorrectiveDiscussionData>(() => ({
    employeeStatement: currentData?.employeeStatement || '',
    expectedBehavior: currentData?.expectedBehavior || '',
    actionCommitments: currentData?.actionCommitments || [],
    reviewDate: currentData?.reviewDate || '',
    interventionDetails: currentData?.interventionDetails || '',
    resourcesProvided: currentData?.resourcesProvided || []
  }));

  const [resourceInput, setResourceInput] = useState('');
  const [phaseErrors, setPhaseErrors] = useState<Record<number, string[]>>({});

  // Get level info for conditional rendering
  const levelInfo = useMemo(() => getWarningLevelInfo(warningLevel), [warningLevel]);

  // ============================================
  // VALIDATION
  // ============================================

  const validatePhase = useCallback((phase: Phase): string[] => {
    const errors: string[] = [];

    switch (phase) {
      case Phase.EMPLOYEE_RESPONSE:
        if (levelInfo.requiresCommitments && formData.employeeStatement.trim().length < 20) {
          errors.push('Add more detail about what the employee said (min 20 characters)');
        }
        break;

      case Phase.EXPECTED_STANDARDS:
        if (formData.expectedBehavior.trim().length < 20) {
          errors.push('Add more detail about expected standards (min 20 characters)');
        }
        break;

      case Phase.IMPROVEMENT_PLAN:
        if (levelInfo.requiresCommitments) {
          if (formData.actionCommitments.length === 0) {
            errors.push('Add at least one improvement commitment');
          } else {
            formData.actionCommitments.forEach((c, i) => {
              if (c.commitment.trim().length < 10) {
                errors.push(`Commitment ${i + 1}: Add more detail (min 10 characters)`);
              }
              if (c.timeline.trim().length < 3) {
                errors.push(`Commitment ${i + 1}: Add a timeline`);
              }
            });
          }
          if (!formData.reviewDate) {
            errors.push('Select a follow-up review date');
          }
        }
        break;
    }

    return errors;
  }, [formData, levelInfo]);

  const validateAllPhases = useCallback((): boolean => {
    let isValid = true;
    const allErrors: Record<number, string[]> = {};

    for (let phase = 0; phase < Phase.REVIEW; phase++) {
      const errors = validatePhase(phase);
      if (errors.length > 0) {
        allErrors[phase] = errors;
        isValid = false;
      }
    }

    setPhaseErrors(allErrors);
    return isValid;
  }, [validatePhase]);

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    const isValid = validateAllPhases();
    onValidationChange?.(isValid);
    onDataChange(formData);
  }, [formData, validateAllPhases, onDataChange, onValidationChange]);

  // Notify parent when user reaches Review phase (enables Next button)
  useEffect(() => {
    onPhasesComplete?.(currentPhase === Phase.REVIEW);
  }, [currentPhase, onPhasesComplete]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleFieldChange = useCallback((field: keyof CorrectiveDiscussionData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const handleNextPhase = useCallback(() => {
    const errors = validatePhase(currentPhase);
    if (errors.length > 0 && currentPhase !== Phase.EMPLOYEE_RESPONSE && currentPhase !== Phase.IMPROVEMENT_PLAN) {
      // Show errors but don't block for optional phases
      setPhaseErrors(prev => ({ ...prev, [currentPhase]: errors }));
    }

    // Allow skipping optional phases for Final warnings
    if (!levelInfo.requiresCommitments && (currentPhase === Phase.EMPLOYEE_RESPONSE || currentPhase === Phase.IMPROVEMENT_PLAN)) {
      setCurrentPhase(prev => prev + 1);
      return;
    }

    // For required phases, only advance if valid
    if (errors.length === 0 || currentPhase === Phase.SUPPORT_PARAMETERS) {
      setCurrentPhase(prev => prev + 1);
    } else {
      setPhaseErrors(prev => ({ ...prev, [currentPhase]: errors }));
    }
  }, [currentPhase, validatePhase, levelInfo]);

  const handlePrevPhase = useCallback(() => {
    setCurrentPhase(prev => Math.max(0, prev - 1));
  }, []);

  const goToPhase = useCallback((phase: Phase) => {
    setCurrentPhase(phase);
  }, []);

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderProgressDots = () => (
    <div className="flex items-center justify-center gap-2 mb-4">
      {PHASE_INFO.map((info, index) => (
        <button
          key={index}
          onClick={() => goToPhase(index)}
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            index === currentPhase
              ? 'w-6 bg-primary'
              : index < currentPhase
                ? 'bg-green-500'
                : 'bg-gray-300'
          }`}
          style={{
            backgroundColor: index === currentPhase
              ? 'var(--color-primary)'
              : index < currentPhase
                ? '#10b981'
                : '#d1d5db'
          }}
          title={info.title}
        />
      ))}
    </div>
  );

  const renderPhaseHeader = () => {
    const info = PHASE_INFO[currentPhase];
    const Icon = info.icon;

    return (
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
             style={{ backgroundColor: 'var(--color-primary-light)' }}>
          <Icon className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
        </div>
        <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {info.title}
        </h3>
        {info.section && (
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            Section {info.section}
          </p>
        )}
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Phase {currentPhase + 1} of {PHASE_INFO.length}
        </p>
      </div>
    );
  };

  const renderCharacterCount = (text: string, min: number) => (
    <div className="flex items-center gap-1.5 text-xs mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
      <span>{text.trim().length}/{min} characters</span>
      {text.trim().length >= min && (
        <CheckCircle className="w-3 h-3" style={{ color: '#10b981' }} />
      )}
    </div>
  );

  // ============================================
  // PHASE RENDERS
  // ============================================

  const renderPhase0_EmployeeResponse = () => (
    <div className="space-y-4">
      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-alert-info-bg)' }}>
        <p className="text-sm" style={{ color: 'var(--color-alert-info-text)' }}>
          <strong>What to ask:</strong> "What is your version of what happened?"
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Record the employee's response in their own words. This demonstrates they were given a fair hearing.
        </p>
      </div>

      {!levelInfo.requiresCommitments && (
        <ThemedAlert variant="info">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="text-sm">
              For {levelInfo.label} warnings, this section is optional. You can skip if preferred.
            </span>
          </div>
        </ThemedAlert>
      )}

      <textarea
        value={formData.employeeStatement}
        onChange={(e) => handleFieldChange('employeeStatement', e.target.value)}
        placeholder="The employee stated that..."
        rows={6}
        className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2"
        style={{
          backgroundColor: 'var(--color-background)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-primary)',
          minHeight: '120px'
        }}
        autoFocus
      />

      {renderCharacterCount(formData.employeeStatement, 20)}

      <div className="text-xs p-3 rounded" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-secondary)' }}>
        <strong>Example:</strong> "The employee stated that they were unaware of the policy change and believed they were following the correct procedure. They acknowledged the incident occurred but felt the circumstances were misunderstood."
      </div>
    </div>
  );

  const renderPhase1_ExpectedStandards = () => (
    <div className="space-y-4">
      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-alert-info-bg)' }}>
        <p className="text-sm" style={{ color: 'var(--color-alert-info-text)' }}>
          <strong>What to explain:</strong> "Here is what should happen instead..."
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Clearly state the expected behavior, performance standards, or policies that must be followed.
        </p>
      </div>

      <textarea
        value={formData.expectedBehavior}
        onChange={(e) => handleFieldChange('expectedBehavior', e.target.value)}
        placeholder="The expected standard is..."
        rows={6}
        className="w-full px-4 py-3 rounded-lg border transition-all focus:outline-none focus:ring-2"
        style={{
          backgroundColor: 'var(--color-background)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-primary)',
          minHeight: '120px'
        }}
        autoFocus
      />

      {renderCharacterCount(formData.expectedBehavior, 20)}

      <div className="text-xs p-3 rounded" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-secondary)' }}>
        <strong>Example:</strong> "Employees are expected to arrive at work by 8:00 AM as per company policy. Any anticipated late arrival must be communicated to the supervisor at least 30 minutes before the start of shift."
      </div>
    </div>
  );

  const renderPhase2_ImprovementPlan = () => (
    <div className="space-y-4">
      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-alert-info-bg)' }}>
        <p className="text-sm" style={{ color: 'var(--color-alert-info-text)' }}>
          <strong>What to agree:</strong> "What will you commit to doing to improve?"
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          Record specific, measurable actions the employee commits to, with timelines.
        </p>
      </div>

      {!levelInfo.requiresCommitments && (
        <ThemedAlert variant="info">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="text-sm">
              For {levelInfo.label} warnings, improvement commitments are optional. You can skip if preferred.
            </span>
          </div>
        </ThemedAlert>
      )}

      {/* Commitments List */}
      {formData.actionCommitments.length > 0 && (
        <div className="space-y-3">
          {formData.actionCommitments.map((commitment, index) => (
            <div key={commitment.id} className="p-3 rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  Commitment {index + 1}
                </span>
                <button
                  onClick={() => handleRemoveCommitment(commitment.id)}
                  className="p-1 rounded hover:bg-red-50"
                >
                  <X className="w-4 h-4" style={{ color: '#ef4444' }} />
                </button>
              </div>
              <input
                type="text"
                value={commitment.commitment}
                onChange={(e) => handleCommitmentChange(commitment.id, 'commitment', e.target.value)}
                placeholder="What they will do..."
                className="w-full px-3 py-2 rounded border mb-2"
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
              <input
                type="text"
                value={commitment.timeline}
                onChange={(e) => handleCommitmentChange(commitment.id, 'timeline', e.target.value)}
                placeholder="By when (e.g., Within 2 weeks)"
                className="w-full px-3 py-2 rounded border"
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
          ))}
        </div>
      )}

      <ThemedButton variant="outline" onClick={handleAddCommitment} className="w-full" icon={Plus}>
        Add Commitment
      </ThemedButton>

      {/* Review Date */}
      {levelInfo.requiresCommitments && (
        <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <label className="text-sm font-medium block mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Follow-up Review Date
          </label>
          <input
            type="date"
            value={formData.reviewDate}
            onChange={(e) => handleFieldChange('reviewDate', e.target.value)}
            min={getMinReviewDate()}
            className="w-full px-4 py-3 rounded-lg border"
            style={{
              backgroundColor: 'var(--color-background)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)'
            }}
          />
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
            When will you meet to review their progress?
          </p>
        </div>
      )}
    </div>
  );

  const renderPhase3_SupportParameters = () => (
    <div className="space-y-4">
      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-alert-info-bg)' }}>
        <p className="text-sm" style={{ color: 'var(--color-alert-info-text)' }}>
          Document any support provided and set warning parameters.
        </p>
      </div>

      {/* Training/Coaching */}
      <div>
        <label className="text-sm font-medium block mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Training/Coaching Provided <span className="text-xs font-normal" style={{ color: 'var(--color-text-tertiary)' }}>(Optional)</span>
        </label>
        <textarea
          value={formData.interventionDetails || ''}
          onChange={(e) => handleFieldChange('interventionDetails', e.target.value)}
          placeholder="Describe any support provided..."
          rows={3}
          className="w-full px-4 py-3 rounded-lg border"
          style={{
            backgroundColor: 'var(--color-background)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)'
          }}
        />
      </div>

      {/* Resources */}
      <div>
        <label className="text-sm font-medium block mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Resources Provided <span className="text-xs font-normal" style={{ color: 'var(--color-text-tertiary)' }}>(Optional)</span>
        </label>

        {formData.resourcesProvided && formData.resourcesProvided.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.resourcesProvided.map((resource, index) => (
              <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                    style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                {resource}
                <button onClick={() => handleRemoveResource(index)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={resourceInput}
            onChange={(e) => setResourceInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddResource())}
            placeholder="e.g., Policy handbook"
            className="flex-1 px-3 py-2 rounded border"
            style={{
              backgroundColor: 'var(--color-background)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)'
            }}
          />
          <ThemedButton variant="outline" onClick={handleAddResource} icon={Plus} disabled={!resourceInput.trim()}>
            Add
          </ThemedButton>
        </div>
      </div>

      {/* Warning Parameters */}
      <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>
          Warning Parameters
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Issue Date</label>
            <input
              type="date"
              value={issueDate || new Date().toISOString().split('T')[0]}
              onChange={(e) => onIssueDateChange?.(e.target.value)}
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Validity</label>
            <select
              value={validityPeriod}
              onChange={(e) => onValidityPeriodChange?.(parseInt(e.target.value) as 3 | 6 | 12)}
              className="w-full px-3 py-2 rounded border"
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
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

  const renderPhase4_Review = () => {
    const sections = [
      { phase: Phase.EMPLOYEE_RESPONSE, title: "Employee's Response", content: formData.employeeStatement, optional: !levelInfo.requiresCommitments },
      { phase: Phase.EXPECTED_STANDARDS, title: 'Expected Standards', content: formData.expectedBehavior, optional: false },
      { phase: Phase.IMPROVEMENT_PLAN, title: 'Improvement Plan',
        content: formData.actionCommitments.length > 0
          ? formData.actionCommitments.map(c => `${c.commitment} (${c.timeline})`).join('\n')
          : '',
        optional: !levelInfo.requiresCommitments
      },
    ];

    return (
      <div className="space-y-3">
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-alert-success-bg)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--color-alert-success-text)' }}>
            Review your entries below. Click Edit to make changes.
          </p>
        </div>

        {sections.map((section) => (
          <div key={section.phase} className="p-3 rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-secondary)' }}>
                {section.title}
                {section.optional && <span className="ml-1 font-normal">(Optional)</span>}
              </span>
              <button
                onClick={() => goToPhase(section.phase)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <Edit2 className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} />
              </button>
            </div>
            <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)' }}>
              {section.content || <span style={{ color: 'var(--color-text-tertiary)' }}>Not provided</span>}
            </p>
          </div>
        ))}

        {formData.reviewDate && (
          <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
            <span className="text-xs font-semibold uppercase" style={{ color: 'var(--color-text-secondary)' }}>
              Review Date
            </span>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-primary)' }}>
              {new Date(formData.reviewDate).toLocaleDateString('en-ZA', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          </div>
        )}

        {Object.keys(phaseErrors).length > 0 && (
          <ThemedAlert variant="warning">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <strong>Some sections need attention:</strong>
                <ul className="mt-1 list-disc list-inside">
                  {Object.entries(phaseErrors).map(([phase, errors]) => (
                    errors.map((error, i) => (
                      <li key={`${phase}-${i}`} className="text-xs">{error}</li>
                    ))
                  ))}
                </ul>
              </div>
            </div>
          </ThemedAlert>
        )}
      </div>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  const renderCurrentPhase = () => {
    switch (currentPhase) {
      case Phase.EMPLOYEE_RESPONSE: return renderPhase0_EmployeeResponse();
      case Phase.EXPECTED_STANDARDS: return renderPhase1_ExpectedStandards();
      case Phase.IMPROVEMENT_PLAN: return renderPhase2_ImprovementPlan();
      case Phase.SUPPORT_PARAMETERS: return renderPhase3_SupportParameters();
      case Phase.REVIEW: return renderPhase4_Review();
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <ThemedCard padding="md">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Meeting Documentation
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Complete each section of the discussion
            </p>
          </div>
        </div>
        {renderProgressDots()}
      </ThemedCard>

      {/* Current Phase Content */}
      <ThemedCard padding="md">
        {renderPhaseHeader()}
        {renderCurrentPhase()}

        {/* Phase Errors */}
        {phaseErrors[currentPhase] && phaseErrors[currentPhase].length > 0 && (
          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            {phaseErrors[currentPhase].map((error, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: '#ef4444' }}>
                <AlertTriangle className="w-3 h-3" />
                <span>{error}</span>
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <ThemedButton
            variant="outline"
            onClick={handlePrevPhase}
            disabled={currentPhase === 0}
            icon={ChevronLeft}
          >
            Back
          </ThemedButton>

          {currentPhase < Phase.REVIEW ? (
            <ThemedButton onClick={handleNextPhase} icon={ChevronRight} iconPosition="right">
              {currentPhase === Phase.EMPLOYEE_RESPONSE && !levelInfo.requiresCommitments ? 'Skip' : 'Continue'}
            </ThemedButton>
          ) : (
            <div className="flex items-center gap-2 text-sm" style={{ color: '#10b981' }}>
              <CheckCircle className="w-4 h-4" />
              <span>Ready for next step</span>
            </div>
          )}
        </div>
      </ThemedCard>
    </div>
  );
};
