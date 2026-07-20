// frontend/src/components/auth/FirstTimeWelcomeModal.tsx
// Award-winning first-time login welcome modal with role-specific guidance
// 🎨 Modern design with gradients, animations, and polished interactions
// ✨ Inspired by Linear, Stripe, Vercel, and Notion's onboarding experiences

import React, { useState, useEffect } from 'react';
import { Key, ArrowRight } from 'lucide-react';
import { UnifiedModal } from '../common/UnifiedModal';
import { getRoleContent } from '../../config/roleContent';
import { UserRoleId, HODPermissions } from '../../types/core';

interface FirstTimeWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userRole: UserRoleId;
  onConfirm: () => void;
  hodPermissions?: HODPermissions; // Optional: For HOD managers to show dynamic features
}

// Animation keyframes for entrance
const fadeInUp = {
  initial: { opacity: 0, transform: 'translateY(20px)' },
  animate: { opacity: 1, transform: 'translateY(0px)' }
};

export const FirstTimeWelcomeModal: React.FC<FirstTimeWelcomeModalProps> = ({
  isOpen,
  onClose,
  userName,
  userRole,
  onConfirm,
  hodPermissions
}) => {
  const [acknowledged, setAcknowledged] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const roleContent = getRoleContent(userRole, hodPermissions);

  // Mobile breakpoint detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Trigger animation on mount
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimated(true), 50);
    } else {
      setIsAnimated(false);
    }
  }, [isOpen]);

  // Handle Enter key to submit
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && acknowledged && isOpen) {
        handleConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [acknowledged, isOpen]);

  const handleConfirm = () => {
    if (dontShowAgain) {
      onConfirm();
    }
    onClose();
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={() => {}} // Prevent closing until acknowledged
      title=""
      size="sm"
      className="first-time-welcome-modal"
      hideHeader={true}
    >
      {/* Professional Compact Content */}
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
            style={{
              backgroundColor: roleContent.primaryColor,
              opacity: 0.12
            }}
          >
            <div style={{ color: roleContent.primaryColor }}>
              <roleContent.icon className="w-5 h-5" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-0.5">
              Welcome, {userName}!
            </h2>
            <p className="text-sm text-gray-500">
              {roleContent.title}
            </p>
          </div>
        </div>

        {/* Key Features - Compact List */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
            Your Capabilities
          </h3>
          <div className="space-y-2">
            {roleContent.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2.5 text-sm text-gray-700">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: roleContent.primaryColor }}
                />
                <span className="leading-tight">{feature.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Password Notice - Compact */}
        <div className="flex items-start gap-2.5 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <Key className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-orange-900 leading-relaxed">
              <strong className="font-semibold">Change your password:</strong> If using temporary password <code className="px-1.5 py-0.5 bg-orange-100 rounded text-[10px] font-mono font-medium">temp123</code>, update it via <span className="font-medium">Profile → Reset Password</span>
            </p>
          </div>
        </div>

        {/* Acknowledgment */}
        <div className="space-y-2.5 pt-3 border-t border-gray-200">
          <label className="flex items-start gap-3 cursor-pointer group hover:opacity-80 transition-opacity">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0 transition-all"
              style={{
                accentColor: roleContent.primaryColor
              }}
            />
            <span className="text-sm text-gray-700 leading-relaxed">
              I understand my role and will change my password if needed
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group hover:opacity-80 transition-opacity">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0 transition-all"
              style={{
                accentColor: roleContent.primaryColor
              }}
            />
            <span className="text-sm text-gray-700 leading-relaxed">
              Don't show this message again
            </span>
          </label>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-3">
          <button
            onClick={handleConfirm}
            disabled={!acknowledged}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all shadow-sm hover:shadow-md disabled:shadow-none"
            style={{
              backgroundColor: acknowledged ? roleContent.primaryColor : '#e5e7eb',
              color: acknowledged ? 'white' : '#9ca3af',
              cursor: acknowledged ? 'pointer' : 'not-allowed',
              opacity: acknowledged ? 1 : 0.6
            }}
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </UnifiedModal>
  );
};
