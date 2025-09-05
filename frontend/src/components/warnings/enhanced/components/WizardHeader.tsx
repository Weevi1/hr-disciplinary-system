// frontend/src/components/warnings/enhanced/components/WizardHeader.tsx
// 🏆 PROFESSIONAL WIZARD HEADER COMPONENT
// Clean, reusable header with time tracking and controls

import React from 'react';
import { Award, X, Info } from 'lucide-react';
import type { WizardHeaderProps } from '@/types/warningWizard';

export const WizardHeader: React.FC<WizardHeaderProps> = ({
  timeSpent,
  estimatedTimeRemaining,
  showDebugger,
  onToggleDebugger,
  onCancel
}) => {
  // Format time display
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatEstimate = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `~${minutes}min left`;
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Left: Title and Description */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Award className="w-8 h-8" />
            Enhanced Warning Wizard
          </h1>
          <p className="text-blue-100 mt-2 text-lg">
            🏆 Progressive discipline with AI guidance and legal compliance
          </p>
        </div>
        
        {/* Right: Controls and Time */}
        <div className="flex items-center gap-4">
          {/* Time Tracking Display */}
          <div className="text-right">
            <div className="text-2xl font-bold">
              {formatTime(timeSpent)}
            </div>
            <div className="text-blue-100 text-sm">
              {formatEstimate(estimatedTimeRemaining)}
            </div>
          </div>
          
          {/* Debug Toggle (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={onToggleDebugger}
              className={`p-2 rounded-lg transition-colors ${
                showDebugger 
                  ? 'bg-white/20 text-white' 
                  : 'bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white'
              }`}
              title="Toggle Debug Panel"
            >
              <Info className="w-5 h-5" />
            </button>
          )}
          
          {/* Cancel Button */}
          <button
            onClick={onCancel}
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            title="Cancel and return to dashboard"
          >
            <X className="w-5 h-5" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
