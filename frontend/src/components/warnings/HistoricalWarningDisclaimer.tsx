// frontend/src/components/warnings/HistoricalWarningDisclaimer.tsx
// 📄 Historical Warning Disclaimer Component
// Prominent warning message for manually entered warnings from physical documents

import React from 'react';
import { AlertTriangle, FileText, Shield } from 'lucide-react';
import { ThemedCard } from '../common/ThemedCard';

interface HistoricalWarningDisclaimerProps {
  physicalCopyLocation?: string;
  className?: string;
}

export const HistoricalWarningDisclaimer: React.FC<HistoricalWarningDisclaimerProps> = ({
  physicalCopyLocation,
  className = ''
}) => {
  return (
    <ThemedCard className={`bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-500 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-amber-900 dark:text-amber-100">
              ⚠️ IMPORTANT: Physical Copy Required
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
              This warning was entered manually from a physical document
            </p>
          </div>
        </div>

        {/* What's Missing */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-300 dark:border-amber-700">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            The system does NOT have:
          </p>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">✗</span>
              <span>Digital signatures from manager and employee</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">✗</span>
              <span>Audio recording of the disciplinary meeting</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">✗</span>
              <span>PDF document with QR code verification</span>
            </li>
          </ul>
        </div>

        {/* Legal Requirements */}
        <div className="bg-amber-100 dark:bg-amber-900/40 rounded-lg p-4 border border-amber-400 dark:border-amber-600">
          <div className="flex items-start gap-2 mb-2">
            <Shield className="w-5 h-5 text-amber-700 dark:text-amber-300 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              Legal Compliance Requirement:
            </p>
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-200 ml-7">
            You <strong>MUST</strong> keep the original signed physical document safe and accessible
            for potential legal proceedings or CCMA hearings. This digital record is supplementary only.
          </p>
        </div>

        {/* Physical Copy Location */}
        {physicalCopyLocation && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-300 dark:border-amber-700">
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Physical Copy Location:
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded border border-gray-200 dark:border-gray-700">
                  {physicalCopyLocation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="text-xs text-amber-700 dark:text-amber-300 italic border-t border-amber-300 dark:border-amber-700 pt-3">
          <p>
            <strong>Note:</strong> Historical entries are fully integrated with the escalation system
            and will count toward the employee's progressive discipline record.
          </p>
        </div>
      </div>
    </ThemedCard>
  );
};

export default HistoricalWarningDisclaimer;