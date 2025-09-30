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
    <div
      className="rounded-lg p-6 m-4"
      style={{
        backgroundColor: 'var(--color-alert-error-bg)',
        border: '1px solid var(--color-alert-error-border)'
      }}
    >
      <h3 className="font-semibold mb-2" style={{ color: 'var(--color-alert-error-text)' }}>
        Something went wrong
      </h3>
      <p className="text-sm mb-4" style={{ color: 'var(--color-alert-error-text)' }}>
        {error.message}
      </p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 rounded-lg transition-colors text-white"
        style={{
          backgroundColor: 'var(--color-error)',
          hover: { backgroundColor: 'var(--color-error)' }
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
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
    <div
      className="h-8 rounded w-1/3 mb-2"
      style={{ backgroundColor: 'var(--color-muted)' }}
    ></div>
    <div
      className="h-4 rounded w-2/3"
      style={{ backgroundColor: 'var(--color-subtle)' }}
    ></div>
  </div>
));

const SkeletonCard = memo(() => (
  <div
    className="rounded-2xl p-6 animate-pulse"
    style={{
      backgroundColor: 'var(--color-card-background)',
      boxShadow: 'var(--shadow-lg)',
      border: '1px solid var(--color-card-border)'
    }}
  >
    <div
      className="h-6 rounded w-1/3 mb-4"
      style={{ backgroundColor: 'var(--color-muted)' }}
    ></div>
    <div className="space-y-2">
      <div
        className="h-4 rounded w-full"
        style={{ backgroundColor: 'var(--color-subtle)' }}
      ></div>
      <div
        className="h-4 rounded w-3/4"
        style={{ backgroundColor: 'var(--color-subtle)' }}
      ></div>
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* 🎨 COMPACT WELCOME SECTION - Desktop first */}
      <div className="pb-0" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="max-w-7xl mx-auto p-6 pb-4">
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<WelcomeSkeleton />}>
              <WelcomeSection />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>

      {/* 🏢 MAIN DASHBOARD CONTENT - Desktop Layout */}
      <div className="max-w-7xl mx-auto p-6 pt-2">
        
        {/* 🏢 BUSINESS OWNER DASHBOARD */}
        {canManageOrganization() && (
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
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
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mb-6">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
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
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            }>
              <HODDashboardSection />
            </Suspense>
          </ErrorBoundary>
        )}

        {/* 💭 COMPACT QUOTES SECTION */}
        <div className="mt-6">
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={
              <div className="h-20 bg-white rounded-xl shadow-sm animate-pulse border border-gray-100"></div>
            }>
              <QuotesSection />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
});

BusinessDashboard.displayName = 'BusinessDashboard';

export default BusinessDashboard;