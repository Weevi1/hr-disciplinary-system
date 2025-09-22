import Logger from './utils/logger';
// frontend/src/App.tsx - PERFORMANCE OPTIMIZED - Code Splitting Implementation
import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { DashboardRouter } from './components/dashboard/DashboardRouter';
import { LoginForm } from './auth/LoginForm';
import { ErrorBoundary, WarningErrorBoundary, EmployeeErrorBoundary, DashboardErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/common/ToastContainer';

// 🚀 LAZY-LOADED COMPONENTS FOR BUNDLE OPTIMIZATION
const EnhancedWarningWizard = React.lazy(() => import('./components/warnings/enhanced/EnhancedWarningWizard').then(m => ({ default: m.EnhancedWarningWizard })));
const EmployeeManagement = React.lazy(() => import('./components/employees/EmployeeManagement').then(m => ({ default: m.EmployeeManagement })));
const UserManagement = React.lazy(() => import('./components/users/UserManagement').then(m => ({ default: m.UserManagement })));

// 🤝 LAZY-LOADED RESELLER COMPONENTS
const ResellerDashboard = React.lazy(() => import('./components/reseller/ResellerDashboard').then(m => ({ default: m.ResellerDashboard })));
const MyClients = React.lazy(() => import('./components/reseller/MyClients').then(m => ({ default: m.MyClients })));
const ResellerManagement = React.lazy(() => import('./components/admin/ResellerManagement').then(m => ({ default: m.ResellerManagement })));

// 🏢 LAZY-LOADED ORGANIZATION WIZARD (used by both SuperUser and Reseller)
const EnhancedOrganizationWizard = React.lazy(() => import('./components/admin/EnhancedOrganizationWizard').then(m => ({ default: m.EnhancedOrganizationWizard })));

// 🌟 LAZY-LOADED FEATURE COMPONENTS
const BookHRMeeting = React.lazy(() => import('./components/meetings/BookHRMeeting').then(m => ({ default: m.BookHRMeeting })));
const ReportAbsence = React.lazy(() => import('./components/absences/ReportAbsence').then(m => ({ default: m.ReportAbsence })));

// 🔔 LAZY-LOADED HR REVIEW COMPONENTS
const AbsenceReportReview = React.lazy(() => import('./components/absences/AbsenceReportReview').then(m => ({ default: m.AbsenceReportReview })));
const HRMeetingReview = React.lazy(() => import('./components/meetings/HRMeetingReview').then(m => ({ default: m.HRMeetingReview })));
const CounsellingDashboard = React.lazy(() => import('./components/counselling/CounsellingDashboard').then(m => ({ default: m.CounsellingDashboard })));

// 🔔 LAZY-LOADED WARNINGS REVIEW
const WarningsReviewDashboard = React.lazy(() => import('./components/warnings/ReviewDashboard'));

// Keep essential hooks and contexts as direct imports for performance
import { useMultiRolePermissions } from './hooks/useMultiRolePermissions';
import { useOrganization } from './contexts/OrganizationContext';


// 🚀 API LAYER FOR DATA LOADING
import { API } from './api';
import { DataService } from './services/DataService';

import './App.css';

// ============================================
// LOADING & ERROR SCREENS
// ============================================

const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
    <div className="text-center">
      <div className="mb-8">
        <img
          src="/logo-128.png"
          alt="File Logo"
          className="w-20 h-16 mx-auto object-contain mb-4"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className="hidden">
          <span className="font-bold text-gray-800 text-lg">&lt;File&gt;</span>
        </div>
        <p className="text-xs text-gray-600 mt-2">by Fifo</p>
      </div>
      <div className="w-8 h-8 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-sm text-gray-600">Loading your filing system...</p>
    </div>
  </div>
);

