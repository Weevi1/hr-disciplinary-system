// frontend/src/components/organization/OrganizationManagement.tsx
// 🏢 ORGANIZATION MANAGEMENT SECTION
// ✅ Add HR Managers, HOD Managers, Department Management

import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Settings, Building2, Shield, 
  Plus, Eye, Edit, Trash2, AlertCircle, CheckCircle
} from 'lucide-react';

import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useMultiRolePermissions } from '../../hooks/useMultiRolePermissions';
import { DataService } from '../../services/DataService';

// Types
interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  departmentIds?: string[];
  isActive: boolean;
  createdAt: string;
}

interface Department {
  id: string;
  name: string;
  managerId?: string;
  managerName?: string;
  employeeCount: number;
  description?: string;
}

// Add Manager Modal Component
interface AddManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  managerType: 'hr-manager' | 'hod-manager';
}

const AddManagerModal: React.FC<AddManagerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  managerType
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    password: 'temp123' // Default password
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
    console.log('🔧 Step 1: Starting Firebase import...');
    
    // Use Firebase functions
    console.log('✅ Step 2: httpsCallable available');
    
    console.log('✅ Step 3: functions imported from config:', functions);
    
    const createOrganizationAdmin = httpsCallable(functions, 'createOrganizationAdmin');
    console.log('✅ Step 4: Cloud function reference created');
    
    const userData = {
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: managerType,
      organizationId: organization.id,
      departmentIds: managerType === 'hod-manager' ? [formData.department] : [],
      sendWelcomeEmail: true,
      requirePasswordChange: true
    };

    console.log('🚀 Step 5: Calling Firebase Cloud Function with:', userData);
    
    // Call the actual Cloud Function
    const result = await createOrganizationAdmin(userData);
    
    console.log('✅ Step 6: Cloud Function success:', result.data);
    
    // Success handling
    setLoading(false);
    onSuccess();
    onClose();
    setFormData({ firstName: '', lastName: '', email: '', department: '', password: 'temp123' });
    
    alert(`✅ ${managerType === 'hr-manager' ? 'HR Manager' : 'Department Manager'} created successfully!\n\nEmail: ${formData.email}\nPassword: ${formData.password}\n\nThey can now login!`);

  } catch (err: any) {
    console.error('❌ Error occurred:', err);
    console.error('❌ Error code:', err.code);
    console.error('❌ Error message:', err.message);
    console.error('❌ Full error object:', err);
    
    let errorMessage = 'Failed to create manager';
    
    if (err.code === 'functions/not-found') {
      errorMessage = 'Cloud function "createOrganizationAdmin" not found. Is it deployed?';
    } else if (err.code === 'functions/unauthenticated') {
      errorMessage = 'Not authenticated to call cloud function';
    } else if (err.code === 'functions/permission-denied') {
      errorMessage = 'Permission denied to call cloud function';
    } else if (err.code === 'functions/already-exists') {
      errorMessage = 'A user with this email already exists';
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    setError(errorMessage);
    setLoading(false);
  }
};

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ margin: '0 0 0.5rem', color: '#1f2937', fontSize: '1.25rem', fontWeight: '600' }}>
            Add {managerType === 'hr-manager' ? 'HR Manager' : 'Department Manager'}
          </h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
            Create a new {managerType === 'hr-manager' ? 'HR manager' : 'department manager'} account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
                required
              />
            </div>

            {managerType === 'hod-manager' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                  required
                >
                  <option value="">Select Department</option>
                  <option value="operations">Operations</option>
                  <option value="production">Production</option>
                  <option value="quality">Quality Assurance</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="logistics">Logistics</option>
                </select>
              </div>
            )}
          </div>

          {error && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle style={{ width: '1rem', height: '1rem', color: '#ef4444' }} />
                <span style={{ fontSize: '0.875rem', color: '#dc2626' }}>{error}</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: 'white',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1rem',
                border: 'none',
                borderRadius: '6px',
                background: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: '1rem', height: '1rem', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus style={{ width: '1rem', height: '1rem' }} />
                  Create {managerType === 'hr-manager' ? 'HR Manager' : 'Manager'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Organization Management Component
export const OrganizationManagement: React.FC = () => {
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
  const [managers, setManagers] = useState<Manager[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddManagerModal, setShowAddManagerModal] = useState(false);
  const [selectedManagerType, setSelectedManagerType] = useState<'hr-manager' | 'hod-manager'>('hr-manager');

  // Load data
  useEffect(() => {
    loadOrganizationData();
  }, [organization]);

  const loadOrganizationData = async () => {
    if (!organization) return;

    try {
      setLoading(true);
      
      // Load managers and departments
      // This would use your existing DataService methods
      const mockManagers: Manager[] = [
        {
          id: 'hr1',
          firstName: 'Sarah',  
          lastName: 'Johnson',
          email: 'sarah.johnson@company.com',
          role: 'hr-manager',
          isActive: true,
          createdAt: '2024-01-15'
        },
        {
          id: 'hod1',
          firstName: 'Mike',
          lastName: 'Wilson', 
          email: 'mike.wilson@company.com',
          role: 'hod-manager',
          departmentIds: ['operations'],
          isActive: true,
          createdAt: '2024-01-20'
        }
      ];

      const mockDepartments: Department[] = [
        {
          id: 'operations',
          name: 'Operations',
          managerId: 'hod1',
          managerName: 'Mike Wilson',
          employeeCount: 15
        },
        {
          id: 'production',
          name: 'Production',
          employeeCount: 22
        },
        {
          id: 'quality',
          name: 'Quality Assurance',
          employeeCount: 8
        }
      ];

      setManagers(mockManagers);
      setDepartments(mockDepartments);
      
    } catch (error) {
      console.error('Failed to load organization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddManager = (type: 'hr-manager' | 'hod-manager') => {
    setSelectedManagerType(type);
    setShowAddManagerModal(true);
  };

  const handleManagerCreated = () => {
    // Refresh data after manager creation
    loadOrganizationData();
  };

  if (loading) {
    return (
      <div className="hr-card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ display: 'inline-block', width: '2rem', height: '2rem', border: '3px solid #f3f4f6', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading organization data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="hr-card">
        <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Building2 style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} />
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
              Organization Management
            </h2>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
            Manage HR staff, department managers, and organizational structure
          </p>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          
          {canCreateHRManagers() && (
            <button
              onClick={() => handleAddManager('hr-manager')}
              style={{
                padding: '1rem',
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                background: 'white',
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.backgroundColor = '#f0f9ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <UserPlus style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Add HR Manager</span>
            </button>
          )}

          {canCreateHODManagers() && (
            <button
              onClick={() => handleAddManager('hod-manager')}
              style={{
                padding: '1rem',
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                background: 'white',
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#059669';
                e.currentTarget.style.backgroundColor = '#f0fdf4';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <Users style={{ width: '1.5rem', height: '1.5rem', color: '#059669' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Add Department Manager</span>
            </button>
          )}

          {canManageUsers() && (
            <button
              onClick={() => navigate('/users')}
              style={{
                padding: '1rem',
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                background: 'white',
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#f59e0b';
                e.currentTarget.style.backgroundColor = '#fffbeb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <Settings style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
              <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Manage All Users</span>
            </button>
          )}
        </div>

        {/* Current Managers */}
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          
          {/* HR Managers */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield style={{ width: '1rem', height: '1rem', color: '#3b82f6' }} />
              HR Managers ({managers.filter(m => m.role === 'hr-manager').length})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {managers.filter(m => m.role === 'hr-manager').map(manager => (
                <div key={manager.id} style={{
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  background: '#f9fafb'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1f2937' }}>
                        {manager.firstName} {manager.lastName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {manager.email}
                      </div>
                    </div>
                    <div style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.625rem',
                      fontWeight: '500',
                      background: manager.isActive ? '#dcfce7' : '#fee2e2',
                      color: manager.isActive ? '#166534' : '#dc2626'
                    }}>
                      {manager.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              ))}
              
              {managers.filter(m => m.role === 'hod-manager').length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                  <Users style={{ width: '2rem', height: '2rem', margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>No department managers</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Departments Overview */}
        {canManageDepartments() && (
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 style={{ width: '1rem', height: '1rem', color: '#f59e0b' }} />
              Departments ({departments.length})
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {departments.map(dept => (
                <div key={dept.id} style={{
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', margin: '0 0 0.25rem' }}>
                        {dept.name}
                      </h4>
                      {dept.managerName ? (
                        <p style={{ fontSize: '0.75rem', color: '#059669', margin: 0 }}>
                          Manager: {dept.managerName}
                        </p>
                      ) : (
                        <p style={{ fontSize: '0.75rem', color: '#f59e0b', margin: 0 }}>
                          No manager assigned
                        </p>
                      )}
                    </div>
                    <button
                      style={{
                        padding: '0.25rem',
                        border: 'none',
                        background: 'transparent',
                        color: '#6b7280',
                        cursor: 'pointer',
                        borderRadius: '4px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Edit style={{ width: '1rem', height: '1rem' }} />
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users style={{ width: '0.875rem', height: '0.875rem', color: '#6b7280' }} />
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {dept.employeeCount} employees
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Manager Modal */}
      <AddManagerModal
        isOpen={showAddManagerModal}
        onClose={() => setShowAddManagerModal(false)}
        onSuccess={handleManagerCreated}
        managerType={selectedManagerType}
      />
    </>
  );
};
