// frontend/src/components/warnings/ManualWarningEntry.tsx
// 📄 Manual Warning Entry Component
// For capturing warnings created outside the system (pre-signup or offline paper warnings)

import React, { useState, useCallback, useMemo } from 'react';
import {
  FileText, X, ChevronLeft, ChevronRight, Check, AlertTriangle,
  Calendar, MapPin, User, Tag, Clock, Save, FileSignature
} from 'lucide-react';
import { UnifiedModal } from '../common/UnifiedModal';
import { ThemedCard, ThemedFormInput, ThemedSectionHeader } from '../common/ThemedCard';
import { ThemedButton } from '../common/ThemedButton';
import { HistoricalWarningDisclaimer } from './HistoricalWarningDisclaimer';
import { CustomDatePicker } from '../common/CustomDatePicker';
import type { Employee, WarningLevel } from '../../types/core';
import type { WarningCategory } from '../../services/WarningService';

interface ManualWarningEntryProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employees: Employee[];
  categories: WarningCategory[];
  preSelectedEmployeeId?: string;
  currentUserId: string;
  organizationId: string;
}

interface ManualWarningFormData {
  // Employee & Category
  employeeId: string;
  categoryId: string;
  level: WarningLevel | '';

  // Dates
  incidentDate: Date | null;
  incidentTime: string;
  issueDate: Date | null;
  expiryDate: Date | null;
  validityPeriod: 3 | 6 | 12;

  // Details
  title: string;
  description: string;
  incidentLocation: string;
  additionalNotes: string;

  // Physical copy tracking
  hasPhysicalCopy: boolean;
  physicalCopyLocation: string;
  historicalNotes: string;
}

enum FormStep {
  EMPLOYEE_CATEGORY = 0,
  DATES_DETAILS = 1,
  PHYSICAL_CONFIRMATION = 2,
  REVIEW = 3
}

const STEP_TITLES = [
  'Select Employee & Category',
  'Enter Dates & Details',
  'Physical Copy Confirmation',
  'Review & Save'
];

const WARNING_LEVEL_LABELS: Record<string, string> = {
  counselling: 'Counselling Session',
  verbal: 'Verbal Warning',
  first_written: 'First Written Warning',
  second_written: 'Second Written Warning',
  final_written: 'Final Written Warning'
};

