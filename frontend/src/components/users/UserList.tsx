import Logger from '../../utils/logger';
// frontend/src/components/users/UserList.tsx
// 🎯 Enhanced Display and manage users with professional table layout
import React, { useState } from 'react';
import { User, Shield, Calendar, CheckCircle, XCircle, RotateCcw, Edit3, AlertTriangle } from 'lucide-react';
import type { User as UserType } from '../../types';

const DEPARTMENTS = [
  { id: 'operations', name: 'Operations' },
  { id: 'production', name: 'Production' }, 
  { id: 'quality-control', name: 'Quality Control' },
  { id: 'maintenance', name: 'Maintenance' },
  { id: 'safety', name: 'Safety' },
  { id: 'administration', name: 'Administration' }
];

interface UserListProps {
  users: UserType[];
  loading: boolean;
  onDeactivateUser: (userId: string) => Promise<void>;
  onReactivateUser: (userId: string) => Promise<void>;
  onEditUser: (user: UserType) => void;
  canManageUser: (user: UserType, action: 'update' | 'deactivate') => boolean;
  getRoleColor: (roleId: string) => string;
  formatLastLogin: (lastLogin?: string) => string;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  loading,
  onDeactivateUser,
  onReactivateUser,
  onEditUser,
  canManageUser,
  getRoleColor,
  formatLastLogin
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleDeactivate = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const confirmed = confirm(
      `Are you sure you want to deactivate ${user.firstName} ${user.lastName}?\n\nThey will no longer be able to log in to the system.`
    );
    
    if (!confirmed) return;

