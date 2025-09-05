// frontend/src/components/admin/OrganizationSwitcher.tsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { DataService } from '../../services/DataService';
import { LoadingSpinner } from '../common/LoadingComponents';
import type { Organization } from '../../types';

export const OrganizationSwitcher = () => {
  const { user, organization, switchOrganization } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Only show for super users
  if (user?.role.id !== 'super-user') {
    return null;
  }

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const orgs = await DataService.loadOrganizations();
      setOrganizations(orgs);
    } catch (error) {
      console.error('Failed to load organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = async (org: Organization) => {
    if (org.id === organization?.id) {
      setIsOpen(false);
      return;
    }

    try {
      await switchOrganization(org.id);
      setIsOpen(false);
      
      // Log the switch
      await DataService.logAuditEvent('ORGANIZATION_SWITCHED', {
        fromOrgId: organization?.id,
        toOrgId: org.id,
        toOrgName: org.name
      });
    } catch (error) {
      console.error('Failed to switch organization:', error);
    }
  };

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hr-button"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          minWidth: '200px',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🏢</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1e293b' }}>
              {organization?.name || 'No Organization'}
            </div>
            {organization && (
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {organization.id}
              </div>
            )}
          </div>
        </div>
        <span style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.2s'
        }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '0.5rem',
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            maxHeight: '400px',
            overflow: 'hidden',
            zIndex: 50
          }}
        >
          {/* Search Input */}
          <div style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Organization List */}
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <LoadingSpinner size="small" />
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                  Loading organizations...
                </p>
              </div>
            ) : filteredOrgs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                No organizations found
              </div>
            ) : (
              <>
                {/* Current Organization */}
                {organization && (
                  <div style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <div
                      style={{
                        padding: '0.75rem',
                        backgroundColor: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Currently viewing:
                      </span>
                      <span style={{ fontWeight: '500', color: '#1e293b' }}>
                        {organization.name}
                      </span>
                    </div>
                  </div>
                )}

                {/* Organization Options */}
                {filteredOrgs.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleSwitch(org)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      textAlign: 'left',
                      backgroundColor: org.id === organization?.id ? '#f3e8ff' : 'white',
                      border: 'none',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (org.id !== organization?.id) {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (org.id !== organization?.id) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: '500', color: '#1e293b', marginBottom: '0.25rem' }}>
                          {org.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {org.id} • {org.industry}
                        </div>
                      </div>
                      {org.id === organization?.id && (
                        <span style={{ color: '#8b5cf6' }}>✓</span>
                      )}
                    </div>
                  </button>
                ))}

                {/* Add New Organization */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to deployment wizard
                    window.location.href = '/super/organizations/deploy';
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    textAlign: 'left',
                    backgroundColor: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#8b5cf6',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <span>➕</span>
                  Deploy New Organization
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
