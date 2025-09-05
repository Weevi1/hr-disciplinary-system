// frontend/src/App.tsx - FIXED VERSION - Proper Organization Context Flow
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { DashboardRouter } from './components/dashboard/DashboardRouter';
import { LoginForm } from './auth/LoginForm';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// 🏆 EXISTING COMPONENT IMPORTS
import { WarningManagement } from './components/warnings/WarningManagement';
import { EnhancedWarningWizard } from './components/warnings/enhanced/EnhancedWarningWizard';
import { EmployeeManagement } from './components/employees/EmployeeManagement';
import { UserManagement } from './components/users/UserManagement';

// 🌟 NEW FEATURE IMPORTS
import { BookHRMeeting } from './components/meetings/BookHRMeeting';
import { ReportAbsence } from './components/absences/ReportAbsence';

// 🔔 HR REVIEW COMPONENT IMPORTS
import { AbsenceReportReview } from './components/absences/AbsenceReportReview';
import { HRMeetingReview } from './components/meetings/HRMeetingReview';

// 🔔 WARNINGS REVIEW IMPORTS
import { useMultiRolePermissions } from './hooks/useMultiRolePermissions';
import { useOrganization } from './contexts/OrganizationContext';
import WarningsReviewDashboard from './components/warnings/ReviewDashboard';


// 🚀 API LAYER FOR DATA LOADING
import { API } from '@/api';
import { DataService } from './services/DataService';

import './App.css';

// ============================================
// LOADING & ERROR SCREENS
// ============================================

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading HR System...</h2>
      <p className="text-gray-600">Professional navigation system initializing...</p>
    </div>
  </div>
);

