// DraftRecoveryModal.tsx - Resume draft prompt
// Priority 4: Data Safety - Resume capability

import React from 'react';
import { Clock, FileText, Trash2, RefreshCw } from 'lucide-react';
import { ThemedButton } from '../../../common/ThemedButton';

interface DraftRecoveryModalProps {
  isOpen: boolean;
  lastSaved: string | null;
  phaseName?: string;
  onResume: () => void;
  onDiscard: () => void;
  onClose: () => void;
}

export const DraftRecoveryModal: React.FC<DraftRecoveryModalProps> = ({
  isOpen,
  lastSaved,
  phaseName,
  onResume,
  onDiscard,
  onClose
}) => {
  if (!isOpen) return null;

  const formatTimeAgo = (isoString: string | null): string => {
    if (!isoString) return 'Unknown';

    const saved = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - saved.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  return (
    <div
      className="fixed inset-0 z-[9600] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="draft-recovery-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden wizard-phase-scale-in"
      >
        {/* Header */}
        <div
          className="p-4 flex items-center gap-3"
          style={{ backgroundColor: 'var(--color-primary-light)' }}
        >
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2
              id="draft-recovery-title"
              className="font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Continue Where You Left Off?
            </h2>
            <p
              className="text-xs"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              We found an unsaved draft
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div
            className="p-3 rounded-lg flex items-center gap-3"
            style={{ backgroundColor: 'var(--color-background)' }}
          >
            <Clock className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Last saved: {formatTimeAgo(lastSaved)}
              </p>
              {phaseName && (
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Stopped at: {phaseName}
                </p>
              )}
            </div>
          </div>

          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Your previous session was not completed. Would you like to continue from where you left off, or start fresh?
          </p>
        </div>

        {/* Actions */}
        <div
          className="p-4 flex flex-col sm:flex-row gap-2 border-t"
          style={{ borderColor: 'var(--color-border-light)' }}
        >
          <ThemedButton
            variant="outline"
            onClick={onDiscard}
            icon={Trash2}
            className="flex-1 wizard-touch-target"
          >
            Discard & Start Fresh
          </ThemedButton>
          <ThemedButton
            onClick={onResume}
            icon={RefreshCw}
            className="flex-1 wizard-touch-target"
          >
            Resume Draft
          </ThemedButton>
        </div>
      </div>
    </div>
  );
};

export default DraftRecoveryModal;
