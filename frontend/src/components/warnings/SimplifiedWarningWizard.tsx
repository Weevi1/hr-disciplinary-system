/**
 * 🚨 SIMPLIFIED WARNING WIZARD FOR 2012-ERA DEVICES
 * Lightweight version with minimal memory usage and simplified UI
 */

import React, { useState, useCallback, useRef } from 'react';
import { X, AlertTriangle, User, FileText, Send, Mic } from 'lucide-react';
import { Employee, WarningCategory } from '../../types/core';
import { globalDeviceCapabilities } from '../../utils/deviceDetection';
import { LegacyAudioFallback } from './LegacyAudioFallback';

interface SimplifiedWarningWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (warningData: any) => Promise<void>;
  selectedEmployee?: Employee | null;
  employees: Employee[];
  categories: WarningCategory[];
}

interface SimpleWarningData {
  employeeId: string;
  categoryId: string;
  description: string;
  managerNotes: string;
  deliveryMethod: 'hand_delivery' | 'email';
}

export const SimplifiedWarningWizard: React.FC<SimplifiedWarningWizardProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedEmployee,
  employees,
  categories
}) => {
  // Simple state management for legacy devices
  const [step, setStep] = useState<'form' | 'confirm' | 'loading'>('form');
  const [formData, setFormData] = useState<SimpleWarningData>({
    employeeId: selectedEmployee?.id || '',
    categoryId: '',
    description: '',
    managerNotes: '',
    deliveryMethod: 'hand_delivery'
  });
  const [error, setError] = useState<string>('');
  const [showAudioFallback, setShowAudioFallback] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Simple validation
  const isValid = formData.employeeId &&
                  formData.categoryId &&
                  formData.description.trim().length >= 10;

  const handleInputChange = useCallback((field: keyof SimpleWarningData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  }, [error]);

  const handleNext = useCallback(() => {
    if (!isValid) {
      setError('Please fill in all required fields');
      return;
    }
    setStep('confirm');
  }, [isValid]);

  const handleAudioText = useCallback((audioText: string) => {
    setFormData(prev => ({
      ...prev,
      managerNotes: prev.managerNotes
        ? `${prev.managerNotes}\n\n--- Audio Notes ---\n${audioText}`
        : `--- Audio Notes ---\n${audioText}`
    }));
    setShowAudioFallback(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isValid) return;

    setStep('loading');
    setError('');

    try {
      // Convert to format expected by main system
      const warningData = {
        employeeId: formData.employeeId,
        categoryId: formData.categoryId,
        incidentDescription: formData.description,
        managerNotes: formData.managerNotes,
        deliveryMethod: formData.deliveryMethod,
        audioRecording: null, // No audio for legacy devices
        signatures: {
          manager: null,
          employee: null
        },
        isLegacyDevice: true
      };

      await onSubmit(warningData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create warning');
      setStep('form');
    }
  }, [formData, isValid, onSubmit, onClose]);

  if (!isOpen) return null;

  const selectedEmployeeData = employees.find(emp => emp.id === formData.employeeId);
  const selectedCategoryData = categories.find(cat => cat.id === formData.categoryId);

  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 legacy-touch-target">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg w-full max-w-md shadow-lg legacy-simple-layout">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 legacy-text-size">
              {step === 'form' ? 'Issue Warning' :
               step === 'confirm' ? 'Confirm Warning' : 'Creating Warning...'}
            </h2>
            {step !== 'loading' && (
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 legacy-touch-target"
                type="button"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <AlertTriangle size={16} className="text-red-500 mr-2" />
                  <span className="text-sm text-red-700 legacy-text-size">{error}</span>
                </div>
              </div>
            )}

            {step === 'form' && (
              <form ref={formRef} className="space-y-4">
                {/* Employee Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 legacy-text-size">
                    <User size={16} className="inline mr-1" />
                    Employee *
                  </label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => handleInputChange('employeeId', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md legacy-touch-target legacy-text-size"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.profile?.firstName} {employee.profile?.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 legacy-text-size">
                    <AlertTriangle size={16} className="inline mr-1" />
                    Warning Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => handleInputChange('categoryId', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md legacy-touch-target legacy-text-size"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 legacy-text-size">
                    <FileText size={16} className="inline mr-1" />
                    Incident Description * (minimum 10 characters)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md legacy-text-size"
                    rows={4}
                    placeholder="Describe what happened..."
                    required
                    minLength={10}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/10 minimum
                  </div>
                </div>

                {/* Manager Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 legacy-text-size">
                    Manager Notes (optional)
                  </label>
                  <textarea
                    value={formData.managerNotes}
                    onChange={(e) => handleInputChange('managerNotes', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md legacy-text-size"
                    rows={2}
                    placeholder="Additional notes or context..."
                  />
                </div>

                {/* Audio Recording Option */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 legacy-text-size">
                    Audio Documentation (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAudioFallback(true)}
                    className="w-full p-3 border border-gray-300 rounded-md flex items-center justify-center gap-2 hover:bg-gray-50 legacy-touch-target legacy-text-size"
                  >
                    <Mic size={16} />
                    <span>Add Voice Notes</span>
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    Record or document verbal discussion with alternative methods
                  </p>
                </div>

                {/* Delivery Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 legacy-text-size">
                    Delivery Method
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="hand_delivery"
                        checked={formData.deliveryMethod === 'hand_delivery'}
                        onChange={(e) => handleInputChange('deliveryMethod', e.target.value)}
                        className="mr-2"
                      />
                      <span className="legacy-text-size">Hand Delivery (Recommended)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value="email"
                        checked={formData.deliveryMethod === 'email'}
                        onChange={(e) => handleInputChange('deliveryMethod', e.target.value)}
                        className="mr-2"
                      />
                      <span className="legacy-text-size">Email</span>
                    </label>
                  </div>
                </div>
              </form>
            )}

            {step === 'confirm' && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="font-medium text-blue-900 mb-2 legacy-text-size">Review Warning Details</h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p><strong>Employee:</strong> {selectedEmployeeData?.profile?.firstName} {selectedEmployeeData?.profile?.lastName}</p>
                    <p><strong>Category:</strong> {selectedCategoryData?.name}</p>
                    <p><strong>Description:</strong> {formData.description}</p>
                    {formData.managerNotes && (
                      <p><strong>Notes:</strong> {formData.managerNotes}</p>
                    )}
                    <p><strong>Delivery:</strong> {formData.deliveryMethod === 'hand_delivery' ? 'Hand Delivery' : 'Email'}</p>
                  </div>
                </div>

                <div className="bg-yellow-50 p-3 rounded-md">
                  <div className="flex items-center">
                    <AlertTriangle size={16} className="text-yellow-600 mr-2" />
                    <span className="text-sm text-yellow-800 legacy-text-size">
                      This warning will be permanently recorded in the employee's file.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {step === 'loading' && (
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 legacy-text-size">Creating warning document...</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {step !== 'loading' && (
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-3">
              {step === 'form' && (
                <>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 legacy-touch-target legacy-text-size"
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!isValid}
                    className={`px-4 py-2 rounded-md legacy-touch-target legacy-text-size ${
                      isValid
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    type="button"
                  >
                    Review
                  </button>
                </>
              )}

              {step === 'confirm' && (
                <>
                  <button
                    onClick={() => setStep('form')}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 legacy-touch-target legacy-text-size"
                    type="button"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 legacy-touch-target legacy-text-size"
                    type="button"
                  >
                    <Send size={16} className="inline mr-1" />
                    Issue Warning
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Audio Fallback Modal */}
      {showAudioFallback && (
        <LegacyAudioFallback
          onTextSubmit={handleAudioText}
          onClose={() => setShowAudioFallback(false)}
          employeeName={selectedEmployeeData?.profile?.firstName}
        />
      )}
    </div>
  );
};