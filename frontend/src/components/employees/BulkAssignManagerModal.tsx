// frontend/src/components/employees/BulkAssignManagerModal.tsx
// 🎯 BULK MANAGER ASSIGNMENT MODAL
// ✅ Select manager from available managers
// ✅ Assign multiple employees at once
// ✅ Shows confirmation before assignment

import React, { useState, useEffect } from 'react';
import { UnifiedModal } from '../common/UnifiedModal';
import { useOrganization } from '../../contexts/OrganizationContext';
import { DatabaseShardingService } from '../../services/DatabaseShardingService';
import { Users, AlertCircle } from 'lucide-react';
import Logger from '../../utils/logger';
import type { Employee } from '../../types';

interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  role: {
    id: string;
    name: string;
  };
  departmentIds?: string[];
}

interface BulkAssignManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onAssign: (managerId: string) => Promise<void>;
}

export const BulkAssignManagerModal: React.FC<BulkAssignManagerModalProps> = ({
  isOpen,
  onClose,
  employees,
  onAssign
}) => {
  const { organization } = useOrganization();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available managers
  useEffect(() => {
    const loadManagers = async () => {
      if (!organization?.id || !isOpen) return;

      setLoading(true);
      setError(null);

      try {
        const result = await DatabaseShardingService.queryDocuments(organization.id, 'users');

        // Filter to only show managers (HR managers and HOD managers)
        const managerUsers = result.documents.filter((user: any) =>
          user.role?.id === 'hr-manager' || user.role?.id === 'hod-manager'
        ).map((user: any) => ({
          id: user.id,
          firstName: user.firstName || user.profile?.firstName || 'Unknown',
          lastName: user.lastName || user.profile?.lastName || 'User',
          role: user.role,
          departmentIds: user.departmentIds
        }));

        setManagers(managerUsers);
        Logger.debug(`📋 Loaded ${managerUsers.length} managers for bulk assignment`);
      } catch (error) {
        Logger.error('Failed to load managers:', error);
        setError('Failed to load managers. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadManagers();
  }, [organization?.id, isOpen]);

  const handleAssign = async () => {
    if (!selectedManagerId) {
      setError('Please select a manager');
      return;
    }

    setAssigning(true);
    setError(null);

    try {
      await onAssign(selectedManagerId);
      onClose();
    } catch (error: any) {
      Logger.error('Failed to assign manager:', error);
      setError(error.message || 'Failed to assign manager. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const selectedManager = managers.find(m => m.id === selectedManagerId);

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Employees to Manager"
      size="md"
    >
      <div className="p-6">
        {/* Employee Count */}
        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-primary-bg)' }}>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            <div>
              <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                {employees.length} employee{employees.length !== 1 ? 's' : ''} selected
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {employees.map(e => `${e.profile.firstName} ${e.profile.lastName}`).join(', ')}
              </p>
            </div>
          </div>
        </div>

        {/* Manager Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
            Select Manager
          </label>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
            </div>
          ) : managers.length === 0 ? (
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-alert-warning-bg)' }}>
              <p className="text-sm" style={{ color: 'var(--color-alert-warning-text)' }}>
                No managers found in your organization.
              </p>
            </div>
          ) : (
            <select
              value={selectedManagerId}
              onChange={(e) => setSelectedManagerId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border transition-colors"
              style={{
                backgroundColor: 'var(--color-card-background)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)'
              }}
            >
              <option value="">-- Select a manager --</option>
              {managers.map(manager => (
                <option key={manager.id} value={manager.id}>
                  {manager.firstName} {manager.lastName} ({manager.role.name})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Confirmation Message */}
        {selectedManager && (
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-alert-info-bg)' }}>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: 'var(--color-alert-info-text)' }} />
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-alert-info-text)' }}>
                  Confirm Assignment
                </p>
                <p className="text-sm" style={{ color: 'var(--color-alert-info-text)' }}>
                  {employees.length} employee{employees.length !== 1 ? 's' : ''} will be assigned to{' '}
                  <strong>{selectedManager.firstName} {selectedManager.lastName}</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-alert-error-bg)' }}>
            <p className="text-sm" style={{ color: 'var(--color-alert-error-text)' }}>
              {error}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={assigning}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-card-background)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedManagerId || assigning || loading}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(to right, var(--color-primary), var(--color-primary-hover))',
              color: 'var(--color-text-inverse)'
            }}
          >
            {assigning ? 'Assigning...' : 'Assign Manager'}
          </button>
        </div>
      </div>
    </UnifiedModal>
  );
};
