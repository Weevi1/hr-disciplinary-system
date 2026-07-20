// SetupChecklist.tsx - "Getting Started" card shown on the HR dashboard's
// Urgent Tasks tab for new organizations. Presentational only: the parent
// decides which steps are visible and persists skips.
import React from 'react';
import { ArrowRight, Building2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type SetupStepKey = 'departments' | 'employees' | 'categories' | 'practiceWarning';

export interface SetupStep {
  key: SetupStepKey;
  title: string;
  description: string;
  icon: LucideIcon;
  // Tailwind classes for the icon tile and step badge (e.g. 'bg-blue-100', 'text-blue-600')
  tileClass: string;
  iconClass: string;
  badgeClass: string;
  onClick: () => void;
}

interface SetupChecklistProps {
  steps: SetupStep[];
  onSkip: (key: SetupStepKey) => void;
}

export const SetupChecklist: React.FC<SetupChecklistProps> = ({ steps, onSkip }) => {
  if (steps.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-blue-200 shadow-sm">
      <div className="p-4 border-b border-blue-100 bg-blue-50">
        <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Getting Started - Setup Your Organization
        </h3>
        <p className="text-sm text-blue-700 mt-1">Complete these steps to get your HR system ready</p>
      </div>
      <div className="divide-y divide-gray-100">
        {steps.map((step, index) => (
          <div
            key={step.key}
            className="p-4 hover:bg-gray-50 cursor-pointer"
            onClick={step.onClick}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-10 h-10 ${step.tileClass} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <step.icon className={`w-5 h-5 ${step.iconClass}`} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{step.title}</div>
                  <div className="text-sm text-gray-600">{step.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSkip(step.key);
                  }}
                  className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  title="Skip this step"
                >
                  Skip
                </button>
                <span className={`${step.badgeClass} text-xs px-2 py-1 rounded-full font-medium`}>
                  Step {index + 1}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SetupChecklist;
