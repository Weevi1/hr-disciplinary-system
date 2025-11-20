// frontend/src/components/reseller/ResellerDashboard.tsx
// 👑 RESELLER DASHBOARD - UNIFIED WITH SUPERADMIN/BUSINESS OWNER DASHBOARD DESIGN
// ✅ Matches unified dashboard structure: Greeting → Metrics → Tabs → Quote
// ✅ Mobile: 2x2 grid + tab cards
// ✅ Desktop: 4 blocks + tab navigation
// ✅ Clean, professional, consistent

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  Building,
  Globe,
  Award,
  Target,
  ChevronRight,
  Download,
  Rocket
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import Logger from '../../utils/logger';
import { DataService } from '../../services/DataService';
import CommissionService from '../../services/CommissionService';
import { MyClients } from './MyClients';
import { EnhancedOrganizationWizard } from '../admin/EnhancedOrganizationWizard';
import type { Reseller, CommissionStatement, Organization } from '../../types/billing';

// Import themed components
import { ThemedCard } from '../common/ThemedCard';
import { QuotesSection } from '../dashboard/QuotesSection';

// 🚀 CENTRALIZED HOOK: Replaced local duplicate with shared implementation
import { useBreakpoint } from '../../hooks/useBreakpoint';

interface ResellerMetrics {
  totalClients: number;
  activeClients: number;
  monthlyRecurringRevenue: number;
  totalCommissionsEarned: number;
  monthlyCommissions: number;
  averageClientValue: number;
  monthlyGrowth: number;
  conversionRate: number;
  topPerformingClient: string;
}

interface ResellerDashboardData {
  reseller: Reseller;
  metrics: ResellerMetrics;
  clients: Organization[];
  recentCommissions: CommissionStatement[];
  monthlyTrend: Array<{ month: string; revenue: number; commissions: number }>;
}

