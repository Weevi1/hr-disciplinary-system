// frontend/src/components/UserManagement.tsx
// 🎯 Enhanced Main User Management component - Business Owner dashboard
import React, { useState } from 'react';
import { UserPlus, Users, Shield, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useUserManagement } from '@/hooks/useUserManagement';
import { CreateUserForm } from './CreateUserForm';
import { UserList } from './UserList';
import { PermissionInfoPanel } from './PermissionInfoPanel';
import { USER_MANAGEMENT_FEATURES } from '@/permissions/roleDefinitions';
import type { User } from '@/types';

interface Message {
  type: 'success' | 'error' | 'info';
  text: string;
}

export const UserManagement: React.FC = () => {
  const { user: currentUser, organization } = useAuth();
  const {
    users,
    loading,
    error,
    creatableRoles,
    userManagementRules,
    createUser,
    deactivateUser,
    reactivateUser,
    canManageUser,
    getRoleColor,
    formatLastLogin
  } = useUserManagement();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Get features for current user role
  const features = USER_MANAGEMENT_FEATURES[currentUser?.role?.id as keyof typeof USER_MANAGEMENT_FEATURES];

  // Auto-hide messages after 5 seconds
  React.useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleCreateUser = async (userData: any) => {
    setCreateLoading(true);
    try {
      await createUser(userData);
      setMessage({
        type: 'success',
        text: `User ${userData.firstName} ${userData.lastName} created successfully!`
      });
      setShowCreateForm(false);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to create user'
      });
      throw error; // Re-throw to let form handle it
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      await deactivateUser(userId);
      setMessage({
        type: 'success',
        text: `User ${user?.firstName} ${user?.lastName} deactivated successfully`
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to deactivate user'
      });
    }
  };

  const handleReactivateUser = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      await reactivateUser(userId);
      setMessage({
        type: 'success',
        text: `User ${user?.firstName} ${user?.lastName} reactivated successfully`
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to reactivate user'
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    // TODO: Implement edit functionality in a future iteration
    setMessage({
      type: 'info',
      text: 'Edit functionality coming soon!'
    });
  };

  if (!currentUser) {
    return (
      <div className="hr-card">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
          <h2 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Authentication Required</h2>
          <p style={{ color: '#6b7280', margin: 0 }}>Please log in to access user management.</p>
        </div>
      </div>
    );
  }

  if (!features) {
    return (
      <div className="hr-card">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Shield size={48} style={{ color: '#f59e0b', margin: '0 auto 1rem' }} />
          <h2 style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>Access Restricted</h2>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Your role ({currentUser.role.name}) does not have user management permissions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Enhanced Header matching your original style */}
      <div className="hr-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ 
              margin: '0 0 0.5rem', 
              color: '#1e40af', 
              fontSize: '1.5rem',
              fontWeight: '600'
            }}>
              👤 User Management
            </h2>
            <p style={{ margin: '0 0 1rem', color: '#64748b' }}>
              Manage HR Managers and Department Heads for {organization?.name}
            </p>
            
            {/* Enhanced User Stats */}
            <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#10b981' 
                }} />
                <span style={{ color: '#6b7280' }}>
                  Active Users: {users.filter(u => u.isActive).length}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: '#ef4444' 
                }} />
                <span style={{ color: '#6b7280' }}>
                  Inactive Users: {users.filter(u => !u.isActive).length}
                </span>
              </div>
            </div>
          </div>

          {/* Create User Button */}
          {creatableRoles.length > 0 && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="hr-button-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              ➕ Create New User
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Message Display matching your original */}
      {message && (
        <div 
          className="hr-card"
          style={{ 
            marginBottom: '1.5rem',
            border: `2px solid ${message.type === 'success' ? '#059669' : 
                                message.type === 'error' ? '#dc2626' : '#3b82f6'}`,
            background: message.type === 'success' ? '#f0fdf4' : 
                       message.type === 'error' ? '#fef2f2' : '#eff6ff'
          }}
        >
          <div style={{ 
            color: message.type === 'success' ? '#059669' : 
                   message.type === 'error' ? '#dc2626' : '#1d4ed8',
            fontWeight: '600',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>
              {message.type === 'success' ? '✅' : message.type === 'error' ? '❌' : 'ℹ️'} {message.text}
            </span>
            <button
              onClick={() => setMessage(null)}
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: '1.2rem',
                cursor: 'pointer',
                color: 'inherit'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="hr-card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            color: '#ef4444'
          }}>
            <AlertCircle size={20} />
            <span style={{ fontWeight: '500' }}>Error loading users</span>
          </div>
          <p style={{ margin: '0.5rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
            {error}
          </p>
        </div>
      )}

      {/* Enhanced Permission Info Panel */}
      <PermissionInfoPanel 
        currentUser={currentUser}
        userManagementRules={userManagementRules}
      />

      {/* Enhanced User List with all missing features */}
      <div style={{ marginTop: '1.5rem' }}>
        <UserList
          users={users}
          loading={loading}
          onDeactivateUser={handleDeactivateUser}
          onReactivateUser={handleReactivateUser}
          onEditUser={handleEditUser}
          canManageUser={canManageUser}
          getRoleColor={getRoleColor}
          formatLastLogin={formatLastLogin}
        />
      </div>

      {/* Enhanced Create User Modal */}
      {showCreateForm && (
        <CreateUserForm
          onSubmit={handleCreateUser}
          onCancel={() => setShowCreateForm(false)}
          creatableRoles={creatableRoles}
          loading={createLoading}
        />
      )}

      {/* Enhanced Development Info matching your original */}
      <div style={{ 
        marginTop: '1.5rem', 
        padding: '1rem', 
        backgroundColor: '#f0f9ff', 
        borderRadius: '6px',
        fontSize: '0.875rem',
        color: '#0369a1'
      }}>
        <strong>Development Status:</strong> Enhanced User Management v2.0 - 
        Organization: {organization?.name} • 
        Current User: {currentUser.role.name} • 
        Manageable Roles: {userManagementRules.canManage?.join(', ') || 'None'} •
        Users Loaded: {users.length}
      </div>
    </div>
  );
};
