// frontend/src/components/users/PermissionInfoPanel.tsx
// 🎯 Display user permissions and restrictions panel
import React from 'react';
import { Shield, CheckCircle, XCircle } from 'lucide-react';
import { USER_MANAGEMENT_FEATURES } from '../../permissions/roleDefinitions';
import type { User } from '../../types';

interface PermissionInfoPanelProps {
  currentUser: User;
  userManagementRules: any;
}

export const PermissionInfoPanel: React.FC<PermissionInfoPanelProps> = ({
  currentUser,
  userManagementRules
}) => {
  // Get features for current user role
  const features = USER_MANAGEMENT_FEATURES[currentUser.role.id as keyof typeof USER_MANAGEMENT_FEATURES];

  if (!features) return null;

  return (
    <div className="hr-card">
      <h4 style={{ 
        margin: '0 0 1rem', 
        color: '#7c3aed', 
        fontSize: '1rem',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        🛡️ Your User Management Permissions ({currentUser.role.name})
      </h4>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {/* Capabilities */}
        <div>
          <h5 style={{ 
            margin: '0 0 0.75rem', 
            color: '#059669', 
            fontSize: '0.875rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle size={16} />
            ✅ You Can:
          </h5>
          <ul style={{ 
            margin: 0, 
            paddingLeft: '1rem', 
            fontSize: '0.875rem', 
            lineHeight: '1.6'
          }}>
            {features.capabilities
              .filter(cap => cap.startsWith('✅'))
              .map((capability, index) => (
                <li key={index} style={{ 
                  color: '#166534',
                  marginBottom: '0.25rem'
                }}>
                  {capability.replace('✅ ', '')}
                </li>
              ))}
          </ul>
        </div>

        {/* Restrictions */}
        <div>
          <h5 style={{ 
            margin: '0 0 0.75rem', 
            color: '#dc2626', 
            fontSize: '0.875rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <XCircle size={16} />
            ❌ You Cannot:
          </h5>
          <ul style={{ 
            margin: 0, 
            paddingLeft: '1rem', 
            fontSize: '0.875rem', 
            lineHeight: '1.6'
          }}>
            {features.capabilities
              .filter(cap => cap.startsWith('❌'))
              .map((capability, index) => (
                <li key={index} style={{ 
                  color: '#991b1b',
                  marginBottom: '0.25rem'
                }}>
                  {capability.replace('❌ ', '')}
                </li>
              ))}
          </ul>

          {/* Additional restrictions from role definitions */}
          {userManagementRules.restrictions && (
            <>
              <h6 style={{ 
                margin: '1rem 0 0.5rem', 
                color: '#6b7280', 
                fontSize: '0.75rem',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>
                System Restrictions:
              </h6>
              <ul style={{ 
                margin: 0, 
                paddingLeft: '1rem', 
                fontSize: '0.875rem',
                lineHeight: '1.6'
              }}>
                {userManagementRules.restrictions.map((restriction: string, index: number) => (
                  <li key={index} style={{ 
                    color: '#6b7280',
                    marginBottom: '0.25rem'
                  }}>
                    {restriction}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Role-specific info */}
      <div style={{ 
        marginTop: '1rem',
        padding: '0.75rem',
        backgroundColor: '#f0f9ff',
        borderRadius: '6px',
        border: '1px solid #bfdbfe'
      }}>
        <p style={{ 
          margin: 0,
          fontSize: '0.875rem',
          color: '#1e40af'
        }}>
          <strong>Scope:</strong> {userManagementRules.scope === 'organization' ? 'Organization-wide' : 'Global'} • 
          <strong> Manageable Roles:</strong> {userManagementRules.canManage?.join(', ') || 'None'}
        </p>
      </div>
    </div>
  );
};
