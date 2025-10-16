// PromoteToManagerModal.tsx
// 🚀 PROMOTE EMPLOYEE TO MANAGER MODAL
// Allows HR to promote existing employees to manager roles

import React, { useState, useEffect } from 'react';
import { UnifiedModal } from '../common/UnifiedModal';
import { useOrganization } from '../../contexts/OrganizationContext';
import { DatabaseShardingService } from '../../services/DatabaseShardingService';
import DepartmentService from '../../services/DepartmentService';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import Logger from '../../utils/logger';
import type { Employee } from '../../types';
import type { Department } from '../../types/department';

interface PromoteToManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPromote: (employeeId: string, role: 'hr-manager' | 'hod-manager', departmentIds?: string[]) => Promise<void>;
}

export const PromoteToManagerModal: React.FC<PromoteToManagerModalProps> = ({
  isOpen,
  onClose,
  onPromote
}) => {
  const { organization } = useOrganization();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'hr-manager' | 'hod-manager'>('hod-manager');
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load employees and departments
  useEffect(() => {
    const loadData = async () => {
      if (!organization?.id || !isOpen) return;

      setLoadingData(true);
      setError(null);

      try {
        // Load employees
        const employeesResult = await DatabaseShardingService.queryDocuments(
          organization.id,
          'employees'
        );

        // Filter to only active employees who are NOT already managers
        const users = await DatabaseShardingService.queryDocuments(organization.id, 'users');
        const managerUserIds = users.documents
          .filter((u: any) => u.role?.id === 'hr-manager' || u.role?.id === 'hod-manager')
          .map((u: any) => u.id);

        const eligibleEmployees = employeesResult.documents.filter((emp: any) => {
          // Must be active and not already a manager
          if (emp.isActive === false || managerUserIds.includes(emp.id)) {
            return false;
          }

          // Must have valid profile data with required fields
          if (!emp.profile || !emp.profile.email || !emp.profile.firstName || !emp.profile.lastName) {
            Logger.warn(`Skipping employee ${emp.id} - missing required profile data`);
            return false;
          }

          return true;
        });

        setEmployees(eligibleEmployees as Employee[]);

        // Load departments
        const depts = await DepartmentService.getDepartments(organization.id);
        setDepartments(depts);

        Logger.debug(`📋 Loaded ${eligibleEmployees.length} eligible employees and ${depts.length} departments`);
      } catch (error) {
        Logger.error('Failed to load data:', error);
        setError('Failed to load employees. Please try again.');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [organization?.id, isOpen]);

  const handlePromote = async () => {
    if (!selectedEmployeeId) {
      setError('Please select an employee to promote');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onPromote(
        selectedEmployeeId,
        selectedRole,
        selectedDepartmentIds.length > 0 ? selectedDepartmentIds : undefined
      );

      // Reset form
      setSelectedEmployeeId('');
      setSelectedRole('hod-manager');
      setSelectedDepartmentIds([]);
      setSearchTerm('');

      onClose();
    } catch (error: any) {
      Logger.error('Failed to promote employee:', error);
      setError(error.message || 'Failed to promote employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentToggle = (deptId: string) => {
    setSelectedDepartmentIds(prev =>
      prev.includes(deptId)
        ? prev.filter(id => id !== deptId)
        : [...prev, deptId]
    );
  };

  const filteredEmployees = employees.filter(emp => {
    // Skip employees with missing profile data
    if (!emp.profile) return false;

    const searchString = `${emp.profile.firstName || ''} ${emp.profile.lastName || ''} ${emp.profile.email || ''} ${emp.profile.employeeNumber || ''}`
      .toLowerCase();

    return searchString.includes(searchTerm.toLowerCase());
  });

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Promote Employee to Manager"
      subtitle="Select an employee and assign manager role"
      size="lg"
    >
      <div className="p-6">
        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Employee Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Employee *
              </label>

              {/* Search Input */}
              <input
                type="text"
                placeholder="Search by name, email, or employee number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {/* Employee Dropdown */}
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Select an employee --</option>
                {filteredEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.profile?.firstName || 'Unknown'} {emp.profile?.lastName || 'Employee'} ({emp.profile?.employeeNumber || 'N/A'}) - {emp.profile?.department || 'No Department'}
                  </option>
                ))}
              </select>

              {filteredEmployees.length === 0 && searchTerm && (
                <p className="text-sm text-gray-500 mt-2">
                  No employees found matching "{searchTerm}"
                </p>
              )}
            </div>

            {/* Selected Employee Info */}
            {selectedEmployee && selectedEmployee.profile && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <UserPlus className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Selected Employee
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      {selectedEmployee.profile.firstName || 'Unknown'} {selectedEmployee.profile.lastName || 'Employee'}
                    </p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      {selectedEmployee.profile.email || 'No Email'} • {selectedEmployee.profile.department || 'No Department'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Role Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager Role *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('hod-manager')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedRole === 'hod-manager'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">HOD Manager</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Department head with team oversight
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('hr-manager')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    selectedRole === 'hr-manager'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">HR Manager</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Full HR access across all departments
                  </div>
                </button>
              </div>
            </div>

            {/* Department Assignment (Optional) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Departments (Optional)
              </label>
              <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                {departments.length === 0 ? (
                  <p className="text-sm text-gray-500">No departments available</p>
                ) : (
                  <div className="space-y-2">
                    {departments.map(dept => (
                      <label key={dept.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedDepartmentIds.includes(dept.id)}
                          onChange={() => handleDepartmentToggle(dept.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-900">{dept.name}</span>
                        {dept.description && (
                          <span className="text-xs text-gray-500">- {dept.description}</span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Confirmation Message */}
            {selectedEmployee && selectedEmployee.profile && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Ready to Promote
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      <strong>{selectedEmployee.profile.firstName || 'Unknown'} {selectedEmployee.profile.lastName || 'Employee'}</strong>{' '}
                      will be promoted to <strong>{selectedRole === 'hr-manager' ? 'HR Manager' : 'HOD Manager'}</strong>
                      {selectedDepartmentIds.length > 0 && (
                        <> with access to{' '}
                          <strong>
                            {selectedDepartmentIds
                              .map(id => departments.find(d => d.id === id)?.name)
                              .filter(Boolean)
                              .join(', ')}
                          </strong>
                        </>
                      )}
                      .
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

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
                onClick={handlePromote}
                disabled={!selectedEmployeeId || loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Promoting...' : 'Promote to Manager'}
              </button>
            </div>
          </>
        )}
      </div>
    </UnifiedModal>
  );
};
