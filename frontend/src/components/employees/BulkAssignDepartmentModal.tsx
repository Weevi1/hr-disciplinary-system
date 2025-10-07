// frontend/src/components/employees/BulkAssignDepartmentModal.tsx
// 🎯 BULK DEPARTMENT ASSIGNMENT MODAL
// ✅ Select department from available departments in org
// ✅ Assign multiple employees at once
// ✅ Shows confirmation before assignment

import React, { useState, useEffect } from 'react';
import { UnifiedModal } from '../common/UnifiedModal';
import { useOrganization } from '../../contexts/OrganizationContext';
import DepartmentService from '../../services/DepartmentService';
import { Building2, AlertCircle } from 'lucide-react';
import Logger from '../../utils/logger';
import type { Employee, Department } from '../../types';

interface BulkAssignDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onAssign: (departmentName: string) => Promise<void>;
}

export const BulkAssignDepartmentModal: React.FC<BulkAssignDepartmentModalProps> = ({
  isOpen,
  onClose,
  employees,
  onAssign
}) => {
  const { organization } = useOrganization();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentName, setSelectedDepartmentName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available departments
  useEffect(() => {
    const loadDepartments = async () => {
      if (!organization?.id || !isOpen) return;

      setLoading(true);
      setError(null);

      try {
        const depts = await DepartmentService.getDepartments(organization.id);
        setDepartments(depts);
        Logger.debug(`📋 Loaded ${depts.length} departments for bulk assignment`);
      } catch (error) {
        Logger.error('Failed to load departments:', error);
        setError('Failed to load departments. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadDepartments();
  }, [organization?.id, isOpen]);

  const handleAssign = async () => {
    if (!selectedDepartmentName) {
      setError('Please select a department');
      return;
    }

    setAssigning(true);
    setError(null);

    try {
      await onAssign(selectedDepartmentName);
      onClose();
    } catch (error: any) {
      Logger.error('Failed to assign department:', error);
      setError(error.message || 'Failed to assign department. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const selectedDepartment = departments.find(d => d.name === selectedDepartmentName);

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Employees to Department"
      size="md"
    >
      <div className="p-6">
        {/* Employee Count */}
        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-primary-bg)' }}>
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
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

        {/* Department Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
            Select Department
          </label>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
            </div>
          ) : departments.length === 0 ? (
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-alert-warning-bg)' }}>
              <p className="text-sm" style={{ color: 'var(--color-alert-warning-text)' }}>
                No departments found in your organization. Please create departments first.
              </p>
            </div>
          ) : (
            <select
              value={selectedDepartmentName}
              onChange={(e) => setSelectedDepartmentName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border transition-colors"
              style={{
                backgroundColor: 'var(--color-card-background)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)'
              }}
            >
              <option value="">-- Select a department --</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Confirmation Message */}
        {selectedDepartment && (
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-alert-info-bg)' }}>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: 'var(--color-alert-info-text)' }} />
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-alert-info-text)' }}>
                  Confirm Assignment
                </p>
                <p className="text-sm" style={{ color: 'var(--color-alert-info-text)' }}>
                  {employees.length} employee{employees.length !== 1 ? 's' : ''} will be assigned to{' '}
                  <strong>{selectedDepartment.name}</strong> department.
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
            disabled={!selectedDepartmentName || assigning || loading}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(to right, var(--color-primary), var(--color-primary-hover))',
              color: 'var(--color-text-inverse)'
            }}
          >
            {assigning ? 'Assigning...' : 'Assign Department'}
          </button>
        </div>
      </div>
    </UnifiedModal>
  );
};
