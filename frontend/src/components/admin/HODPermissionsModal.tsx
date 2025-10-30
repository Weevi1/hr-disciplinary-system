// frontend/src/components/admin/HODPermissionsModal.tsx
// Modal for HR to configure which dashboard features each HOD manager can access

import React, { useState, useEffect } from 'react';
import { UnifiedModal } from '../common/UnifiedModal';
import { User, HODPermissions } from '../../types/core';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useOrganization } from '../../contexts/OrganizationContext';
import Logger from '../../utils/logger';
import {
  AlertTriangle,
  MessageSquare,
  UserX,
  BookOpen,
  Check,
  X,
  Info
} from 'lucide-react';

interface HODPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: User;
  onSuccess: () => void;
}

interface FeatureConfig {
  key: keyof HODPermissions;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const FEATURES: FeatureConfig[] = [
  {
    key: 'canIssueWarnings',
    label: 'Issue Warnings',
    description: 'Allow manager to create and issue warnings to team members',
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'orange'
  },
  {
    key: 'canBookHRMeetings',
    label: 'Book HR Meetings',
    description: 'Allow manager to request meetings with HR for team issues',
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'green'
  },
  {
    key: 'canReportAbsences',
    label: 'Report Absences',
    description: 'Allow manager to report employee absences to HR',
    icon: <UserX className="w-5 h-5" />,
    color: 'red'
  },
  {
    key: 'canRecordCounselling',
    label: 'Record Counselling',
    description: 'Allow manager to document counselling sessions with team members',
    icon: <BookOpen className="w-5 h-5" />,
    color: 'blue'
  }
];

const getColorClasses = (color: string) => {
  const colors: Record<string, { bg: string; text: string; icon: string; border: string }> = {
    orange: { bg: 'bg-orange-50', text: 'text-orange-900', icon: 'text-orange-600', border: 'border-orange-200' },
    green: { bg: 'bg-green-50', text: 'text-green-900', icon: 'text-green-600', border: 'border-green-200' },
    red: { bg: 'bg-red-50', text: 'text-red-900', icon: 'text-red-600', border: 'border-red-200' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-900', icon: 'text-blue-600', border: 'border-blue-200' }
  };
  return colors[color] || colors.blue;
};

export const HODPermissionsModal: React.FC<HODPermissionsModalProps> = ({
  isOpen,
  onClose,
  manager,
  onSuccess
}) => {
  const { organization } = useOrganization();
  const [permissions, setPermissions] = useState<HODPermissions>({
    canIssueWarnings: false,
    canBookHRMeetings: false,
    canReportAbsences: false,
    canRecordCounselling: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize permissions from manager's current settings
  useEffect(() => {
    if (manager.hodPermissions) {
      setPermissions(manager.hodPermissions);
    } else {
      // Default: all features disabled (HR must explicitly enable)
      setPermissions({
        canIssueWarnings: false,
        canBookHRMeetings: false,
        canReportAbsences: false,
        canRecordCounselling: false
      });
    }
  }, [manager]);

  const togglePermission = (key: keyof HODPermissions) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    if (!organization?.id) {
      setError('Organization not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use sharded user collection path
      const userRef = doc(db, 'organizations', organization.id, 'users', manager.id);
      await updateDoc(userRef, {
        hodPermissions: permissions,
        updatedAt: new Date().toISOString()
      });

      Logger.success(`HOD permissions updated for ${manager.firstName} ${manager.lastName}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      Logger.error('Failed to update HOD permissions:', err);
      setError(err.message || 'Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  const enabledCount = Object.values(permissions).filter(Boolean).length;
  const allEnabled = enabledCount === 4;
  const noneEnabled = enabledCount === 0;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Dashboard Features"
      size="medium"
    >
      <div className="space-y-6">
        {/* Manager Info */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
              {manager.firstName?.charAt(0)}{manager.lastName?.charAt(0)}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {manager.firstName} {manager.lastName}
              </h3>
              <p className="text-sm text-gray-600">
                {manager.email} • Department Manager
              </p>
            </div>
          </div>
        </div>

        {/* Info Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-900 leading-relaxed">
                Control which features this manager can access on their dashboard.
                Only selected features will be visible to them.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">
            Dashboard Features ({enabledCount}/4 enabled)
          </h4>

          {FEATURES.map((feature) => {
            const isEnabled = permissions[feature.key];
            const colors = getColorClasses(feature.color);

            return (
              <button
                key={feature.key}
                onClick={() => togglePermission(feature.key)}
                className={`
                  w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-all
                  ${isEnabled
                    ? `${colors.bg} ${colors.border}`
                    : 'bg-gray-50 border-gray-200 opacity-60'
                  }
                  hover:shadow-md
                `}
              >
                {/* Icon */}
                <div className={`
                  flex-shrink-0 p-2 rounded-lg
                  ${isEnabled ? 'bg-white shadow-sm' : 'bg-gray-100'}
                  ${isEnabled ? colors.icon : 'text-gray-400'}
                `}>
                  {feature.icon}
                </div>

                {/* Content */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-semibold ${isEnabled ? colors.text : 'text-gray-500'}`}>
                      {feature.label}
                    </span>
                  </div>
                  <p className={`text-sm ${isEnabled ? 'text-gray-700' : 'text-gray-400'}`}>
                    {feature.description}
                  </p>
                </div>

                {/* Toggle Indicator */}
                <div className={`
                  flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                  ${isEnabled ? 'bg-green-500' : 'bg-gray-300'}
                `}>
                  {isEnabled ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <X className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Warning if none enabled */}
        {noneEnabled && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-amber-900 leading-relaxed">
                  <strong>Warning:</strong> This manager will have no dashboard features available.
                  Their dashboard will be empty.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <button
            onClick={() => setPermissions({
              canIssueWarnings: true,
              canBookHRMeetings: true,
              canReportAbsences: true,
              canRecordCounselling: true
            })}
            disabled={allEnabled}
            className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Enable All
          </button>
          <button
            onClick={() => setPermissions({
              canIssueWarnings: false,
              canBookHRMeetings: false,
              canReportAbsences: false,
              canRecordCounselling: false
            })}
            disabled={noneEnabled}
            className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Disable All
          </button>
        </div>

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
