// frontend/src/components/warnings/modals/AppealReviewModal.tsx
// 🏛️ COMPREHENSIVE HR APPEAL REVIEW SYSTEM
// ✅ SA Labour Law Compliant Appeal Decision Process
// ✅ Professional HR Decision Tools with Documentation

import React, { useState, useCallback } from 'react';
import {
  X,
  Scale,
  FileText,
  AlertTriangle,
  CheckCircle,
  Edit3,
  Calendar,
  User,
  Building,
  Clock,
  MessageCircle,
  Save,
  Eye,
  Info,
  Gavel,
  Shield,
  TrendingDown,
  RefreshCw
} from 'lucide-react';

interface AppealReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  warning: {
    id: string;
    employeeName: string;
    employeeNumber: string;
    department: string;
    category: string;
    level: string;
    issueDate: any;
    description: string;
    status: string;
    appealDetails?: {
      grounds: string;
      additionalDetails: string;
      requestedOutcome: string;
      submittedBy: string;
      submittedDate: any;
    };
  };
  onDecisionSubmit: (decisionData: {
    warningId: string;
    decision: 'upheld' | 'overturned' | 'modified' | 'reduced';
    reasoning: string;
    newLevel?: string;
    newDescription?: string;
    hrNotes: string;
    followUpRequired: boolean;
    followUpDate?: Date;
  }) => Promise<void>;
}

// Decision options for HR
const DECISION_OPTIONS = [
  {
    value: 'upheld',
    label: 'Uphold Warning',
    icon: Shield,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: 'Warning is justified and remains unchanged'
  },
  {
    value: 'reduced',
    label: 'Reduce Warning Level',
    icon: TrendingDown,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    description: 'Warning is justified but level should be reduced'
  },
  {
    value: 'modified',
    label: 'Modify Warning',
    icon: Edit3,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Warning content needs modification'
  },
  {
    value: 'overturned',
    label: 'Overturn Warning',
    icon: RefreshCw,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    description: 'Warning is not justified and should be removed'
  }
];

// Warning level options for reduction/modification
const WARNING_LEVELS = [
  { value: 'counselling', label: 'Counselling', severity: 1 },
  { value: 'verbal', label: 'Verbal Warning', severity: 2 },
  { value: 'first_written', label: 'First Written Warning', severity: 3 },
  { value: 'second_written', label: 'Second Written Warning', severity: 4 },
  { value: 'final_written', label: 'Final Written Warning', severity: 5 }
];

// Appeal grounds labels
const APPEAL_GROUNDS_LABELS: Record<string, string> = {
  'procedural_unfair': 'Procedural Unfairness',
  'substantive_unfair': 'Substantive Unfairness',
  'bias_prejudice': 'Bias or Prejudice',
  'insufficient_evidence': 'Insufficient Evidence',
  'inconsistent_treatment': 'Inconsistent Treatment',
  'other': 'Other Grounds'
};

