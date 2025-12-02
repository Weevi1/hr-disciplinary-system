// frontend/src/components/warnings/enhanced/steps/components/IncidentDetailsForm.tsx
// 🎯 FOCUSED INCIDENT DETAILS FORM - V2 TREATMENT
// ✅ Real-time validation, writing assistance
// ✅ Mobile-first design, accessibility improvements
// 🔧 REMOVED: Auto-save functionality (was causing date persistence issues)

import React, { useState, useCallback } from 'react';
import { FileText, MapPin, Calendar, Clock, PenTool, AlertTriangle } from 'lucide-react';
import type { EnhancedWarningFormData } from '../../../../../services/WarningService';

// Import unified theming components
import { ThemedSectionHeader, ThemedFormInput } from '../../../../common/ThemedCard';
import { CustomDatePicker } from '../../../../common/CustomDatePicker';

interface IncidentDetailsFormProps {
  formData: EnhancedWarningFormData;
  onFormDataChange: (updates: Partial<EnhancedWarningFormData>) => void;
  disabled?: boolean;
  className?: string;
}

interface ValidationErrors {
  incidentDate?: string;
  incidentTime?: string;
  incidentLocation?: string;
  incidentDescription?: string;
}

// 🔧 REMOVED: useAutoSave hook - caused issues with date persistence from localStorage

export const IncidentDetailsForm: React.FC<IncidentDetailsFormProps> = ({
  formData,
  onFormDataChange,
  disabled = false,
  className = ""
}) => {
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // 🔧 REMOVED: Auto-save functionality - caused issues with date persistence
  // const { isSaving, lastSaved } = useAutoSave(
  //   formData,
  //   (data) => {
  //     localStorage.setItem('warningWizard_incidentDetails', JSON.stringify(data));
  //   }
  // );

  // 🔧 REMOVED: Load saved data on mount - caused October 6 date bug
  // useEffect(() => {
  //   const savedData = localStorage.getItem('warningWizard_incidentDetails');
  //   if (savedData) {
  //     try {
  //       const parsed = JSON.parse(savedData);
  //       const isEmpty = !formData.incidentDescription && !formData.incidentLocation;
  //       if (isEmpty) {
  //         onFormDataChange(parsed);
  //       }
  //     } catch (error) {
  //       Logger.warn('Failed to load saved incident details:', error);
  //     }
  //   }
  // }, []);

  // Word count calculation (minimum 6 words required)
  const getWordCount = (text: string) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  };
  const wordCount = getWordCount(formData.incidentDescription || '');
  const isMinimumMet = wordCount >= 6;

  // Real-time validation
  const validateField = useCallback((field: keyof EnhancedWarningFormData, value: any): string | null => {
    switch (field) {
      case 'incidentDate':
        if (!value) return 'Incident date is required';
        const date = new Date(value);
        const today = new Date();
        if (date > today) return 'Incident date cannot be in the future';
        return null;
      
      case 'incidentTime':
        if (!value) return 'Incident time is required';
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(value)) return 'Please enter time in HH:MM format';
        return null;
      
      case 'incidentLocation':
        if (!value || value.trim().length < 3) return 'Please provide a specific location (minimum 3 characters)';
        return null;
      
      case 'incidentDescription':
        // Word-based validation (minimum 6 words, maximum 500 words)
        const words = value.trim().split(/\s+/).filter(word => word.length > 0);
        const wordCount = words.length;
        if (wordCount === 0) return 'Description is required';
        if (wordCount < 6) return `Description must be at least 6 words (currently ${wordCount} word${wordCount === 1 ? '' : 's'})`;
        if (wordCount > 500) return `Description is too long (maximum 500 words, currently ${wordCount} words)`;
        return null;
      
      default:
        return null;
    }
  }, []);

  // Handle field changes with validation
  const handleFieldChange = useCallback((field: keyof EnhancedWarningFormData, value: any) => {
    onFormDataChange({ [field]: value });
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate field
    const error = validateField(field, value);
    setValidationErrors(prev => ({ ...prev, [field]: error }));
  }, [onFormDataChange, validateField]);

  // Get today's date for max date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Section Header */}
      <ThemedSectionHeader
        icon={FileText}
        title="Incident Details"
        subtitle="Provide comprehensive details about the incident"
      />

      {/* Date and Time Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Incident Date */}
        <CustomDatePicker
          type="date"
          label="Incident Date"
          value={formData.incidentDate || ''}
          onChange={(value) => handleFieldChange('incidentDate', value)}
          icon={Calendar}
          required
          disabled={disabled}
          error={validationErrors.incidentDate && touched.incidentDate ? validationErrors.incidentDate : undefined}
        />

        {/* Incident Time */}
        <CustomDatePicker
          type="time"
          label="Incident Time"
          value={formData.incidentTime || ''}
          onChange={(value) => handleFieldChange('incidentTime', value)}
          icon={Clock}
          required
          disabled={disabled}
          error={validationErrors.incidentTime && touched.incidentTime ? validationErrors.incidentTime : undefined}
        />
      </div>

      {/* Location */}
      <ThemedFormInput
        type="text"
        label="Incident Location"
        value={formData.incidentLocation || ''}
        onChange={(value) => handleFieldChange('incidentLocation', value)}
        placeholder="e.g., Main office reception area, Warehouse loading dock, Conference Room B"
        icon={MapPin}
        required
        disabled={disabled}
        error={validationErrors.incidentLocation && touched.incidentLocation ? validationErrors.incidentLocation : undefined}
      />

      {/* What Happened */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            <PenTool className="w-3 h-3 inline mr-1" />
            What Happened *
          </label>
          <div
            className="text-xs px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: isMinimumMet
                ? 'var(--color-alert-success-bg)'
                : 'var(--color-alert-warning-bg)',
              color: isMinimumMet
                ? 'var(--color-alert-success-text)'
                : 'var(--color-alert-warning-text)'
            }}
          >
            {wordCount} words
          </div>
        </div>

        <textarea
          value={formData.incidentDescription || ''}
          onChange={(e) => handleFieldChange('incidentDescription', e.target.value)}
          placeholder="Describe the incident: What did the employee do or fail to do? Include specific details like what was said, actions taken, who was present, and when/where it happened..."
          disabled={disabled}
          rows={6}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 text-sm min-h-[132px] resize-vertical ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{
            backgroundColor: validationErrors.incidentDescription && touched.incidentDescription
              ? 'var(--color-alert-error-bg)'
              : 'var(--color-input-background)',
            borderColor: validationErrors.incidentDescription && touched.incidentDescription
              ? 'var(--color-alert-error-border)'
              : 'var(--color-input-border)',
            color: 'var(--color-text)'
          }}
        />
        
        {validationErrors.incidentDescription && touched.incidentDescription && (
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-error)' }}>
            <AlertTriangle className="w-3 h-3" />
            {validationErrors.incidentDescription}
          </div>
        )}
      </div>
    </div>
  );
};