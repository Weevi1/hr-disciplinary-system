// frontend/src/components/users/CreateUserForm.tsx
// 🎯 Form component for creating new HR/Manager accounts
import React, { useState } from 'react';
import { X, User, Mail, Lock, Shield, Users } from 'lucide-react';
import { USER_ROLES } from '../../permissions/roleDefinitions';

interface CreateUserFormProps {
  onSubmit: (userData: CreateUserData) => Promise<void>;
  onCancel: () => void;
  creatableRoles: typeof USER_ROLES[keyof typeof USER_ROLES][];
  loading: boolean;
}

interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  departmentIds: string[];
  password: string;
  confirmPassword: string;
}

const DEPARTMENTS = [
  { id: 'operations', name: 'Operations' },
  { id: 'production', name: 'Production' }, 
  { id: 'quality-control', name: 'Quality Control' },
  { id: 'maintenance', name: 'Maintenance' },
  { id: 'safety', name: 'Safety' },
  { id: 'administration', name: 'Administration' }
];

export const CreateUserForm: React.FC<CreateUserFormProps> = ({
  onSubmit,
  onCancel,
  creatableRoles,
  loading
}) => {
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    firstName: '',
    lastName: '',
    roleId: '',
    departmentIds: [],
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.roleId) newErrors.roleId = 'Role is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm password';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Password confirmation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Department validation for HOD managers
    if (formData.roleId === 'hod-manager' && formData.departmentIds.length === 0) {
      newErrors.departmentIds = 'Please select at least one department for managers';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
      // Form will be reset by parent component
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const handleDepartmentToggle = (departmentId: string) => {
    setFormData(prev => ({
      ...prev,
      departmentIds: prev.departmentIds.includes(departmentId)
        ? prev.departmentIds.filter(d => d !== departmentId)
        : [...prev.departmentIds, departmentId]
    }));
  };

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
      <div className="hr-card" style={{ 
        width: '100%', 
        maxWidth: '500px', 
        maxHeight: '90vh', 
        overflow: 'auto',
        margin: '1rem'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{ 
            margin: 0, 
            color: '#1f2937', 
            fontSize: '1.25rem', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <User size={20} />
            Create New User Account
          </h2>
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ 
              margin: '0 0 1rem', 
              color: '#374151', 
              fontSize: '1rem', 
              fontWeight: '500' 
            }}>
              Personal Information
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151' 
                }}>
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: errors.firstName ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = errors.firstName ? '#ef4444' : '#d1d5db'}
                />
                {errors.firstName && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151' 
                }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: errors.lastName ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = errors.lastName ? '#ef4444' : '#d1d5db'}
                />
                {errors.lastName && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151'
              }}>
                <Mail size={16} />
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: errors.email ? '1px solid #ef4444' : '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = errors.email ? '#ef4444' : '#d1d5db'}
              />
              {errors.email && (
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ 
              margin: '0 0 1rem', 
              color: '#374151', 
              fontSize: '1rem', 
              fontWeight: '500' 
            }}>
              Role & Permissions
            </h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151'
              }}>
                <Shield size={16} />
                User Role *
              </label>
              <select
                value={formData.roleId}
                onChange={(e) => setFormData(prev => ({ ...prev, roleId: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: errors.roleId ? '1px solid #ef4444' : '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  backgroundColor: 'white'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = errors.roleId ? '#ef4444' : '#d1d5db'}
              >
                <option value="">Select Role</option>
                {creatableRoles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name} - {role.description}
                  </option>
                ))}
              </select>
              {errors.roleId && (
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                  {errors.roleId}
                </p>
              )}
            </div>

            {/* Department Selection for HOD Managers */}
            {formData.roleId === 'hod-manager' && (
              <div>
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151'
                }}>
                  <Users size={16} />
                  Departments (for HOD/Manager role) *
                </label>
                <div style={{ 
                  border: errors.departmentIds ? '1px solid #ef4444' : '1px solid #d1d5db',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  backgroundColor: '#f9fafb',
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '0.5rem'
                }}>
                  {DEPARTMENTS.map(department => (
                    <label key={department.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.departmentIds.includes(department.id)}
                        onChange={() => handleDepartmentToggle(department.id)}
                        style={{ margin: 0 }}
                      />
                      {department.name}
                    </label>
                  ))}
                </div>
                {errors.departmentIds && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                    {errors.departmentIds}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Password Setup */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ 
              margin: '0 0 1rem', 
              color: '#374151', 
              fontSize: '1rem', 
              fontWeight: '500' 
            }}>
              Account Security
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151'
                }}>
                  <Lock size={16} />
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: errors.password ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = errors.password ? '#ef4444' : '#d1d5db'}
                  minLength={6}
                />
                {errors.password && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151'
                }}>
                  <Lock size={16} />
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: errors.confirmPassword ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = errors.confirmPassword ? '#ef4444' : '#d1d5db'}
                  minLength={6}
                />
                {errors.confirmPassword && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'flex-end',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              type="button"
              onClick={onCancel}
              className="hr-button-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="hr-button-primary"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Creating...
                </>
              ) : (
                <>
                  ✅ Create User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
