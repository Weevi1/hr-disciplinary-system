// frontend/src/components/admin/SuperAdminDashboard.tsx
// Updated to include Sector Assignment functionality

import { useState, useEffect } from 'react';
import { OrganizationWizard } from './OrganizationWizard';
import { SectorAssignment } from './SectorAssignment';
import { CreateUsersButton } from './CreateUsersButton';
import { AudioCleanupDashboard } from './AudioCleanupDashboard'; // 🎯 NEW
import { DataService } from '../../services/DataService';
import { AudioCleanupService } from '../../services/AudioCleanupService'; // 🎯 NEW
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  Building2,
  Users,
  AlertTriangle,
  Plus,
  Trash2 // 🎯 NEW
} from 'lucide-react';


interface Organization {
  id: string;
  name: string;
  industry: string;
  employeeCount: number;
  warningCount: number;
  lastActivity: string;
  createdAt?: string;
  sectorId?: string;
  sectorName?: string;
}

interface SectorAssignmentState {
  isOpen: boolean;
  organizationId: string;
  organizationName: string;
  currentSectorId?: string;
}

interface SuperAdminStats {
  totalOrganizations: number;
  totalEmployees: number;
  totalWarnings: number;
  systemUptime: string;
  // New audio cleanup stats
  totalAudioFiles: number;
  audioStorageUsed: string;
  lastCleanupRun: string | null;
  cleanupHealth: 'healthy' | 'warning' | 'error';
}

