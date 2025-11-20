// frontend/src/components/recognition/RecognitionEntry.tsx
// 🎉 RECOGNITION ENTRY COMPONENT - Record employee achievements and recognition
// ✅ Uses modal-system.css for consistent styling
// ✅ Repurposed from counselling/absence report patterns
// ✅ Positive, celebratory design with validation
// 📱 Mobile-optimized with proper touch targets

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Award, User, Calendar, FileText, CheckCircle,
  AlertCircle, Star, Trophy, Target, X, ChevronDown,
  Sparkles, Upload, Tag
} from 'lucide-react';

import { UniversalEmployeeSelector } from '../common/UniversalEmployeeSelector';
import { CustomDatePicker } from '../common/CustomDatePicker';

import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { usePreventBodyScroll } from '../../hooks/usePreventBodyScroll';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { DatabaseShardingService } from '../../services/DatabaseShardingService';
import { TimeService } from '../../services/TimeService';
import { API } from '../../api';
import type { Employee } from '../../types/core';
import Logger from '../../utils/logger';

interface RecognitionEntryProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId?: string; // Pre-selected employee if opened from employee profile
}

interface RecognitionRecord {
  id?: string;
  organizationId: string;
  managerId: string;
  managerName: string;
  employeeId: string;
  employeeName: string;
  employeeNumber?: string;

  // Core Recognition Fields
  recognitionType: RecognitionType;
  achievementTitle: string;
  achievementDescription: string;
  businessImpact: string;
  achievementDate: string;

  // Optional Fields
  skillsDemonstrated: string[];
  recognitionGiven: RecognitionGivenType[];
  recognitionOtherDetails?: string;
  futureGoals?: string;
  managerComments?: string;

  // Attachments
  attachmentUrls?: string[];

  // System Fields
  createdAt: string;
  updatedAt: string;
}

type RecognitionType =
  | 'exceptional_performance'
  | 'achievement'
  | 'positive_behavior'
  | 'innovation'
  | 'leadership'
  | 'teamwork'
  | 'customer_service'
  | 'safety'
  | 'other';

type RecognitionGivenType =
  | 'bonus'
  | 'extra_time_off'
  | 'public_praise'
  | 'certificate'
  | 'other';

// Recognition types with icons and descriptions
const RECOGNITION_TYPES = [
  {
    id: 'exceptional_performance' as RecognitionType,
    label: 'Exceptional Performance',
    icon: '🌟',
    description: 'Outstanding work quality and results'
  },
  {
    id: 'achievement' as RecognitionType,
    label: 'Achievement',
    icon: '🏆',
    description: 'Completed major milestone or project'
  },
  {
    id: 'positive_behavior' as RecognitionType,
    label: 'Positive Behavior',
    icon: '😊',
    description: 'Exemplary conduct and attitude'
  },
  {
    id: 'innovation' as RecognitionType,
    label: 'Innovation',
    icon: '💡',
    description: 'Creative solutions and new ideas'
  },
  {
    id: 'leadership' as RecognitionType,
    label: 'Leadership',
    icon: '👑',
    description: 'Leading by example and inspiring others'
  },
  {
    id: 'teamwork' as RecognitionType,
    label: 'Teamwork',
    icon: '🤝',
    description: 'Collaboration and team support'
  },
  {
    id: 'customer_service' as RecognitionType,
    label: 'Customer Service',
    icon: '💬',
    description: 'Exceptional client/customer interaction'
  },
  {
    id: 'safety' as RecognitionType,
    label: 'Safety',
    icon: '🛡️',
    description: 'Commitment to workplace safety'
  },
  {
    id: 'other' as RecognitionType,
    label: 'Other',
    icon: '⭐',
    description: 'Other notable achievement'
  }
];

// Pre-defined skills list
const PREDEFINED_SKILLS = [
  'Leadership',
  'Problem Solving',
  'Communication',
  'Creativity',
  'Collaboration',
  'Time Management',
  'Technical Expertise',
  'Customer Focus',
  'Adaptability',
  'Attention to Detail',
  'Initiative',
  'Accountability'
];

