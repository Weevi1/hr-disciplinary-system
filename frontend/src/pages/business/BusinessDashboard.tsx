// frontend/src/pages/business/BusinessDashboard.tsx
// 🚀 CLEAN BUSINESS DASHBOARD - REDUNDANCY REMOVED
// ✅ Focused, efficient, no duplicate functionality
// 🎯 Role-specific sections handle all navigation and actions

import React, { Suspense, memo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// 🎯 CORE HOOKS & CONTEXTS
import { useAuth } from '../../auth/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useMultiRolePermissions } from '../../hooks/useMultiRolePermissions';

// 🚀 OPTIMIZED COMPONENTS
import { WelcomeSection } from '../../components/dashboard/WelcomeSection';
import { QuotesSection } from '../../components/dashboard/QuotesSection';
import { HRDashboardSection } from '../../components/dashboard/HRDashboardSection';
import { HODDashboardSection } from '../../components/dashboard/HODDashboardSection';
import { BusinessOwnerDashboardSection } from '../../components/dashboard/BusinessOwnerDashboardSection';

// 🛡️ ERROR FALLBACK COMPONENT
const ErrorFallback = memo<{ error: Error; resetErrorBoundary: () => void }>(
  ({ error, resetErrorBoundary }) => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
      <h3 className="text-red-800 font-semibold mb-2">Something went wrong</h3>
      <p className="text-red-700 text-sm mb-4">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
      >
        Try again
      </button>
    </div>
  )
);

ErrorFallback.displayName = 'ErrorFallback';

// 🎨 LOADING SKELETONS
const WelcomeSkeleton = memo(() => (
  <div className="animate-pulse max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
  </div>
));

const SkeletonCard = memo(() => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 animate-pulse">
    <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
  </div>
));

WelcomeSkeleton.displayName = 'WelcomeSkeleton';
SkeletonCard.displayName = 'SkeletonCard';

// 🏢 MAIN BUSINESS DASHBOARD COMPONENT - CLEAN & FOCUSED
export const BusinessDashboard = memo(() => {
  const { user } = useAuth();
  const { organizationData } = useOrganization();
  const {
    getPrimaryRole,
    canManageOrganization,
    canManageHR
  } = useMultiRolePermissions();

  // 🛡️ SAFETY CHECK
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🎨 WELCOME SECTION */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<WelcomeSkeleton />}>
          <WelcomeSection />
        </Suspense>
      </ErrorBoundary>

      {/* 🏢 BUSINESS OWNER DASHBOARD */}
      {canManageOrganization() && (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
              <div className="grid grid-cols-1 gap-6">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
          }>
            <BusinessOwnerDashboardSection />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* 🔔 HR MANAGEMENT SECTION */}
      {canManageHR() && !canManageOrganization() && (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
          }>
            <HRDashboardSection />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* 👥 HOD MANAGER SECTION */}
      {getPrimaryRole() === 'hod-manager' && !canManageHR() && !canManageOrganization() && (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
          }>
            <HODDashboardSection />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* 💭 INSPIRATIONAL QUOTES SECTION */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <div className="h-32 bg-white rounded-2xl shadow-lg animate-pulse"></div>
          </div>
        }>
          <QuotesSection />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
});

BusinessDashboard.displayName = 'BusinessDashboard';

export default BusinessDashboard;