// frontend/src/components/warnings/enhanced/steps/components/IncidentDetailsForm.tsx
// 🎯 FOCUSED INCIDENT DETAILS FORM - V2 TREATMENT
// ✅ Auto-save functionality, real-time validation, writing assistance
// ✅ Mobile-first design, accessibility improvements

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FileText, MapPin, Calendar, Clock, PenTool, Lightbulb, CheckCircle, AlertTriangle, Save } from 'lucide-react';
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

interface WritingAssistance {
  wordCount: number;
  isMinimumMet: boolean;
  suggestions: string[];
}

interface ValidationErrors {
  incidentDate?: string;
  incidentTime?: string;
  incidentLocation?: string;
  incidentDescription?: string;
  additionalNotes?: string;
}

// Auto-save hook
const useAutoSave = (data: any, onSave: (data: any) => void, delay: number = 2000) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const scheduleAutoSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsSaving(true);
      onSave(data);
      setLastSaved(new Date());
      setIsSaving(false);
    }, delay);
  }, [data, onSave, delay]);

  useEffect(() => {
    scheduleAutoSave();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [scheduleAutoSave]);

  return { isSaving, lastSaved };
};

export const IncidentDetailsForm: React.FC<IncidentDetailsFormProps> = ({
  formData,
  onFormDataChange,
  disabled = false,
  className = ""
}) => {
  const [showWritingAssistance, setShowWritingAssistance] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Auto-save functionality
  const { isSaving, lastSaved } = useAutoSave(
    formData, 
    (data) => {
      // Auto-save logic - you can integrate with localStorage or API
      localStorage.setItem('warningWizard_incidentDetails', JSON.stringify(data));
    }
  );

  // Load saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem('warningWizard_incidentDetails');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Only load if current form is mostly empty
        const isEmpty = !formData.incidentDescription && !formData.incidentLocation;
        if (isEmpty) {
          onFormDataChange(parsed);
        }
      } catch (error) {
        console.warn('Failed to load saved incident details:', error);
      }
    }
  }, []);

  // Writing assistance
  const writingAssistance = useMemo((): WritingAssistance => {
    const description = formData.incidentDescription || '';
    const words = description.trim().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const isMinimumMet = wordCount >= 20;

    const suggestions: string[] = [];
    if (wordCount < 20) {
      suggestions.push(`Add ${20 - wordCount} more words for a complete description`);
    }
    if (!description.includes('when') && !description.includes('time')) {
      suggestions.push('Consider adding when the incident occurred');
    }
    if (!description.includes('where') && !description.includes('location')) {
      suggestions.push('Consider specifying where the incident took place');
    }
    if (!description.includes('what') && !description.includes('action')) {
      suggestions.push('Be specific about what actions were observed');
    }
    if (!description.includes('witness') && wordCount > 10) {
      suggestions.push('Were there any witnesses to mention?');
    }

    return { wordCount, isMinimumMet, suggestions };
  }, [formData.incidentDescription]);

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
        if (!value || value.trim().length < 20) return 'Description must be at least 20 characters';
        if (value.trim().length > 2000) return 'Description is too long (maximum 2000 characters)';
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
        rightContent={
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            {isSaving && (
              <div className="flex items-center gap-1">
                <Save className="w-4 h-4 animate-pulse" />
                <span>Saving...</span>
              </div>
            )}
            {lastSaved && !isSaving && (
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                <span>Saved {lastSaved.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        }
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

      {/* Incident Description */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            <PenTool className="w-3 h-3 inline mr-1" />
            Incident Description *
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowWritingAssistance(!showWritingAssistance)}
              className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--color-primary)' }}
            >
              <Lightbulb className="w-3 h-3" />
              Writing Tips
            </button>
            <div
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: writingAssistance.isMinimumMet
                  ? 'var(--color-alert-success-bg)'
                  : 'var(--color-alert-warning-bg)',
                color: writingAssistance.isMinimumMet
                  ? 'var(--color-alert-success-text)'
                  : 'var(--color-alert-warning-text)'
              }}
            >
              {writingAssistance.wordCount} words
            </div>
          </div>
        </div>

        <textarea
          value={formData.incidentDescription || ''}
          onChange={(e) => handleFieldChange('incidentDescription', e.target.value)}
          placeholder="Describe exactly what happened. Include specific details such as what was said or done, who was present, and any relevant context..."
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

        {/* Writing Assistance */}
        {showWritingAssistance && (
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-alert-info-bg)', border: '1px solid var(--color-alert-info-border)' }}>
            <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--color-alert-info-text)' }}>Writing Assistance</h4>
            <div className="space-y-2 text-sm" style={{ color: 'var(--color-alert-info-text)' }}>
              {writingAssistance.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 mt-0.5" style={{ color: 'var(--color-alert-info-text)' }} />
                  <span>{suggestion}</span>
                </div>
              ))}
              {writingAssistance.suggestions.length === 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                  <span className="text-green-700">Your description looks comprehensive!</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-700">
          Additional Notes
          <span className="text-gray-500 font-normal ml-1">(optional)</span>
        </label>
        <textarea
          value={formData.additionalNotes || ''}
          onChange={(e) => handleFieldChange('additionalNotes', e.target.value)}
          placeholder="Any additional context, background information, or relevant details..."
          disabled={disabled}
          rows={3}
          className={`
            w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
      </div>

      {/* Issue Date and Validity Period Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Issue Date */}
        <div className="space-y-2">
          <label className="block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Issue Date *
          </label>
          <input
            type="date"
            value={formData.issueDate || today}
            onChange={(e) => handleFieldChange('issueDate', e.target.value)}
            disabled={disabled}
            className={`
              w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          />
        </div>

        {/* Validity Period */}
        <div className="space-y-2">
          <label className="block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Validity Period *
          </label>
          <select
            value={formData.validityPeriod || 6}
            onChange={(e) => handleFieldChange('validityPeriod', parseInt(e.target.value))}
            disabled={disabled}
            className={`
              w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <option value={3}>3 months</option>
            <option value={6}>6 months</option>
            <option value={12}>12 months</option>
          </select>
        </div>
      </div>
    </div>
  );
};