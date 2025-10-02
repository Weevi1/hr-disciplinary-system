// frontend/src/components/admin/SuperAdminDashboard.tsx
// 👑 SUPER ADMIN DASHBOARD - UNIFIED WITH HR/BUSINESS OWNER DASHBOARD DESIGN
// ✅ Matches HR/Business Owner Dashboard structure: Greeting → Metrics → Tabs → Quote
// ✅ Mobile: 2x2 grid + tab cards
// ✅ Desktop: 4 blocks + tab navigation
// ✅ Clean, professional, consistent

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Users,
  Crown,
  TrendingUp,
  Globe,
  DollarSign,
  Rocket,
  ChevronRight,
  X,
  Settings,
  HardDrive
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { DataService } from '../../services/DataService';
import { DatabaseShardingService } from '../../services/DatabaseShardingService';
import { ResellerManagement } from './ResellerManagement';
import { AudioCleanupDashboard } from './AudioCleanupDashboard';
import { OrganizationCategoriesViewer } from '../organization/OrganizationCategoriesViewer';
import { EnhancedOrganizationWizard } from './EnhancedOrganizationWizard';
import Logger from '../../utils/logger';
import { auth } from '../../config/firebase';
import type { Organization } from '../../types/core';
import { ThemeSelector } from '../common/ThemeSelector';
import { QuotesSection } from '../dashboard/QuotesSection';
import { ref, listAll, getMetadata } from 'firebase/storage';
import { storage } from '../../config/firebase';

// Themed components
import { ThemedCard } from '../common/ThemedCard';

interface SuperUserStats {
  totalOrganizations: number;
  totalEmployees: number;
  totalResellers: number;
  monthlyGrowth: number;
}

// Helper function to format bytes to human-readable size
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Calculate storage usage for an organization
const calculateStorageUsage = async (orgId: string): Promise<number> => {
  try {
    let totalSize = 0;

    // Check audio files folder
    const audioRef = ref(storage, `organizations/${orgId}/audio`);
    try {
      const audioList = await listAll(audioRef);
      for (const item of audioList.items) {
        const metadata = await getMetadata(item);
        totalSize += metadata.size || 0;
      }
    } catch (error) {
      // Folder might not exist yet
    }

    // Check signatures folder
    const signaturesRef = ref(storage, `organizations/${orgId}/signatures`);
    try {
      const signaturesList = await listAll(signaturesRef);
      for (const item of signaturesList.items) {
        const metadata = await getMetadata(item);
        totalSize += metadata.size || 0;
      }
    } catch (error) {
      // Folder might not exist yet
    }

    return totalSize;
  } catch (error) {
    Logger.error(`Error calculating storage for ${orgId}:`, error);
    return 0;
  }
};

// --- Breakpoint Hook ---
const useBreakpoint = (breakpoint: number) => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > breakpoint);
  const handleResize = useCallback(() => setIsDesktop(window.innerWidth > breakpoint), [breakpoint]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return isDesktop;
};

