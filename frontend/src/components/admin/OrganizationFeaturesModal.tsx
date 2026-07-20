// frontend/src/components/admin/OrganizationFeaturesModal.tsx
// Super-user modal to enable/disable dashboard features for a tenant organization.
// Disabled features disappear from that org's manager and HR dashboards (and their routes).

import React, { useState, useEffect } from 'react';
import { UnifiedModal } from '../common/UnifiedModal';
import { OrgFeatureToggleGrid } from '../common/OrgFeatureToggleGrid';
import { AdminDataService } from '../../services/AdminDataService';
import { DEFAULT_ORG_FEATURES, type OrgFeatureKey } from '../../constants/orgFeatures';
import type { Organization } from '../../types/core';
import Logger from '../../utils/logger';
import { Building2, Info } from 'lucide-react';

interface OrganizationFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization;
  onSuccess: () => void;
}

export const OrganizationFeaturesModal: React.FC<OrganizationFeaturesModalProps> = ({
  isOpen,
  onClose,
  organization,
  onSuccess
}) => {
  const [features, setFeatures] = useState<Record<OrgFeatureKey, boolean>>({
    ...DEFAULT_ORG_FEATURES
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Absent keys render as enabled — matches runtime semantics (only explicit false disables)
  useEffect(() => {
    setFeatures({ ...DEFAULT_ORG_FEATURES, ...organization.features });
    setError(null);
  }, [organization]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      await AdminDataService.updateOrganization(organization.id, { features });
      Logger.success(`Feature toggles updated for ${organization.name}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      Logger.error('Failed to update organization features:', err);
      setError(err.message || 'Failed to update features');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Organization Features"
      size="medium"
    >
      <div className="space-y-6">
        {/* Organization Info */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{organization.name}</h3>
              <p className="text-sm text-gray-600">{organization.industry}</p>
            </div>
          </div>
        </div>

        {/* Info Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-900 leading-relaxed">
                Disabled features are removed from this organization's manager and HR
                dashboards. Core warning management always stays available. Signed-in
                users see the change on their next reload or login.
              </p>
            </div>
          </div>
        </div>

        <OrgFeatureToggleGrid value={features} onChange={setFeatures} disabled={loading} />

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors font-semibold"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </UnifiedModal>
  );
};
