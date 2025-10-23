// frontend/src/components/reseller/ResellerDashboard.tsx
// Personal dashboard for reseller users showing their performance and earnings

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  Building,
  Calendar,
  Download,
  Eye,
  Phone,
  Mail,
  MapPin,
  Target,
  Award,
  Clock,
  Rocket
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import Logger from '../../utils/logger';
import { DataService } from '../../services/DataService';
import CommissionService from '../../services/CommissionService';
import type { Reseller, CommissionStatement, Organization } from '../../types/billing';

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
  const [dashboardData, setDashboardData] = useState<ResellerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'3m' | '6m' | '12m'>('6m');

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

      // Claims refresh is handled automatically by AuthContext
      // No need for duplicate checks here

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

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-6">


      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {reseller.firstName}!</h1>
            <p className="text-blue-100 flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {reseller.province}
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                {(reseller.commissionRate * 100).toFixed(0)}% Commission
              </span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{formatCurrency(metrics.monthlyCommissions)}</div>
            <div className="text-blue-100">This Month's Earnings</div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">Total Clients</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{metrics.totalClients}</div>
          <div className="text-sm text-gray-500">{metrics.activeClients} active</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-600">Monthly Revenue</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrency(metrics.monthlyRecurringRevenue)}
          </div>
          <div className="text-sm text-green-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {formatPercentage(metrics.monthlyGrowth)}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-600">Total Commissions</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrency(metrics.totalCommissionsEarned)}
          </div>
          <div className="text-sm text-gray-500">Lifetime earnings</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-600">Avg Client Value</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrency(metrics.averageClientValue)}
          </div>
          <div className="text-sm text-gray-500">Per month</div>
        </div>
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Performance Trend</h3>
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
              <div key={index} className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-gray-600">{month.month}</span>
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="text-gray-500">Revenue: </span>
                    <span className="font-semibold">{formatCurrency(month.revenue)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Commission: </span>
                    <span className="font-semibold text-green-600">{formatCurrency(month.commissions)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/deploy-client'}
              className="w-full flex items-center gap-3 px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <Rocket className="w-4 h-4" />
              Deploy Client
            </button>

            <button
              onClick={downloadCommissionStatement}
              className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Statement
            </button>

            <button
              onClick={() => window.location.href = '/my-clients'}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Eye className="w-4 h-4" />
              View All Clients
            </button>

            <button
              onClick={() => window.location.href = '/performance'}
              className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              Detailed Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Client Overview & Recent Commissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Clients */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Your Clients ({clients.length})</h3>
          <div className="space-y-3">
            {clients.slice(0, 5).map((client) => (
              <div key={client.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <div className="font-medium text-gray-900">{client.name}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-3">
                    <span>{client.sector}</span>
                    <span>{client.employees?.length || 0} employees</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-green-600">
                    {formatCurrency(client.monthlySubscription || 0)}
                  </div>
                  <div className="text-xs text-gray-500">monthly</div>
                </div>
              </div>
            ))}
            {clients.length > 5 && (
              <div className="text-center pt-2">
                <button 
                  onClick={() => window.location.href = '/my-clients'}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View all {clients.length} clients →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Commissions */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Earnings</h3>
          <div className="space-y-3">
            {recentCommissions.map((commission) => (
              <div key={commission.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <div className="font-medium text-gray-900">{commission.clientName}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(commission.periodStart).toLocaleDateString('en-ZA')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">
                    {formatCurrency(commission.commissionAmount)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(commission.commissionRate * 100).toFixed(0)}% of {formatCurrency(commission.baseAmount)}
                  </div>
                </div>
              </div>
            ))}
            {recentCommissions.length === 0 && (
              <div className="text-center py-6">
                <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No recent commissions</p>
                <p className="text-sm text-gray-500">Earnings will appear here as clients are billed</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};