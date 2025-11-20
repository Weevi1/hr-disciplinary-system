// frontend/src/components/reviews/ReviewFollowUpModal.tsx
// Modal for reviewing employee progress on corrective actions

import React, { useState, useCallback, useMemo } from 'react';
import {
  X,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  MessageSquare,
  Phone,
  Mail
} from 'lucide-react';
import { UnifiedModal } from '../common/UnifiedModal';
import { ThemedCard, ThemedBadge, ThemedAlert } from '../common/ThemedCard';
import { ThemedButton } from '../common/ThemedButton';
import type { WarningWithReview } from '../../hooks/useReviewFollowUps';
import { useAuth } from '../../auth/AuthContext';

interface ReviewFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  warning: WarningWithReview | null;
  onReviewComplete: (warningId: string, reviewData: {
    reviewOutcome: 'satisfactory' | 'some_concerns' | 'unsatisfactory';
    hodFeedback?: string;
    hrNotes?: string;
    nextSteps?: string;
    reviewedBy: string;
  }) => Promise<void>;
}

export const ReviewFollowUpModal: React.FC<ReviewFollowUpModalProps> = ({
  isOpen,
  onClose,
  warning,
  onReviewComplete
}) => {
  const { user } = useAuth();
  const [reviewOutcome, setReviewOutcome] = useState<'satisfactory' | 'some_concerns' | 'unsatisfactory' | ''>('');
  const [hodFeedback, setHodFeedback] = useState('');
  const [hrNotes, setHrNotes] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!warning || !reviewOutcome || !user) return;

    try {
      setSaving(true);
      setError(null);

      await onReviewComplete(warning.id, {
        reviewOutcome,
        hodFeedback: hodFeedback.trim() || undefined,
        hrNotes: hrNotes.trim() || undefined,
        nextSteps: nextSteps.trim() || undefined,
        reviewedBy: user.uid
      });

      onClose();
    } catch (err) {
      console.error('Error completing review:', err);
      setError('Failed to save review. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [warning, reviewOutcome, hodFeedback, hrNotes, nextSteps, user, onReviewComplete, onClose]);

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setReviewOutcome('');
      setHodFeedback('');
      setHrNotes('');
      setNextSteps('');
      setError(null);
    }
  }, [isOpen]);

  if (!warning) return null;

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      counselling: 'Counselling',
      verbal: 'Verbal Warning',
      first_written: 'Written Warning',
      second_written: 'Second Written Warning',
      final_written: 'Final Warning',
      suspension: 'Suspension',
      dismissal: 'Ending of Service'
    };
    return labels[level] || level;
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Corrective Action Progress"
      subtitle={`${warning.employee?.firstName || ''} ${warning.employee?.lastName || ''} - ${warning.employee?.employeeNumber || ''}`}
      size="xl"
    >
      <div className="flex flex-col md:flex-row gap-6 p-6 overflow-y-auto" style={{ maxHeight: '75vh' }}>
        {/* LEFT PANEL - Warning Information */}
        <div className="flex-1 space-y-4">
          {/* Employee Card */}
          <ThemedCard padding="md">
            <div className="flex items-start gap-4">
              {warning.employee?.photoUrl ? (
                <img
                  src={warning.employee.photoUrl}
                  alt={`${warning.employee.firstName} ${warning.employee.lastName}`}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-background-secondary)' }}
                >
                  <User className="w-8 h-8" style={{ color: 'var(--color-text-secondary)' }} />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                  {warning.employee?.firstName} {warning.employee?.lastName}
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {warning.employee?.position} • {warning.employee?.department}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Employee #{warning.employee?.employeeNumber}
                </p>
              </div>
              <ThemedBadge variant="warning">
                {getLevelLabel(warning.level)}
              </ThemedBadge>
            </div>
          </ThemedCard>

          {/* Original Warning Details */}
          <ThemedCard padding="md">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <AlertTriangle className="w-4 h-4" />
              Original Warning Details
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Category:</span>
                <span style={{ color: 'var(--color-text)' }} className="font-medium">{warning.category || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Issue Date:</span>
                <span style={{ color: 'var(--color-text)' }}>{formatDate(warning.issueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Review Date:</span>
                <span style={{ color: 'var(--color-text)' }} className="font-medium">{formatDate(warning.reviewDate)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Issued By:</span>
                <span style={{ color: 'var(--color-text)' }}>{warning.managerName || 'Unknown'}</span>
              </div>
            </div>
          </ThemedCard>

          {/* Incident Description */}
          <ThemedCard padding="md">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <FileText className="w-4 h-4" />
              Incident Description
            </h4>
            <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>
              {warning.description}
            </p>
          </ThemedCard>

          {/* Expected Behavior */}
          {warning.expectedBehaviorStandards && (
            <ThemedCard padding="md">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <CheckCircle className="w-4 h-4" />
                Expected Behavior/Standards
              </h4>
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>
                {warning.expectedBehaviorStandards}
              </p>
            </ThemedCard>
          )}

          {/* Improvement Commitments */}
          {warning.improvementCommitments && warning.improvementCommitments.length > 0 && (
            <ThemedCard padding="md">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <Clock className="w-4 h-4" />
                Improvement Commitments
              </h4>
              <div className="space-y-3">
                {warning.improvementCommitments.map((commitment, index) => (
                  <div key={index} className="border-l-2 pl-3" style={{ borderColor: 'var(--color-border)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {commitment.commitment}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      Timeline: {commitment.timeline}
                    </p>
                    {commitment.completedDate && (
                      <ThemedBadge variant="success" size="sm" className="mt-1">
                        Completed
                      </ThemedBadge>
                    )}
                  </div>
                ))}
              </div>
            </ThemedCard>
          )}
        </div>

        {/* RIGHT PANEL - Review Actions */}
        <div className="w-full md:w-96 space-y-4">
          {/* Contact HOD Section */}
          <ThemedCard padding="md">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <User className="w-4 h-4" />
              Contact Department Manager
            </h4>
            <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              {warning.managerName || 'Department Manager'}
            </p>
            <div className="flex gap-2">
              <ThemedButton variant="secondary" size="sm" className="flex-1">
                <Phone className="w-3 h-3 mr-1" />
                Call
              </ThemedButton>
              <ThemedButton variant="secondary" size="sm" className="flex-1">
                <Mail className="w-3 h-3 mr-1" />
                Email
              </ThemedButton>
            </div>
          </ThemedCard>

          {/* HOD Feedback */}
          <ThemedCard padding="md">
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Department Manager Feedback
            </label>
            <textarea
              value={hodFeedback}
              onChange={(e) => setHodFeedback(e.target.value)}
              placeholder="Record verbal feedback from the department manager..."
              className="w-full px-3 py-2 border rounded-lg text-sm resize-vertical"
              style={{
                backgroundColor: 'var(--color-input-background)',
                borderColor: 'var(--color-input-border)',
                color: 'var(--color-text)',
                minHeight: '80px'
              }}
            />
          </ThemedCard>

          {/* Review Outcome */}
          <ThemedCard padding="md">
            <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
              Review Outcome <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-opacity-50"
                style={{
                  borderColor: reviewOutcome === 'satisfactory' ? 'var(--color-success)' : 'var(--color-border)',
                  backgroundColor: reviewOutcome === 'satisfactory' ? 'var(--color-alert-success-bg)' : 'transparent'
                }}
              >
                <input
                  type="radio"
                  name="outcome"
                  value="satisfactory"
                  checked={reviewOutcome === 'satisfactory'}
                  onChange={(e) => setReviewOutcome(e.target.value as any)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Satisfactory
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    No further action needed
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-opacity-50"
                style={{
                  borderColor: reviewOutcome === 'some_concerns' ? 'var(--color-warning)' : 'var(--color-border)',
                  backgroundColor: reviewOutcome === 'some_concerns' ? 'var(--color-alert-warning-bg)' : 'transparent'
                }}
              >
                <input
                  type="radio"
                  name="outcome"
                  value="some_concerns"
                  checked={reviewOutcome === 'some_concerns'}
                  onChange={(e) => setReviewOutcome(e.target.value as any)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    Some Concerns
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    Monitor for another period
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-opacity-50"
                style={{
                  borderColor: reviewOutcome === 'unsatisfactory' ? 'var(--color-error)' : 'var(--color-border)',
                  backgroundColor: reviewOutcome === 'unsatisfactory' ? 'var(--color-alert-error-bg)' : 'transparent'
                }}
              >
                <input
                  type="radio"
                  name="outcome"
                  value="unsatisfactory"
                  checked={reviewOutcome === 'unsatisfactory'}
                  onChange={(e) => setReviewOutcome(e.target.value as any)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                    <X className="w-4 h-4 text-red-600" />
                    Unsatisfactory
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    Issue new warning / escalate
                  </p>
                </div>
              </label>
            </div>
          </ThemedCard>

          {/* HR Notes */}
          <ThemedCard padding="md">
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              HR Notes
            </label>
            <textarea
              value={hrNotes}
              onChange={(e) => setHrNotes(e.target.value)}
              placeholder="Additional notes about this review..."
              className="w-full px-3 py-2 border rounded-lg text-sm resize-vertical"
              style={{
                backgroundColor: 'var(--color-input-background)',
                borderColor: 'var(--color-input-border)',
                color: 'var(--color-text)',
                minHeight: '60px'
              }}
            />
          </ThemedCard>

          {/* Next Steps (if unsatisfactory) */}
          {reviewOutcome === 'unsatisfactory' && (
            <ThemedCard padding="md">
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                Next Steps
              </label>
              <textarea
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                placeholder="Schedule follow-up meeting / Issue new warning / Escalate to next level..."
                className="w-full px-3 py-2 border rounded-lg text-sm resize-vertical"
                style={{
                  backgroundColor: 'var(--color-input-background)',
                  borderColor: 'var(--color-input-border)',
                  color: 'var(--color-text)',
                  minHeight: '60px'
                }}
              />
            </ThemedCard>
          )}

          {/* Error Alert */}
          {error && (
            <ThemedAlert variant="error" onClose={() => setError(null)}>
              {error}
            </ThemedAlert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <ThemedButton
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={saving}
            >
              Cancel
            </ThemedButton>
            <ThemedButton
              variant="primary"
              onClick={handleSubmit}
              className="flex-1"
              disabled={!reviewOutcome || saving}
            >
              {saving ? 'Saving...' : reviewOutcome === 'satisfactory' ? 'Mark Satisfactory' : 'Submit Review'}
            </ThemedButton>
          </div>
        </div>
      </div>
    </UnifiedModal>
  );
};
