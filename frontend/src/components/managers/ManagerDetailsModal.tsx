// ManagerDetailsModal.tsx
// 👁️ MANAGER DETAILS MODAL
// Displays comprehensive manager information and allows department editing

import React, { useState, useEffect } from 'react';
import { UnifiedModal } from '../common/UnifiedModal';
import { Manager } from '../../services/ManagerService';
import ManagerService from '../../services/ManagerService';
import DepartmentService from '../../services/DepartmentService';
import { DatabaseShardingService } from '../../services/DatabaseShardingService';
import { Mail, Building2, Users, Calendar, UserCheck, Edit, Save, X, UserPlus, Search, UserMinus } from 'lucide-react';
import Logger from '../../utils/logger';
import type { Employee } from '../../types';
import type { Department } from '../../types/department';
import { getManagerIds } from '../../types/employee';

interface ManagerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: Manager;
  onUpdate: (managerId: string, departmentIds: string[]) => Promise<void>;
}

export const ManagerDetailsModal: React.FC<ManagerDetailsModalProps> = ({
  isOpen,
  onClose,
  manager,
  onUpdate
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>(manager.departmentIds || []);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add employee state
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [assigningEmployee, setAssigningEmployee] = useState(false);

  // Load manager's employees and departments
  useEffect(() => {
    const loadData = async () => {
      if (!manager || !isOpen) return;

      setLoadingData(true);
      try {
        const [emps, depts] = await Promise.all([
          ManagerService.getManagerEmployees(manager.organizationId, manager.id),
          DepartmentService.getDepartments(manager.organizationId)
        ]);

        setEmployees(emps);
        setDepartments(depts);
        Logger.debug(`📋 Loaded ${emps.length} employees and ${depts.length} departments`);
      } catch (error) {
        Logger.error('Failed to load manager data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [manager, isOpen]);

  // Reset selectedDepartmentIds when manager changes
  useEffect(() => {
    setSelectedDepartmentIds(manager.departmentIds || []);
    setIsEditing(false);
  }, [manager]);

  // Load available employees when add employee section is opened
  useEffect(() => {
    if (showAddEmployee) {
      loadAvailableEmployees();
    }
  }, [showAddEmployee]);

  const handleDepartmentToggle = (deptId: string) => {
    setSelectedDepartmentIds(prev =>
      prev.includes(deptId)
        ? prev.filter(id => id !== deptId)
        : [...prev, deptId]
    );
  };

  const handleSaveDepartments = async () => {
    setLoading(true);
    setError(null);

    try {
      await onUpdate(manager.id, selectedDepartmentIds);
      setIsEditing(false);
    } catch (error: any) {
      Logger.error('Failed to update departments:', error);
      setError(error.message || 'Failed to update departments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setSelectedDepartmentIds(manager.departmentIds || []);
    setIsEditing(false);
    setError(null);
  };

  // Load available employees for assignment
  const loadAvailableEmployees = async () => {
    if (!manager || !isOpen) return;

    try {
      const result = await DatabaseShardingService.queryDocuments(manager.organizationId, 'employees');

      // Filter to employees that are:
      // 1. Active
      // 2. Not already assigned to this manager (check managerIds array)
      const available = result.documents.filter((emp: Employee) => {
        const employeeManagerIds = getManagerIds(emp.employment);
        return emp.isActive !== false && !employeeManagerIds.includes(manager.id);
      });

      setAvailableEmployees(available as Employee[]);
    } catch (error) {
      Logger.error('Failed to load available employees:', error);
    }
  };

  // 🔧 UPDATED: Handle assigning employee to this manager (add to managerIds array)
  const handleAssignEmployee = async () => {
    if (!selectedEmployeeId || !manager) return;

    setAssigningEmployee(true);
    setError(null);

    try {
      // Get current employee to access their existing managers
      const employee = await DatabaseShardingService.getDocument(
        manager.organizationId,
        'employees',
        selectedEmployeeId
      );

      if (employee) {
        // Get current manager IDs and add this manager
        const currentManagerIds = getManagerIds(employee.employment);
        const updatedManagerIds = [...new Set([...currentManagerIds, manager.id])]; // Add + deduplicate

        await DatabaseShardingService.updateDocument(
          manager.organizationId,
          'employees',
          selectedEmployeeId,
          { 'employment.managerIds': updatedManagerIds }
        );
      }

      // Reload employees
      const emps = await ManagerService.getManagerEmployees(manager.organizationId, manager.id);
      setEmployees(emps);

      // Reload available employees
      await loadAvailableEmployees();

      // Reset form
      setShowAddEmployee(false);
      setSelectedEmployeeId('');
      setEmployeeSearch('');

      Logger.success('Employee assigned successfully');
    } catch (error: any) {
      Logger.error('Failed to assign employee:', error);
      setError(error.message || 'Failed to assign employee. Please try again.');
    } finally {
      setAssigningEmployee(false);
    }
  };

  // 🔧 NEW: Handle removing employee from this manager
  const handleRemoveEmployee = async (employeeId: string) => {
    if (!manager) return;

    try {
      // Get current employee
      const employee = await DatabaseShardingService.getDocument(
        manager.organizationId,
        'employees',
        employeeId
      );

      if (employee) {
        // Remove this manager from the employee's managerIds array
        const currentManagerIds = getManagerIds(employee.employment);
        const updatedManagerIds = currentManagerIds.filter(id => id !== manager.id);

        await DatabaseShardingService.updateDocument(
          manager.organizationId,
          'employees',
          employeeId,
          { 'employment.managerIds': updatedManagerIds }
        );

        // Reload employees
        const emps = await ManagerService.getManagerEmployees(manager.organizationId, manager.id);
        setEmployees(emps);

        Logger.success('Manager removed from employee');
      }
    } catch (error: any) {
      Logger.error('Failed to remove manager:', error);
      setError(error.message || 'Failed to remove manager. Please try again.');
    }
  };

  // Filter available employees based on search
  const filteredAvailableEmployees = availableEmployees.filter(emp => {
    // Skip employees with missing profile data
    if (!emp.profile) return false;

    const searchLower = employeeSearch.toLowerCase();
    const fullName = `${emp.profile.firstName || ''} ${emp.profile.lastName || ''}`.toLowerCase();
    const employeeNumber = emp.profile.employeeNumber?.toLowerCase() || '';
    const email = emp.profile.email?.toLowerCase() || '';
    const position = emp.profile.position?.toLowerCase() || '';

    return (
      fullName.includes(searchLower) ||
      employeeNumber.includes(searchLower) ||
      email.includes(searchLower) ||
      position.includes(searchLower)
    );
  });

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      // Handle Firestore Timestamp
      if (date.toDate && typeof date.toDate === 'function') {
        return date.toDate().toLocaleDateString();
      }
      // Handle Date object
      if (date instanceof Date) {
        return date.toLocaleDateString();
      }
      // Handle string
      return new Date(date).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Manager Details"
      subtitle={`${manager.firstName} ${manager.lastName}`}
      size="lg"
    >
      <div className="p-6">
        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Manager Profile */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                  {manager.firstName.charAt(0)}{manager.lastName.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    {manager.firstName} {manager.lastName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        manager.role.id === 'hr-manager'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {manager.role.name}
                    </span>
                    {manager.isActive && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Contact Information
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email</span>
                  <span className="text-sm font-medium text-gray-900">{manager.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">User ID</span>
                  <span className="text-sm font-mono text-gray-900">{manager.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm text-gray-900">{formatDate(manager.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Department Assignments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Department Assignments
                </h4>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelEdit}
                      disabled={loading}
                      className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      <X className="w-3 h-3" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveDepartments}
                      disabled={loading}
                      className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      <Save className="w-3 h-3" />
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {departments.length === 0 ? (
                    <p className="text-sm text-gray-500">No departments available</p>
                  ) : (
                    <div className="space-y-2">
                      {departments.map(dept => (
                        <label key={dept.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={selectedDepartmentIds.includes(dept.id)}
                            onChange={() => handleDepartmentToggle(dept.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">{dept.name}</span>
                            {dept.description && (
                              <p className="text-xs text-gray-500">{dept.description}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  {manager.departmentNames && manager.departmentNames.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {manager.departmentNames.map((name, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No departments assigned</p>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>

            {/* Direct Reports */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Direct Reports ({employees.length})
                </h4>
                {!showAddEmployee && (
                  <button
                    onClick={() => setShowAddEmployee(true)}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    <UserPlus className="w-3 h-3" />
                    Add Employee
                  </button>
                )}
              </div>

              {/* Add Employee Form */}
              {showAddEmployee && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-900">Assign Employee to Manager</span>
                    <button
                      onClick={() => {
                        setShowAddEmployee(false);
                        setSelectedEmployeeId('');
                        setEmployeeSearch('');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative mb-2">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search employees by name, number, position..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Employee Dropdown */}
                  <div className="mb-2">
                    <select
                      value={selectedEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      size={5}
                    >
                      <option value="">Select an employee...</option>
                      {filteredAvailableEmployees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.profile?.firstName || 'Unknown'} {emp.profile?.lastName || 'Employee'} ({emp.profile?.employeeNumber || 'N/A'}) - {emp.profile?.position || 'No Position'}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-600 mt-1">
                      {filteredAvailableEmployees.length} available employee{filteredAvailableEmployees.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleAssignEmployee}
                      disabled={!selectedEmployeeId || assigningEmployee}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {assigningEmployee ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Assigning...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3" />
                          Assign Employee
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddEmployee(false);
                        setSelectedEmployeeId('');
                        setEmployeeSearch('');
                      }}
                      disabled={assigningEmployee}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                {employees.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No employees currently assigned to this manager
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {employees.map((emp) => {
                      const firstName = emp.profile?.firstName || 'Unknown';
                      const lastName = emp.profile?.lastName || 'Employee';
                      const position = emp.profile?.position || 'No Position';
                      const department = emp.profile?.department || 'No Department';
                      const employeeNumber = emp.profile?.employeeNumber || 'N/A';

                      return (
                        <div key={emp.id} className="p-3 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-xs">
                                {firstName.charAt(0)}{lastName.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {firstName} {lastName}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {position} • {department}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-gray-500">
                                {employeeNumber}
                              </div>
                              <button
                                onClick={() => handleRemoveEmployee(emp.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Remove manager from employee"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </UnifiedModal>
  );
};
