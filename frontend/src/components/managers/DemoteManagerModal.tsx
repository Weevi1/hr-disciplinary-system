// DemoteManagerModal.tsx
// ⬇️ DEMOTE MANAGER TO EMPLOYEE MODAL
// Allows HR to demote managers back to regular employee status

import React, { useState, useEffect } from 'react';
import { UnifiedModal } from '../common/UnifiedModal';
import { Manager } from '../../services/ManagerService';
import ManagerService from '../../services/ManagerService';
import { AlertTriangle, Users, UserMinus } from 'lucide-react';
import Logger from '../../utils/logger';
import type { Employee } from '../../types';

interface DemoteManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: Manager;
  onDemote: (managerId: string, replacementManagerId?: string) => Promise<void>;
  availableManagers: Manager[]; // Other managers who can take over employees
}

export const DemoteManagerModal: React.FC<DemoteManagerModalProps> = ({
  isOpen,
  onClose,
  manager,
  onDemote,
  availableManagers
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [replacementManagerId, setReplacementManagerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load manager's employees
  useEffect(() => {
    const loadEmployees = async () => {
      if (!manager || !isOpen) return;

      setLoadingEmployees(true);
      try {
        const emps = await ManagerService.getManagerEmployees(
          manager.organizationId,
          manager.id
        );
        setEmployees(emps);
        Logger.debug(`📋 Loaded ${emps.length} employees for manager ${manager.id}`);
      } catch (error) {
        Logger.error('Failed to load manager employees:', error);
      } finally {
        setLoadingEmployees(false);
      }
    };

    loadEmployees();
  }, [manager, isOpen]);

  const handleDemote = async () => {
    if (employees.length > 0 && !replacementManagerId) {
      setError('Please select a replacement manager for the assigned employees');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onDemote(
        manager.id,
        employees.length > 0 ? replacementManagerId : undefined
      );

      onClose();
    } catch (error: any) {
      Logger.error('Failed to demote manager:', error);
      setError(error.message || 'Failed to demote manager. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const replacementManager = availableManagers.find(m => m.id === replacementManagerId);

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Demote Manager to Employee"
      subtitle={`Remove manager privileges from ${manager.firstName} ${manager.lastName}`}
      size="md"
    >
      <div className="p-6">
        {/* Warning Banner */}
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-900">
                Permanent Action
              </p>
              <p className="text-sm text-orange-700 mt-1">
                This will remove all manager privileges and access rights. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Manager Info */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
              {manager.firstName.charAt(0)}{manager.lastName.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {manager.firstName} {manager.lastName}
              </p>
              <p className="text-sm text-gray-600">{manager.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                Current Role: <span className="font-medium">{manager.role.name}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Employee Reassignment Section */}
        {loadingEmployees ? (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
              <span className="ml-3 text-sm text-gray-600">Loading assigned employees...</span>
            </div>
          </div>
        ) : employees.length > 0 ? (
          <div className="mb-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {employees.length} Direct Report{employees.length !== 1 ? 's' : ''} Assigned
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    These employees will need a new manager assigned
                  </p>
                  <div className="mt-2 space-y-1">
                    {employees.slice(0, 5).map(emp => (
                      <div key={emp.id} className="text-xs text-blue-600">
                        • {emp.profile.firstName} {emp.profile.lastName} ({emp.profile.department})
                      </div>
                    ))}
                    {employees.length > 5 && (
                      <div className="text-xs text-blue-600 italic">
                        + {employees.length - 5} more...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Replacement Manager Selection */}
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Replacement Manager *
            </label>
            <select
              value={replacementManagerId}
              onChange={(e) => setReplacementManagerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select a manager --</option>
              {availableManagers
                .filter(m => m.id !== manager.id && m.isActive)
                .map(m => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} ({m.role.name})
                    {m.employeeCount ? ` - Currently managing ${m.employeeCount}` : ''}
                  </option>
                ))}
            </select>

            {replacementManager && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-700">
                  ✓ {employees.length} employee{employees.length !== 1 ? 's' : ''} will be reassigned to{' '}
                  <strong>{replacementManager.firstName} {replacementManager.lastName}</strong>
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              ✓ This manager has no direct reports. Safe to demote without reassignment.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Confirmation */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <UserMinus className="w-4 h-4 inline mr-2 text-gray-600" />
            After demotion, <strong>{manager.firstName} {manager.lastName}</strong> will:
          </p>
          <ul className="mt-2 ml-6 text-sm text-gray-600 space-y-1">
            <li>• Lose all manager privileges and access rights</li>
            <li>• No longer have department assignments</li>
            <li>• Be converted to a regular employee account</li>
            {employees.length > 0 && (
              <li>• Their {employees.length} direct report{employees.length !== 1 ? 's' : ''} will be reassigned</li>
            )}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDemote}
            disabled={loading || (employees.length > 0 && !replacementManagerId)}
            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Demoting...' : 'Confirm Demotion'}
          </button>
        </div>
      </div>
    </UnifiedModal>
  );
};