export const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const isDesktop = useBreakpoint(768);

  const [stats, setStats] = useState<SuperUserStats>({
    totalOrganizations: 0,
    totalEmployees: 0,
    totalResellers: 0,
    monthlyGrowth: 0
  });

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [activeView, setActiveView] = useState<'organizations' | 'resellers' | 'audio' | 'financial' | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [categoryManagement, setCategoryManagement] = useState({
    isOpen: false,
    organizationId: '',
    organizationName: ''
  });

  // Load data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      Logger.debug('Loading SuperAdmin dashboard data...');

      // 🔍 DEBUG: Check user's auth token claims
      const user = auth.currentUser;
      if (user) {
        const idTokenResult = await user.getIdTokenResult();
        console.log('🔍 [DEBUG] User custom claims:', idTokenResult.claims);
        console.log('🔍 [DEBUG] User role:', idTokenResult.claims.role);
        console.log('🔍 [DEBUG] Is super-user?', idTokenResult.claims.role === 'super-user');

        // Auto-refresh claims if role is missing or incorrectly formatted (object instead of string)
        const roleIsInvalid = !idTokenResult.claims.role || typeof idTokenResult.claims.role === 'object';
        if (roleIsInvalid) {
          console.warn('⚠️ Role missing or incorrectly formatted! Calling refreshUserClaims...');
          try {
            const { getFunctions, httpsCallable } = await import('firebase/functions');
            const functions = getFunctions(undefined, 'us-central1');
            const refreshClaims = httpsCallable(functions, 'refreshUserClaims');
            const result = await refreshClaims({});
            console.log('✅ Claims refreshed! Please sign out and back in:', result.data);
            alert('Your user role has been refreshed! Please SIGN OUT and SIGN BACK IN for changes to take effect.');
            return; // Stop loading dashboard until user refreshes
          } catch (err) {
            console.error('❌ Failed to refresh claims:', err);
          }
        }
      }

      // Load organizations
      const orgs = await DataService.loadOrganizations();

      // Calculate stats
      let totalEmployees = 0;
      let totalResellers = 0;

      // Get real warning counts and storage usage for each org
      const orgsWithRealCounts = await Promise.all(
        orgs.map(async (org) => {
          try {
            // Get warning count
            const warningsResult = await DatabaseShardingService.queryDocuments(
              org.id,
              'warnings'
            );
            const activeWarnings = warningsResult.documents.filter((w: any) => w.isActive === true);

            // Get storage usage
            const storageBytes = await calculateStorageUsage(org.id);

            return {
              ...org,
              warningCount: activeWarnings.length,
              storageUsage: storageBytes
            };
          } catch (error) {
            return {
              ...org,
              warningCount: 0,
              storageUsage: 0
            };
          }
        })
      );

      setOrganizations(orgsWithRealCounts);

      // Calculate totals
      orgsWithRealCounts.forEach(org => {
        totalEmployees += org.employeeCount || 0;
        if (org.resellerId) totalResellers++;
      });

      // Calculate monthly growth
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      let currentMonthCount = 0;
      let lastMonthCount = 0;

      orgsWithRealCounts.forEach(org => {
        if (org.createdAt) {
          const createdDate = org.createdAt instanceof Date
            ? org.createdAt
            : org.createdAt.toDate?.() || new Date(org.createdAt);

          const createdMonth = createdDate.getMonth();
          const createdYear = createdDate.getFullYear();

          // Count orgs created in current month
          if (createdMonth === currentMonth && createdYear === currentYear) {
            currentMonthCount++;
          }

          // Count orgs created in last month
          if (createdMonth === lastMonth && createdYear === lastMonthYear) {
            lastMonthCount++;
          }
        }
      });

      // Calculate growth percentage
      let monthlyGrowth = 0;
      if (lastMonthCount > 0) {
        monthlyGrowth = Math.round(((currentMonthCount - lastMonthCount) / lastMonthCount) * 100);
      } else if (currentMonthCount > 0) {
        // If no orgs last month but some this month, show 100% growth
        monthlyGrowth = 100;
      }

      setStats({
        totalOrganizations: orgsWithRealCounts.length,
        totalEmployees,
        totalResellers: Math.max(totalResellers, 1), // At least 1 (you)
        monthlyGrowth
      });

      Logger.success('SuperAdmin dashboard data loaded successfully');
    } catch (error) {
      Logger.error('Error loading SuperAdmin dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryManagement = (org: Organization) => {
    setCategoryManagement({
      isOpen: true,
      organizationId: org.id,
      organizationName: org.name
    });
  };

  const handleWizardSuccess = async (result: any) => {
    Logger.success('Organization deployed successfully!', result);
    setShowWizard(false);
    await loadDashboardData();
  };

  // 📱 MOBILE VIEW
  if (!isDesktop) {
    return (
      <div className="space-y-6 pb-20">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            👑 Super Admin
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Global system management
          </p>
        </div>

        {/* Deploy Button - Prominent */}
        <ThemedCard
          padding="md"
          shadow="lg"
          hover
          onClick={() => setShowWizard(true)}
          className="cursor-pointer transition-all duration-200 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            color: 'var(--color-text-inverse)',
            minHeight: '64px',
            willChange: 'transform'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Rocket className="w-6 h-6" />
              <span className="font-bold text-lg">Deploy New Organization</span>
            </div>
            <ChevronRight className="w-5 h-5" />
          </div>
        </ThemedCard>

        {/* 2x2 Metrics Grid */}
        <div className="grid grid-cols-2 gap-2">
          <ThemedCard
            padding="sm"
            shadow="lg"
            hover
            onClick={() => setActiveView('organizations')}
            className="cursor-pointer transition-all duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white',
              minHeight: '80px',
              willChange: 'transform'
            }}
          >
            <div className="flex flex-col items-center gap-1.5 py-1">
              <Building2 className="w-5 h-5" />
              <span className="font-medium text-xs text-center leading-tight">Organizations</span>
              <span className="text-lg font-bold">{stats.totalOrganizations}</span>
            </div>
          </ThemedCard>

          <ThemedCard
            padding="sm"
            shadow="lg"
            hover
            onClick={() => setActiveView('organizations')}
            className="cursor-pointer transition-all duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              minHeight: '80px',
              willChange: 'transform'
            }}
          >
            <div className="flex flex-col items-center gap-1.5 py-1">
              <Users className="w-5 h-5" />
              <span className="font-medium text-xs text-center leading-tight">Total Employees</span>
              <span className="text-lg font-bold">{stats.totalEmployees.toLocaleString()}</span>
            </div>
          </ThemedCard>

          <ThemedCard
            padding="sm"
            shadow="lg"
            hover
            onClick={() => setActiveView('resellers')}
            className="cursor-pointer transition-all duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              minHeight: '80px',
              willChange: 'transform'
            }}
          >
            <div className="flex flex-col items-center gap-1.5 py-1">
              <Globe className="w-5 h-5" />
              <span className="font-medium text-xs text-center leading-tight">Resellers</span>
              <span className="text-lg font-bold">{stats.totalResellers}</span>
            </div>
          </ThemedCard>

          <ThemedCard
            padding="sm"
            shadow="lg"
            hover
            onClick={() => setActiveView('financial')}
            className="cursor-pointer transition-all duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: 'white',
              minHeight: '80px',
              willChange: 'transform'
            }}
          >
            <div className="flex flex-col items-center gap-1.5 py-1">
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium text-xs text-center leading-tight">Growth</span>
              <span className="text-lg font-bold">+{stats.monthlyGrowth}%</span>
            </div>
          </ThemedCard>
        </div>

        {/* Tab Cards */}
        <div className="space-y-3">
          <ThemedCard
            padding="md"
            shadow="sm"
            hover
            onClick={() => setActiveView('audio')}
            className="cursor-pointer transition-all duration-200 active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Audio Cleanup</span>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          </ThemedCard>

          <ThemedCard
            padding="md"
            shadow="sm"
            hover
            onClick={() => setActiveView('financial')}
            className="cursor-pointer transition-all duration-200 active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Financial Dashboard</span>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          </ThemedCard>
        </div>

        {/* Quote */}
        <QuotesSection />

        {/* Modals */}
        {renderModals()}
      </div>
    );
  }

  // 🖥️ DESKTOP VIEW
  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <ThemedCard
          padding="sm"
          shadow="md"
          hover
          onClick={() => setActiveView('organizations')}
          className="cursor-pointer"
          style={{ minHeight: '80px' }}
        >
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" style={{ opacity: 0.7 }} />
            <div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Organizations</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {stats.totalOrganizations}
              </div>
            </div>
          </div>
        </ThemedCard>

        <ThemedCard
          padding="sm"
          shadow="md"
          hover
          onClick={() => setActiveView('organizations')}
          className="cursor-pointer"
          style={{ minHeight: '80px' }}
        >
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-green-600" style={{ opacity: 0.7 }} />
            <div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Employees</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {stats.totalEmployees.toLocaleString()}
              </div>
            </div>
          </div>
        </ThemedCard>

        <ThemedCard
          padding="sm"
          shadow="md"
          hover
          onClick={() => setActiveView('resellers')}
          className="cursor-pointer"
          style={{ minHeight: '80px' }}
        >
          <div className="flex items-center gap-3">
            <Globe className="w-8 h-8 text-orange-600" style={{ opacity: 0.7 }} />
            <div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Active Resellers</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {stats.totalResellers}
              </div>
            </div>
          </div>
        </ThemedCard>

        <ThemedCard
          padding="sm"
          shadow="md"
          hover
          onClick={() => setActiveView('financial')}
          className="cursor-pointer"
          style={{ minHeight: '80px' }}
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-purple-600" style={{ opacity: 0.7 }} />
            <div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Monthly Growth</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                +{stats.monthlyGrowth}%
              </div>
            </div>
          </div>
        </ThemedCard>
      </div>

      {/* Tab Navigation */}
      <div className="border-b" style={{ borderColor: 'var(--color-border)' }}>
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'organizations', label: 'Organizations', count: stats.totalOrganizations },
            { id: 'resellers', label: 'Resellers', count: stats.totalResellers },
            { id: 'audio', label: 'Audio Cleanup', count: null },
            { id: 'financial', label: 'Financial', count: null }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeView === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent hover:border-gray-300'
              }`}
              style={{
                color: activeView === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)'
              }}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeView && renderTabContent()}

      {/* Quote */}
      <QuotesSection />

      {/* Modals */}
      {renderModals()}
    </div>
  );

  // Render tab content for desktop
  function renderTabContent() {
    switch (activeView) {
      case 'organizations':
        return (
          <ThemedCard padding="none" shadow="md">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                🏢 Organizations & Category Management
              </h2>
              <button
                onClick={() => setShowWizard(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors"
                style={{
                  background: 'var(--color-primary)',
                  color: 'var(--color-text-inverse)'
                }}
              >
                <Rocket className="w-4 h-4" />
                Deploy New Organization
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Loading organizations...</p>
                </div>
              </div>
            ) : organizations.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Building2 className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-text-tertiary)' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                  No Organizations Yet
                </h3>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Deploy your first organization to start managing the system
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ background: 'var(--color-background-secondary)' }}>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                          style={{ color: 'var(--color-text-secondary)' }}>
                        Organization
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                          style={{ color: 'var(--color-text-secondary)' }}>
                        Industry
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider"
                          style={{ color: 'var(--color-text-secondary)' }}>
                        Employees
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider"
                          style={{ color: 'var(--color-text-secondary)' }}>
                        Warnings
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider"
                          style={{ color: 'var(--color-text-secondary)' }}>
                        Storage
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider"
                          style={{ color: 'var(--color-text-secondary)' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                    {organizations.map((org) => (
                      <tr key={org.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-semibold" style={{ color: 'var(--color-text)' }}>
                              {org.name}
                            </div>
                            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                              {org.id}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 capitalize">
                            {org.industry || org.sector}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center font-semibold">
                          <span className={org.employeeCount === 0 ? 'text-gray-500' : 'text-green-600'}>
                            {org.employeeCount || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center font-semibold">
                          <span className={org.warningCount === 0 ? 'text-green-600' : 'text-red-600'}>
                            {org.warningCount || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            <HardDrive className="w-4 h-4" />
                            <span className="font-medium">
                              {formatBytes(org.storageUsage || 0)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleCategoryManagement(org)}
                              className="text-xs px-3 py-1 rounded font-semibold bg-purple-600 text-white hover:bg-purple-700"
                            >
                              Categories
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ThemedCard>
        );

      case 'resellers':
        return <ResellerManagement />;

      case 'audio':
        return <AudioCleanupDashboard />;

      case 'financial':
        return (
          <ThemedCard padding="lg" shadow="md">
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-text-tertiary)' }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                Financial Dashboard
              </h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Revenue tracking and commission management coming soon
              </p>
            </div>
          </ThemedCard>
        );

      default:
        return null;
    }
  }

  // Render modals
  function renderModals() {
    return (
      <>
        {/* Organization Wizard */}
        {showWizard && (
          <EnhancedOrganizationWizard
            onClose={() => setShowWizard(false)}
            onComplete={handleWizardSuccess}
          />
        )}

        {/* Category Management Modal */}
        {categoryManagement.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl my-auto">
              <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Warning Categories</h2>
                  <p className="text-sm text-gray-600">{categoryManagement.organizationName}</p>
                </div>
                <button
                  onClick={() => setCategoryManagement(prev => ({ ...prev, isOpen: false }))}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-6">
                <OrganizationCategoriesViewer
                  onClose={() => setCategoryManagement(prev => ({ ...prev, isOpen: false }))}
                  organizationId={categoryManagement.organizationId}
                  organizationName={categoryManagement.organizationName}
                  inline={true}
                  allowEdit={true}
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
};
