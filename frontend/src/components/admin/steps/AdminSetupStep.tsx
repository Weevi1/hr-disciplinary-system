// frontend/src/components/admin/steps/AdminSetupStep.tsx
// Enhanced version with password fields and demo password option
import { useState } from 'react';
import type { WizardFormData } from '../OrganizationWizard';

interface StepProps {
  formData: WizardFormData;
  setFormData: (data: WizardFormData) => void;
}

export const AdminSetupStep = ({ formData, setFormData }: StepProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [useDemoPassword, setUseDemoPassword] = useState(true);

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, adminPassword: password });
    
    // Calculate password strength
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  };

  const handleDemoPasswordToggle = (checked: boolean) => {
    setUseDemoPassword(checked);
    if (checked) {
      setFormData({ 
        ...formData, 
        adminPassword: 'demo123',
        adminPasswordConfirm: 'demo123',
        requirePasswordChange: true
      });
      setPasswordStrength(50); // Demo password is medium strength
    } else {
      setFormData({ 
        ...formData, 
        adminPassword: '',
        adminPasswordConfirm: '',
        requirePasswordChange: false
      });
      setPasswordStrength(0);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength < 25) return '#ef4444';
    if (passwordStrength < 50) return '#f59e0b';
    if (passwordStrength < 75) return '#3b82f6';
    return '#10b981';
  };

  const getStrengthText = () => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '600',
          marginBottom: '0.5rem'
        }}>
          Administrator Setup
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          Create the primary administrator account for this organization. This user will have full control over the system.
        </p>
      </div>

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: window.innerWidth > 768 ? 'repeat(2, 1fr)' : '1fr',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div>
          <label style={{ 
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            First Name *
          </label>
          <input
            type="text"
            value={formData.adminFirstName}
            onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
            placeholder="John"
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid #e2e8f0',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        <div>
          <label style={{ 
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Last Name *
          </label>
          <input
            type="text"
            value={formData.adminLastName}
            onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
            placeholder="Doe"
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid #e2e8f0',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        <div style={{ gridColumn: window.innerWidth > 768 ? 'span 2' : 'span 1' }}>
          <label style={{ 
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Email Address *
          </label>
          <input
            type="email"
            value={formData.adminEmail}
            onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
            placeholder="admin@company.com"
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid #e2e8f0',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
          <p style={{ 
            fontSize: '0.75rem',
            color: '#64748b',
            marginTop: '0.25rem'
          }}>
            This email will be used for login and system notifications
          </p>
        </div>
      </div>

      {/* Password Setup Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ 
          fontSize: '1rem',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '1rem'
        }}>
          Password Configuration
        </h4>

        {/* Demo Password Toggle */}
        <div className="hr-card" style={{ 
          backgroundColor: '#f0f9ff',
          border: '2px solid #3b82f6',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <label style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={useDemoPassword}
              onChange={(e) => handleDemoPasswordToggle(e.target.checked)}
              style={{
                width: '1.25rem',
                height: '1.25rem',
                accentColor: '#3b82f6'
              }}
            />
            <div>
              <span style={{ 
                fontSize: '0.875rem', 
                fontWeight: '600',
                color: '#1e40af'
              }}>
                Use Demo Password (demo123)
              </span>
              <p style={{ 
                fontSize: '0.75rem',
                color: '#1e40af',
                margin: '0.25rem 0 0 0'
              }}>
                Perfect for testing and demonstrations. Administrator will be required to change password on first login.
              </p>
            </div>
          </label>
        </div>

        {!useDemoPassword && (
          <>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: window.innerWidth > 768 ? 'repeat(2, 1fr)' : '1fr',
              gap: '1.5rem'
            }}>
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.adminPassword || ''}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="Enter secure password"
                    style={{
                      width: '100%',
                      padding: '0.5rem 2.5rem 0.5rem 0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      fontSize: '0.875rem'
                    }}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.adminPassword && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      marginBottom: '0.25rem'
                    }}>
                      <div style={{
                        width: '100%',
                        height: '0.25rem',
                        backgroundColor: '#e2e8f0',
                        borderRadius: '0.125rem',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${passwordStrength}%`,
                          height: '100%',
                          backgroundColor: getStrengthColor(),
                          transition: 'all 0.3s ease'
                        }} />
                      </div>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: getStrengthColor()
                      }}>
                        {getStrengthText()}
                      </span>
                    </div>
                    <p style={{ 
                      fontSize: '0.75rem',
                      color: '#64748b',
                      margin: 0
                    }}>
                      Use 8+ characters with mixed case, numbers, and symbols
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Confirm Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.adminPasswordConfirm || ''}
                  onChange={(e) => setFormData({ ...formData, adminPasswordConfirm: e.target.value })}
                  placeholder="Confirm password"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    border: `1px solid ${
                      formData.adminPasswordConfirm && 
                      formData.adminPassword !== formData.adminPasswordConfirm 
                        ? '#ef4444' : '#e2e8f0'
                    }`,
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => {
                    e.target.style.borderColor = formData.adminPasswordConfirm && 
                      formData.adminPassword !== formData.adminPasswordConfirm 
                        ? '#ef4444' : '#e2e8f0';
                  }}
                />
                {formData.adminPasswordConfirm && 
                 formData.adminPassword !== formData.adminPasswordConfirm && (
                  <p style={{ 
                    fontSize: '0.75rem',
                    color: '#ef4444',
                    marginTop: '0.25rem'
                  }}>
                    Passwords do not match
                  </p>
                )}
              </div>
            </div>

            {/* Password Requirements */}
            <div style={{ marginTop: '1rem' }}>
              <p style={{ 
                fontSize: '0.75rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Password Requirements:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.25rem' }}>
                {[
                  { text: 'At least 8 characters', valid: (formData.adminPassword?.length || 0) >= 8 },
                  { text: 'Contains uppercase letter', valid: /[A-Z]/.test(formData.adminPassword || '') },
                  { text: 'Contains lowercase letter', valid: /[a-z]/.test(formData.adminPassword || '') },
                  { text: 'Contains number', valid: /[0-9]/.test(formData.adminPassword || '') }
                ].map((req, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    fontSize: '0.75rem'
                  }}>
                    <span style={{ 
                      color: req.valid ? '#10b981' : '#64748b'
                    }}>
                      {req.valid ? '✓' : '○'}
                    </span>
                    <span style={{ 
                      color: req.valid ? '#10b981' : '#64748b'
                    }}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Administrator Permissions */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ 
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '0.75rem'
        }}>
          Administrator Permissions
        </h4>
        <div className="hr-card" style={{ 
          backgroundColor: '#f8fafc',
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              'Full access to all organization data',
              'Create and manage HR managers',
              'Configure system settings',
              'Access compliance reports',
              'Export data and analytics'
            ].map((permission) => (
              <div 
                key={permission}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem'
                }}
              >
                <span style={{ color: '#10b981' }}>✓</span>
                <span style={{ color: '#374151' }}>{permission}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Account Options */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ 
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '0.75rem'
        }}>
          Account Options
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={formData.sendWelcomeEmail !== false}
              onChange={(e) => setFormData({ ...formData, sendWelcomeEmail: e.target.checked })}
              style={{
                width: '1rem',
                height: '1rem',
                accentColor: '#8b5cf6'
              }}
            />
            <span style={{ fontSize: '0.875rem', color: '#374151' }}>
              Send welcome email with login instructions to the administrator
            </span>
          </label>

          {(useDemoPassword || passwordStrength < 75) && (
            <label style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={formData.requirePasswordChange !== false}
                onChange={(e) => setFormData({ ...formData, requirePasswordChange: e.target.checked })}
                style={{
                  width: '1rem',
                  height: '1rem',
                  accentColor: '#f59e0b'
                }}
              />
              <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                Require password change on first login
              </span>
            </label>
          )}
        </div>
      </div>

      <div className="hr-card" style={{ 
        backgroundColor: useDemoPassword ? '#dbeafe' : '#f0fdf4',
        border: `1px solid ${useDemoPassword ? '#3b82f6' : '#10b981'}`,
        padding: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <span style={{ 
            color: useDemoPassword ? '#3b82f6' : '#10b981', 
            fontSize: '1.25rem' 
          }}>
            {useDemoPassword ? '🚀' : '🔐'}
          </span>
          <div>
            <p style={{ 
              fontWeight: '500',
              marginBottom: '0.25rem',
              color: useDemoPassword ? '#1e40af' : '#166534'
            }}>
              {useDemoPassword ? 'Demo Mode Active:' : 'Security Note:'}
            </p>
            <p style={{ 
              fontSize: '0.875rem',
              color: useDemoPassword ? '#1e40af' : '#166534',
              margin: 0
            }}>
              {useDemoPassword 
                ? 'The administrator can login immediately with "demo123" and will be prompted to set a secure password on first login.'
                : 'The administrator will receive a secure link to complete their account setup. Two-factor authentication is recommended for all administrator accounts.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
