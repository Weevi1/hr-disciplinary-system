import Logger from '../../../../utils/logger';
// frontend/src/components/warnings/enhanced/modals/AudioConsentModal.tsx
// 🎯 MANDATORY AUDIO CONSENT MODAL
// ✅ Appears before warning wizard opens
// ✅ Cannot be bypassed - recording is mandatory
// ✅ Clear legal disclosure and consent tracking

import React, { useState } from 'react';
import { usePreventBodyScroll } from '../../../../hooks/usePreventBodyScroll';
import { Z_INDEX } from '../../../../constants/zIndex';
import {
  Mic,
  X,
  Scale,
  Users,
  CheckSquare,
} from 'lucide-react';

// ============================================
// INTERFACES
// ============================================

interface AudioConsentModalProps {
  isOpen: boolean;
  organizationName: string;
  managerName: string;
  onConsent: () => void;
  onCancel: () => void;
}

// ============================================
// COMPONENT
// ============================================

export const AudioConsentModal: React.FC<AudioConsentModalProps> = ({
  isOpen,
  organizationName,
  managerName,
  onConsent,
  onCancel
}) => {

  // Prevent body scroll when modal is open
  usePreventBodyScroll(isOpen);

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
      Logger.debug('🎤 Audio recording consent given by:', managerName)
      Logger.debug('🕐 Consent timestamp:', new Date().toISOString());
      
      onConsent();
    }
  };

  const handleCancel = () => {
    Logger.debug('❌ Audio recording consent declined by:', managerName)
    onCancel();
  };

  // ============================================
  // RENDER
  // ============================================
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4" style={{ zIndex: Z_INDEX.modal }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* ============================================ */}
        {/* HEADER (Condensed) */}
        {/* ============================================ */}
        
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 sm:px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-3 text-lg font-bold text-white">
              <Mic className="w-5 h-5" />
              Audio Recording Required
            </h2>
            <button
              onClick={handleCancel}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              title="Cancel and return to dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================ */}
        {/* CONTENT (Hyper-Condensed) */}
        {/* ============================================ */}
        
        <div className="p-4 sm:p-5 overflow-y-auto">
          
          <p className="text-gray-700 mb-4 leading-relaxed text-sm">
            To proceed, you must consent to a mandatory audio recording for legal compliance and to protect all parties.
          </p>

          <div className="space-y-4">
            {/* Why is this recorded? */}
            <div>
              <h3 className="flex items-center text-base font-semibold text-gray-800 mb-2">
                <Scale className="w-4 h-4 text-indigo-600 mr-2" />
                Purpose of Recording
              </h3>
              <div className="space-y-2 text-indigo-800 text-sm pl-1">
                <div className="flex items-start gap-2.5">
                  <CheckSquare className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <p><strong>Fair Procedure:</strong> Creates an objective record for quality and dispute resolution.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <Users className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <p><strong>Mutual Protection:</strong> Protects the rights of both employee and management.</p>
                </div>
              </div>
            </div>

            {/* Acknowledgment Section (Single Checkbox) */}
            <div className="pt-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAcknowledged}
                  onChange={(e) => setIsAcknowledged(e.target.checked)}
                  className="w-6 h-6 text-red-600 border-gray-400 rounded focus:ring-red-500 mt-0.5 flex-shrink-0"
                  aria-label="Acknowledge and consent to audio recording"
                />
                <span className="text-sm text-gray-800">
                  I agree to this mandatory audio recording and will inform all participants.
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* FOOTER (Responsive & Condensed) */}
        {/* ============================================ */}
        
        <div className="border-t border-gray-200 px-4 sm:px-5 py-3 bg-gray-50 flex-shrink-0">
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            
            <div className="text-xs text-gray-500 text-center sm:text-left">
              <p><strong>{organizationName}</strong></p>
              <p>Manager: {managerName}</p>
            </div>

            <div className="flex w-full sm:w-auto items-center gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 sm:flex-none px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConsent}
                disabled={!isAcknowledged}
                className={`
                  flex flex-1 sm:flex-none items-center justify-center gap-2 px-5 py-2 rounded-lg font-semibold transition-all
                  ${isAcknowledged
                    ? 'bg-red-600 text-white hover:bg-red-700 shadow-md'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                <Mic className="w-4 h-4" />
                Agree & Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};