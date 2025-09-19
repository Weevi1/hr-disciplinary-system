import Logger from '../../../../utils/logger';
// frontend/src/components/warnings/enhanced/steps/AudioConsentStep.tsx
// 🎯 AUDIO CONSENT STEP - INTEGRATED INTO WARNING WIZARD
// ✅ First step of the EnhancedWarningWizard
// ✅ Cannot be bypassed - recording is mandatory
// ✅ Clear legal disclosure and consent tracking

import React, { useState } from 'react';
import {
  Mic,
  Scale,
  Users,
  CheckSquare,
} from 'lucide-react';

// ============================================
// INTERFACES
// ============================================

interface AudioConsentStepProps {
  organizationName: string;
  managerName: string;
  onConsent: () => void;
}

// ============================================
// COMPONENT
// ============================================

export const AudioConsentStep: React.FC<AudioConsentStepProps> = ({
  organizationName,
  managerName,
  onConsent
}) => {

  // ============================================
  // STATE
  // ============================================
  
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  // ============================================
  // HANDLERS
  // ============================================
  
  const handleConsent = () => {
    if (isAcknowledged) {
      // Log consent for audit trail
      Logger.debug('🎤 Audio recording consent given by:', managerName);
      Logger.debug('🕐 Consent timestamp:', new Date().toISOString());
      
      onConsent();
    }
  };

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="space-y-6">
      
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      
      <div className="text-center pb-4 border-b border-gray-200">
        <div className="flex items-center justify-center mb-3">
          <div className="bg-red-100 p-3 rounded-full">
            <Mic className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Audio Recording Required
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          To proceed, you must consent to a mandatory audio recording for legal compliance and to protect all parties.
        </p>
      </div>

      {/* ============================================ */}
      {/* CONTENT */}
      {/* ============================================ */}
      
      <div className="space-y-6">
        
        {/* Purpose of Recording */}
        <div>
          <h3 className="flex items-center text-lg font-semibold text-gray-800 mb-4">
            <Scale className="w-5 h-5 text-indigo-600 mr-2" />
            Purpose of Recording
          </h3>
          <div className="space-y-3 ml-7">
            <div className="flex items-start gap-3">
              <CheckSquare className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Fair Procedure</p>
                <p className="text-gray-600 text-sm">Creates an objective record for quality and dispute resolution.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">Mutual Protection</p>
                <p className="text-gray-600 text-sm">Protects the rights of both employee and management.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Acknowledgment Section */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <label className="flex items-start gap-4 cursor-pointer">
            <input
              type="checkbox"
              checked={isAcknowledged}
              onChange={(e) => setIsAcknowledged(e.target.checked)}
              className="w-6 h-6 text-red-600 border-gray-300 rounded focus:ring-red-500 mt-1 flex-shrink-0"
              aria-label="Acknowledge and consent to audio recording"
            />
            <div className="flex-1">
              <span className="text-gray-900 font-medium">
                I agree to this mandatory audio recording and will inform all participants.
              </span>
              <div className="text-sm text-gray-600 mt-2">
                <p><strong>Organization:</strong> {organizationName}</p>
                <p><strong>Manager:</strong> {managerName}</p>
              </div>
            </div>
          </label>
        </div>

        {/* Continue Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={handleConsent}
            disabled={!isAcknowledged}
            className={`
              flex items-center gap-3 px-8 py-4 rounded-lg font-semibold text-lg transition-all
              ${isAcknowledged
                ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            <Mic className="w-5 h-5" />
            Agree & Continue to Warning Wizard
          </button>
        </div>
      </div>
    </div>
  );
};