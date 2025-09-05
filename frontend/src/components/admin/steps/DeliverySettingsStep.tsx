// frontend/src/components/admin/steps/DeliverySettingsStep.tsx
import type { WizardFormData } from '../OrganizationWizard';

interface StepProps {
  formData: WizardFormData;
  setFormData: (data: WizardFormData) => void;
}

export const DeliverySettingsStep = ({ formData, setFormData }: StepProps) => {
  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '600',
          marginBottom: '0.5rem'
        }}>
          Delivery Settings
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          Configure how employees can choose to receive their disciplinary communications. 
          This revolutionary feature ensures dignity in workplace communications.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div 
          className="hr-card"
          style={{ 
            padding: '1.25rem',
            border: formData.emailEnabled ? '2px solid #10b981' : '1px solid #e2e8f0',
            backgroundColor: formData.emailEnabled ? '#f0fdf4' : 'white'
          }}
        >
          <label style={{ 
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={formData.emailEnabled}
              onChange={(e) => setFormData({ ...formData, emailEnabled: e.target.checked })}
              style={{
                width: '1.25rem',
                height: '1.25rem',
                marginTop: '0.125rem',
                accentColor: '#10b981'
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.25rem'
              }}>
                <span style={{ fontWeight: '500', color: '#1e293b' }}>
                  Email Delivery
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '0.25rem'
                }}>
                  Recommended
                </span>
              </div>
              <p style={{ 
                fontSize: '0.875rem',
                color: '#64748b',
                margin: 0
              }}>
                Employees can choose to receive warnings via their personal email address
              </p>
            </div>
          </label>
        </div>

        <div 
          className="hr-card"
          style={{ 
            padding: '1.25rem',
            border: formData.whatsappEnabled ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            backgroundColor: formData.whatsappEnabled ? '#eff6ff' : 'white'
          }}
        >
          <label style={{ 
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={formData.whatsappEnabled}
              onChange={(e) => setFormData({ ...formData, whatsappEnabled: e.target.checked })}
              style={{
                width: '1.25rem',
                height: '1.25rem',
                marginTop: '0.125rem',
                accentColor: '#3b82f6'
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.25rem'
              }}>
                <span style={{ fontWeight: '500', color: '#1e293b' }}>
                  WhatsApp Delivery
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '0.25rem'
                }}>
                  Popular Choice
                </span>
              </div>
              <p style={{ 
                fontSize: '0.875rem',
                color: '#64748b',
                margin: 0
              }}>
                Employees can choose to receive warnings via WhatsApp Business API
              </p>
            </div>
          </label>
        </div>

        <div 
          className="hr-card"
          style={{ 
            padding: '1.25rem',
            border: formData.printEnabled ? '2px solid #6b7280' : '1px solid #e2e8f0',
            backgroundColor: formData.printEnabled ? '#f9fafb' : 'white'
          }}
        >
          <label style={{ 
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={formData.printEnabled}
              onChange={(e) => setFormData({ ...formData, printEnabled: e.target.checked })}
              style={{
                width: '1.25rem',
                height: '1.25rem',
                marginTop: '0.125rem',
                accentColor: '#6b7280'
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.25rem'
              }}>
                <span style={{ fontWeight: '500', color: '#1e293b' }}>
                  Print Delivery
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '0.25rem'
                }}>
                  Traditional
                </span>
              </div>
              <p style={{ 
                fontSize: '0.875rem',
                color: '#64748b',
                marginBottom: formData.printEnabled ? '0.75rem' : '0'
              }}>
                Employees can choose to collect printed warnings from designated administrators
              </p>
              
              {formData.printEnabled && (
                <div style={{ marginLeft: '2rem', marginTop: '0.75rem' }}>
                  <label style={{ 
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Print Administrator Email
                  </label>
                  <input
                    type="email"
                    value={formData.printAdminEmail}
                    onChange={(e) => setFormData({ ...formData, printAdminEmail: e.target.value })}
                    placeholder="printadmin@company.com"
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
                    This person will be notified when employees choose print delivery
                  </p>
                </div>
              )}
            </div>
          </label>
        </div>
      </div>

      <div className="hr-card" style={{ 
        marginTop: '2rem',
        backgroundColor: '#f3e8ff',
        border: '1px solid #8b5cf6',
        padding: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <span style={{ color: '#8b5cf6', fontSize: '1.25rem' }}>🏆</span>
          <div>
            <p style={{ 
              fontWeight: '500',
              marginBottom: '0.25rem',
              color: '#6b21a8'
            }}>
              Revolutionary Feature:
            </p>
            <p style={{ 
              fontSize: '0.875rem',
              color: '#6b21a8',
              margin: 0
            }}>
              This is the world's first HR system that allows employees to choose how they receive 
              disciplinary communications, preserving their dignity while ensuring proper documentation.
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <h4 style={{ 
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '0.75rem'
        }}>
          Delivery Statistics Preview
        </h4>
        <div className="hr-card" style={{ 
          backgroundColor: '#f8fafc',
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Active Delivery Methods:
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1e293b' }}>
              {[formData.emailEnabled, formData.whatsappEnabled, formData.printEnabled].filter(Boolean).length} of 3
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <div style={{
                width: '1rem',
                height: '1rem',
                borderRadius: '50%',
                backgroundColor: formData.emailEnabled ? '#10b981' : '#e2e8f0'
              }} />
              <span style={{ color: formData.emailEnabled ? '#374151' : '#9ca3af' }}>
                Email notifications ready
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <div style={{
                width: '1rem',
                height: '1rem',
                borderRadius: '50%',
                backgroundColor: formData.whatsappEnabled ? '#3b82f6' : '#e2e8f0'
              }} />
              <span style={{ color: formData.whatsappEnabled ? '#374151' : '#9ca3af' }}>
                WhatsApp API integration
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <div style={{
                width: '1rem',
                height: '1rem',
                borderRadius: '50%',
                backgroundColor: formData.printEnabled ? '#6b7280' : '#e2e8f0'
              }} />
              <span style={{ color: formData.printEnabled ? '#374151' : '#9ca3af' }}>
                Print administration {formData.printEnabled && formData.printAdminEmail ? '✓' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {(!formData.emailEnabled && !formData.whatsappEnabled && !formData.printEnabled) && (
        <div className="hr-card" style={{ 
          marginTop: '1rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #ef4444',
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <span style={{ color: '#ef4444', fontSize: '1.25rem' }}>⚠️</span>
            <div>
              <p style={{ 
                fontWeight: '500',
                marginBottom: '0.25rem',
                color: '#991b1b'
              }}>
                No Delivery Methods Selected
              </p>
              <p style={{ 
                fontSize: '0.875rem',
                color: '#991b1b',
                margin: 0
              }}>
                Please enable at least one delivery method. Employees need a way to receive their 
                disciplinary communications.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