const ErrorScreen = ({ error }: { error: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center max-w-md">
      <div className="text-6xl mb-4 text-red-500">⚠️</div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
      <p className="text-gray-600 mb-4">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Retry
      </button>
    </div>
  </div>
);

// ============================================
// 🔧 FIXED: ENHANCED WARNING WIZARD WRAPPER
// ============================================

// 🎯 CRITICAL FIX: This component now properly uses the organization context
// that's already available from the parent MainLayout OrganizationProvider
const EnhancedWarningWizardWrapper: React.FC = () => {
  const { user } = useAuth();
  const { organization } = useOrganization(); // ✅ Now properly wrapped
  const navigate = useNavigate();
  
  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data loading effect
  useEffect(() => {
    const loadData = async () => {
      if (!organization?.id) {
        console.log('⏳ Waiting for organization to load...');
        return;
      }

      console.log('📊 Loading wizard data for organization:', organization.id);
      setIsLoading(true);
      setError(null);

      try {
        const [employeesData, categoriesData] = await Promise.all([
          API.employees.getAll(organization.id),
          DataService.getWarningCategories(organization.id)
        ]);

        console.log('✅ Loaded employees:', employeesData.length);
        console.log('✅ Loaded categories:', categoriesData.length);

        // Transform employees to match wizard interface
        const transformedEmployees = employeesData.map(emp => ({
          id: emp.id,
          firstName: emp.firstName || emp.profile?.firstName || 'Unknown',
          lastName: emp.lastName || emp.profile?.lastName || 'Employee',
          position: emp.position || emp.employment?.position || 'Unknown Position',
          department: emp.department || emp.profile?.department || emp.employment?.department || 'Unknown',
          email: emp.email || emp.profile?.email || emp.contact?.email || '',
          phone: emp.phone || emp.profile?.phone || emp.contact?.phone || '',
          deliveryPreference: (emp.deliveryPreference || 'email') as 'email' | 'whatsapp' | 'print',
          recentWarnings: emp.recentWarnings || { count: 0 },
          riskIndicators: emp.riskIndicators || { highRisk: false, reasons: [] }
        }));

        // Transform categories
        const transformedCategories = categoriesData.map(cat => ({
          id: cat.id,
          name: cat.name,
          severity: (cat.severity || 'medium') as 'low' | 'medium' | 'high' | 'critical',
          description: cat.description || '',
          lraSection: cat.lraSection || 'LRA Section 188',
          schedule8Reference: cat.schedule8Reference || 'Schedule 8',
          escalationPath: cat.escalationPath || ['verbal_warning', 'first_written', 'final_written', 'dismissal']
        }));

        setEmployees(transformedEmployees);
        setCategories(transformedCategories);
        
      } catch (error) {
        console.error('❌ Error loading warning wizard data:', error);
        setError('Failed to load warning wizard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [organization?.id]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading warning wizard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4 text-red-500">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Wizard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render the enhanced warning wizard
  return (
    <EnhancedWarningWizard
      employees={employees}
      categories={categories}
      currentManagerName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Manager'}
      organizationName={organization?.name || 'Your Organization'}
      onComplete={() => navigate('/dashboard')}
      onCancel={() => navigate('/dashboard')}
    />
  );
};
// ============================================
// WARNINGS REVIEW PROTECTED WRAPPER
// ============================================

const WarningsReviewProtectedWrapper: React.FC = () => {
  const { canManageHR, canManageOrganization } = useMultiRolePermissions();
  const { user } = useAuth();
  
  if (!canManageHR() && !canManageOrganization()) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <WarningsReviewDashboard organizationId={user?.organizationId || ''} />;
};

// ============================================
// 🔧 FIXED: PROTECTED LAYOUT
// ============================================

// ✅ This component properly handles the auth flow and provides MainLayout
// which includes the OrganizationProvider for child components
const ProtectedLayout = () => {
  const { user, loading, error } = useAuth();

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;
  if (!user) return <Navigate to="/login" replace />;

  // 🎯 CRITICAL: MainLayout includes OrganizationProvider
  // so all child routes will have access to useOrganization()
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

// ============================================
// 🔧 FIXED: APP ROUTES
// ============================================

const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      {/* 🎯 FIXED: Redirect authenticated users away from login */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginForm />} />
      
      {/* 🎯 All protected routes live inside ProtectedLayout */}
      {/* This ensures OrganizationProvider is available for all child routes */}
      <Route element={<ProtectedLayout />}>
        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Main Routes */}
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/employees" element={<EmployeeManagement />} />
        <Route path="/warnings" element={<WarningManagement />} />
        
        {/* 🚀 FIXED: Enhanced Warning Wizard - now properly wrapped */}
        <Route path="/warnings/create" element={<EnhancedWarningWizardWrapper />} />
        
        {/* Warnings review dashboard */}
        <Route path="/warnings/review" element={<WarningsReviewProtectedWrapper />} />
        
        <Route path="/users" element={<UserManagement />} />
        
        {/* New Feature Routes */}
        <Route path="/book-hr-meeting" element={<BookHRMeeting />} />
        <Route path="/report-absence" element={<ReportAbsence />} />

        {/* HR Review Routes */}
        <Route path="/hr/absence-reports" element={<AbsenceReportReview />} />
        <Route path="/hr/meeting-requests" element={<HRMeetingReview />} />
        
        {/* Role-Specific Placeholder Routes */}
        <Route path="/organizations" element={<div className="hr-card"><h2>🏢 Organizations Management</h2><p>Coming soon...</p></div>} />
        <Route path="/deploy" element={<div className="hr-card"><h2>🚀 Deploy Client</h2><p>Coming soon...</p></div>} />
        <Route path="/overview" element={<div className="hr-card"><h2>📊 Business Overview</h2><p>Coming soon...</p></div>} />
        <Route path="/compliance" element={<div className="hr-card"><h2>⚖️ Compliance Reports</h2><p>Coming soon...</p></div>} />
        <Route path="/reports" element={<div className="hr-card"><h2>📄 HR Reports</h2><p>Coming soon...</p></div>} />
        <Route path="/team" element={<div className="hr-card"><h2>👥 My Team</h2><p>Coming soon...</p></div>} />
        <Route path="/analytics" element={<div className="hr-card"><h2>📈 Analytics Dashboard</h2><p>Coming soon...</p></div>} />
        <Route path="/settings" element={<div className="hr-card"><h2>⚙️ Organization Settings</h2><p>Coming soon...</p></div>} />

      </Route>

      {/* Catch-all Route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

// ============================================
// 🚀 MAIN APP COMPONENT
// ============================================

function App() {
  console.log('🚀 <File> by Fifo - Fully Integrated, Fully Online HR Management System initializing...');
  
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="app-container">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;