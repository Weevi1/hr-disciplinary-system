// frontend/src/components/admin/steps/ReviewDeployStep.tsx
import type { WizardFormData } from '../OrganizationWizard';

interface StepProps {
  formData: WizardFormData;
}

export const ReviewDeployStep = ({ formData }: StepProps) => {
  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '600',
          marginBottom: '0.5rem'
        }}>
          Review & Deploy
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          Review the configuration below. Once deployed, the organization will be live and ready for use.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ 
          padding: '1.25rem',
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem'
        }}>
          <h4 style={{ 
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: '#1e293b'
          }}>
            Organization Details
          </h4>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: window.innerWidth > 768 ? 'repeat(2, 1fr)' : '1fr',
            gap: '1rem'
          }}>
            <div>
              <dt style={{ 
                fontSize: '0.75rem',
                color: '#64748b',
                marginBottom: '0.25rem'
              }}>
                Company Name
              </dt>
              <dd style={{ 
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#1e293b',
                margin: 0
              }}>
                {formData.companyName}
              </dd>
            </div>
            <div>
              <dt style={{ 
                fontSize: '0.75rem',
                color: '#64748b',
                marginBottom: '0.25rem'
              }}>
                Organization ID
              </dt>
              <dd style={{ 
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#1e293b',
                margin: 0
              }}>
                {formData.subdomain}
              </dd>
            </div>
            <div>
              <dt style={{ 
                fontSize: '0.75rem',
                color: '#64748b',
                marginBottom: '0.25rem'
              }}>
                Company Size
              </dt>
              <dd style={{ 
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#1e293b',
                margin: 0
              }}>
                {formData.companySize} employees
              </dd>
            </div>
            <div>
              <dt style={{ 
                fontSize: '0.75rem',
                color: '#64748b',
                marginBottom: '0.25rem'
              }}>
                Country
              </dt>
              <dd style={{ 
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#1e293b',
                margin: 0
              }}>
                {formData.country}
              </dd>
            </div>
            <div style={{ gridColumn: window.innerWidth > 768 ? 'span 2' : 'span 1' }}>
              <dt style={{ 
                fontSize: '0.75rem',
                color: '#64748b',
                marginBottom: '0.25rem'
              }}>
                Access Method
              </dt>
              <dd style={{ 
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#1e293b',
                margin: 0
              }}>
                Single shared portal - all organizations
              </dd>
            </div>
          </div>
        </div>

        <div style={{ 
          padding: '1.25rem',
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem'
        }}>
          <h4 style={{ 
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: '#1e293b'
          }}>
            Administrator
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>
              <dt style={{ 
                fontSize: '0.75rem',
                color: '#64748b',
                marginBottom: '0.25rem'
              }}>
                Name
              </dt>
              <dd style={{ 
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#1e293b',
                margin: 0
              }}>
                {formData.adminFirstName} {formData.adminLastName}
              </dd>
            </div>
            <div>
              <dt style={{ 
                fontSize: '0.75rem',
                color: '#64748b',
                marginBottom: '0.25rem'
              }}>
                Email
              </dt>
              <dd style={{ 
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#1e293b',
                margin: 0
              }}>
                {formData.adminEmail}
              </dd>
            </div>
          </div>
        </div>

        <div style={{ 
          padding: '1.25rem',
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem'
        }}>
          <h4 style={{ 
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: '#1e293b'
          }}>
            Configuration Summary
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <dt style={{ 
                fontSize: '0.75rem',
                color: '#64748b',
                marginBottom: '0.25rem'
              }}>
                Warning Categories
              </dt>
              <dd style={{ 
                fontSize: '0.875rem',
                color: '#1e293b',
                margin: 0
              }}>
                {formData.warningCategories.length} categories configured
              </dd>
            </div>
            <div>
              <dt style={{ 
                fontSize: '0.75rem',
                color: '#64748b',
                marginBottom: '0.25rem'
              }}>
                Escalation Rules
              </dt>
              <dd style={{ 
                fontSize: '0.875rem',
                color: '#1e293b',
                margin: 0,
                textTransform: 'capitalize'
              }}>
                {formData.escalationRules} discipline process
              </dd>
            </div>
          </div>
        </div>

        <div style={{ 
          padding: '1.25rem',
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem'
        }}>
          <h4 style={{ 
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '1rem',
            color: '#1e293b'
          }}>
            Delivery Methods
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {formData.emailEnabled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#10b981' }}>✓</span>
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                  Email delivery enabled
                </span>
              </div>
            )}
            {formData.whatsappEnabled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#10b981' }}>✓</span>
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                  WhatsApp delivery enabled
                </span>
              </div>
            )}
            {formData.printEnabled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#10b981' }}>✓</span>
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                  Print delivery enabled (Admin: {formData.printAdminEmail})
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ 
        marginTop: '2rem',
        backgroundColor: '#f0fdf4',
        border: '1px solid #10b981',
        borderRadius: '0.5rem',
        padding: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <span style={{ color: '#10b981', fontSize: '1.25rem' }}>🚀</span>
          <div>
            <p style={{ 
              fontWeight: '500',
              marginBottom: '0.25rem',
              color: '#166534'
            }}>
              Ready to Deploy!
            </p>
            <p style={{ 
              fontSize: '0.875rem',
              color: '#166534',
              margin: 0
            }}>
              The system will be live immediately after deployment. The administrator will receive login instructions via email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};