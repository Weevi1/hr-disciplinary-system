// frontend/src/components/reseller/demos/DeleteDemoConfirmModal.tsx
// Type-to-confirm: permanently destroy a demo org and all related data.

import React, { useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { UnifiedModal } from '../../common/UnifiedModal';
import { ResellerDemoService, DeleteDemoResult } from '../../../services/ResellerDemoService';
import Logger from '../../../utils/logger';

interface DeleteDemoConfirmModalProps {
  isOpen: boolean;
  orgId: string;
  orgName: string;
  onClose: () => void;
  onDeleted: (result: DeleteDemoResult) => void;
}

export const DeleteDemoConfirmModal: React.FC<DeleteDemoConfirmModalProps> = ({
  isOpen,
  orgId,
  orgName,
  onClose,
  onDeleted
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phrase = `DELETE ${orgName}`;
  const matches = confirmText.trim() === phrase;

  const handleClose = () => {
    if (loading) return;
    setConfirmText('');
    setError(null);
    onClose();
  };

  const handleDelete = async () => {
    if (!matches) return;
    setLoading(true);
    setError(null);
    try {
      const result = await ResellerDemoService.deleteDemo(orgId);
      onDeleted(result);
      setConfirmText('');
    } catch (err: any) {
      Logger.error('Demo deletion failed:', err);
      setError(err?.message || 'Failed to delete demo');
      setLoading(false);
    }
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Permanently Delete Demo"
      subtitle={orgName}
      size="md"
      primaryAction={{
        label: loading ? 'Deleting…' : 'Delete Forever',
        onClick: handleDelete,
        disabled: !matches || loading,
        loading,
        variant: 'danger'
      }}
      secondaryAction={{ label: 'Cancel', onClick: handleClose }}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
          <Trash2 className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-900">
            <p className="font-medium mb-1">This is permanent and cannot be undone.</p>
            <p className="text-red-800">
              The organization, all its data, and every prospect login will be deleted. If you
              want to reuse this demo with a new prospect, use <strong>Reset</strong> instead.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Type{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-900 text-xs font-mono">
              {phrase}
            </code>{' '}
            to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            disabled={loading}
            placeholder={phrase}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 font-mono"
          />
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Removing all data, revoking logins…</span>
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
