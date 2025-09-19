// frontend/src/components/warnings/enhanced/steps/components/IncidentDetailsForm.tsx
// 🎯 FOCUSED INCIDENT DETAILS FORM - V2 TREATMENT
// ✅ Auto-save functionality, real-time validation, writing assistance
// ✅ Mobile-first design, accessibility improvements

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FileText, MapPin, Calendar, Clock, PenTool, Lightbulb, CheckCircle, AlertTriangle, Save } from 'lucide-react';
import type { EnhancedWarningFormData } from '../../../../../services/WarningService';

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
    <div className={`space-y-6 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <FileText className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Incident Details</h3>
            <p className="text-sm text-gray-600">Provide comprehensive details about the incident</p>
          </div>
        </div>
        
        {/* Auto-save indicator */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {isSaving && (
            <div className="flex items-center gap-1">
              <Save className="w-4 h-4 animate-pulse" />
              <span>Saving...</span>
            </div>
          )}
          {lastSaved && !isSaving && (
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Date and Time Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Incident Date */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <Calendar className="w-4 h-4 inline mr-1" />
            Incident Date *
          </label>
          <input
            type="date"
            value={formData.incidentDate || ''}
            max={today}
            onChange={(e) => handleFieldChange('incidentDate', e.target.value)}
            disabled={disabled}
            className={`
              w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${validationErrors.incidentDate && touched.incidentDate 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          />
          {validationErrors.incidentDate && touched.incidentDate && (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <AlertTriangle className="w-4 h-4" />
              {validationErrors.incidentDate}
            </div>
          )}
        </div>

        {/* Incident Time */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <Clock className="w-4 h-4 inline mr-1" />
            Incident Time *
          </label>
          <input
            type="time"
            value={formData.incidentTime || ''}
            onChange={(e) => handleFieldChange('incidentTime', e.target.value)}
            disabled={disabled}
            className={`
              w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${validationErrors.incidentTime && touched.incidentTime 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          />
          {validationErrors.incidentTime && touched.incidentTime && (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <AlertTriangle className="w-4 h-4" />
              {validationErrors.incidentTime}
            </div>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <MapPin className="w-4 h-4 inline mr-1" />
          Incident Location *
        </label>
        <input
          type="text"
          value={formData.incidentLocation || ''}
          onChange={(e) => handleFieldChange('incidentLocation', e.target.value)}
          placeholder="e.g., Main office reception area, Warehouse loading dock, Conference Room B"
          disabled={disabled}
          className={`
            w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${validationErrors.incidentLocation && touched.incidentLocation 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-300'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
        {validationErrors.incidentLocation && touched.incidentLocation && (
          <div className="flex items-center gap-1 text-sm text-red-600">
            <AlertTriangle className="w-4 h-4" />
            {validationErrors.incidentLocation}
          </div>
        )}
      </div>

      {/* Incident Description */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            <PenTool className="w-4 h-4 inline mr-1" />
            Incident Description *
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowWritingAssistance(!showWritingAssistance)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Lightbulb className="w-4 h-4" />
              Writing Tips
            </button>
            <div className={`
              text-sm px-2 py-1 rounded-full
              ${writingAssistance.isMinimumMet 
                ? 'bg-green-100 text-green-700' 
                : 'bg-amber-100 text-amber-700'
              }
            `}>
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
          className={`
            w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${validationErrors.incidentDescription && touched.incidentDescription 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-300'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
        
        {validationErrors.incidentDescription && touched.incidentDescription && (
          <div className="flex items-center gap-1 text-sm text-red-600">
            <AlertTriangle className="w-4 h-4" />
            {validationErrors.incidentDescription}
          </div>
        )}

        {/* Writing Assistance */}
        {showWritingAssistance && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Writing Assistance</h4>
            <div className="space-y-2 text-sm text-blue-800">
              {writingAssistance.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 mt-0.5 text-blue-600" />
                  <span>{suggestion}</span>
                </div>
              ))}
              {writingAssistance.suggestions.length === 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-700">Your description looks comprehensive!</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
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
          <label className="block text-sm font-medium text-gray-700">
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
          <label className="block text-sm font-medium text-gray-700">
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