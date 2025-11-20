// PromoteToManagerModal.tsx
// 🚀 PROMOTE EMPLOYEE TO MANAGER MODAL
// Allows HR to promote existing employees to manager roles

import React, { useState, useEffect, useRef } from 'react';
import { UnifiedModal } from '../common/UnifiedModal';
import { useOrganization } from '../../contexts/OrganizationContext';
import { DatabaseShardingService } from '../../services/DatabaseShardingService';
import DepartmentService from '../../services/DepartmentService';
import { AlertCircle, Info, Search } from 'lucide-react';
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
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'hr-manager' | 'hod-manager'>('hod-manager');
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
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

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    if (showResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showResults]);

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
      setSelectedEmployee(null);
      setSearchTerm('');
      setSelectedRole('hod-manager');
      setSelectedDepartmentIds([]);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowResults(true);
    if (selectedEmployee) {
      setSelectedEmployee(null);
      setSelectedEmployeeId('');
    }
  };

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setSelectedEmployeeId(emp.id);
    setSearchTerm('');
    setShowResults(false);
  };

  const filteredEmployees = employees.filter(emp => {
    if (!emp.profile) return false;
    if (!searchTerm.trim()) return true;

    const searchString = `${emp.profile.firstName || ''} ${emp.profile.lastName || ''} ${emp.profile.email || ''} ${emp.profile.employeeNumber || ''}`
      .toLowerCase();

    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Promote Employee to Manager"
      subtitle="Select an employee and assign manager role"
      size="sm"
    >
      <div className="p-2.5">
        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Employee Selection */}
            <div className="mb-3 relative">
              <label className="block text-[11px] font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                Employee <span className="text-red-500">*</span> <span className="font-normal text-gray-400 normal-case text-[10px]">(email required)</span>
              </label>

              {/* Selected Employee Display */}
              {selectedEmployee ? (
                <div className="w-full px-2.5 py-2 text-xs border border-blue-500 bg-blue-50 rounded flex items-center justify-between">
                  <span className="font-medium text-blue-900">
                    {selectedEmployee.profile?.firstName} {selectedEmployee.profile?.lastName} ({selectedEmployee.profile?.employeeNumber})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEmployee(null);
                      setSelectedEmployeeId('');
                      setSearchTerm('');
                    }}
                    className="text-blue-600 hover:text-blue-800 text-xs underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div ref={searchContainerRef}>
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Type to search employees..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      onFocus={() => setShowResults(true)}
                      className="w-full pl-8 pr-2.5 py-2 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoComplete="off"
                    />
                  </div>

                  {/* Results List */}
                  {showResults && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map(emp => (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => handleSelectEmployee(emp)}
                            className="w-full px-2.5 py-2 text-left text-xs hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-gray-900">
                              {emp.profile?.firstName} {emp.profile?.lastName}
                            </div>
                            <div className="text-gray-500">
                              {emp.profile?.employeeNumber} • {emp.profile?.department || 'No Department'} • {emp.profile?.email}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-2.5 py-2 text-xs text-gray-500 text-center">
                          No employees found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {employees.length === 0 && !loadingData && (
                <div className="mt-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded flex items-start gap-1.5">
                  <Info className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800">
                    No eligible employees. All lack email or are already managers.
                  </p>
                </div>
              )}
            </div>

            {/* Role & Departments - Minimal */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-gray-700 uppercase tracking-wide">
                  {selectedRole === 'hod-manager' ? 'Departments' : 'Role'} <span className="font-normal text-gray-400 normal-case text-[10px]">(optional)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-500">Role:</span>
                  <label className="flex items-center gap-0.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={selectedRole === 'hod-manager'}
                      onChange={() => setSelectedRole('hod-manager')}
                      className="w-2.5 h-2.5 text-purple-600"
                    />
                    <span className="text-[10px] text-gray-600">HOD</span>
                  </label>
                  <label className="flex items-center gap-0.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={selectedRole === 'hr-manager'}
                      onChange={() => setSelectedRole('hr-manager')}
                      className="w-2.5 h-2.5 text-green-600"
                    />
                    <span className="text-[10px] text-gray-600">HR</span>
                  </label>
                </div>
              </div>

              {/* Department Assignment with Checkboxes */}
              {selectedRole === 'hod-manager' && departments.length > 0 && (
                <div className="border border-gray-300 rounded p-1.5 max-h-24 overflow-y-auto bg-white">
                  {departments.map(dept => (
                    <label key={dept.id} className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 px-1.5 py-1 rounded text-xs">
                      <input
                        type="checkbox"
                        checked={selectedDepartmentIds.includes(dept.id)}
                        onChange={() => handleDepartmentToggle(dept.id)}
                        className="w-3 h-3 text-purple-600 rounded"
                      />
                      <span>{dept.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-2 px-2.5 py-1.5 bg-red-50 border border-red-200 rounded flex items-start gap-1.5">
                <AlertCircle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-800">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-3 mt-3 border-t">
              <button
                onClick={onClose}
                disabled={loading}
                className="modal-footer__button modal-footer__button--secondary"
                style={{ flex: '1' }}
              >
                Cancel
              </button>
              <button
                onClick={handlePromote}
                disabled={!selectedEmployeeId || loading}
                className="modal-footer__button modal-footer__button--primary"
                style={{ flex: '1' }}
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