export const AppealReviewModal: React.FC<AppealReviewModalProps> = ({
  isOpen,
  onClose,
  warning,
  onDecisionSubmit
}) => {
  const [selectedDecision, setSelectedDecision] = useState<string>('');
  const [reasoning, setReasoning] = useState('');
  const [hrNotes, setHrNotes] = useState('');
  const [newLevel, setNewLevel] = useState(warning.level);
  const [newDescription, setNewDescription] = useState(warning.description);
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format date helper
  const formatDate = (date: any) => {
    if (!date) return 'Unknown';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle decision submission
  const handleSubmit = useCallback(async () => {
    if (!selectedDecision || !reasoning.trim()) {
      alert('Please select a decision and provide reasoning.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onDecisionSubmit({
        warningId: warning.id,
        decision: selectedDecision as any,
        reasoning: reasoning.trim(),
        newLevel: selectedDecision === 'reduced' || selectedDecision === 'modified' ? newLevel : undefined,
        newDescription: selectedDecision === 'modified' ? newDescription : undefined,
        hrNotes: hrNotes.trim(),
        followUpRequired,
        followUpDate: followUpRequired && followUpDate ? new Date(followUpDate) : undefined
      });

      onClose();
    } catch (error) {
      console.error('Failed to submit appeal decision:', error);
      alert('Failed to submit decision. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedDecision, reasoning, hrNotes, newLevel, newDescription, followUpRequired, followUpDate, warning.id, onDecisionSubmit, onClose]);

  // Get current warning level severity for comparison
  const currentSeverity = WARNING_LEVELS.find(l => l.value === warning.level)?.severity || 0;
  const availableReductions = WARNING_LEVELS.filter(l => l.severity < currentSeverity);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Scale className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Appeal Review</h2>
              <p className="text-sm text-gray-600">Review and decide on employee appeal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Warning Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-600" />
              Original Warning Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Employee:</span>
                  <span className="text-sm">{warning.employeeName} ({warning.employeeNumber})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Department:</span>
                  <span className="text-sm">{warning.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Issue Date:</span>
                  <span className="text-sm">{formatDate(warning.issueDate)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Category:</span>
                  <span className="text-sm ml-2">{warning.category}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">Level:</span>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    warning.level === 'final_written' ? 'bg-red-100 text-red-800' :
                    warning.level === 'second_written' ? 'bg-orange-100 text-orange-800' :
                    warning.level === 'first_written' ? 'bg-yellow-100 text-yellow-800' :
                    warning.level === 'verbal' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {WARNING_LEVELS.find(l => l.value === warning.level)?.label || warning.level}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Description:</span>
                  <p className="text-sm mt-1 text-gray-700">{warning.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Appeal Details */}
          {warning.appealDetails && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                Employee's Appeal
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Appeal Grounds:</span>
                  <p className="text-sm mt-1 px-3 py-2 bg-white rounded border">
                    {APPEAL_GROUNDS_LABELS[warning.appealDetails.grounds] || warning.appealDetails.grounds}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Employee's Statement:</span>
                  <p className="text-sm mt-1 px-3 py-2 bg-white rounded border">
                    {warning.appealDetails.additionalDetails}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Requested Outcome:</span>
                  <p className="text-sm mt-1 px-3 py-2 bg-white rounded border">
                    {warning.appealDetails.requestedOutcome}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span>Submitted: {formatDate(warning.appealDetails.submittedDate)}</span>
                  <span>By: {warning.appealDetails.submittedBy}</span>
                </div>
              </div>
            </div>
          )}

          {/* HR Decision Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Gavel className="w-5 h-5 text-gray-600" />
              HR Decision
            </h3>

            {/* Decision Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {DECISION_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setSelectedDecision(option.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedDecision === option.value
                        ? `border-purple-500 ${option.bgColor}`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${option.color}`} />
                      <div className="text-left">
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs text-gray-600">{option.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Level Reduction Options */}
            {(selectedDecision === 'reduced' || selectedDecision === 'modified') && (
              <div className="bg-orange-50 rounded-lg p-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedDecision === 'reduced' ? 'Reduce to Level:' : 'New Warning Level:'}
                </label>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {selectedDecision === 'reduced' ?
                    availableReductions.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    )) :
                    WARNING_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))
                  }
                </select>
              </div>
            )}

            {/* Description Modification */}
            {selectedDecision === 'modified' && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modified Warning Description:
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter the modified warning description..."
                />
              </div>
            )}

            {/* Decision Reasoning */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-500">*</span> Decision Reasoning (Legal Documentation)
              </label>
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Provide detailed reasoning for your decision. This will be part of the legal record and may be reviewed by labor courts or CCMA..."
                required
              />
            </div>

            {/* HR Internal Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HR Internal Notes (Optional)
              </label>
              <textarea
                value={hrNotes}
                onChange={(e) => setHrNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Internal notes for HR records (not shared with employee)..."
              />
            </div>

            {/* Follow-up Required */}
            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={followUpRequired}
                  onChange={(e) => setFollowUpRequired(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">Follow-up Required</span>
              </label>

              {followUpRequired && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Follow-up Date:
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Info className="w-4 h-4" />
            <span>This decision will be automatically documented and employee will be notified</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedDecision || !reasoning.trim() || isSubmitting}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Submit Decision
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};