export const ResellerDashboard: React.FC = () => {
  const { user } = useAuth();
  const isDesktop = useBreakpoint(768);
  const [dashboardData, setDashboardData] = useState<ResellerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'3m' | '6m' | '12m'>('6m');
  const [activeView, setActiveView] = useState<'overview' | 'clients' | 'deploy' | 'performance' | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (user?.resellerId) {
      loadResellerDashboard();
    }
  }, [user?.resellerId, timeframe]);

  const loadResellerDashboard = async () => {
    if (!user?.resellerId) return;

    try {
      setLoading(true);
      Logger.debug('Loading reseller dashboard data...', { resellerId: user.resellerId });

      // Load reseller profile and metrics
      const [reseller, metrics, clients, commissions, trends] = await Promise.all([
        DataService.getReseller(user.resellerId),
        CommissionService.getResellerMetrics(user.resellerId),
        DataService.getResellerClients(user.resellerId),
        CommissionService.getRecentCommissions(user.resellerId, 5),
        CommissionService.getPerformanceTrend(user.resellerId, timeframe)
      ]);

      if (!reseller) {
        throw new Error('Reseller profile not found');
      }

      setDashboardData({
        reseller,
        metrics,
        clients,
        recentCommissions: commissions,
        monthlyTrend: trends
      });

      Logger.success('Reseller dashboard loaded successfully');

    } catch (error) {
      Logger.error('Failed to load reseller dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amountInCents: number): string => {
    return `R${(amountInCents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value: number): string => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const downloadCommissionStatement = async () => {
    if (!user?.resellerId) return;

    try {
      Logger.debug('Generating commission statement...');
      await CommissionService.generateCommissionStatement(user.resellerId);
      Logger.success('Commission statement downloaded');
    } catch (error) {
      Logger.error('Failed to generate commission statement:', error);
    }
  };

  const handleWizardSuccess = async (result: any) => {
    Logger.success('Organization deployed successfully!', result);
    setShowWizard(false);
    await loadResellerDashboard();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Reseller Profile Not Found</h3>
        <p className="text-gray-600">Please contact support to set up your reseller account.</p>
      </div>
    );
  }

  const { reseller, metrics, clients, recentCommissions, monthlyTrend } = dashboardData;

  // 📱 MOBILE VIEW
  if (!isDesktop) {
    return (
      <div className="space-y-6 pb-20">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Welcome back, {reseller.firstName}!
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {reseller.province} • {(reseller.commissionRate * 100).toFixed(0)}% Commission Rate
          </p>
        </div>

        {/* 2x2 Metrics Grid */}
        <div className="grid grid-cols-2 gap-2">
          <ThemedCard
            padding="sm"
            shadow="lg"
            hover
            onClick={() => setActiveView('clients')}
            className="cursor-pointer transition-all duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white',
              minHeight: '80px',
              willChange: 'transform'
            }}
          >
            <div className="flex flex-col items-center gap-1.5 py-1">
              <Users className="w-5 h-5" />
              <span className="font-medium text-xs text-center leading-tight">Total Clients</span>
              <span className="text-lg font-bold">{metrics.totalClients}</span>
            </div>
          </ThemedCard>

          <ThemedCard
            padding="sm"
            shadow="lg"
            hover
            onClick={() => setActiveView('overview')}
            className="cursor-pointer transition-all duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              minHeight: '80px',
              willChange: 'transform'
            }}
          >
            <div className="flex flex-col items-center gap-1.5 py-1">
              <DollarSign className="w-5 h-5" />
              <span className="font-medium text-xs text-center leading-tight">Monthly Earnings</span>
              <span className="text-lg font-bold">{formatCurrency(metrics.monthlyCommissions)}</span>
            </div>
          </ThemedCard>

          <ThemedCard
            padding="sm"
            shadow="lg"
            hover
            onClick={() => setActiveView('overview')}
            className="cursor-pointer transition-all duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              minHeight: '80px',
              willChange: 'transform'
            }}
          >
            <div className="flex flex-col items-center gap-1.5 py-1">
              <Award className="w-5 h-5" />
              <span className="font-medium text-xs text-center leading-tight">Total Earned</span>
              <span className="text-lg font-bold">{formatCurrency(metrics.totalCommissionsEarned)}</span>
            </div>
          </ThemedCard>

          <ThemedCard
            padding="sm"
            shadow="lg"
            hover
            onClick={() => setActiveView('performance')}
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
              <span className="text-lg font-bold">{formatPercentage(metrics.monthlyGrowth)}</span>
            </div>
          </ThemedCard>
        </div>

        {/* Tab Cards */}
        <div className="space-y-3">
          <ThemedCard
            padding="md"
            shadow="sm"
            hover
            onClick={() => setActiveView('clients')}
            className="cursor-pointer transition-all duration-200 active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>My Clients</span>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          </ThemedCard>

          <ThemedCard
            padding="md"
            shadow="sm"
            hover
            onClick={() => setActiveView('performance')}
            className="cursor-pointer transition-all duration-200 active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Performance Trends</span>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          </ThemedCard>

          <ThemedCard
            padding="md"
            shadow="sm"
            hover
            onClick={downloadCommissionStatement}
            className="cursor-pointer transition-all duration-200 active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Download Statement</span>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          </ThemedCard>
        </div>

        {/* Quote */}
        <QuotesSection />

        {/* Modals & Full Screen Views */}
        {activeView === 'clients' && (
          <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
            <div className="p-4">
              <button
                onClick={() => setActiveView(null)}
                className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
              >
                ← Back to Dashboard
              </button>
              <MyClients onDeployClient={() => setShowWizard(true)} />
            </div>
          </div>
        )}

        {activeView === 'performance' && (
          <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
            <div className="p-4">
              <button
                onClick={() => setActiveView(null)}
                className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
              >
                ← Back to Dashboard
              </button>
              <ThemedCard padding="lg" shadow="md">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                    Performance Trend
                  </h3>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value as any)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="3m">3 Months</option>
                    <option value="6m">6 Months</option>
                    <option value="12m">12 Months</option>
                  </select>
                </div>

                <div className="space-y-3">
                  {monthlyTrend.map((month, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                        {month.month}
                      </span>
                      <div className="flex flex-col gap-1 text-right">
                        <div className="text-sm">
                          <span style={{ color: 'var(--color-text-secondary)' }}>Revenue: </span>
                          <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                            {formatCurrency(month.revenue)}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span style={{ color: 'var(--color-text-secondary)' }}>Commission: </span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(month.commissions)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {monthlyTrend.length === 0 && (
                    <div className="text-center py-12">
                      <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p style={{ color: 'var(--color-text-secondary)' }}>
                        No performance data available yet
                      </p>
                    </div>
                  )}
                </div>
              </ThemedCard>
            </div>
          </div>
        )}

        {renderModals()}
      </div>
    );
  }

  // 🖥️ DESKTOP VIEW
  return (
    <div className="space-y-6">
      {/* Greeting Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {reseller.firstName}!</h1>
          <p className="text-blue-100 flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1">
              <Globe className="w-4 h-4" />
              {reseller.province}
            </span>
            <span className="flex items-center gap-1">
              <Target className="w-4 h-4" />
              {(reseller.commissionRate * 100).toFixed(0)}% Commission Rate
            </span>
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3">
        <ThemedCard
          padding="sm"
          shadow="md"
          hover
          onClick={() => setActiveView('clients')}
          className="cursor-pointer"
          style={{ minHeight: '80px' }}
        >
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" style={{ opacity: 0.7 }} />
            <div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Clients</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {metrics.totalClients}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {metrics.activeClients} active
              </div>
            </div>
          </div>
        </ThemedCard>

        <ThemedCard
          padding="sm"
          shadow="md"
          hover
          onClick={() => setActiveView('overview')}
          className="cursor-pointer"
          style={{ minHeight: '80px' }}
        >
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600" style={{ opacity: 0.7 }} />
            <div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Monthly Revenue</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {formatCurrency(metrics.monthlyRecurringRevenue)}
              </div>
              <div className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {formatPercentage(metrics.monthlyGrowth)}
              </div>
            </div>
          </div>
        </ThemedCard>

        <ThemedCard
          padding="sm"
          shadow="md"
          hover
          onClick={() => setActiveView('overview')}
          className="cursor-pointer"
          style={{ minHeight: '80px' }}
        >
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-yellow-600" style={{ opacity: 0.7 }} />
            <div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total Commissions</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {formatCurrency(metrics.totalCommissionsEarned)}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Lifetime earnings
              </div>
            </div>
          </div>
        </ThemedCard>

        <ThemedCard
          padding="sm"
          shadow="md"
          hover
          onClick={() => setActiveView('overview')}
          className="cursor-pointer"
          style={{ minHeight: '80px' }}
        >
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-purple-600" style={{ opacity: 0.7 }} />
            <div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Avg Client Value</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {formatCurrency(metrics.averageClientValue)}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Per month
              </div>
            </div>
          </div>
        </ThemedCard>
      </div>

      {/* Tab Navigation */}
      <div className="border-b" style={{ borderColor: 'var(--color-border)' }}>
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', count: null },
            { id: 'clients', label: 'My Clients', count: metrics.totalClients },
            { id: 'performance', label: 'Performance', count: null }
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
      case 'overview':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Clients */}
            <ThemedCard padding="lg" shadow="md">
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
                Recent Clients
              </h3>
              <div className="space-y-3">
                {clients.slice(0, 2).map((client) => (
                  <div key={client.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <div className="font-medium" style={{ color: 'var(--color-text)' }}>{client.name}</div>
                      <div className="text-sm flex items-center gap-3" style={{ color: 'var(--color-text-secondary)' }}>
                        <span>{client.industry || client.sector}</span>
                        <span>{client.employeeCount || 0} employees</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600">
                        {formatCurrency(client.monthlySubscription || 0)}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>monthly</div>
                    </div>
                  </div>
                ))}
                {clients.length > 2 && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setActiveView('clients')}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View all {clients.length} clients →
                    </button>
                  </div>
                )}
                {clients.length === 0 && (
                  <div className="text-center py-6">
                    <Building className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p style={{ color: 'var(--color-text-secondary)' }}>No clients yet</p>
                    <button
                      onClick={() => setShowWizard(true)}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Deploy your first client
                    </button>
                  </div>
                )}
              </div>
            </ThemedCard>

            {/* Recent Earnings */}
            <ThemedCard padding="lg" shadow="md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                  Recent Earnings
                </h3>
                <button
                  onClick={downloadCommissionStatement}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
              <div className="space-y-3">
                {recentCommissions.map((commission) => (
                  <div key={commission.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <div className="font-medium" style={{ color: 'var(--color-text)' }}>{commission.clientName}</div>
                      <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {new Date(commission.periodStart).toLocaleDateString('en-ZA')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {formatCurrency(commission.commissionAmount)}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {(commission.commissionRate * 100).toFixed(0)}% of {formatCurrency(commission.baseAmount)}
                      </div>
                    </div>
                  </div>
                ))}
                {recentCommissions.length === 0 && (
                  <div className="text-center py-6">
                    <DollarSign className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p style={{ color: 'var(--color-text-secondary)' }}>No recent commissions</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                      Earnings will appear here as clients are billed
                    </p>
                  </div>
                )}
              </div>
            </ThemedCard>
          </div>
        );

      case 'clients':
        return <MyClients onDeployClient={() => setShowWizard(true)} />;

      case 'performance':
        return (
          <ThemedCard padding="lg" shadow="md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                Performance Trend
              </h3>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="3m">3 Months</option>
                <option value="6m">6 Months</option>
                <option value="12m">12 Months</option>
              </select>
            </div>

            <div className="space-y-3">
              {monthlyTrend.map((month, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    {month.month}
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Revenue: </span>
                      <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                        {formatCurrency(month.revenue)}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Commission: </span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(month.commissions)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {monthlyTrend.length === 0 && (
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    No performance data available yet
                  </p>
                </div>
              )}
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
            isOpen={showWizard}
            onClose={() => setShowWizard(false)}
            onComplete={handleWizardSuccess}
          />
        )}
      </>
    );
  }
};
