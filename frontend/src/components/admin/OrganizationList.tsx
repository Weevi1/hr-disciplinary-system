// frontend/src/components/admin/OrganizationList.tsx
import { useState } from 'react';

interface OrganizationListProps {
  organizations: any[];
  onRefresh: () => void;
}

export const OrganizationList = ({ organizations, onRefresh }: OrganizationListProps) => {
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'inactive': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPlanBadge = (plan: string) => {
    const planConfig = {
      starter: { color: '#6b7280', label: 'Starter' },
      professional: { color: '#3b82f6', label: 'Professional' },
      enterprise: { color: '#8b5cf6', label: 'Enterprise' }
    };
    const config = planConfig[plan as keyof typeof planConfig] || planConfig.starter;
    
    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        color: 'white',
        backgroundColor: config.color,
        display: 'inline-block'
      }}>
        {config.label}
      </span>
    );
  };

  const handleManageOrg = (orgId: string) => {
    setSelectedOrg(orgId);
    // TODO: Navigate to organization management page
    console.log('Managing organization:', orgId);
  };

  return (
    <div className="hr-card">
      <div style={{ 
        padding: '1.5rem',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>🏢</span>
            Deployed Organizations
          </h2>
          <button 
            onClick={onRefresh}
            className="hr-button"
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              border: '1px solid #e2e8f0'
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="hr-table" style={{ width: '100%' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <th style={{ 
                padding: '0.75rem 1rem',
                textAlign: 'left',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Organization
              </th>
              <th style={{ 
                padding: '0.75rem 1rem',
                textAlign: 'left',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Industry
              </th>
              <th style={{ 
                padding: '0.75rem 1rem',
                textAlign: 'left',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Status
              </th>
              <th style={{ 
                padding: '0.75rem 1rem',
                textAlign: 'left',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Employees
              </th>
              <th style={{ 
                padding: '0.75rem 1rem',
                textAlign: 'left',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Warnings
              </th>
              <th style={{ 
                padding: '0.75rem 1rem',
                textAlign: 'left',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Plan
              </th>
              <th style={{ 
                padding: '0.75rem 1rem',
                textAlign: 'left',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((org) => (
              <tr 
                key={org.id}
                style={{ 
                  borderBottom: '1px solid #f1f5f9',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '1rem' }}>
                  <div>
                    <div style={{ 
                      fontWeight: '500',
                      color: '#1e293b',
                      marginBottom: '0.25rem'
                    }}>
                      {org.name}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem',
                      color: '#64748b'
                    }}>
                      {org.subdomain}.hrdignitysystem.com
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem', color: '#475569' }}>
                  {org.industry.charAt(0).toUpperCase() + org.industry.slice(1)}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{
                      width: '0.5rem',
                      height: '0.5rem',
                      borderRadius: '50%',
                      backgroundColor: getStatusColor(org.status)
                    }} />
                    <span style={{ 
                      fontSize: '0.875rem',
                      textTransform: 'capitalize',
                      color: '#475569'
                    }}>
                      {org.status}
                    </span>
                  </span>
                </td>
                <td style={{ padding: '1rem', color: '#475569' }}>
                  {org.employeeCount}
                </td>
                <td style={{ padding: '1rem', color: '#475569' }}>
                  {org.warningCount}
                </td>
                <td style={{ padding: '1rem' }}>
                  {getPlanBadge(org.plan)}
                </td>
                <td style={{ padding: '1rem' }}>
                  <button
                    onClick={() => handleManageOrg(org.id)}
                    className="hr-button"
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.875rem',
                      color: '#8b5cf6',
                      border: '1px solid #8b5cf6',
                      background: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#8b5cf6';
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#8b5cf6';
                    }}
                  >
                    Manage
                    <span>→</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {organizations.length === 0 && (
        <div style={{ 
          padding: '3rem',
          textAlign: 'center',
          color: '#64748b'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <p style={{ margin: 0 }}>No organizations deployed yet.</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
            Click "Deploy New Client" to get started!
          </p>
        </div>
      )}
    </div>
  );
};
