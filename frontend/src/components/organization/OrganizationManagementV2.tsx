// frontend/src/components/organization/OrganizationManagementV2.tsx
// 🏢 V2 ORGANIZATION MANAGEMENT - SHARDED ARCHITECTURE COMPATIBLE
// ✅ Modern V2 design system, sharded data integration, enhanced UX

import React, { useState, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Settings, Building2, Shield,
  Plus, Eye, Edit, Trash2, AlertCircle, CheckCircle,
  Crown, TrendingUp, Calendar, Mail, Phone, Archive, RotateCcw
} from 'lucide-react';

import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useMultiRolePermissions } from '../../hooks/useMultiRolePermissions';
import { ShardedDataService } from '../../services/ShardedDataService';
import { DatabaseShardingService } from '../../services/DatabaseShardingService';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { userCreationManager } from '../../utils/userCreationContext';
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
  monthlyGrowth: number;
}

// V2 Add User Modal Component
interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userRole: 'hr-manager' | 'hod-manager';
}

const AddUserModal = memo<AddUserModalProps>(({
  isOpen,
  onClose,
  onSuccess,
  userRole
}) => {
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

    let firebaseUserId: string | null = null;

    try {
      Logger.debug(`🔧 Creating ${userRole} user with race condition prevention`);
      
      // Step 1: Create Firebase Auth account (this will trigger AuthContext listener)
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const firebaseUser = userCredential.user;
      firebaseUserId = firebaseUser.uid;

      // Step 2: Mark this user as being created to suppress warnings
      userCreationManager.startUserCreation(firebaseUserId);
      
      Logger.debug(`👤 Created Firebase Auth user: ${firebaseUserId}`);
      
      // Step 3: Prepare user data
      const roleData = {
        id: userRole,
        name: userRole === 'hr-manager' ? 'HR Manager' : 'Department Manager',
        description: userRole === 'hr-manager' ? 'Human Resources Manager' : 'Head of Department Manager',
        level: userRole === 'hr-manager' ? 3 : 2
      };

      const userData = {
        uid: firebaseUserId, // Firebase Auth UID
        id: firebaseUserId, // Use Firebase Auth UID
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: roleData,
        organizationId: organization.id,
        departmentIds: userRole === 'hod-manager' ? [formData.department] : [],
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        permissions: [{
          resource: 'employees',
          actions: userRole === 'hr-manager' ? ['create', 'read', 'update', 'delete'] : ['read'],
          scope: 'organization'
        }, {
          resource: 'warnings',
          actions: userRole === 'hod-manager' ? ['create', 'read', 'update'] : ['read'],
          scope: userRole === 'hod-manager' ? 'department' : 'organization'
        }]
      };

      // Step 4: Create user document in sharded structure
      await DatabaseShardingService.createDocument(
        organization.id,
        'users',
        userData,
        firebaseUserId
      );

      Logger.debug(`📄 Created Firestore user document: ${firebaseUserId}`);

      // Step 5: Update Firebase Auth profile
      await updateProfile(firebaseUser, {
        displayName: `${formData.firstName} ${formData.lastName}`
      });

      // Step 6: Mark user creation as complete
      userCreationManager.finishUserCreation(firebaseUserId);
      
      Logger.success(`✅ Created ${userRole} user successfully: ${firebaseUserId}`);
      
      setLoading(false);
      onSuccess();
      onClose();
      setFormData({ firstName: '', lastName: '', email: '', department: '', password: 'temp123' });
      
    } catch (err: any) {
      // Clean up user creation state on error
      if (firebaseUserId) {
        userCreationManager.finishUserCreation(firebaseUserId);
      }
      
      Logger.error('❌ Error creating user:', err);
      setError(err.message || 'Failed to create user');
      setLoading(false);
    }
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
            Create a new {userRole === 'hr-manager' ? 'HR manager' : 'department manager'} account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create User
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
export const OrganizationManagementV2 = memo(() => {
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
  const [businessOwner, setBusinessOwner] = useState<OrganizationUser | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<OrganizationStats>({
    totalUsers: 0,
    totalEmployees: 0,
    totalDepartments: 0,
    activeWarnings: 0,
    monthlyGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedUserRole, setSelectedUserRole] = useState<'hr-manager' | 'hod-manager'>('hr-manager');

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
        return getRoleId(user.role) !== 'business-owner';
      });

      const businessOwnerUser = allUsers.find((user: any) => {
        return getRoleId(user.role) === 'business-owner';
      }) || null;

      // Load employees for stats
      const employeesResult = await ShardedDataService.loadEmployees(organization.id);
      
      // Load warnings for stats
      const warningsResult = await ShardedDataService.loadWarnings(organization.id);
      const activeWarnings = warningsResult.documents.filter((w: any) => w.status === 'issued').length;

      // Create mock departments (replace with real data loading)
      const mockDepartments: Department[] = [
        {
          id: 'operations',
          name: 'Operations',
          employeeCount: employeesResult.documents.filter((e: any) => e.employment?.department === 'Operations').length,
          createdAt: '2024-01-01',
          managerId: organizationUsers.find(u => {
            return getRoleId(u.role) === 'hod-manager' && u.departmentIds?.includes('operations');
          })?.id,
          managerName: (() => {
            const manager = organizationUsers.find(u => {
              return getRoleId(u.role) === 'hod-manager' && u.departmentIds?.includes('operations');
            });
            return manager ? `${manager.firstName} ${manager.lastName || ''}` : undefined;
          })()
        },
        {
          id: 'production',
          name: 'Production',
          employeeCount: employeesResult.documents.filter((e: any) => e.employment?.department === 'Production').length,
          createdAt: '2024-01-01'
        },
        {
          id: 'quality',
          name: 'Quality Assurance',
          employeeCount: employeesResult.documents.filter((e: any) => e.employment?.department === 'Quality Assurance').length,
          createdAt: '2024-01-01'
        }
      ];

      // Calculate stats
      const organizationStats: OrganizationStats = {
        totalUsers: organizationUsers.length,
        totalEmployees: employeesResult.documents.length,
        totalDepartments: mockDepartments.length,
        activeWarnings,
        monthlyGrowth: 12.5 // Mock growth - replace with real calculation
      };

      setUsers(organizationUsers);
      setBusinessOwner(businessOwnerUser);
      setDepartments(mockDepartments);
      setStats(organizationStats);

      Logger.success(`✅ Loaded organization data: ${organizationUsers.length} users, ${employeesResult.documents.length} employees`);
      
    } catch (error) {
      Logger.error('❌ Failed to load organization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = (role: 'hr-manager' | 'hod-manager') => {
    setSelectedUserRole(role);
    setShowAddUserModal(true);
  };

  const handleUserCreated = () => {
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
      const employeesResult = await ShardedDataService.loadEmployees(organization.id);
      return employeesResult.documents.filter((emp: any) =>
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
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header with Stats */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Organization Management</h2>
                <p className="text-blue-100">Manage users, departments, and organizational structure</p>
              </div>
            </div>
            <div className="text-xs bg-white/20 backdrop-blur px-4 py-2 rounded-full font-semibold">
              V2 Architecture
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-blue-200" />
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <div className="text-xs text-blue-200">System Users</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <Shield className="w-6 h-6 mx-auto mb-2 text-blue-200" />
              <div className="text-2xl font-bold">{stats.totalEmployees}</div>
              <div className="text-xs text-blue-200">Employees</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <Building2 className="w-6 h-6 mx-auto mb-2 text-blue-200" />
              <div className="text-2xl font-bold">{stats.totalDepartments}</div>
              <div className="text-xs text-blue-200">Departments</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-200" />
              <div className="text-2xl font-bold">+{stats.monthlyGrowth}%</div>
              <div className="text-xs text-blue-200">Growth</div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {canCreateHRManagers() && (
            <button
              onClick={() => handleAddUser('hr-manager')}
              className="group bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-blue-100 group-hover:bg-blue-200 rounded-xl transition-colors">
                  <UserPlus className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900">Add HR Manager</h3>
                  <p className="text-sm text-gray-600 mt-1">Create new HR management role</p>
                </div>
              </div>
            </button>
          )}

          {canCreateHODManagers() && (
            <button
              onClick={() => handleAddUser('hod-manager')}
              className="group bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-dashed border-green-300 hover:border-green-500 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-green-100 group-hover:bg-green-200 rounded-xl transition-colors">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900">Add Department Manager</h3>
                  <p className="text-sm text-gray-600 mt-1">Create department head role</p>
                </div>
              </div>
            </button>
          )}

          {canManageUsers() && (
            <button
              onClick={() => navigate('/users')}
              className="group bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-purple-100 group-hover:bg-purple-200 rounded-xl transition-colors">
                  <Settings className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900">User Management</h3>
                  <p className="text-sm text-gray-600 mt-1">Manage all system users</p>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Business Owner Section */}
        {businessOwner && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3 mb-4">
              <Crown className="w-6 h-6 text-yellow-600" />
              Business Owner
            </h3>

            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Crown className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {businessOwner.firstName} {businessOwner.lastName}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {businessOwner.email}
                    </div>
                    {businessOwner.lastLogin && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Last login: {new Date(businessOwner.lastLogin).toLocaleDateString()}
                      </div>
                    )}
                    <div className="text-xs text-yellow-700 font-medium mt-1">
                      👑 Organization Owner • Full Access
                    </div>
                  </div>
                </div>

                {/* Super Users and Resellers can manage business owners */}
                {(user?.role === 'super-user' || user?.role === 'reseller') && (
                  <div className="flex items-center gap-2">
                    {businessOwner.isActive ? (
                      <button
                        onClick={() => handleArchiveUser(businessOwner.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                        title="Archive business owner"
                      >
                        <Archive className="w-4 h-4 text-gray-500 group-hover:text-red-600" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRestoreUser(businessOwner.id)}
                        className="p-2 hover:bg-green-100 rounded-lg transition-colors group"
                        title="Restore business owner"
                      >
                        <RotateCcw className="w-4 h-4 text-gray-500 group-hover:text-green-600" />
                      </button>
                    )}
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      businessOwner.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {businessOwner.isActive ? 'Active' : 'Archived'}
                    </div>
                  </div>
                )}

                {/* Business owners cannot manage themselves */}
                {user?.role === 'business-owner' && (
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Current User
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Current Users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* HR Managers */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
              HR Managers ({users.filter(u => getRoleId(u.role) === 'hr-manager').length})
            </h3>
            
            <div className="space-y-3">
              {users.filter(u => getRoleId(u.role) === 'hr-manager').map(user => (
                <div key={user.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-blue-600 text-sm">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                        {user.lastLogin && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Last login: {new Date(user.lastLogin).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-green-600" />
              Department Managers ({users.filter(u => getRoleId(u.role) === 'hod-manager').length})
            </h3>
            
            <div className="space-y-3">
              {users.filter(u => getRoleId(u.role) === 'hod-manager').map(user => (
                <div key={user.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-green-600 text-sm">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                        {user.departmentIds && user.departmentIds.length > 0 && (
                          <div className="text-xs text-green-600 font-medium">
                            Manages: {user.departmentIds.map(id => 
                              departments.find(d => d.id === id)?.name || id
                            ).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3 mb-4">
              <Building2 className="w-6 h-6 text-orange-600" />
              Departments ({departments.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {departments.map(dept => (
                <div key={dept.id} className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{dept.name}</h4>
                    <button className="p-1 hover:bg-orange-100 rounded-lg transition-colors">
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
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
      {showAddUserModal && createPortal(
        <AddUserModal
          isOpen={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
          onSuccess={handleUserCreated}
          userRole={selectedUserRole}
        />,
        document.body
      )}
    </>
  );
});

OrganizationManagementV2.displayName = 'OrganizationManagementV2';