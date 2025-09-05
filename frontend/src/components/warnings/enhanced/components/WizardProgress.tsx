// frontend/src/components/warnings/enhanced/components/WizardProgress.tsx
// 🏆 PREMIUM WIZARD PROGRESS - UPDATED TO MATCH NEW MOBILE DESIGN
// ✅ Mobile view is now larger and more prominent.
// ✅ Desktop view is unchanged.

import React from 'react';
import { 
  User, 
  Brain, 
  FileText, 
  Scale, 
  PenTool, 
  Send,
  CheckCircle,
  AlertTriangle,
  X,
  ArrowLeft
} from 'lucide-react';
import { WizardStep, STEP_CONFIG } from '@/types/warningWizard';
import type { WizardProgressProps } from '@/types/warningWizard';

const STEP_ICONS = { User, Brain, FileText, Scale, PenTool, Send };

interface UpdatedWizardProgressProps extends Omit<WizardProgressProps, 'timeSpent' | 'estimatedTimeRemaining'> {
  onCancel: () => void;
}

export const WizardProgress: React.FC<UpdatedWizardProgressProps> = ({
  currentStep,
  completedSteps,
  isStepValid,
  onStepClick,
  onCancel
}) => {
  const progressPercentage = ((completedSteps.size + (isStepValid ? 1 : 0.5)) / Object.keys(STEP_CONFIG).length) * 100;

  return (
    <div className="bg-gray-50 md:bg-white md:shadow-sm md:border-b md:border-gray-200">
      {/* 📱 MOBILE: Larger, more prominent design from screenshot */}
      <div className="md:hidden bg-white shadow-md">
        {/* Purple Gradient Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onCancel}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <span className="text-base font-semibold">Warning Wizard</span>
                <span className="text-sm text-purple-200 ml-2">
                  Step {currentStep}/{Object.keys(STEP_CONFIG).length}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{Math.round(progressPercentage)}%</div>
            </div>
          </div>
          
          {/* Progress Bar within Header */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-1.5">
            <div className="bg-white/20 rounded-full h-1">
              <div 
                className="bg-white rounded-full h-1 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Larger Step Indicators */}
        <div className="px-4 py-4">
          <div className="flex justify-center space-x-2">
            {Object.entries(STEP_CONFIG).map(([stepNum]) => {
              const stepNumber = parseInt(stepNum) as WizardStep;
              const isCompleted = completedSteps.has(stepNumber);
              const isCurrent = currentStep === stepNumber;
              
              return (
                <div
                  key={stepNumber}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    isCurrent 
                      ? 'bg-purple-600 text-white' 
                      : isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isCompleted ? '✓' : stepNumber}
                </div>
              );
            })}
          </div>
        </div>

        {/* Validation Warning - Mobile */}
        {!isStepValid && (
          <div className="px-4 pb-3">
            <div className="bg-red-50 p-2 rounded-lg flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-xs text-red-800 font-medium">
                Complete required fields to continue
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 🖥️ DESKTOP: Compact Single Row (Unchanged) */}
      <div className="hidden md:block">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onCancel}
                className="flex items-center space-x-2 px-3 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white">
                  {React.createElement(
                    STEP_ICONS[STEP_CONFIG[currentStep]?.icon as keyof typeof STEP_ICONS] || User,
                    { className: "w-3 h-3" }
                  )}
                </div>
                <span className="font-semibold text-gray-900 text-sm">
                  {STEP_CONFIG[currentStep]?.title}
                </span>
                <span className="text-xs text-gray-500">
                  ({currentStep}/{Object.keys(STEP_CONFIG).length})
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                {Object.entries(STEP_CONFIG).map(([stepNum]) => {
                  const stepNumber = parseInt(stepNum) as WizardStep;
                  const isCompleted = completedSteps.has(stepNumber);
                  const isCurrent = currentStep === stepNumber;
                  const isAccessible = stepNumber <= currentStep || completedSteps.has(stepNumber);
                  
                  return (
                    <button
                      key={stepNumber}
                      onClick={() => isAccessible ? onStepClick(stepNumber) : null}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                        isCurrent 
                          ? 'bg-purple-500 text-white' 
                          : isCompleted 
                            ? 'bg-green-500 text-white hover:bg-green-600' 
                            : isAccessible
                              ? 'bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-pointer'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={!isAccessible}
                      title={STEP_CONFIG[stepNumber]?.title}
                    >
                      {isCompleted ? <CheckCircle className="w-3 h-3" /> : stepNumber}
                    </button>
                  );
                })}
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-purple-600">
                  {Math.round(progressPercentage)}%
                </div>
              </div>
            </div>
          </div>
          {!isStepValid && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-800 font-medium">
                  Complete required fields to continue
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};