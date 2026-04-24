// frontend/src/components/reseller/demos/ResetDemoConfirmModal.tsx
// Type-to-confirm destructive action: wipes a demo and re-seeds the pristine state.

import React, { useState } from 'react';
import { AlertTriangle, Loader2, RefreshCw, Trash2, Sparkles } from 'lucide-react';
import { UnifiedModal } from '../../common/UnifiedModal';
import { ResellerDemoService, ResetDemoResult } from '../../../services/ResellerDemoService';
import Logger from '../../../utils/logger';

interface ResetDemoConfirmModalProps {
  isOpen: boolean;
  orgId: string;
  orgName: string;
  onClose: () => void;
  onReset: (result: ResetDemoResult) => void;
}

export const ResetDemoConfirmModal: React.FC<ResetDemoConfirmModalProps> = ({
  isOpen,
  orgId,
  orgName,
  onClose,
  onReset
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = confirmText.trim() === orgName;

  const reset = () => {
    setConfirmText('');
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const handleReset = async () => {
    if (!matches) return;
    setLoading(true);
    setError(null);
    try {
      const result = await ResellerDemoService.resetDemo(orgId);
      onReset(result);
      reset();
    } catch (err: any) {
      Logger.error('Demo reset failed:', err);
      setError(err?.message || 'Failed to reset demo');
      setLoading(false);
    }
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reset Demo to Pristine State"
      subtitle={orgName}
      size="md"
      primaryAction={{
        label: loading ? 'Resetting…' : 'Reset Demo',
        onClick: handleReset,
        disabled: !matches || loading,
        loading,
        variant: 'danger'
      }}
      secondaryAction={{ label: 'Cancel', onClick: handleClose }}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-900">
            <p className="font-medium mb-2">This will permanently delete:</p>
            <ul className="space-y-1 text-red-800">
              <li className="flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>All warnings, evidence files, audio recordings</span>
              </li>
              <li className="flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>All response tokens and appeal records</span>
              </li>
              <li className="flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>All current employees (including any added by the prospect)</span>
              </li>
              <li className="flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>All prospect logins you've issued for this demo</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
          <Sparkles className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-900">
            <p className="font-medium mb-1">Then re-seeded with:</p>
            <ul className="space-y-0.5 text-green-800 list-disc list-inside">
              <li>The 10 canonical sample employees</li>
              <li>Default Operations &amp; Admin departments</li>
              <li>All warning categories (preserved across resets)</li>
            </ul>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Type the demo's name to confirm: <code className="text-gray-900">{orgName}</code>
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            disabled={loading}
            placeholder={orgName}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 font-mono"
          />
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Wiping data, re-seeding canonical employees…</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </UnifiedModal>
  );
};
