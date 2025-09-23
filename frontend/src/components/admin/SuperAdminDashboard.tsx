// frontend/src/components/admin/SuperAdminDashboard.tsx
// Modern Professional SuperUser Dashboard - Mobile-First Design

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Crown,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Settings,
  Shield,
  Rocket,
  BarChart3,
  Activity,
  Globe,
  DollarSign,
  PieChart,
  Banknote,
  X
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { DataService } from '../../services/DataService';
import CommissionService from '../../services/CommissionService';
import { ResellerManagement } from './ResellerManagement';
import { AudioCleanupDashboard } from './AudioCleanupDashboard';
import { CategoryManagement } from './CategoryManagement';
import { CreateUsersButton } from './CreateUsersButton';
import { EnhancedOrganizationWizard } from './EnhancedOrganizationWizard';
import Logger from '../../utils/logger';
import type { Organization } from '../../types/core';
import { ThemeSelector } from '../common/ThemeSelector';

interface SuperUserStats {
  totalOrganizations: number;
  totalEmployees: number;
  totalResellers: number;
  activeUsers: number;
  monthlyGrowth: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
}

/**
 * SuperAdminDashboard - Comprehensive system overview for super users
 *
 * Features:
 * - System-wide statistics and monitoring
 * - Organization management overview
 * - Real-time health metrics
 * - Quick access to admin functions
 */