    try {
      setActionLoading(userId);
      await onDeactivateUser(userId);
    } catch (error) {
      Logger.error('Error deactivating user:', error)
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const confirmed = confirm(
      `Are you sure you want to reactivate ${user.firstName} ${user.lastName}?\n\nThey will be able to log in again.`
    );
    
    if (!confirmed) return;

    try {
      setActionLoading(userId);
      await onReactivateUser(userId);
    } catch (error) {
      Logger.error('Error reactivating user:', error)
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getRoleBadge = (user: UserType) => (
    <span 
      className="hr-badge"
      style={{ 
        backgroundColor: getRoleColor(user.role.id) + '20',
        color: getRoleColor(user.role.id),
        border: `1px solid ${getRoleColor(user.role.id)}`,
        fontWeight: '600'
      }}
    >
      {user.role.name}
    </span>
  );

  const getDepartmentNames = (departmentIds?: string[]) => {
    if (!departmentIds || departmentIds.length === 0) return '-';
    return departmentIds
      .map(deptId => DEPARTMENTS.find(d => d.id === deptId)?.name || deptId)
      .join(', ');
  };

  if (loading) {
    return (
      <div className="hr-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <h2 style={{ color: '#1e40af' }}>👤 Loading Users...</h2>
        <p style={{ color: '#64748b' }}>Please wait while we load the user data.</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="hr-card">
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
          <User size={48} style={{ color: '#d1d5db', margin: '0 auto 1rem' }} />
          <h3 style={{ color: '#6b7280', marginBottom: '0.5rem' }}>No manageable users found.</h3>
          <p style={{ color: '#9ca3af', margin: 0 }}>
            Create your first HR Manager or Department Head!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="hr-card">
      <h3 style={{ 
        margin: '0 0 1rem', 
        color: '#1e40af', 
        fontSize: '1.125rem', 
        fontWeight: '600'
      }}>
        👥 Organization Users ({users.length})
      </h3>

      {/* Enhanced Table Layout */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ 
                padding: '0.75rem', 
                textAlign: 'left', 
                fontWeight: '600',
                color: '#374151'
              }}>
                User
              </th>
              <th style={{ 
                padding: '0.75rem', 
                textAlign: 'left', 
                fontWeight: '600',
                color: '#374151'
              }}>
                Role
              </th>
              <th style={{ 
                padding: '0.75rem', 
                textAlign: 'left', 
                fontWeight: '600',
                color: '#374151'
              }}>
                Departments
              </th>
              <th style={{ 
                padding: '0.75rem', 
                textAlign: 'left', 
                fontWeight: '600',
                color: '#374151'
              }}>
                Status
              </th>
              <th style={{ 
                padding: '0.75rem', 
                textAlign: 'left', 
                fontWeight: '600',
                color: '#374151'
              }}>
                Created
              </th>
              <th style={{ 
                padding: '0.75rem', 
                textAlign: 'left', 
                fontWeight: '600',
                color: '#374151'
              }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr 
                key={user.id} 
                style={{ 
                  borderBottom: '1px solid #e5e7eb',
                  opacity: user.isActive ? 1 : 0.7,
                  backgroundColor: user.isActive ? 'transparent' : '#f9fafb'
                }}
              >
                {/* User Column */}
                <td style={{ padding: '0.75rem' }}>
                  <div>
                    <div style={{ 
                      fontWeight: '600',
                      color: user.isActive ? '#1f2937' : '#6b7280',
                      marginBottom: '0.25rem'
                    }}>
                      {user.firstName} {user.lastName}
                    </div>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      color: user.isActive ? '#64748b' : '#9ca3af'
                    }}>
                      {user.email}
                    </div>
                  </div>
                </td>

                {/* Role Column */}
                <td style={{ padding: '0.75rem' }}>
                  {getRoleBadge(user)}
                </td>

                {/* Departments Column */}
                <td style={{ padding: '0.75rem' }}>
                  <span style={{ 
                    fontSize: '0.875rem',
                    color: user.isActive ? '#374151' : '#6b7280'
                  }}>
                    {getDepartmentNames(user.departmentIds)}
                  </span>
                </td>

                {/* Status Column */}
                <td style={{ padding: '0.75rem' }}>
                  <span 
                    className={`hr-badge ${user.isActive ? 'hr-badge-success' : 'hr-badge-danger'}`}
                  >
                    {user.isActive ? '✅ Active' : '❌ Inactive'}
                  </span>
                </td>

                {/* Created Column */}
                <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  {formatDate(user.createdAt)}
                </td>

                {/* Actions Column */}
                <td style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {/* Edit Button */}
                    {canManageUser(user, 'update') && (
                      <button
                        onClick={() => onEditUser(user)}
                        style={{
                          fontSize: '0.75rem', 
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#dbeafe',
                          color: '#1e40af',
                          border: '1px solid #bfdbfe',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                        title="Edit user details"
                      >
                        <Edit3 size={12} />
                        Edit
                      </button>
                    )}

                    {/* Deactivate/Reactivate Button */}
                    {canManageUser(user, 'deactivate') && (
                      <>
                        {user.isActive ? (
                          <button
                            onClick={() => handleDeactivate(user.id)}
                            disabled={actionLoading === user.id}
                            className="hr-button-danger"
                            style={{ 
                              fontSize: '0.75rem', 
                              padding: '0.25rem 0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              opacity: actionLoading === user.id ? 0.6 : 1,
                              cursor: actionLoading === user.id ? 'not-allowed' : 'pointer'
                            }}
                            title="Deactivate user account"
                          >
                            {actionLoading === user.id ? (
                              <div style={{
                                width: '12px',
                                height: '12px',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTop: '2px solid white',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                              }} />
                            ) : (
                              <XCircle size={12} />
                            )}
                            🚫 Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(user.id)}
                            disabled={actionLoading === user.id}
                            className="hr-button-success"
                            style={{ 
                              fontSize: '0.75rem', 
                              padding: '0.25rem 0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              opacity: actionLoading === user.id ? 0.6 : 1,
                              cursor: actionLoading === user.id ? 'not-allowed' : 'pointer'
                            }}
                            title="Reactivate user account"
                          >
                            {actionLoading === user.id ? (
                              <div style={{
                                width: '12px',
                                height: '12px',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTop: '2px solid #059669',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                              }} />
                            ) : (
                              <RotateCcw size={12} />
                            )}
                            ✅ Reactivate
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
