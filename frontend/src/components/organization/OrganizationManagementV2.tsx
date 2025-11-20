// frontend/src/components/organization/OrganizationManagementV2.tsx
// 🏢 V2 ORGANIZATION MANAGEMENT - SHARDED ARCHITECTURE COMPATIBLE
// ✅ Modern V2 design system, sharded data integration, enhanced UX

import React, { useState, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Settings, Building2, Shield,
  Plus, Eye, Edit, Trash2, AlertCircle, CheckCircle,
  Crown, Calendar, Mail, Phone, Archive, RotateCcw, X
} from 'lucide-react';

import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useMultiRolePermissions } from '../../hooks/useMultiRolePermissions';
import { useModal } from '../../hooks/useModal';
import { API } from '../../api';  // 🚀 WEEK 3: Migrated to API layer
import { DatabaseShardingService } from '../../services/DatabaseShardingService';  // Still needed for queryDocuments
import { UserCreationService } from '../../services/UserCreationService';
import { userCreationManager } from '../../utils/userCreationContext';
import DepartmentService from '../../services/DepartmentService';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import { LoadingState } from '../common/LoadingState';
import Logger from '../../utils/logger';

// Types
interface OrganizationUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  departmentIds?: string[];
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface Department {
  id: string;
  name: string;
  managerId?: string;
  managerName?: string;
  employeeCount: number;
  description?: string;
  createdAt: string;
}

interface OrganizationStats {
  totalUsers: number;
  totalEmployees: number;
  totalDepartments: number;
  activeWarnings: number;
}

// V2 Add User Modal Component
interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userRole: 'hr-manager' | 'hod-manager';
  employees: any[]; // List of current employees for promotion
}

