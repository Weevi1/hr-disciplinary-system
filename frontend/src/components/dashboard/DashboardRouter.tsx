// frontend/src/components/DashboardRouter.tsx
// 🏆 ENHANCED UNIFIED DASHBOARD ROUTER
// ✅ MAINTAINS: All existing functionality  
// 🚀 ROUTES: All company users to unified BusinessDashboard
// 👑 KEEPS: Super users separate (as requested)
// 🎨 REMOVED: Redundant greetings - BusinessDashboard handles all greetings now

import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useMultiRolePermissions } from '../../hooks/useMultiRolePermissions';

// Import components - DIRECT IMPORTS (keeping existing)
import { SuperAdminDashboard } from '../admin/SuperAdminDashboard';
import { BusinessDashboard } from '../../pages/business/BusinessDashboard'; // 🏆 Now the unified dashboard

// Import navigation components - DIRECT IMPORTS (keeping existing)
import { EmployeeManagement } from '../employees/EmployeeManagement';
import { UserManagement } from '../users/UserManagement';
import { WarningManagement } from '../warnings/WarningManagement';
import { Settings, Eye } from 'lucide-react';

// 🏆 ENHANCED: Multi-role welcome message - NOW ONLY FOR SUPER USERS
export const SuperUserWelcomeMessage: React.FC = () => {
  const { user } = useAuth();
  const { getPrimaryRole, getAllRoles } = useMultiRolePermissions();
  
  if (!user) return null;
  
  const primaryRole = getPrimaryRole();
  const allRoles = getAllRoles();
  const hasMultipleRoles = allRoles.length > 1;
  
  // Only show for super users - company users get greeting from BusinessDashboard
  if (primaryRole !== 'super-user') return null;
  
  return (
    <div style={{ 
      padding: '1rem', 
      backgroundColor: '#fef3c7', 
      borderRadius: '8px', 
      marginBottom: '1rem',
      border: '1px solid #f59e0b'
    }}>
      <h2 style={{ 
        margin: '0 0 0.5rem 0', 
        color: '#92400e',
        fontSize: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        👑 Welcome, System Administrator
        {hasMultipleRoles && (
          <span style={{
            fontSize: '0.75rem',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            color: '#2563eb',
            padding: '0.25rem 0.5rem',
            borderRadius: '12px',
            fontWeight: '500'
          }}>
            Multi-Role
          </span>
        )}
      </h2>
      <p style={{ 
        margin: '0 0 0.5rem 0', 
        color: '#a16207',
        fontSize: '0.875rem' 
      }}>
        {user.firstName} {user.lastName} • {user.email}
      </p>
      <p style={{ 
        margin: 0, 
        color: '#d97706',
        fontSize: '0.75rem',
        fontStyle: 'italic'
      }}>
        Global system administration and client management
        {hasMultipleRoles && ` • Additional roles: ${allRoles.filter(r => r !== primaryRole).join(', ')}`}
      </p>
    </div>
  );
};

// 🏆 ENHANCED: Main Dashboard Router with Unified Experience
export const DashboardRouter: React.FC = () => {
  const { user } = useAuth();
  const { getPrimaryRole } = useMultiRolePermissions();
  const [currentView, setCurrentView] = useState<string>('dashboard');

  const handleNavigation = (view: string) => {
    setCurrentView(view);
  };

  const backToDashboard = () => {
    setCurrentView('dashboard');
  };

  // Safety check
  if (!user) {
    return (
      <div className="hr-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <h2 style={{ color: '#ef4444' }}>Authentication Required</h2>
        <p style={{ color: '#64748b' }}>Please log in to access the dashboard.</p>
      </div>
    );
  }

  const primaryRole = getPrimaryRole();

  // 🏆 ENHANCED: Professional back button component
  const BackButton = () => (
    <div style={{ marginBottom: '1rem' }}>
      <button
        onClick={backToDashboard}
        className="hr-button-secondary"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem'
        }}
      >
        ← Back to Dashboard
      </button>
    </div>
  );

  // 🎯 NAVIGATION VIEWS - Keep existing functionality, but no greetings for company users
  if (currentView === 'employee-management') {
    return (
      <div>
        {/* Only show greeting for super users in sub-views */}
        {primaryRole === 'super-user' && <SuperUserWelcomeMessage />}
        <BackButton />
        <EmployeeManagement />
      </div>
    );
  }

  if (currentView === 'user-management') {
    return (
      <div>
        {/* Only show greeting for super users in sub-views */}
        {primaryRole === 'super-user' && <SuperUserWelcomeMessage />}
        <BackButton />
        <UserManagement />
      </div>
    );
  }

  if (currentView === 'warning-management') {
    return (
      <div>
        {/* Only show greeting for super users in sub-views */}
        {primaryRole === 'super-user' && <SuperUserWelcomeMessage />}
        <BackButton />
        {/* 🏆 Enhanced Warning System - HOD managers get the new single-form flow */}
        {primaryRole === 'hod-manager' ? (
          <EnhancedWarningForm />
        ) : (
          <WarningManagement />
        )}
      </div>
    );
  }

  // 🏆 UNIFIED DASHBOARD ROUTING - This is the key change!
  switch (primaryRole) {
    case 'super-user':
      // 👑 SUPER USERS: Keep separate dashboard with greeting
      return (
        <div>
          <SuperUserWelcomeMessage />
          <SuperAdminDashboard />
        </div>
      );

    case 'business-owner':
    case 'hr-manager':
    case 'hod-manager':
      // 🏆 ALL COMPANY USERS: Use unified BusinessDashboard
      // BusinessDashboard will handle its own polished greetings
      return <BusinessDashboard />;

    default:
      // 🔧 FALLBACK: Unknown roles
      return (
        <div className="hr-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Settings style={{ width: '1.5rem', height: '1.5rem' }} />
            Role Configuration Needed
          </h2>
          <p style={{ color: '#64748b', margin: '1rem 0' }}>
            Your user role "{user.role.name}" needs dashboard configuration. 
            Please contact your system administrator.
          </p>
          
          {/* 🏆 ENHANCED: Better error information */}
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
              <strong>Debug Information:</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace' }}>
              Role ID: {user.role.id}<br/>
              Role Name: {user.role.name}<br/>
              User ID: {user.id}<br/>
              Organization: {user.organizationId || 'None'}
            </div>
          </div>

          {/* 🏆 FALLBACK: Route to unified dashboard anyway */}
          <div style={{ marginTop: '1.5rem' }}>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="hr-button-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
            >
              <Eye style={{ width: '1rem', height: '1rem' }} />
              Try Dashboard Anyway
            </button>
          </div>
        </div>
      );
  }
};