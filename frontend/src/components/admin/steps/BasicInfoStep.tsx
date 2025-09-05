// frontend/src/components/admin/steps/BasicInfoStep.tsx
import type { WizardFormData } from '../OrganizationWizard';

interface StepProps {
  formData: WizardFormData;
  setFormData: (data: WizardFormData) => void;
}

export const BasicInfoStep = ({ formData, setFormData }: StepProps) => {

  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '600',
          marginBottom: '0.5rem'
        }}>
          Basic Information
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          Let's start with the basic details about the organization you're deploying.
        </p>
      </div>

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
            Company Name *
          </label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            placeholder="ACME Corporation"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '2px solid #e2e8f0',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              outline: 'none',
              backgroundColor: '#ffffff',
              color: '#1f2937'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#8b5cf6';
              e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.boxShadow = 'none';
            }}
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
            Company Size *
          </label>
          <select
            value={formData.companySize}
            onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '2px solid #e2e8f0',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              outline: 'none',
              backgroundColor: '#ffffff',
              color: '#1f2937',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e")',
              backgroundPosition: 'right 0.75rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1rem',
              cursor: 'pointer'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#8b5cf6';
              e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.boxShadow = 'none';
            }}
          >
            <option value="" style={{ color: '#9ca3af' }}>Select company size</option>
            <option value="1-50" style={{ color: '#1f2937' }}>1-50 employees</option>
            <option value="51-200" style={{ color: '#1f2937' }}>51-200 employees</option>
            <option value="201-500" style={{ color: '#1f2937' }}>201-500 employees</option>
            <option value="501-1000" style={{ color: '#1f2937' }}>501-1000 employees</option>
            <option value="1000+" style={{ color: '#1f2937' }}>1000+ employees</option>
          </select>
        </div>

        <div>
          <label style={{ 
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Country *
          </label>
          <select
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '2px solid #e2e8f0',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              outline: 'none',
              backgroundColor: '#ffffff',
              color: '#1f2937',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e")',
              backgroundPosition: 'right 0.75rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1rem',
              cursor: 'pointer'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#8b5cf6';
              e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.boxShadow = 'none';
            }}
          >
            <option value="SA" style={{ color: '#1f2937' }}>South Africa</option>
            <option value="ZW" style={{ color: '#1f2937' }}>Zimbabwe</option>
            <option value="BW" style={{ color: '#1f2937' }}>Botswana</option>
            <option value="NA" style={{ color: '#1f2937' }}>Namibia</option>
            <option value="KE" style={{ color: '#1f2937' }}>Kenya</option>
            <option value="NG" style={{ color: '#1f2937' }}>Nigeria</option>
          </select>
        </div>

        <div>
          <label style={{ 
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Organization ID *
          </label>
          <input
            type="text"
            value={formData.subdomain}
            onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
            placeholder="acme-corp"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '2px solid #e2e8f0',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              outline: 'none',
              backgroundColor: '#ffffff',
              color: '#1f2937'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#8b5cf6';
              e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.boxShadow = 'none';
            }}
          />
          <p style={{ 
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: '#64748b'
          }}>
            Used internally to identify the organization. Lowercase letters, numbers, and hyphens only.
          </p>
        </div>
      </div>

      <div style={{ 
        marginTop: '2rem',
        backgroundColor: '#eff6ff',
        border: '1px solid #3b82f6',
        borderRadius: '0.5rem',
        padding: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <span style={{ color: '#3b82f6', fontSize: '1.25rem' }}>ℹ️</span>
          <div>
            <p style={{ 
              fontWeight: '500',
              marginBottom: '0.5rem',
              color: '#1e40af'
            }}>
              Why we need this information:
            </p>
            <ul style={{ 
              margin: 0,
              paddingLeft: '1.25rem',
              fontSize: '0.875rem',
              color: '#1e40af'
            }}>
              <li>Company size determines the recommended plan and features</li>
              <li>Country selection loads the appropriate legal framework</li>
              <li>Organization ID creates a unique identifier for internal use</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