export const SuperAdminDashboard = () => {
// NEW UPDATED STATE
const [showWizard, setShowWizard] = useState(false);
const [organizations, setOrganizations] = useState<Organization[]>([]);
const [loading, setLoading] = useState(true);
const [sectorAssignment, setSectorAssignment] = useState<SectorAssignmentState>({
  isOpen: false,
  organizationId: '',
  organizationName: ''
});
const [activeTab, setActiveTab] = useState<'organizations' | 'audio-cleanup'>('organizations'); // NEW

// Enhanced stats with audio cleanup
const [stats, setStats] = useState<SuperAdminStats>({
  totalOrganizations: 0,
  totalEmployees: 0,
  totalWarnings: 0,
  systemUptime: '99.8%',
  // New audio cleanup stats
  totalAudioFiles: 0,
  audioStorageUsed: '0 GB',
  lastCleanupRun: null,
  cleanupHealth: 'healthy'
});

useEffect(() => {
  loadRealData();
  loadAudioCleanupStats(); // 🎯 ADD THIS LINE
}, []);

// 🎯 ADD THIS ENTIRE NEW FUNCTION
const loadAudioCleanupStats = async () => {
  try {
    const cleanupStats = await AudioCleanupService.getCleanupStats();
    const healthCheck = await AudioCleanupService.isCleanupHealthy();
    
    setStats(prev => ({
      ...prev,
      lastCleanupRun: cleanupStats.lastCleanup ? 
        new Date(cleanupStats.lastCleanup).toLocaleDateString() : null,
      cleanupHealth: healthCheck.healthy ? 'healthy' : 
        (healthCheck.issues.length > 2 ? 'error' : 'warning')
    }));
  } catch (error) {
    console.error('Failed to load audio cleanup stats:', error);
    setStats(prev => ({
      ...prev,
      cleanupHealth: 'error'
    }));
  }
};

  const loadRealData = async () => {
    try {
      console.log('📊 Loading REAL data from Firestore...');
      setLoading(true);
      
      // ✅ Load real organizations from Firestore
      const orgs = await DataService.loadOrganizations();
      console.log('✅ Raw organizations from Firestore:', orgs);
      
      // ✅ Load real employee and warning counts for each organization
      const orgsWithRealStats = await Promise.all(
        orgs.map(async (org) => {
          try {
            // Count real employees for this organization
            const employeesRef = collection(db, 'employees');
            const employeeQuery = query(employeesRef, where('organizationId', '==', org.id));
            const employeeSnapshot = await getDocs(employeeQuery);
            const employeeCount = employeeSnapshot.size;

            // Count real warnings for this organization
            const warningsRef = collection(db, 'warnings');
            const warningQuery = query(warningsRef, where('organizationId', '==', org.id));
            const warningSnapshot = await getDocs(warningQuery);
            const warningCount = warningSnapshot.size;

            // 🚧 TEMP: Commenting out SectorService until it's available
            // const orgSectorConfig = await SectorService.getOrganizationSector(org.id);
            const sectorId = org.sectorId;
            const sectorName = org.sectorName;

            console.log(`📊 ${org.name}: ${employeeCount} employees, ${warningCount} warnings, sector: ${sectorName || 'Unassigned'}`);

            return {
              id: org.id,
              name: org.name,
              industry: org.industry,
              employeeCount,
              warningCount,
              lastActivity: org.createdAt ? 
                new Date(org.createdAt).toLocaleDateString() : 'Recently',
              createdAt: org.createdAt,
              sectorId,
              sectorName
            };
          } catch (error) {
            console.error(`❌ Error loading stats for ${org.name}:`, error);
            return {
              id: org.id,
              name: org.name,
              industry: org.industry,
              employeeCount: 0,
              warningCount: 0,
              lastActivity: 'Unknown',
              createdAt: org.createdAt
            };
          }
        })
      );
      
      setOrganizations(orgsWithRealStats);
      
      // ✅ Calculate real system stats
const totalStats = {
  totalOrganizations: orgsWithRealStats.length,
  totalEmployees: orgsWithRealStats.reduce((sum, org) => sum + org.employeeCount, 0),
  totalWarnings: orgsWithRealStats.reduce((sum, org) => sum + org.warningCount, 0),
};
setStats(prev => ({ ...prev, ...totalStats }));
      
      console.log('✅ Real system stats:', realStats);
      console.log('📊 Organizations with real data:', orgsWithRealStats);
      
    } catch (error) {
      console.error('❌ Failed to load real data:', error);
      // Fallback to show empty state instead of fake data
      setOrganizations([]);
      setStats({
        totalOrganizations: 0,
        totalEmployees: 0,
        totalWarnings: 0,
        systemUptime: 'Loading...'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWizardSuccess = () => {
    setShowWizard(false);
    loadRealData(); // Refresh with real data
  };

// 🎯 REPLACE EVERYTHING FROM handleWizardSuccess DOWN TO THE END OF THE FILE

  const handleSectorAssignment = (org: Organization) => {
    setSectorAssignment({
      isOpen: true,
      organizationId: org.id,
      organizationName: org.name,
      currentSectorId: org.sectorId
    });
  };

  const handleSectorAssignmentComplete = () => {
    setSectorAssignment(prev => ({ ...prev, isOpen: false }));
    loadRealData();
  };

  const renderTabNavigation = () => (
    <div className="flex border-b border-gray-200 mb-6">
      <button
        onClick={() => setActiveTab('organizations')}
        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'organizations'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        <Building2 className="w-4 h-4 inline mr-2" />
        Organizations
      </button>
      <button
        onClick={() => setActiveTab('audio-cleanup')}
        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === 'audio-cleanup'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        <Trash2 className="w-4 h-4 inline mr-2" />
        Audio Cleanup
        {stats.cleanupHealth !== 'healthy' && (
          <span className={`ml-2 w-2 h-2 rounded-full inline-block ${
            stats.cleanupHealth === 'error' ? 'bg-red-500' : 'bg-yellow-500'
          }`} />
        )}
      </button>
    </div>
  );

  const renderStatsCards = () => (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
      gap: '1.5rem',
      marginBottom: '2rem'
    }}>
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: '#dbeafe', borderRadius: '8px' }}>
            <Building2 style={{ width: '1.5rem', height: '1.5rem', color: '#2563eb' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Organizations</p>
            <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>{stats.totalOrganizations}</p>
          </div>
        </div>
      </div>
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: '#d1fae5', borderRadius: '8px' }}>
            <Users style={{ width: '1.5rem', height: '1.5rem', color: '#059669' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Total Employees</p>
            <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>{stats.totalEmployees.toLocaleString()}</p>
          </div>
        </div>
      </div>
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
            <AlertTriangle style={{ width: '1.5rem', height: '1.5rem', color: '#d97706' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Total Warnings</p>
            <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>{stats.totalWarnings.toLocaleString()}</p>
          </div>
        </div>
      </div>
      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: stats.cleanupHealth === 'healthy' ? '#dcfce7' : stats.cleanupHealth === 'warning' ? '#fef3c7' : '#fee2e2', borderRadius: '8px' }}>
            <Trash2 style={{ width: '1.5rem', height: '1.5rem', color: stats.cleanupHealth === 'healthy' ? '#16a34a' : stats.cleanupHealth === 'warning' ? '#d97706' : '#dc2626' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Audio Cleanup</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: stats.cleanupHealth === 'healthy' ? '#16a34a' : stats.cleanupHealth === 'warning' ? '#d97706' : '#dc2626', margin: 0, textTransform: 'capitalize' }}>{stats.cleanupHealth}</p>
            {stats.lastCleanupRun && (<p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0 0 0' }}>Last: {stats.lastCleanupRun}</p>)}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            Super Admin Dashboard
          </h1>
          <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
            Global system management and organization oversight
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <CreateUsersButton />
          <button
            onClick={() => setShowWizard(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            <Plus style={{ width: '1rem', height: '1rem' }} />
            Deploy New Client
          </button>
        </div>
      </div>

      {/* Stats cards */}
      {renderStatsCards()}

      {/* Tab navigation */}
      {renderTabNavigation()}

      {/* Tab content */}
      {activeTab === 'organizations' ? (
        // YOUR EXISTING ORGANIZATION TABLE LOGIC GOES HERE
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #f1f5f9',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
              🏢 Organizations & Sector Assignments
            </h2>
          </div>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <div style={{ display: 'inline-block', width: '2rem', height: '2rem', border: '2px solid #f3f4f6', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }}></div>
              <p>Loading real data from Firestore...</p>
            </div>
          ) : organizations.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🏢</span>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>No Organizations Yet</h3>
              <p style={{ margin: 0 }}>Deploy your first organization to start managing the system</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Organization</th>
                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Industry</th>
                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Sector Assignment</th>
                    <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Employees</th>
                    <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Warnings</th>
                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Last Activity</th>
                    <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org, index) => (
                    <tr key={org.id} style={{ borderBottom: index < organizations.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div>
                          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{org.name}</div>
                          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{org.id}</div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}><span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', background: '#f0f9ff', color: '#0369a1', textTransform: 'capitalize' }}>{org.industry}</span></td>
// REPLACE THE BROKEN SECTOR ASSIGNMENT SECTION (around line 400-420) IN SuperAdminDashboard.tsx

<td style={{ padding: '1rem 1.5rem' }}>
  {org.sectorName ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ 
        padding: '0.25rem 0.75rem', 
        borderRadius: '9999px', 
        fontSize: '0.75rem', 
        fontWeight: '600', 
        background: '#f0fdf4', 
        color: '#15803d'
      }}>
        ✅ {org.sectorName}
      </span>
    </div>
  ) : (
    <span style={{
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      background: '#fef2f2',
      color: '#dc2626'
    }}>
      ⚠️ Unassigned
    </span>
  )}
</td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: '600' }}>
                      <span style={{ color: org.employeeCount === 0 ? '#64748b' : '#059669' }}>{org.employeeCount}</span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: '600' }}>
                      <span style={{ color: org.warningCount === 0 ? '#059669' : '#dc2626' }}>{org.warningCount}</span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.875rem' }}>
                      {new Date(org.lastActivity).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button 
                          className="hr-button"
                          style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem', background: org.sectorName ? '#059669' : '#dc2626', color: 'white', border: 'none', borderRadius: '0.375rem' }}
                          onClick={() => handleSectorAssignment(org)}
                        >
                          {org.sectorName ? 'Change Sector' : 'Assign Sector'}
                        </button>
                        <button 
                          className="hr-button"
                          style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem', background: 'white', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: '0.375rem' }}
                        >
                          Manage
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      ) : (
        // New audio cleanup tab
        <AudioCleanupDashboard />
      )}

      {/* Modals */}
      {showWizard && (
        <OrganizationWizard
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          onComplete={() => {
            setShowWizard(false);
            loadRealData();
          }}
        />
      )}

      {sectorAssignment.isOpen && (
        <SectorAssignment
          isOpen={sectorAssignment.isOpen}
          organizationId={sectorAssignment.organizationId}
          organizationName={sectorAssignment.organizationName}
          currentSectorId={sectorAssignment.currentSectorId}
          onClose={() => setSectorAssignment(prev => ({ ...prev, isOpen: false }))}
          onComplete={handleSectorAssignmentComplete}
        />
      )}
    </div>
  );
};