// Recognition given options
const RECOGNITION_GIVEN_OPTIONS = [
  { id: 'bonus' as RecognitionGivenType, label: 'Bonus', icon: '💰' },
  { id: 'extra_time_off' as RecognitionGivenType, label: 'Extra Time Off', icon: '🏖️' },
  { id: 'public_praise' as RecognitionGivenType, label: 'Public Praise', icon: '📢' },
  { id: 'certificate' as RecognitionGivenType, label: 'Certificate', icon: '📜' },
  { id: 'other' as RecognitionGivenType, label: 'Other', icon: '✨' }
];

export const RecognitionEntry: React.FC<RecognitionEntryProps> = ({
  isOpen,
  onClose,
  employeeId
}) => {
  const { user } = useAuth();
  const { organization } = useOrganization();

  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [recognitionType, setRecognitionType] = useState<RecognitionType | ''>('');
  const [achievementTitle, setAchievementTitle] = useState('');
  const [achievementDescription, setAchievementDescription] = useState('');
  const [businessImpact, setBusinessImpact] = useState('');
  const [achievementDate, setAchievementDate] = useState(new Date().toISOString().split('T')[0]);

  // Optional fields
  const [skillsDemonstrated, setSkillsDemonstrated] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [recognitionGiven, setRecognitionGiven] = useState<RecognitionGivenType[]>([]);
  const [recognitionOtherDetails, setRecognitionOtherDetails] = useState('');
  const [futureGoals, setFutureGoals] = useState('');
  const [managerComments, setManagerComments] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  // Dropdown states
  const [isRecognitionTypeOpen, setIsRecognitionTypeOpen] = useState(false);
  const [isMobileRecognitionModal, setIsMobileRecognitionModal] = useState(false);
  const [isSkillsDropdownOpen, setIsSkillsDropdownOpen] = useState(false);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Accessibility hooks
  usePreventBodyScroll(isOpen);
  const modalRef = useFocusTrap({
    isActive: isOpen,
    onEscape: onClose,
    autoFocus: true,
    returnFocus: true
  });

  // Load employees
  useEffect(() => {
    const loadEmployees = async () => {
      if (!user?.id || !organization?.id) return;

      try {
        const employeesData = await API.employees.getByManager(user.id, organization.id);
        const transformedEmployees = employeesData.map(emp => ({
          id: emp.id,
          firstName: emp.profile?.firstName || emp.firstName || 'Unknown',
          lastName: emp.profile?.lastName || emp.lastName || 'Employee',
          position: emp.profile?.position || emp.employment?.position || 'Unknown Position',
          department: emp.profile?.department || emp.employment?.department || 'Unknown',
          employeeNumber: emp.employeeNumber || emp.profile?.employeeNumber || '',
          ...emp
        }));
        setEmployees(transformedEmployees);

        // Pre-select employee if employeeId provided
        if (employeeId) {
          const preSelectedEmployee = transformedEmployees.find(emp => emp.id === employeeId);
          if (preSelectedEmployee) {
            setSelectedEmployee(preSelectedEmployee);
          }
        }
      } catch (error) {
        Logger.error('Failed to load employees:', error);
        setError('Failed to load employees');
      }
    };

    if (isOpen) {
      loadEmployees();
    }
  }, [user?.id, organization?.id, isOpen, employeeId]);

  // Get selected recognition type
  const selectedRecognitionTypeData = useMemo(() =>
    RECOGNITION_TYPES.find(type => type.id === recognitionType),
    [recognitionType]
  );

  // Handle recognition type selection
  const handleRecognitionTypeSelect = useCallback((typeId: RecognitionType) => {
    setRecognitionType(typeId);
    setIsRecognitionTypeOpen(false);
    setIsMobileRecognitionModal(false);
  }, []);

  // Handle opening recognition type selector (mobile vs desktop)
  const handleOpenRecognitionTypeSelector = useCallback(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setIsMobileRecognitionModal(true);
    } else {
      setIsRecognitionTypeOpen(!isRecognitionTypeOpen);
    }
  }, [isRecognitionTypeOpen]);

  // Handle skill selection
  const handleSkillToggle = useCallback((skill: string) => {
    setSkillsDemonstrated(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill);
      } else {
        return [...prev, skill];
      }
    });
  }, []);

  // Handle adding custom skill
  const handleAddCustomSkill = useCallback(() => {
    const trimmedSkill = customSkill.trim();
    if (trimmedSkill && !skillsDemonstrated.includes(trimmedSkill)) {
      setSkillsDemonstrated(prev => [...prev, trimmedSkill]);
      setCustomSkill('');
    }
  }, [customSkill, skillsDemonstrated]);

  // Handle recognition given toggle
  const handleRecognitionGivenToggle = useCallback((type: RecognitionGivenType) => {
    setRecognitionGiven(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  }, []);

  // Form validation
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!selectedEmployee) {
      errors.employee = 'Please select an employee';
    }

    if (!recognitionType) {
      errors.recognitionType = 'Please select a recognition type';
    }

    if (!achievementTitle.trim()) {
      errors.achievementTitle = 'Achievement title is required';
    } else if (achievementTitle.trim().length < 5) {
      errors.achievementTitle = 'Title must be at least 5 characters';
    } else if (achievementTitle.trim().length > 100) {
      errors.achievementTitle = 'Title must be less than 100 characters';
    }

    if (!achievementDescription.trim()) {
      errors.achievementDescription = 'Achievement description is required';
    } else if (achievementDescription.trim().length < 20) {
      errors.achievementDescription = 'Description must be at least 20 characters';
    }

    if (!businessImpact.trim()) {
      errors.businessImpact = 'Business impact is required';
    } else if (businessImpact.trim().length < 20) {
      errors.businessImpact = 'Business impact must be at least 20 characters';
    }

    if (!achievementDate) {
      errors.achievementDate = 'Achievement date is required';
    }

    if (recognitionGiven.includes('other') && !recognitionOtherDetails.trim()) {
      errors.recognitionOtherDetails = 'Please specify other recognition details';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [selectedEmployee, recognitionType, achievementTitle, achievementDescription, businessImpact, achievementDate, recognitionGiven, recognitionOtherDetails]);

  // Submit recognition
  const handleSubmit = async () => {
    if (!validateForm() || !user || !selectedEmployee || !organization?.id) return;

    try {
      setLoading(true);
      setError(null);

      const recognitionData: Omit<RecognitionRecord, 'id'> = {
        organizationId: organization.id,
        managerId: user.id,
        managerName: `${user.firstName} ${user.lastName}`,
        employeeId: selectedEmployee.id,
        employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
        employeeNumber: selectedEmployee.employeeNumber || undefined,
        recognitionType: recognitionType as RecognitionType,
        achievementTitle: achievementTitle.trim(),
        achievementDescription: achievementDescription.trim(),
        businessImpact: businessImpact.trim(),
        achievementDate,
        skillsDemonstrated,
        recognitionGiven,
        recognitionOtherDetails: recognitionOtherDetails.trim() || undefined,
        futureGoals: futureGoals.trim() || undefined,
        managerComments: managerComments.trim() || undefined,
        createdAt: TimeService.getServerTimestamp(),
        updatedAt: TimeService.getServerTimestamp()
      };

      // Remove undefined fields for Firebase
      const cleanedData = Object.fromEntries(
        Object.entries(recognitionData).filter(([_, value]) => value !== undefined)
      );

      await DatabaseShardingService.createDocument(
        organization.id,
        'recognitions',
        cleanedData
      );

      setSuccess(true);
      setShowConfetti(true);

      // Hide confetti after 3 seconds
      setTimeout(() => {
        setShowConfetti(false);
      }, 3000);

      // Close modal after success
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      Logger.error('Failed to submit recognition:', err);
      setError('Failed to submit recognition. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedEmployee(null);
      setRecognitionType('');
      setAchievementTitle('');
      setAchievementDescription('');
      setBusinessImpact('');
      setAchievementDate(new Date().toISOString().split('T')[0]);
      setSkillsDemonstrated([]);
      setCustomSkill('');
      setRecognitionGiven([]);
      setRecognitionOtherDetails('');
      setFutureGoals('');
      setManagerComments('');
      setError(null);
      setSuccess(false);
      setValidationErrors({});
      setIsRecognitionTypeOpen(false);
      setIsMobileRecognitionModal(false);
      setShowConfetti(false);
    }
  }, [isOpen]);

  // Success screen
  if (success) {
    if (!isOpen) return null;

    return (
      <div className="modal-system">
        <div
          ref={modalRef}
          className="modal-container"
          role="dialog"
          aria-modal="true"
          aria-labelledby="recognition-success-title"
        >
          {/* Confetti effect */}
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '-10px',
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                >
                  {['🎉', '⭐', '🌟', '✨', '🎊'][Math.floor(Math.random() * 5)]}
                </div>
              ))}
            </div>
          )}

          {/* Header */}
          <div className="modal-header">
            <div className="modal-header__left">
              <div>
                <h2 id="recognition-success-title" className="modal-header__title">
                  Recognition Recorded!
                </h2>
                <p className="modal-header__subtitle">
                  Achievement has been successfully documented
                </p>
              </div>
            </div>

            <button onClick={onClose} className="modal-header__close-button" aria-label="Close modal">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="modal-content">
            <div className="modal-content__scrollable">
              <div className="p-4 sm:p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full mb-6 bg-gradient-to-br from-green-100 to-emerald-100 relative">
                  <Trophy className="h-10 w-10 text-green-600" />
                  <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
                </div>

                <h3 className="text-2xl font-bold mb-4 text-green-700">
                  Celebration Time! 🎉
                </h3>

                <p className="mb-6 text-lg" style={{ color: 'var(--color-text)' }}>
                  You've recognized <span className="font-semibold text-green-600">{selectedEmployee?.firstName} {selectedEmployee?.lastName}</span> for their outstanding achievement!
                </p>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Award className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-green-800 mb-1">{achievementTitle}</div>
                      <div className="text-sm text-green-700">
                        {selectedRecognitionTypeData?.icon} {selectedRecognitionTypeData?.label}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  This recognition has been added to the employee's record and can be referenced during performance reviews.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <div className="modal-footer__nav">
              <button
                onClick={onClose}
                className="modal-footer__button modal-footer__button--primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="modal-system">
      <div
        ref={modalRef}
        className="modal-container modal-container--lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recognition-entry-title"
        aria-describedby="recognition-entry-description"
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header__left">
            <div>
              <h2 id="recognition-entry-title" className="modal-header__title">
                <Award className="w-5 h-5 inline mr-2" style={{ color: 'var(--color-primary)' }} />
                Record Employee Recognition
              </h2>
              <p id="recognition-entry-description" className="modal-header__subtitle">
                Celebrate achievements and document positive contributions
              </p>
            </div>
          </div>

          <button onClick={onClose} className="modal-header__close-button" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          <div className="modal-content__scrollable">
            <div className="space-y-6 p-4">
              {/* Error Alert */}
              {error && (
                <div className="flex items-start gap-3 p-3 rounded" style={{ backgroundColor: 'var(--color-error-bg)', border: '1px solid var(--color-error)' }}>
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--color-error)' }} />
                  <div className="flex-1">
                    <span style={{ color: 'var(--color-text)' }}>{error}</span>
                  </div>
                </div>
              )}

              {/* Employee Selection */}
              <div>
                <UniversalEmployeeSelector
                  employees={employees}
                  selectedEmployeeId={selectedEmployee?.id || null}
                  onEmployeeSelect={(id) => {
                    const emp = employees.find(e => e.id === id);
                    setSelectedEmployee(emp || null);
                    setValidationErrors(prev => ({ ...prev, employee: '' }));
                  }}
                  title="Select Employee"
                  subtitle="Who are you recognizing?"
                  disabled={!!employeeId} // Disable if pre-selected
                />
                {validationErrors.employee && (
                  <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: 'var(--color-error)' }}>
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.employee}
                  </div>
                )}
              </div>

              {/* Recognition Type */}
              <div>
                <div className="unified-section-header mb-3">
                  <div className="unified-section-header__icon">
                    <Star className="w-5 h-5" />
                  </div>
                  <div className="unified-section-header__content">
                    <h3 className="unified-section-header__title">Recognition Type <span style={{ color: 'var(--color-error)' }}>*</span></h3>
                    <p className="unified-section-header__subtitle">What type of achievement is this?</p>
                  </div>
                </div>

                <div className="relative">
                  <div
                    className={`cursor-pointer transition-all min-h-[48px] p-3 rounded border ${validationErrors.recognitionType ? 'border-red-500' : ''}`}
                    style={{
                      backgroundColor: 'var(--color-input-background)',
                      borderColor: isRecognitionTypeOpen ? 'var(--color-primary)' : (validationErrors.recognitionType ? 'var(--color-error)' : 'var(--color-input-border)'),
                      boxShadow: isRecognitionTypeOpen ? '0 0 0 2px var(--color-primary-light)' : undefined
                    }}
                    onClick={handleOpenRecognitionTypeSelector}
                  >
                    {selectedRecognitionTypeData ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{selectedRecognitionTypeData.icon}</span>
                          <div>
                            <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                              {selectedRecognitionTypeData.label}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                              {selectedRecognitionTypeData.description}
                            </div>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${isRecognitionTypeOpen ? 'rotate-180' : ''}`}
                          style={{ color: 'var(--color-text-tertiary)' }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          Select recognition type...
                        </span>
                        <ChevronDown className="w-4 h-4" style={{ color: 'var(--color-text-tertiary)' }} />
                      </div>
                    )}
                  </div>

                  {/* Desktop Dropdown */}
                  {isRecognitionTypeOpen && (
                    <div
                      className="absolute z-10 w-full mt-1 rounded-lg shadow-lg border max-h-96 overflow-y-auto"
                      style={{
                        backgroundColor: 'var(--color-card-background)',
                        borderColor: 'var(--color-card-border)'
                      }}
                    >
                      {RECOGNITION_TYPES.map((type) => (
                        <div
                          key={type.id}
                          className="p-3 cursor-pointer hover:bg-opacity-80 transition-colors border-b last:border-b-0"
                          style={{
                            borderColor: 'var(--color-card-border)'
                          }}
                          onClick={() => {
                            handleRecognitionTypeSelect(type.id);
                            setValidationErrors(prev => ({ ...prev, recognitionType: '' }));
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-hover)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{type.icon}</span>
                            <div className="flex-1">
                              <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                                {type.label}
                              </div>
                              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                {type.description}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {validationErrors.recognitionType && (
                  <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: 'var(--color-error)' }}>
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.recognitionType}
                  </div>
                )}
              </div>

              {/* Achievement Title */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Achievement Title <span style={{ color: 'var(--color-error)' }}>*</span>
                  <span className="ml-2 text-xs font-normal">(5-100 characters)</span>
                </label>
                <input
                  type="text"
                  value={achievementTitle}
                  onChange={(e) => {
                    setAchievementTitle(e.target.value);
                    setValidationErrors(prev => ({ ...prev, achievementTitle: '' }));
                  }}
                  placeholder="e.g., Completed Major Client Project Ahead of Schedule"
                  maxLength={100}
                  className={`w-full h-11 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${validationErrors.achievementTitle ? 'border-red-500' : ''}`}
                  style={{
                    backgroundColor: 'var(--color-input-background)',
                    borderColor: validationErrors.achievementTitle ? 'var(--color-error)' : 'var(--color-input-border)',
                    color: 'var(--color-text)'
                  }}
                />
                <div className="mt-1 flex justify-between items-center">
                  {validationErrors.achievementTitle ? (
                    <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-error)' }}>
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.achievementTitle}
                    </div>
                  ) : (
                    <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      Brief summary of the achievement
                    </div>
                  )}
                  <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {achievementTitle.length}/100
                  </div>
                </div>
              </div>

              {/* Achievement Description */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Achievement Description <span style={{ color: 'var(--color-error)' }}>*</span>
                  <span className="ml-2 text-xs font-normal">(minimum 20 characters)</span>
                </label>
                <textarea
                  value={achievementDescription}
                  onChange={(e) => {
                    setAchievementDescription(e.target.value);
                    setValidationErrors(prev => ({ ...prev, achievementDescription: '' }));
                  }}
                  placeholder="Provide detailed description of what was achieved..."
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm resize-vertical ${validationErrors.achievementDescription ? 'border-red-500' : ''}`}
                  style={{
                    backgroundColor: 'var(--color-input-background)',
                    borderColor: validationErrors.achievementDescription ? 'var(--color-error)' : 'var(--color-input-border)',
                    color: 'var(--color-text)'
                  }}
                />
                {validationErrors.achievementDescription && (
                  <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: 'var(--color-error)' }}>
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.achievementDescription}
                  </div>
                )}
              </div>

              {/* Business Impact */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Business Impact <span style={{ color: 'var(--color-error)' }}>*</span>
                  <span className="ml-2 text-xs font-normal">(minimum 20 characters)</span>
                </label>
                <textarea
                  value={businessImpact}
                  onChange={(e) => {
                    setBusinessImpact(e.target.value);
                    setValidationErrors(prev => ({ ...prev, businessImpact: '' }));
                  }}
                  placeholder="Why does this matter? What value did it create for the organization?"
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm resize-vertical ${validationErrors.businessImpact ? 'border-red-500' : ''}`}
                  style={{
                    backgroundColor: 'var(--color-input-background)',
                    borderColor: validationErrors.businessImpact ? 'var(--color-error)' : 'var(--color-input-border)',
                    color: 'var(--color-text)'
                  }}
                />
                {validationErrors.businessImpact && (
                  <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: 'var(--color-error)' }}>
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.businessImpact}
                  </div>
                )}
              </div>

              {/* Achievement Date */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Achievement Date <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <CustomDatePicker
                  selectedDate={achievementDate}
                  onDateChange={(date) => {
                    setAchievementDate(date);
                    setValidationErrors(prev => ({ ...prev, achievementDate: '' }));
                  }}
                  maxDate={new Date().toISOString().split('T')[0]}
                />
                {validationErrors.achievementDate && (
                  <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: 'var(--color-error)' }}>
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.achievementDate}
                  </div>
                )}
              </div>

              {/* Skills Demonstrated */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Skills Demonstrated <span className="text-xs font-normal">(optional)</span>
                </label>

                {/* Selected Skills */}
                {skillsDemonstrated.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {skillsDemonstrated.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-300"
                      >
                        <Tag className="w-3 h-3" />
                        {skill}
                        <button
                          onClick={() => handleSkillToggle(skill)}
                          className="ml-1 hover:text-blue-900"
                          aria-label={`Remove ${skill}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Skill Selection Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSkillsDropdownOpen(!isSkillsDropdownOpen)}
                    className="w-full h-11 px-3 py-2 border rounded-lg text-left flex items-center justify-between text-sm"
                    style={{
                      backgroundColor: 'var(--color-input-background)',
                      borderColor: 'var(--color-input-border)',
                      color: 'var(--color-text)'
                    }}
                  >
                    <span>Select skills...</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isSkillsDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSkillsDropdownOpen && (
                    <div
                      className="absolute z-10 w-full mt-1 rounded-lg shadow-lg border max-h-64 overflow-y-auto"
                      style={{
                        backgroundColor: 'var(--color-card-background)',
                        borderColor: 'var(--color-card-border)'
                      }}
                    >
                      {PREDEFINED_SKILLS.map((skill) => (
                        <label
                          key={skill}
                          className="flex items-center gap-3 p-3 cursor-pointer hover:bg-opacity-80 transition-colors border-b last:border-b-0"
                          style={{ borderColor: 'var(--color-card-border)' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-hover)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={skillsDemonstrated.includes(skill)}
                            onChange={() => handleSkillToggle(skill)}
                            className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm" style={{ color: 'var(--color-text)' }}>{skill}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Skill Input */}
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSkill();
                      }
                    }}
                    placeholder="Add custom skill..."
                    className="flex-1 h-9 px-3 py-2 border rounded-lg text-sm"
                    style={{
                      backgroundColor: 'var(--color-input-background)',
                      borderColor: 'var(--color-input-border)',
                      color: 'var(--color-text)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSkill}
                    disabled={!customSkill.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Recognition Given */}
              <div>
                <label className="block text-xs font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                  Recognition Given <span className="text-xs font-normal">(optional)</span>
                </label>
                <div className="space-y-2">
                  {RECOGNITION_GIVEN_OPTIONS.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                      style={{
                        backgroundColor: recognitionGiven.includes(option.id) ? 'var(--color-primary-light)' : 'var(--color-input-background)',
                        borderColor: recognitionGiven.includes(option.id) ? 'var(--color-primary)' : 'var(--color-input-border)'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={recognitionGiven.includes(option.id)}
                        onChange={() => handleRecognitionGivenToggle(option.id)}
                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-xl">{option.icon}</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Other Details */}
                {recognitionGiven.includes('other') && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={recognitionOtherDetails}
                      onChange={(e) => {
                        setRecognitionOtherDetails(e.target.value);
                        setValidationErrors(prev => ({ ...prev, recognitionOtherDetails: '' }));
                      }}
                      placeholder="Please specify other recognition details..."
                      className={`w-full h-11 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm ${validationErrors.recognitionOtherDetails ? 'border-red-500' : ''}`}
                      style={{
                        backgroundColor: 'var(--color-input-background)',
                        borderColor: validationErrors.recognitionOtherDetails ? 'var(--color-error)' : 'var(--color-input-border)',
                        color: 'var(--color-text)'
                      }}
                    />
                    {validationErrors.recognitionOtherDetails && (
                      <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: 'var(--color-error)' }}>
                        <AlertCircle className="w-3 h-3" />
                        {validationErrors.recognitionOtherDetails}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Future Goals */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Future Goals & Stretch Targets <span className="text-xs font-normal">(optional)</span>
                </label>
                <textarea
                  value={futureGoals}
                  onChange={(e) => setFutureGoals(e.target.value)}
                  placeholder="Any stretch targets or next challenges discussed..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm resize-vertical"
                  style={{
                    backgroundColor: 'var(--color-input-background)',
                    borderColor: 'var(--color-input-border)',
                    color: 'var(--color-text)'
                  }}
                />
              </div>

              {/* Manager Comments */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Manager Comments <span className="text-xs font-normal">(optional)</span>
                </label>
                <textarea
                  value={managerComments}
                  onChange={(e) => setManagerComments(e.target.value)}
                  placeholder="Additional notes or comments..."
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm resize-vertical"
                  style={{
                    backgroundColor: 'var(--color-input-background)',
                    borderColor: 'var(--color-input-border)',
                    color: 'var(--color-text)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="modal-footer__nav">
            <button
              onClick={onClose}
              disabled={loading}
              className="modal-footer__button modal-footer__button--secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="modal-footer__button modal-footer__button--primary"
              style={{
                backgroundColor: loading ? 'var(--color-primary-hover)' : 'var(--color-primary)'
              }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4 mr-2" />
                  Record Recognition
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Recognition Type Modal */}
      {isMobileRecognitionModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50">
          <div
            className="w-full max-h-[70vh] rounded-t-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--color-card-background)' }}
          >
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-card-border)' }}>
              <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>Select Recognition Type</h3>
              <button onClick={() => setIsMobileRecognitionModal(false)} aria-label="Close">
                <X className="w-5 h-5" style={{ color: 'var(--color-text)' }} />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
              {RECOGNITION_TYPES.map((type) => (
                <div
                  key={type.id}
                  className="p-4 cursor-pointer border-b last:border-b-0 active:bg-opacity-70"
                  style={{ borderColor: 'var(--color-card-border)' }}
                  onClick={() => {
                    handleRecognitionTypeSelect(type.id);
                    setValidationErrors(prev => ({ ...prev, recognitionType: '' }));
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{type.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold" style={{ color: 'var(--color-text)' }}>
                        {type.label}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {type.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add confetti animation to global CSS if not already present
// (This would typically go in index.css)
/*
@keyframes confetti {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

.animate-confetti {
  animation: confetti 4s ease-in forwards;
}
*/
