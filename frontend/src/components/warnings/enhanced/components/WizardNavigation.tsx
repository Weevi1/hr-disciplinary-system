// frontend/src/components/warnings/enhanced/components/WizardNavigation.tsx
// 🏆 SMART WIZARD NAVIGATION COMPONENT
// Intelligent navigation with context-aware buttons

import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { WizardStep } from '@/types/warningWizard';
import type { WizardNavigationProps } from '@/types/warningWizard';
import { LoadingSpinner } from '@/components/common/LoadingComponents';

export const WizardNavigation: React.FC<WizardNavigationProps> = ({
  currentStep,
  isStepValid,
  isSubmitting,
  onPrevious,
  onNext,
  onProceedToSignatures
}) => {
  
  // Determine if we can go back
  const canGoBack = currentStep > WizardStep.EMPLOYEE_SELECTION;
  
  // Determine button text and action based on current step
  const getNextButtonConfig = () => {
    switch (currentStep) {
      case WizardStep.LEGAL_REVIEW:
        return {
          text: '🏆 Proceed to Signatures',
          action: onProceedToSignatures,
          className: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700',
          isSpecial: true
        };
      case WizardStep.SIGNATURE_COLLECTION:
      case WizardStep.DELIVERY_COMPLETION:
        return null; // These steps handle their own navigation
      default:
        return {
          text: 'Continue',
          action: onNext,
          className: 'bg-blue-600 hover:bg-blue-700',
          isSpecial: false
        };
    }
  };

  const nextButtonConfig = getNextButtonConfig();
  const showNextButton = nextButtonConfig !== null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center">
        {/* Previous Button */}
        <button
          onClick={onPrevious}
          disabled={!canGoBack}
          className={`flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg transition-colors ${
            canGoBack
              ? 'text-gray-600 hover:bg-gray-50 hover:border-gray-400'
              : 'text-gray-400 cursor-not-allowed opacity-50'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
          Previous
        </button>

        {/* Step Info */}
        <div className="text-center">
          <div className="text-sm text-gray-500">
            Step {currentStep} of {Object.keys(WizardStep).length / 2}
          </div>
          {!isStepValid && (
            <div className="text-xs text-red-600 mt-1">
              Complete required fields to continue
            </div>
          )}
        </div>

        {/* Next/Action Button */}
        <div className="flex items-center gap-4">
          {showNextButton && nextButtonConfig && (
            <button
              onClick={nextButtonConfig.action}
              disabled={!isStepValid || isSubmitting}
              className={`flex items-center gap-2 px-8 py-3 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${nextButtonConfig.className}`}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="small" />
                  Processing...
                </>
              ) : (
                <>
                  {nextButtonConfig.text}
                  {!nextButtonConfig.isSpecial && <ArrowRight className="w-5 h-5" />}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mt-4 flex items-center justify-center">
        <div className="flex space-x-2">
          {Array.from({ length: Object.keys(WizardStep).length / 2 }, (_, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;
            
            return (
              <div
                key={stepNumber}
                className={`w-2 h-2 rounded-full transition-colors ${
                  isActive
                    ? 'bg-blue-500'
                    : isCompleted
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Helpful Hints */}
      <div className="mt-4 text-center">
        {currentStep === WizardStep.EMPLOYEE_SELECTION && (
          <p className="text-sm text-gray-600">
            💡 Select an employee to begin the progressive discipline process
          </p>
        )}
        {currentStep === WizardStep.CATEGORY_ANALYSIS && (
          <p className="text-sm text-gray-600">
            🧠 AI will analyze the best escalation path based on employee history
          </p>
        )}
        {currentStep === WizardStep.INCIDENT_DETAILS && (
          <p className="text-sm text-gray-600">
            📝 Document facts objectively - this will be part of the legal record
          </p>
        )}
        {currentStep === WizardStep.LEGAL_REVIEW && (
          <p className="text-sm text-gray-600">
            ⚖️ Review AI recommendations and legal compliance requirements
          </p>
        )}
        {currentStep === WizardStep.SIGNATURE_COLLECTION && (
          <p className="text-sm text-gray-600">
            ✍️ Collect digital signatures for legal compliance
          </p>
        )}
        {currentStep === WizardStep.DELIVERY_COMPLETION && (
          <p className="text-sm text-gray-600">
            🚀 Choose delivery method and complete the warning process
          </p>
        )}
      </div>

      {/* Keyboard Shortcuts Hint */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-center text-xs text-gray-400">
          💡 Press Ctrl+Enter to continue, Ctrl+← to go back
        </div>
      )}
    </div>
  );
};