// 🚀 COMPONENT LOADING FALLBACK (for lazy-loaded components)
const ComponentLoader = ({ text = 'Loading...' }: { text?: string }) => (
  <div className="flex items-center justify-center min-h-96 bg-white">
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mb-2"></div>
      <p className="text-gray-600 text-sm">{text}</p>
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
  const navigate = useNavigate();
  
  // 🔧 FIX: Skip organization context for resellers and super-users
  const isOrganizationUser = user?.role !== 'reseller' && user?.role !== 'super-user';
  const { organization } = isOrganizationUser ? useOrganization() : { organization: null };
  
  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data loading effect
  useEffect(() => {
    const loadData = async () => {
      if (!organization?.id) {
        Logger.debug('⏳ Waiting for organization to load...')
        return;
      }

      Logger.debug(3931)
      setIsLoading(true);
      setError(null);

      try {
        const [employeesData, categoriesData] = await Promise.all([
          API.employees.getAll(organization.id),
          DataService.getWarningCategories(organization.id)
        ]);

        Logger.success(4219)
        Logger.success(4286)

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
          escalationPath: cat.escalationPath || ['verbal_warning', 'first_written', 'final_written']
        }));

        setEmployees(transformedEmployees);
        setCategories(transformedCategories);
        
      } catch (error) {
        Logger.error('❌ Error loading warning wizard data:', error)
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
    <Suspense fallback={<ComponentLoader text="Loading Warning Wizard..." />}>
      <EnhancedWarningWizard
        employees={employees}
        categories={categories}
        currentManagerName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Manager'}
        organizationName={organization?.name || 'Your Organization'}
        onComplete={() => navigate('/dashboard')}
        onCancel={() => navigate('/dashboard')}
      />
    </Suspense>
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
  
  return (
    <Suspense fallback={<ComponentLoader text="Loading Warnings Review..." />}>
      <WarningsReviewDashboard organizationId={user?.organizationId || ''} />
    </Suspense>
  );
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
        <Route path="/dashboard" element={<DashboardErrorBoundary><DashboardRouter /></DashboardErrorBoundary>} />
        <Route path="/employees" element={
          <EmployeeErrorBoundary>
            <Suspense fallback={<ComponentLoader text="Loading Employee Management..." />}>
              <EmployeeManagement />
            </Suspense>
          </EmployeeErrorBoundary>
        } />
        
        {/* 🚀 FIXED: Enhanced Warning Wizard - now properly wrapped */}
        <Route path="/warnings/create" element={
          <WarningErrorBoundary>
            <Suspense fallback={<ComponentLoader text="Loading Warning Wizard..." />}>
              <EnhancedWarningWizardWrapper />
            </Suspense>
          </WarningErrorBoundary>
        } />
        
        {/* Warnings review dashboard */}
        <Route path="/warnings/review" element={<WarningErrorBoundary><WarningsReviewProtectedWrapper /></WarningErrorBoundary>} />
        
        <Route path="/users" element={
          <Suspense fallback={<ComponentLoader text="Loading User Management..." />}>
            <UserManagement />
          </Suspense>
        } />
        
        {/* New Feature Routes */}
        <Route path="/book-hr-meeting" element={
          <Suspense fallback={<ComponentLoader text="Loading HR Meeting Form..." />}>
            <BookHRMeeting />
          </Suspense>
        } />
        <Route path="/report-absence" element={
          <Suspense fallback={<ComponentLoader text="Loading Absence Report..." />}>
            <ReportAbsence />
          </Suspense>
        } />

        {/* HR Review Routes */}
        <Route path="/hr/absence-reports" element={
          <Suspense fallback={<ComponentLoader text="Loading Absence Reviews..." />}>
            <AbsenceReportReview />
          </Suspense>
        } />
        <Route path="/hr/meeting-requests" element={
          <Suspense fallback={<ComponentLoader text="Loading Meeting Reviews..." />}>
            <HRMeetingReview />
          </Suspense>
        } />
        <Route path="/hr/corrective-counselling" element={
          <Suspense fallback={<ComponentLoader text="Loading Counselling Dashboard..." />}>
            <CounsellingDashboard />
          </Suspense>
        } />
        
        {/* Reseller Routes */}
        <Route path="/resellers" element={
          <Suspense fallback={<ComponentLoader text="Loading Reseller Management..." />}>
            <ResellerManagement />
          </Suspense>
        } />
        <Route path="/my-clients" element={
          <Suspense fallback={<ComponentLoader text="Loading Client List..." />}>
            <MyClients />
          </Suspense>
        } />
        <Route path="/deploy-client" element={
          <Suspense fallback={<ComponentLoader text="Loading Deployment Wizard..." />}>
            <EnhancedOrganizationWizard
              isOpen={true}
              onClose={() => window.history.back()}
              onComplete={() => window.location.href = '/my-clients'}
            />
          </Suspense>
        } />
        <Route path="/commissions" element={<div className="hr-card"><h2>💰 Commission Reports</h2><p>Your earnings and commission statements</p></div>} />
        <Route path="/performance" element={<div className="hr-card"><h2>📈 Performance Analytics</h2><p>Detailed performance metrics and trends</p></div>} />
        <Route path="/client-support" element={<div className="hr-card"><h2>🎯 Client Support</h2><p>Tools to help support your clients</p></div>} />

        {/* Role-Specific Placeholder Routes */}
        <Route path="/organizations" element={<div className="hr-card"><h2>🏢 Organizations Management</h2><p>Coming soon...</p></div>} />
        <Route path="/deploy" element={
          <Suspense fallback={<ComponentLoader text="Loading Deployment Wizard..." />}>
            <EnhancedOrganizationWizard
              isOpen={true}
              onClose={() => window.history.back()}
              onComplete={() => window.location.href = '/organizations'}
            />
          </Suspense>
        } />
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
  // Only log in production to avoid StrictMode double-logging
  if (import.meta.env.PROD) {
    Logger.debug('🚀 <File> by Fifo - Fully Integrated, Fully Online HR Management System initializing...')
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
      <AuthProvider>
        <Router>
          <div className="app-container">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;