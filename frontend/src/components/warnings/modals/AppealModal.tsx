// frontend/src/components/warnings/modals/AppealModal.tsx
// 🇿🇦 SOUTH AFRICAN LABOUR LAW COMPLIANT APPEAL PROCESS
// ✅ Meets CCMA and LRA requirements for written warning appeals
// ✅ User-friendly but legally compliant

import React, { useState, useCallback } from 'react';
import { usePreventBodyScroll } from '../../../hooks/usePreventBodyScroll';
import { useModalDialog } from '../../../hooks/useFocusTrap';
import { Z_INDEX } from '../../../constants/zIndex';
import {
  X,
  FileText,
  AlertTriangle,
  Info,
  Calendar,
  User,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface AppealModalProps {
  isOpen: boolean;
  onClose: () => void;
  warning: {
    id: string;
    employeeName: string;
    category: string;
    level: string;
    issueDate: any; // Could be Date or Firestore timestamp
    description: string;
  };
  onAppealSubmit: (appealData: {
    warningId: string;
    grounds: string;
    additionalDetails: string;
    requestedOutcome: string;
  }) => Promise<void>;
}

// Legal grounds for appeal based on SA labour law
const APPEAL_GROUNDS = [
  {
    value: 'procedural_unfair',
    label: 'Procedural Unfairness',
    description: 'The disciplinary process was not followed correctly'
  },
  {
    value: 'substantive_unfair', 
    label: 'Substantive Unfairness',
    description: 'The warning was not justified by the facts'
  },
  {
    value: 'bias_prejudice',
    label: 'Bias or Prejudice',
    description: 'The decision was influenced by bias or unfair treatment'
  },
  {
    value: 'insufficient_evidence',
    label: 'Insufficient Evidence',
    description: 'Not enough evidence to support the warning'
  },
  {
    value: 'inconsistent_treatment',
    label: 'Inconsistent Treatment',
    description: 'Others were treated differently for similar conduct'
  },
  {
    value: 'other',
    label: 'Other Grounds',
    description: 'Different reason (explain in details below)'
  }
];

export const AppealModal: React.FC<AppealModalProps> = ({
  isOpen,
  onClose,
  warning,
  onAppealSubmit
}) => {
  const [selectedGrounds, setSelectedGrounds] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [requestedOutcome, setRequestedOutcome] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent body scroll when modal is open
  usePreventBodyScroll(isOpen);

  // Set up focus trap and ARIA
  const { containerRef, ariaProps } = useModalDialog({
    isOpen,
    onClose,
    titleId: 'appeal-modal-title',
    descriptionId: 'appeal-modal-description',
  });

  // Calculate appeal deadline (30 days from issue date)
  const issueDate = warning.issueDate?.seconds 
    ? new Date(warning.issueDate.seconds * 1000)
    : new Date(warning.issueDate);
  
  const appealDeadline = new Date(issueDate);
  appealDeadline.setDate(appealDeadline.getDate() + 30);

  const handleSubmit = useCallback(async () => {
    if (!selectedGrounds) {
      setError('Please select grounds for your appeal');
      return;
    }

    if (!additionalDetails.trim()) {
      setError('Please provide details explaining your appeal');
      return;
    }

    if (!requestedOutcome.trim()) {
      setError('Please specify what outcome you are requesting');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onAppealSubmit({
        warningId: warning.id,
        grounds: selectedGrounds,
        additionalDetails: additionalDetails.trim(),
        requestedOutcome: requestedOutcome.trim()
      });
      
      // Modal will close from parent component after successful submission
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit appeal');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedGrounds, additionalDetails, requestedOutcome, onAppealSubmit, warning.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: Z_INDEX.modal }}>
      <div
        ref={containerRef}
        {...ariaProps}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
      >

        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-700 p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 id="appeal-modal-title" className="text-xl font-bold">
                  Appeal Disciplinary Warning
                </h2>
                <p id="appeal-modal-description" className="text-sm opacity-90">
                  Submit formal appeal as per Labour Relations Act
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Close appeal modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 flex-1 overflow-y-auto min-h-0">
          
          {/* Warning Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Warning Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Employee:</span>
                <div className="font-medium">{warning.employeeName}</div>
              </div>
              <div>
                <span className="text-gray-600">Warning Level:</span>
                <div className="font-medium capitalize">{warning.level.replace('_', ' ')}</div>
              </div>
              <div>
                <span className="text-gray-600">Category:</span>
                <div className="font-medium">{warning.category}</div>
              </div>
              <div>
                <span className="text-gray-600">Issue Date:</span>
                <div className="font-medium">{issueDate.toLocaleDateString()}</div>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-gray-600 text-sm">Description:</span>
              <div className="text-sm mt-1 p-2 bg-white rounded border">
                {warning.description}
              </div>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-800 font-medium mb-2">Your Appeal Rights</p>
                <ul className="text-blue-700 space-y-1 text-xs">
                  <li>• Appeals must be submitted within <strong>30 days</strong> of the warning (deadline: {appealDeadline.toLocaleDateString()})</li>
                  <li>• You have the right to fair treatment under the Labour Relations Act</li>
                  <li>• All internal procedures must be exhausted before CCMA referral</li>
                  <li>• You may be assisted by a shop steward or fellow employee</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Appeal Form */}
          <div className="space-y-6">
            
            {/* Grounds for Appeal */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Grounds for Appeal *
              </label>
              <div className="space-y-2">
                {APPEAL_GROUNDS.map((ground) => (
                  <label key={ground.value} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="appealGrounds"
                      value={ground.value}
                      checked={selectedGrounds === ground.value}
                      onChange={(e) => setSelectedGrounds(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-sm text-gray-900">{ground.label}</div>
                      <div className="text-xs text-gray-600">{ground.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Details */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Appeal Details *
              </label>
              <p className="text-xs text-gray-600 mb-3">
                Explain in detail why you believe the warning is unfair and what evidence supports your appeal.
              </p>
              <textarea
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                placeholder="Provide specific facts, dates, witnesses, and any other relevant information that supports your appeal..."
              />
            </div>

            {/* Requested Outcome */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Requested Outcome *
              </label>
              <p className="text-xs text-gray-600 mb-3">
                Specify what you would like to happen if your appeal is successful.
              </p>
              <textarea
                value={requestedOutcome}
                onChange={(e) => setRequestedOutcome(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                placeholder="E.g., 'Remove warning from my record', 'Reduce warning level', 'Replace with verbal counselling', etc."
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Appeal deadline: {appealDeadline.toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedGrounds || !additionalDetails.trim() || !requestedOutcome.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting Appeal...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Submit Appeal
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};