const AddUserModal = memo<AddUserModalProps>(({
  isOpen,
  onClose,
  onSuccess,
  userRole,
  employees
}) => {
  const [selectionMode, setSelectionMode] = useState<'promote' | 'create'>(employees.length > 0 ? 'promote' : 'create');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    password: 'temp123'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const { organization } = useOrganization();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !user) return;

    setLoading(true);
    setError('');

    try {
      if (selectionMode === 'promote') {
        if (!selectedEmployee) {
          setError('Please select an employee to promote');
          setLoading(false);
          return;
        }

        Logger.debug(`🔧 Promoting employee ${selectedEmployee.id} to ${userRole}`);

        // Validate email is provided
        if (!formData.email.trim()) {
          setError('Email address is required for creating user account');
          setLoading(false);
          return;
        }

        // Create user account for existing employee
        const userData = {
          firstName: selectedEmployee.profile?.firstName || selectedEmployee.firstName,
          lastName: selectedEmployee.profile?.lastName || selectedEmployee.lastName,
          email: formData.email.trim(), // Use the verified/entered email
          password: 'temp123',
          role: userRole,
          organizationId: organization.id,
          departmentIds: userRole === 'hod-manager' ? [formData.department] : [],
          employeeId: selectedEmployee.id, // Link to existing employee record
          updateEmployeeEmail: true // Flag to update employee record with verified email
        };

        const createUserFunction = httpsCallable(functions, 'createOrganizationUser');
        const result = await createUserFunction(userData);

        if (!result.data.success) {
          throw new Error(result.data.message || 'Failed to promote employee');
        }

        Logger.success(`✅ Promoted employee to ${userRole} with verified email: ${formData.email}`);

      } else {
        // Create new user AND employee
        Logger.debug(`🔧 Creating new ${userRole} user and employee via Cloud Function`);

        const userData = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: userRole,
          organizationId: organization.id,
          departmentIds: userRole === 'hod-manager' ? [formData.department] : [],
          createEmployee: true // Flag to also create employee record
        };

        const createUserFunction = httpsCallable(functions, 'createOrganizationUser');
        const result = await createUserFunction(userData);

        if (!result.data.success) {
          throw new Error(result.data.message || 'Failed to create user');
        }

        Logger.success(`✅ Created ${userRole} user and employee: ${result.data.userId}`);
      }

      setLoading(false);
      onSuccess();
      onClose();
      resetForm();

    } catch (err: any) {
      Logger.error('❌ Error processing user:', err);
      setError(err.message || 'Failed to process user');
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectionMode(employees.length > 0 ? 'promote' : 'create');
    setSelectedEmployee(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      department: '',
      password: 'temp123'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in duration-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-blue-600" />
            Add {userRole === 'hr-manager' ? 'HR Manager' : 'Department Manager'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {selectionMode === 'promote'
              ? `Promote an existing employee to ${userRole === 'hr-manager' ? 'HR manager' : 'department manager'}`
              : `Create a new ${userRole === 'hr-manager' ? 'HR manager' : 'department manager'} account`
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Selection Mode Toggle */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Choose Option
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="selectionMode"
                  value="promote"
                  checked={selectionMode === 'promote'}
                  onChange={(e) => setSelectionMode(e.target.value as 'promote' | 'create')}
                  className="mr-3 text-blue-600"
                  disabled={employees.length === 0}
                />
                <span className={employees.length === 0 ? 'text-gray-400' : 'text-gray-700'}>
                  Promote Existing Employee {employees.length === 0 && '(No employees available)'}
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="selectionMode"
                  value="create"
                  checked={selectionMode === 'create'}
                  onChange={(e) => setSelectionMode(e.target.value as 'promote' | 'create')}
                  className="mr-3 text-blue-600"
                />
                <span className="text-gray-700">Create New Manager</span>
              </label>
            </div>
          </div>

          {/* Employee Selection Mode */}
          {selectionMode === 'promote' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Employee to Promote
              </label>
              <select
                value={selectedEmployee?.id || ''}
                onChange={(e) => {
                  const emp = employees.find(emp => emp.id === e.target.value);
                  setSelectedEmployee(emp || null);
                  // Pre-populate email if available, otherwise suggest one
                  if (emp) {
                    const currentEmail = emp.profile?.email || emp.email;
                    const suggestedEmail = currentEmail || `${emp.profile?.firstName || emp.firstName}.${emp.profile?.lastName || emp.lastName}@${organization?.name.toLowerCase().replace(/\s+/g, '')}.com`;
                    setFormData(prev => ({ ...prev, email: currentEmail || '' }));
                  } else {
                    setFormData(prev => ({ ...prev, email: '' }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select an employee...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.profile?.firstName || emp.firstName} {emp.profile?.lastName || emp.lastName}
                    {emp.profile?.email && ` (${emp.profile.email})`}
                  </option>
                ))}
              </select>
              {selectedEmployee && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg space-y-3">
                  <div className="text-sm">
                    <strong>Selected:</strong> {selectedEmployee.profile?.firstName || selectedEmployee.firstName} {selectedEmployee.profile?.lastName || selectedEmployee.lastName}
                    <br />
                    <strong>Department:</strong> {selectedEmployee.profile?.department || selectedEmployee.employment?.department || 'Not assigned'}
                  </div>

                  {/* Email Verification/Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      Email Address
                      {selectedEmployee.profile?.email ? (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          Verify/Update
                        </span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          Required
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          selectedEmployee.profile?.email ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                        }`}
                        placeholder={selectedEmployee.profile?.email || `${selectedEmployee.profile?.firstName || selectedEmployee.firstName}.${selectedEmployee.profile?.lastName || selectedEmployee.lastName}@${organization?.name.toLowerCase().replace(/\s+/g, '')}.com`}
                        required
                      />
                      {selectedEmployee.profile?.email && formData.email === (selectedEmployee.profile?.email || selectedEmployee.email) && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-green-600 text-sm">✓ Verified</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 flex items-start gap-2">
                      {selectedEmployee.profile?.email ? (
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0 mt-1"></span>
                          <span>Current: <strong>{selectedEmployee.profile.email}</strong>. You can verify or update it above.</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1"></span>
                          <span>No email on file. Please enter their email address for login access.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Create New User Form */}
          {selectionMode === 'create' && (
            <>
              <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {userRole === 'hod-manager' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Department</option>
                <option value="operations">Operations</option>
                <option value="production">Production</option>
                <option value="quality">Quality Assurance</option>
                <option value="maintenance">Maintenance</option>
                <option value="logistics">Logistics</option>
                <option value="administration">Administration</option>
                <option value="finance">Finance</option>
                <option value="sales">Sales & Marketing</option>
              </select>
            </div>
          )}
          </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {selectionMode === 'promote' ? 'Promoting...' : 'Creating...'}
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  {selectionMode === 'promote' ? 'Promote Employee' : 'Create Manager'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

AddUserModal.displayName = 'AddUserModal';

// Helper function to get role ID from either string or object role
const getRoleId = (role: any): string => {
  return typeof role === 'string' ? role : role?.id || '';
};

// Main Organization Management V2 Component
interface OrganizationManagementV2Props {
  onSwitchToDepartments?: () => void; // Callback to switch to departments tab
}

export const OrganizationManagementV2 = memo(({ onSwitchToDepartments }: OrganizationManagementV2Props = {}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organization } = useOrganization();
  const {
    canCreateHRManagers,
    canCreateHODManagers,
    canManageDepartments,
    canManageUsers
  } = useMultiRolePermissions();

  // State
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [executiveManagement, setBusinessOwner] = useState<OrganizationUser | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [stats, setStats] = useState<OrganizationStats>({
    totalUsers: 0,
    totalEmployees: 0,
    totalDepartments: 0,
    activeWarnings: 0
  });
  const [loading, setLoading] = useState(true);

  // 🚀 REFACTORED: Migrated to useModal hook
  const addUserModal = useModal<'hr-manager' | 'hod-manager'>();

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load organization data with sharded architecture
  useEffect(() => {
    if (organization) {
      loadOrganizationData();
    }
  }, [organization]);

  const loadOrganizationData = async () => {
    if (!organization) return;

    try {
      setLoading(true);
      Logger.debug(`📊 Loading organization data for: ${organization.id}`);
      
      // Load users from sharded structure
      const usersResult = await DatabaseShardingService.queryDocuments(
        organization.id,
        'users',
        []
      );

      // Separate business owners from other users
      const allUsers = usersResult.documents.map((user: any) => ({
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        role: user.role,
        departmentIds: user.departmentIds || [],
        isActive: user.isActive ?? true,
        createdAt: user.createdAt || new Date().toISOString(),
        lastLogin: user.lastLogin
      }));

      const organizationUsers = allUsers.filter((user: any) => {
        return getRoleId(user.role) !== 'executive-management';
      });

      const executiveManagementUser = allUsers.find((user: any) => {
        return getRoleId(user.role) === 'executive-management';
      }) || null;

      // 🚀 WEEK 3: Migrated to API layer
      // Load employees for stats
      const employeesResult = await API.employees.getAll(organization.id);

      // Load warnings for stats
      const warningsResult = await API.warnings.getAll(organization.id);
      const activeWarnings = warningsResult.filter((w: any) => w.status === 'issued').length;

      // Load real departments from Firebase
      const departmentsData = await DepartmentService.getDepartments(organization.id);

      // Convert to component format and add manager info
      const realDepartments: Department[] = departmentsData.map(dept => ({
        id: dept.id,
        name: dept.name,
        employeeCount: dept.employeeCount,
        createdAt: dept.createdAt.toISOString(),
        description: dept.description,
        managerId: dept.managerId,
        managerName: dept.managerName
      }));

      // Calculate stats
      const organizationStats: OrganizationStats = {
        totalUsers: organizationUsers.length,
        totalEmployees: employeesResult.length,  // 🚀 WEEK 3: API returns array directly
        totalDepartments: realDepartments.length,
        activeWarnings
      };

      setUsers(organizationUsers);
      setBusinessOwner(executiveManagementUser);
      setDepartments(realDepartments);
      setEmployees(employeesResult);  // 🚀 WEEK 3: API returns array directly
      setStats(organizationStats);

      Logger.success(`✅ Loaded organization data: ${organizationUsers.length} users, ${employeesResult.length} employees`);
      
    } catch (error) {
      Logger.error('❌ Failed to load organization data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🚀 REFACTORED: Using useModal hook with data
  const handleAddUser = (role: 'hr-manager' | 'hod-manager') => {
    addUserModal.open(role);
  };

  const handleUserCreated = () => {
    // 🚀 REFACTORED: Using modal data
    const roleName = addUserModal.data === 'hr-manager' ? 'HR Manager' : 'Department Manager';
    setSuccessMessage(`✅ ${roleName} created successfully! User can now sign in with their email and password 'temp123'.`);

    // Auto-hide success message after 5 seconds
    setTimeout(() => setSuccessMessage(null), 5000);

    // Reload data to show new user
    loadOrganizationData();
  };

  // Archive user and reassign their employees to HR manager
  const handleArchiveUser = async (userId: string) => {
    if (!organization) return;

    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Confirmation with warning about employee reassignment
    const employeesManaged = await getEmployeesManagedByUser(userId);
    const confirmMessage = employeesManaged.length > 0
      ? `Archive ${user.firstName} ${user.lastName}?\n\nThis will:\n• Archive the user account\n• Reassign ${employeesManaged.length} employees to HR managers\n• Remove access to the system\n\nThis action can be undone by restoring the user.`
      : `Archive ${user.firstName} ${user.lastName}?\n\nThis will remove their access to the system.\nThis action can be undone by restoring the user.`;

    const confirmed = confirm(confirmMessage);
    if (!confirmed) return;

    try {
      Logger.debug(`🗃️ Archiving user ${userId} and reassigning employees...`);

      // Step 1: Reassign employees if user is a manager
      if (employeesManaged.length > 0) {
        await reassignEmployeesToHRManager(userId, employeesManaged);
      }

      // Step 2: Archive the user
      await ShardedDataService.updateDocument(
        organization.id,
        'users',
        userId,
        {
          isActive: false,
          archivedAt: new Date().toISOString(),
          archivedBy: user?.uid || 'system'
        }
      );

      Logger.success(`✅ User archived successfully: ${user.firstName} ${user.lastName}`);

      // Refresh data
      loadOrganizationData();

    } catch (error) {
      Logger.error('❌ Failed to archive user:', error);
      alert('Failed to archive user. Please try again.');
    }
  };

  // Restore archived user
  const handleRestoreUser = async (userId: string) => {
    if (!organization) return;

    const user = users.find(u => u.id === userId);
    if (!user) return;

    const confirmed = confirm(`Restore ${user.firstName} ${user.lastName}?\n\nThis will reactivate their account and restore system access.`);
    if (!confirmed) return;

    try {
      Logger.debug(`🔄 Restoring user ${userId}...`);

      await ShardedDataService.updateDocument(
        organization.id,
        'users',
        userId,
        {
          isActive: true,
          restoredAt: new Date().toISOString(),
          restoredBy: user?.uid || 'system',
          archivedAt: null,
          archivedBy: null
        }
      );

      Logger.success(`✅ User restored successfully: ${user.firstName} ${user.lastName}`);

      // Refresh data
      loadOrganizationData();

    } catch (error) {
      Logger.error('❌ Failed to restore user:', error);
      alert('Failed to restore user. Please try again.');
    }
  };

  // Helper function to get employees managed by a user
  const getEmployeesManagedByUser = async (managerId: string) => {
    if (!organization) return [];

    try {
      // 🚀 WEEK 3: Migrated to API layer
      const employeesResult = await API.employees.getAll(organization.id);
      return employeesResult.filter((emp: any) =>
        emp.employment?.managerId === managerId && emp.isActive !== false
      );
    } catch (error) {
      Logger.error('Error loading managed employees:', error);
      return [];
    }
  };

  // Helper function to reassign employees to HR manager
  const reassignEmployeesToHRManager = async (oldManagerId: string, employees: any[]) => {
    if (!organization || employees.length === 0) return;

    try {
      // Find active HR manager to reassign to
      const hrManager = users.find(u =>
        getRoleId(u.role) === 'hr-manager' && u.isActive && u.id !== oldManagerId
      );

      if (!hrManager) {
        Logger.warn('⚠️ No active HR manager found for employee reassignment');
        return;
      }

      Logger.debug(`📋 Reassigning ${employees.length} employees to HR manager: ${hrManager.firstName} ${hrManager.lastName}`);

      // Update each employee's managerId
      const updatePromises = employees.map(employee =>
        ShardedDataService.updateDocument(
          organization.id,
          'employees',
          employee.id,
          {
            'employment.managerId': hrManager.id,
            'employment.managerName': `${hrManager.firstName} ${hrManager.lastName}`,
            'employment.managerRole': 'hr-manager',
            reassignedAt: new Date().toISOString(),
            reassignedFrom: oldManagerId,
            reassignedReason: 'Manager archived'
          }
        )
      );

      await Promise.all(updatePromises);

      Logger.success(`✅ Reassigned ${employees.length} employees to ${hrManager.firstName} ${hrManager.lastName}`);

    } catch (error) {
      Logger.error('❌ Failed to reassign employees:', error);
      throw error;
    }
  };

  if (loading) {
    return <LoadingState message="Loading organization..." />;
  }

  return (
    <>
      <div className="space-y-3">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="text-green-800 font-medium">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Compact Header with Actions */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <h2 className="text-base font-bold text-gray-900">Organization Management</h2>
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {stats.totalUsers} users
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {stats.totalEmployees} employees
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {stats.totalDepartments} depts
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canCreateHRManagers() && (
                <button
                  onClick={() => handleAddUser('hr-manager')}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-md transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add HR Manager
                </button>
              )}
              {canCreateHODManagers() && (
                <button
                  onClick={() => handleAddUser('hod-manager')}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-md transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add Dept Manager
                </button>
              )}
              {canManageUsers() && (
                <button
                  onClick={() => navigate('/users')}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  User Management
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Executive Management Section */}
        {executiveManagement && (
          <div className="bg-white border border-gray-200 rounded-lg p-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Crown className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-gray-900">
                    {executiveManagement.firstName} {executiveManagement.lastName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {executiveManagement.email} • Executive Management
                  </div>
                </div>
              </div>

              {/* Super Users and Resellers can manage business owners */}
              {(user?.role === 'super-user' || user?.role === 'reseller') && (
                <div className="flex items-center gap-1">
                  {executiveManagement.isActive ? (
                    <button
                      onClick={() => handleArchiveUser(executiveManagement.id)}
                      className="p-1.5 hover:bg-red-100 rounded transition-colors group"
                      title="Archive business owner"
                    >
                      <Archive className="w-3.5 h-3.5 text-gray-500 group-hover:text-red-600" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRestoreUser(executiveManagement.id)}
                      className="p-1.5 hover:bg-green-100 rounded transition-colors group"
                      title="Restore business owner"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-gray-500 group-hover:text-green-600" />
                    </button>
                  )}
                  <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    executiveManagement.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {executiveManagement.isActive ? 'Active' : 'Archived'}
                  </div>
                </div>
              )}

              {/* Business owners cannot manage themselves */}
              {user?.role === 'executive-management' && (
                <div className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Current User
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current Users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* HR Managers */}
          <div className="bg-white border border-gray-200 rounded-lg p-2.5">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mb-2">
              <Shield className="w-4 h-4 text-blue-600" />
              HR Managers ({users.filter(u => getRoleId(u.role) === 'hr-manager').length})
            </h3>

            <div className="space-y-1.5">
              {users.filter(u => getRoleId(u.role) === 'hr-manager').map(user => (
                <div key={user.id} className="bg-gray-50 rounded p-2 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="font-semibold text-blue-600 text-xs">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-xs text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {user.isActive ? (
                        <button
                          onClick={() => handleArchiveUser(user.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                          title="Archive user"
                        >
                          <Archive className="w-4 h-4 text-gray-500 group-hover:text-red-600" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRestoreUser(user.id)}
                          className="p-2 hover:bg-green-100 rounded-lg transition-colors group"
                          title="Restore user"
                        >
                          <RotateCcw className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
                        </button>
                      )}
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Archived'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {users.filter(u => getRoleId(u.role) === 'hr-manager').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No HR managers yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Department Managers */}
          <div className="bg-white border border-gray-200 rounded-lg p-2.5">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mb-2">
              <Users className="w-4 h-4 text-green-600" />
              Department Managers ({users.filter(u => getRoleId(u.role) === 'hod-manager').length})
            </h3>

            <div className="space-y-1.5">
              {users.filter(u => getRoleId(u.role) === 'hod-manager').map(user => (
                <div key={user.id} className="bg-gray-50 rounded p-2 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="font-semibold text-green-600 text-xs">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-xs text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.email}
                          {user.departmentIds && user.departmentIds.length > 0 && (
                            <span className="ml-1 text-green-600">
                              • {user.departmentIds.map(id =>
                                departments.find(d => d.id === id)?.name || id
                              ).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {user.isActive ? (
                        <button
                          onClick={() => handleArchiveUser(user.id)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                          title="Archive user"
                        >
                          <Archive className="w-4 h-4 text-gray-500 group-hover:text-red-600" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRestoreUser(user.id)}
                          className="p-2 hover:bg-green-100 rounded-lg transition-colors group"
                          title="Restore user"
                        >
                          <RotateCcw className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
                        </button>
                      )}
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Archived'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {users.filter(u => getRoleId(u.role) === 'hod-manager').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No department managers yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Departments Overview */}
        {canManageDepartments() && departments.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-2.5">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mb-2">
              <Building2 className="w-4 h-4 text-orange-600" />
              Departments ({departments.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {departments.map(dept => (
                <div
                  key={dept.id}
                  onClick={onSwitchToDepartments}
                  className="bg-orange-50 rounded p-2 border border-orange-200 cursor-pointer hover:bg-orange-100 hover:border-orange-300 transition-all duration-200 active:scale-95"
                  title="Click to manage departments"
                >
                  <div className="mb-1">
                    <h4 className="font-semibold text-xs text-gray-900">{dept.name}</h4>
                  </div>

                  {dept.managerName ? (
                    <div className="text-sm text-green-700 font-medium mb-2">
                      👤 {dept.managerName}
                    </div>
                  ) : (
                    <div className="text-sm text-orange-600 font-medium mb-2">
                      ⚠️ No manager assigned
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    {dept.employeeCount} employees
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal - Portal to body to ensure proper z-index */}
      {/* 🚀 REFACTORED: Using useModal hook */}
      {addUserModal.isOpen && addUserModal.data && createPortal(
        <AddUserModal
          isOpen={addUserModal.isOpen}
          onClose={addUserModal.close}
          onSuccess={handleUserCreated}
          userRole={addUserModal.data}
          employees={employees}
        />,
        document.body
      )}
    </>
  );
});

OrganizationManagementV2.displayName = 'OrganizationManagementV2';