export const ManualWarningEntry: React.FC<ManualWarningEntryProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employees,
  categories,
  preSelectedEmployeeId,
  currentUserId,
  organizationId
}) => {
  console.log('🔵 [DEBUG] ManualWarningEntry component rendered:', {
    isOpen,
    employeesCount: employees?.length,
    categoriesCount: categories?.length,
    currentUserId,
    organizationId
  });

  const [currentStep, setCurrentStep] = useState<FormStep>(FormStep.EMPLOYEE_CATEGORY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<ManualWarningFormData>({
    employeeId: preSelectedEmployeeId || '',
    categoryId: '',
    level: '',
    incidentDate: null,
    incidentTime: '09:00',
    issueDate: null,
    expiryDate: null,
    validityPeriod: 6,
    title: '',
    description: '',
    incidentLocation: '',
    additionalNotes: '',
    hasPhysicalCopy: false,
    physicalCopyLocation: '',
    historicalNotes: ''
  });

  // Selected entities
  const selectedEmployee = useMemo(() =>
    employees.find(e => e.id === formData.employeeId),
    [employees, formData.employeeId]
  );

  const selectedCategory = useMemo(() =>
    categories.find(c => c.id === formData.categoryId),
    [categories, formData.categoryId]
  );

  // Available warning levels based on selected category
  const availableLevels = useMemo(() => {
    if (!selectedCategory?.escalationPath) {
      return ['counselling', 'verbal', 'first_written', 'second_written', 'final_written'];
    }
    return selectedCategory.escalationPath;
  }, [selectedCategory]);

  // Calculate expiry date when issue date or validity period changes
  const calculateExpiryDate = useCallback((issueDate: Date | null, months: number): Date | null => {
    if (!issueDate) return null;
    const expiry = new Date(issueDate);
    expiry.setMonth(expiry.getMonth() + months);
    return expiry;
  }, []);

  // Update form data helper
  const updateFormData = useCallback(<K extends keyof ManualWarningFormData>(
    field: K,
    value: ManualWarningFormData[K]
  ) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-calculate expiry date when issue date or validity period changes
      if (field === 'issueDate' || field === 'validityPeriod') {
        const issueDate = field === 'issueDate' ? value as Date | null : prev.issueDate;
        const validityPeriod = field === 'validityPeriod' ? value as number : prev.validityPeriod;
        updated.expiryDate = calculateExpiryDate(issueDate, validityPeriod);
      }

      return updated;
    });
  }, [calculateExpiryDate]);

  // Validation
  const validateStep = useCallback((step: FormStep): { isValid: boolean; error?: string } => {
    switch (step) {
      case FormStep.EMPLOYEE_CATEGORY:
        if (!formData.employeeId) return { isValid: false, error: 'Please select an employee' };
        if (!formData.categoryId) return { isValid: false, error: 'Please select a category' };
        if (!formData.level) return { isValid: false, error: 'Please select a warning level' };
        return { isValid: true };

      case FormStep.DATES_DETAILS:
        if (!formData.incidentDate) return { isValid: false, error: 'Please enter incident date' };
        if (!formData.issueDate) return { isValid: false, error: 'Please enter issue date' };
        if (!formData.title.trim()) return { isValid: false, error: 'Please enter a warning title' };
        if (!formData.description.trim()) return { isValid: false, error: 'Please enter incident description' };
        if (!formData.incidentLocation.trim()) return { isValid: false, error: 'Please enter incident location' };

        // Validate dates
        if (formData.issueDate > new Date()) {
          return { isValid: false, error: 'Issue date cannot be in the future' };
        }
        if (formData.expiryDate && formData.expiryDate <= formData.issueDate) {
          return { isValid: false, error: 'Expiry date must be after issue date' };
        }
        return { isValid: true };

      case FormStep.PHYSICAL_CONFIRMATION:
        if (!formData.hasPhysicalCopy) {
          return { isValid: false, error: 'You must confirm that a physical signed copy exists' };
        }
        return { isValid: true };

      case FormStep.REVIEW:
        return { isValid: true };

      default:
        return { isValid: false };
    }
  }, [formData]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    const validation = validateStep(currentStep);
    if (!validation.isValid) {
      setError(validation.error || 'Please complete all required fields');
      return;
    }
    setError(null);
    setCurrentStep(prev => Math.min(prev + 1, FormStep.REVIEW));
  }, [currentStep, validateStep]);

  const handleBack = useCallback(() => {
    setError(null);
    setCurrentStep(prev => Math.max(prev - 1, FormStep.EMPLOYEE_CATEGORY));
  }, []);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    const validation = validateStep(FormStep.PHYSICAL_CONFIRMATION);
    if (!validation.isValid) {
      setError(validation.error || 'Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Import service dynamically to avoid circular dependencies
      const { ShardedDataService } = await import('../../services/ShardedDataService');

      const warningData = {
        employeeId: formData.employeeId,
        categoryId: formData.categoryId,
        level: formData.level as WarningLevel,

        // Dates
        incidentDate: formData.incidentDate!,
        incidentTime: formData.incidentTime,
        issueDate: formData.issueDate!,
        expiryDate: formData.expiryDate!,
        validityPeriod: formData.validityPeriod,

        // Content
        title: formData.title,
        description: formData.description,
        incidentLocation: formData.incidentLocation,
        additionalNotes: formData.additionalNotes,

        // Historical tracking
        isHistoricalEntry: true,
        hasPhysicalCopy: formData.hasPhysicalCopy,
        physicalCopyLocation: formData.physicalCopyLocation,
        historicalNotes: formData.historicalNotes,
        enteredBy: currentUserId,
        enteredAt: new Date(),

        // Set as issued with no signatures/audio
        issuedBy: currentUserId,
        status: 'issued' as const,
        isActive: true,
        deliveryStatus: 'delivered' as const, // Mark as delivered since it was given physically
        followUpActions: []
      };

      await ShardedDataService.createWarning(warningData, organizationId);

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating historical warning:', err);
      setError(err instanceof Error ? err.message : 'Failed to create warning');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, currentUserId, organizationId, onSuccess, onClose, validateStep]);

  // Reset form when modal closes
  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setCurrentStep(FormStep.EMPLOYEE_CATEGORY);
      setError(null);
      setFormData({
        employeeId: preSelectedEmployeeId || '',
        categoryId: '',
        level: '',
        incidentDate: null,
        incidentTime: '09:00',
        issueDate: null,
        expiryDate: null,
        validityPeriod: 6,
        title: '',
        description: '',
        incidentLocation: '',
        additionalNotes: '',
        hasPhysicalCopy: false,
        physicalCopyLocation: '',
        historicalNotes: ''
      });
      onClose();
    }
  }, [isSubmitting, onClose, preSelectedEmployeeId]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case FormStep.EMPLOYEE_CATEGORY:
        return (
          <div className="space-y-4">
            {/* Employee Selection */}
            <div>
              <ThemedSectionHeader
                icon={User}
                title="Select Employee"
                subtitle="Choose the employee who received this warning"
              />
              <select
                value={formData.employeeId}
                onChange={(e) => updateFormData('employeeId', e.target.value)}
                className="mt-2 w-full h-11 px-4 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-medium transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select an employee...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.profile.firstName} {emp.profile.lastName} ({emp.profile.employeeNumber})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Selection */}
            <div>
              <ThemedSectionHeader
                icon={Tag}
                title="Select Category"
                subtitle="Choose the violation category"
              />
              <select
                value={formData.categoryId}
                onChange={(e) => updateFormData('categoryId', e.target.value)}
                className="mt-2 w-full h-11 px-4 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-medium transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select a category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Warning Level Selection */}
            {formData.categoryId && (
              <div>
                <ThemedSectionHeader
                  icon={AlertTriangle}
                  title="Warning Level"
                  subtitle="Select the severity level given in the original warning"
                />
                <select
                  value={formData.level}
                  onChange={(e) => updateFormData('level', e.target.value as WarningLevel)}
                  className="mt-2 w-full h-11 px-4 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-medium transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Select warning level...</option>
                  {availableLevels.map(level => (
                    <option key={level} value={level}>
                      {WARNING_LEVEL_LABELS[level] || level}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );

      case FormStep.DATES_DETAILS:
        return (
          <div className="space-y-4">
            {/* Incident Date */}
            <div>
              <CustomDatePicker
                label="Incident Date"
                value={formData.incidentDate ? formData.incidentDate.toISOString().split('T')[0] : ''}
                onChange={(dateString) => updateFormData('incidentDate', dateString ? new Date(dateString) : null)}
                icon={Calendar}
                required
              />
              <p className="text-xs text-gray-500 mt-1">When did the incident occur?</p>
            </div>

            {/* Incident Time */}
            <ThemedFormInput
              icon={Clock}
              label="Incident Time"
              type="time"
              value={formData.incidentTime}
              onChange={(value) => updateFormData('incidentTime', value)}
            />

            {/* Issue Date */}
            <div>
              <CustomDatePicker
                label="Issue Date"
                value={formData.issueDate ? formData.issueDate.toISOString().split('T')[0] : ''}
                onChange={(dateString) => updateFormData('issueDate', dateString ? new Date(dateString) : null)}
                icon={FileSignature}
                required
              />
              <p className="text-xs text-gray-500 mt-1">When was the warning issued?</p>
            </div>

            {/* Validity Period */}
            <div>
              <ThemedSectionHeader
                icon={Clock}
                title="Validity Period"
                subtitle="How long is this warning active?"
              />
              <select
                value={formData.validityPeriod}
                onChange={(e) => updateFormData('validityPeriod', parseInt(e.target.value) as 3 | 6 | 12)}
                className="w-full h-11 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={12}>12 months</option>
              </select>
              {formData.expiryDate && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Will expire on: {formData.expiryDate.toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Warning Title */}
            <ThemedFormInput
              icon={FileText}
              label="Warning Title"
              placeholder="Brief summary of the warning"
              value={formData.title}
              onChange={(value) => updateFormData('title', value)}
            />

            {/* Incident Location */}
            <ThemedFormInput
              icon={MapPin}
              label="Incident Location"
              placeholder="Where did the incident occur?"
              value={formData.incidentLocation}
              onChange={(value) => updateFormData('incidentLocation', value)}
            />

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Incident Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Describe what happened in detail..."
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={formData.additionalNotes}
                onChange={(e) => updateFormData('additionalNotes', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Any additional context or notes..."
              />
            </div>
          </div>
        );

      case FormStep.PHYSICAL_CONFIRMATION:
        return (
          <div className="space-y-4">
            {/* Physical Copy Confirmation */}
            <ThemedCard>
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasPhysicalCopy}
                    onChange={(e) => updateFormData('hasPhysicalCopy', e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      I confirm the physical signed copy exists
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Required: You must have access to the original signed warning document
                    </p>
                  </div>
                </label>
              </div>
            </ThemedCard>

            {/* Physical Copy Location */}
            {formData.hasPhysicalCopy && (
              <ThemedFormInput
                icon={FileText}
                label="Physical Copy Location (Optional)"
                placeholder="e.g., Filing Cabinet A3, HR Office"
                value={formData.physicalCopyLocation}
                onChange={(value) => updateFormData('physicalCopyLocation', value)}
              />
            )}

            {/* Historical Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Historical Entry Notes (Optional)
              </label>
              <textarea
                value={formData.historicalNotes}
                onChange={(e) => updateFormData('historicalNotes', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Any additional context about this historical entry..."
              />
            </div>

            {/* Disclaimer */}
            <HistoricalWarningDisclaimer
              physicalCopyLocation={formData.physicalCopyLocation || undefined}
            />
          </div>
        );

      case FormStep.REVIEW:
        return (
          <div className="space-y-4">
            {/* Summary */}
            <ThemedCard>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
                  Warning Summary
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Employee:</span>
                      <p className="text-gray-900 dark:text-gray-100 mt-1">
                        {selectedEmployee?.profile.firstName} {selectedEmployee?.profile.lastName}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Category:</span>
                      <p className="text-gray-900 dark:text-gray-100 mt-1">{selectedCategory?.name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Level:</span>
                      <p className="text-gray-900 dark:text-gray-100 mt-1">
                        {WARNING_LEVEL_LABELS[formData.level as string] || formData.level}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Validity:</span>
                      <p className="text-gray-900 dark:text-gray-100 mt-1">{formData.validityPeriod} months</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Incident Date:</span>
                      <p className="text-gray-900 dark:text-gray-100 mt-1">
                        {formData.incidentDate?.toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Issue Date:</span>
                      <p className="text-gray-900 dark:text-gray-100 mt-1">
                        {formData.issueDate?.toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Title:</span>
                    <p className="text-gray-900 dark:text-gray-100 mt-1">{formData.title}</p>
                  </div>

                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Description:</span>
                    <p className="text-gray-900 dark:text-gray-100 mt-1">{formData.description}</p>
                  </div>
                </div>
              </div>
            </ThemedCard>

            {/* Final Warning */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                    This warning has NO digital signatures or audio recording
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Ensure the physical signed document is kept safe for legal compliance
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/20 flex items-center justify-center shadow-sm">
            <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Manual Warning Entry
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {STEP_TITLES[currentStep]}
            </p>
          </div>
        </div>
      }
      size="lg"
    >
      {/* Progress Indicator - Compact Design */}
      <div className="flex items-center justify-between mb-4 px-4">
        {[0, 1, 2, 3].map((step) => (
          <div key={step} className="flex items-center flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200
                ${step <= currentStep
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
            >
              {step < currentStep ? <Check className="w-3.5 h-3.5" /> : step + 1}
            </div>
            {step < 3 && (
              <div
                className={`flex-1 h-0.5 mx-2 transition-all duration-200
                  ${step < currentStep
                    ? 'bg-blue-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                  }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 px-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="px-4 pb-4 max-h-[calc(100vh-300px)] overflow-y-auto">
        {renderStepContent()}
      </div>

      {/* Navigation Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4 flex items-center justify-between">
        <ThemedButton
          variant="outline"
          onClick={currentStep === FormStep.EMPLOYEE_CATEGORY ? handleClose : handleBack}
          disabled={isSubmitting}
          icon={currentStep === FormStep.EMPLOYEE_CATEGORY ? X : ChevronLeft}
        >
          {currentStep === FormStep.EMPLOYEE_CATEGORY ? 'Cancel' : 'Back'}
        </ThemedButton>

        <ThemedButton
          onClick={currentStep === FormStep.REVIEW ? handleSubmit : handleNext}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2"
        >
          {isSubmitting
            ? 'Saving...'
            : currentStep === FormStep.REVIEW
            ? <>Save Historical Warning <Save className="w-4 h-4" /></>
            : <>Next <ChevronRight className="w-4 h-4" /></>
          }
        </ThemedButton>
      </div>
    </UnifiedModal>
  );
};

export default ManualWarningEntry;