export const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<SuperUserStats>({
    totalOrganizations: 0,
    totalEmployees: 0,
    totalResellers: 0,
    activeUsers: 0,
    monthlyGrowth: 0,
    systemHealth: 'good'
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [recentOrganizations, setRecentOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResellerManagement, setShowResellerManagement] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [activeTab, setActiveTab] = useState<'organizations' | 'audio-cleanup' | 'financial'>('organizations');
  const [categoryManagement, setCategoryManagement] = useState({
    isOpen: false,
    organizationId: '',
    organizationName: ''
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      Logger.debug('Loading SuperAdmin dashboard data...');

      // Load organizations
      const organizations = await DataService.loadOrganizations();

      // Load resellers
      const resellers = await DataService.getAllResellers();

      // Calculate stats (simplified for now)
      const totalEmployees = organizations.reduce((sum, org) => sum + (org.employeeCount || 0), 0);

      setStats({
        totalOrganizations: organizations.length,
        totalEmployees,
        totalResellers: resellers.length,
        activeUsers: Math.floor(totalEmployees * 0.8), // Estimate active users
        monthlyGrowth: 12, // Mock growth percentage
        systemHealth: organizations.length > 50 ? 'excellent' : 'good'
      });

      // Set recent organizations (last 5)
      setRecentOrganizations(
        organizations
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
          .slice(0, 5)
      );

      setOrganizations(organizations);
      Logger.success('SuperAdmin dashboard data loaded successfully');
    } catch (error) {
      Logger.error('Failed to load SuperAdmin dashboard data:', error);
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

  const handleWizardSuccess = (organizationId: string) => {
    Logger.success(`🎉 Organization ${organizationId} deployed successfully!`);
    Logger.info(`📋 Console logs preserved - wizard will stay open for inspection`);
    Logger.info(`💡 Click "Close" button when ready to return to dashboard`);
    // Don't immediately close the wizard - let user inspect console first
    // setShowWizard(false);
    loadDashboardData(); // Refresh data
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return <CheckCircle className="w-5 h-5" />;
      case 'good': return <Activity className="w-5 h-5" />;
      case 'warning': return <AlertCircle className="w-5 h-5" />;
      case 'critical': return <AlertCircle className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl">
            <Crown className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-gray-600">Global system management and organization oversight</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeSelector />

          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getHealthColor(stats.systemHealth)}`}>
            {getHealthIcon(stats.systemHealth)}
            <span className="font-medium capitalize">{stats.systemHealth}</span>
          </div>

          <CreateUsersButton />

          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            <Rocket className="w-4 h-4" />
            Deploy New Client
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalOrganizations}</div>
          <div className="text-sm text-gray-600">Organizations</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">System Wide</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalEmployees.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Employees</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Globe className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">Partners</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalResellers}</div>
          <div className="text-sm text-gray-600">Active Resellers</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Growth</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">+{stats.monthlyGrowth}%</div>
          <div className="text-sm text-gray-600">Monthly Growth</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <button
          onClick={() => window.location.href = '/deploy'}
          className="group bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-xl p-6 transition-all duration-200 hover:shadow-lg text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 group-hover:bg-blue-200 rounded-xl transition-colors">
              <Rocket className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Deploy Organization</h3>
              <p className="text-sm text-gray-600 mt-1">Create new client organization</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => window.location.href = '/organizations'}
          className="group bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-dashed border-green-300 hover:border-green-500 rounded-xl p-6 transition-all duration-200 hover:shadow-lg text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 group-hover:bg-green-200 rounded-xl transition-colors">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Manage Organizations</h3>
              <p className="text-sm text-gray-600 mt-1">View and manage all organizations</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => window.location.href = '/system-settings'}
          className="group bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-xl p-6 transition-all duration-200 hover:shadow-lg text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 group-hover:bg-purple-200 rounded-xl transition-colors">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">System Settings</h3>
              <p className="text-sm text-gray-600 mt-1">Configure system parameters</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setShowResellerManagement(true)}
          className="group bg-gradient-to-br from-orange-50 to-red-50 border-2 border-dashed border-orange-300 hover:border-orange-500 rounded-xl p-6 transition-all duration-200 hover:shadow-lg text-left"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 group-hover:bg-orange-200 rounded-xl transition-colors">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Manage Resellers</h3>
              <p className="text-sm text-gray-600 mt-1">Provincial sales partners</p>
            </div>
          </div>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('organizations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'organizations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Organizations
          </button>
          <button
            onClick={() => setActiveTab('audio-cleanup')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'audio-cleanup'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Audio Cleanup
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'financial'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Financial Dashboard
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'organizations' ? (
        /* Organizations Tab */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">🏢 Organizations & Category Management</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading real data from Firestore...</p>
              </div>
            </div>
          ) : organizations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Organizations Yet</h3>
              <p className="text-gray-600">Deploy your first organization to start managing the system</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Employees</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Warnings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-semibold text-gray-900">{org.name}</div>
                          <div className="text-sm text-gray-500">{org.id}</div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {org.lastActivity || 'Recently'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleCategoryManagement(org)}
                            className="text-xs px-3 py-1 rounded font-semibold bg-purple-600 text-white hover:bg-purple-700"
                            title="Manage warning categories"
                          >
                            Categories
                          </button>
                          <button
                            onClick={() => window.open(`/organization/${org.id}`, '_blank')}
                            className="text-xs px-3 py-1 rounded font-semibold bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
                            title="Open organization dashboard"
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
      ) : activeTab === 'audio-cleanup' ? (
        /* Audio Cleanup Tab */
        <AudioCleanupDashboard />
      ) : (
        /* Financial Dashboard Tab */
        <div className="space-y-6">
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm text-gray-500">Monthly</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                R{(stats.totalOrganizations * 500).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Banknote className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">Your Share (30%)</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                R{Math.round(stats.totalOrganizations * 500 * 0.30).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Owner Income</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-sm text-gray-500">Reseller Share (50%)</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                R{Math.round(stats.totalOrganizations * 500 * 0.50).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Reseller Commissions</div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm text-gray-500">Company Fund (20%)</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                R{Math.round(stats.totalOrganizations * 500 * 0.20).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Company Reserve</div>
            </div>
          </div>

          {/* Revenue Split Breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Revenue Split Breakdown (50/30/20 Model)
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="font-medium">Gross Revenue</span>
                </div>
                <span className="text-lg font-semibold">R{(stats.totalOrganizations * 500).toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="font-medium">Stripe Fees (2.9%)</span>
                </div>
                <span className="text-lg font-semibold text-red-600">
                  -R{Math.round(stats.totalOrganizations * 500 * 0.029).toLocaleString()}
                </span>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="font-medium">Net Revenue (After Stripe)</span>
                  </div>
                  <span className="text-lg font-semibold">
                    R{Math.round(stats.totalOrganizations * 500 * 0.971).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 border-2 border-orange-200 rounded-lg bg-orange-50">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">50%</div>
                    <div className="text-sm text-gray-600 mb-2">Resellers</div>
                    <div className="text-lg font-semibold">
                      R{Math.round(stats.totalOrganizations * 500 * 0.971 * 0.50).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">30%</div>
                    <div className="text-sm text-gray-600 mb-2">Owner (You)</div>
                    <div className="text-lg font-semibold">
                      R{Math.round(stats.totalOrganizations * 500 * 0.971 * 0.30).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-2 border-purple-200 rounded-lg bg-purple-50">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">20%</div>
                    <div className="text-sm text-gray-600 mb-2">Company</div>
                    <div className="text-lg font-semibold">
                      R{Math.round(stats.totalOrganizations * 500 * 0.971 * 0.20).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Status Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <h3 className="font-semibold text-yellow-800">Stripe Integration Status</h3>
            </div>
            <p className="text-yellow-700 mb-4">
              Stripe webhooks are configured but not yet activated. The system currently marks subscriptions as paid
              for development purposes. Real financial metrics will be available once Stripe is activated in production.
            </p>
            <div className="text-sm text-yellow-600">
              <strong>Note:</strong> Above figures are calculated based on {stats.totalOrganizations} organizations × R500 average subscription.
              Actual revenue will depend on subscription tiers and active billing cycles.
            </div>
          </div>

          {/* Reseller Performance Placeholder */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Provincial Revenue Distribution</h3>
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-600 mb-2">Provincial Metrics Coming Soon</h4>
              <p className="text-gray-500 max-w-md mx-auto">
                Once Stripe is activated and commission tracking begins, you'll see detailed
                provincial revenue breakdowns and reseller performance metrics here.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Organizations - Moved to bottom for reference */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Organizations</h2>
          <button
            onClick={() => window.location.href = '/organizations'}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All
          </button>
        </div>

        <div className="divide-y divide-gray-200">
          {recentOrganizations.map((org) => (
            <div key={org.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Building2 className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{org.name}</h3>
                    <p className="text-sm text-gray-600">{org.sector}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {org.employeeCount || 0} employees
                  </div>
                  <div className="text-xs text-gray-500">
                    {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {recentOrganizations.length === 0 && (
            <div className="px-6 py-8 text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No organizations found</p>
              <p className="text-sm text-gray-500">Organizations will appear here as they are created</p>
            </div>
          )}
        </div>
      </div>

      {/* Reseller Management Modal */}
      {showResellerManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-orange-50 to-red-50">
              <h2 className="text-xl font-bold text-gray-900">Reseller Management</h2>
              <button
                onClick={() => setShowResellerManagement(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              <ResellerManagement />
            </div>
          </div>
        </div>
      )}

      {/* Organization Deployment Wizard */}
      {showWizard && (
        <EnhancedOrganizationWizard
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          onComplete={() => handleWizardSuccess('new-org')}
        />
      )}

      {/* Category Management Modal */}
      {categoryManagement.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Category Management</h2>
                <p className="text-sm text-gray-600">{categoryManagement.organizationName}</p>
              </div>
              <button
                onClick={() => setCategoryManagement(prev => ({ ...prev, isOpen: false }))}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              <CategoryManagement
                onClose={() => setCategoryManagement(prev => ({ ...prev, isOpen: false }))}
                organizationId={categoryManagement.organizationId}
                isEmbedded={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};