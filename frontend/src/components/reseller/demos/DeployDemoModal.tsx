// frontend/src/components/reseller/demos/DeployDemoModal.tsx
// Single-field modal for deploying a new pre-populated demo organization.

import React, { useState } from 'react';
import { Rocket, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { UnifiedModal } from '../../common/UnifiedModal';
import { ResellerDemoService, DeployDemoResult } from '../../../services/ResellerDemoService';
import Logger from '../../../utils/logger';

interface DeployDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeployed: (result: DeployDemoResult) => void;
}

export const DeployDemoModal: React.FC<DeployDemoModalProps> = ({
  isOpen,
  onClose,
  onDeployed
}) => {
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setCompanyName('');
    setError(null);
    setLoading(false);
  };

  const handleDeploy = async () => {
    if (!companyName.trim() || companyName.trim().length < 2) {
      setError('Company name must be at least 2 characters');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await ResellerDemoService.deployDemo(companyName.trim());
      onDeployed(result);
      reset();
    } catch (err: any) {
      Logger.error('Demo deployment failed:', err);
      setError(err?.message || 'Failed to deploy demo organization');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Deploy a Demo Organization"
      subtitle="Spin up a pre-populated workspace for a prospect to test"
      size="md"
      primaryAction={{
        label: loading ? 'Deploying…' : 'Deploy Demo',
        onClick: handleDeploy,
        disabled: loading || !companyName.trim(),
        loading,
        variant: 'primary'
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: handleClose
      }}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <Rocket className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-medium mb-1">What you're deploying</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-800">
              <li>10 sample employees across Operations &amp; Admin departments</li>
              <li>Full SA warning category library pre-loaded</li>
              <li>No warnings issued — prospect drives the workflow themselves</li>
              <li>No billing, no Stripe, no effect on your reseller quota</li>
            </ul>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Demo Company Name
          </label>
          <input
            type="text"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder="e.g. Acme Logistics Demo"
            disabled={loading}
            autoFocus
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            onKeyDown={e => {
              if (e.key === 'Enter' && !loading) handleDeploy();
            }}
          />
          <p className="mt-1 text-xs text-gray-500">
            Pick something the prospect will recognize — it appears in their PDFs and dashboards.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Creating organization, seeding employees, categories, and departments…</span>
          </div>
        )}
      </div>
    </UnifiedModal>
  );
};
