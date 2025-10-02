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
import { ResellerDashboard } from '../reseller/ResellerDashboard';
import { WelcomeSection } from './WelcomeSection';

// Import navigation components - DIRECT IMPORTS (keeping existing)
import { UserManagement } from '../users/UserManagement';
import { Settings, Eye } from 'lucide-react';


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
  if (currentView === 'user-management') {
    return (
      <div>
        <BackButton />
        <UserManagement />
      </div>
    );
  }


  // 🏆 UNIFIED DASHBOARD ROUTING - This is the key change!
  switch (primaryRole) {
    case 'super-user':
      // 👑 SUPER USERS: Now use unified WelcomeSection like everyone else
      return (
        <div>
          <div className="p-6 max-w-7xl mx-auto pb-0">
            <WelcomeSection />
          </div>
          <div className="max-w-7xl mx-auto p-6 pt-2">
            <SuperAdminDashboard />
          </div>
        </div>
      );

    case 'reseller':
      // 🤝 RESELLERS: Use dedicated reseller dashboard
      return <ResellerDashboard />;

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