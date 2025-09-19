import Logger from '../../utils/logger';
// CREATE NEW FILE: frontend/src/components/admin/AudioCleanupDashboard.tsx
// 🎯 ADMIN DASHBOARD FOR AUDIO CLEANUP MANAGEMENT
// ✅ View cleanup stats, trigger manual cleanup, monitor health

import React, { useState, useEffect } from 'react';
import {
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  BarChart3,
  Calendar,
  Settings,
  RefreshCw,
  TrendingUp,
  Database,
  Shield
} from 'lucide-react';

import { AudioCleanupService } from '../../services/AudioCleanupService';
import type { AudioCleanupAudit } from '../../types/warning';

interface CleanupStats {
  recentAudits: AudioCleanupAudit[];
  totalAudits: number;
  lastCleanup: Date | null;
}

interface CleanupHealth {
  healthy: boolean;
  issues: string[];
  lastCleanup: Date | null;
  daysSinceLastCleanup: number;
}

export const AudioCleanupDashboard: React.FC = () => {
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [health, setHealth] = useState<CleanupHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResult, healthResult] = await Promise.all([
        AudioCleanupService.getCleanupStats(),
        AudioCleanupService.isCleanupHealthy()
      ]);

      setStats(statsResult);
      setHealth(healthResult);

    } catch (err: any) {
      setError(err.message);
      Logger.error('Failed to load cleanup dashboard:', err)
    } finally {
      setLoading(false);
    }
  };

  const triggerManualCleanup = async () => {
    try {
      setTriggering(true);
      setError(null);

      const result = await AudioCleanupService.triggerManualCleanup();
      
      // Refresh data after cleanup
      await loadDashboardData();
      
      alert(`✅ Manual cleanup completed!\n\nDeleted: ${result.result.successfulDeletions} files\nScanned: ${result.result.totalScanned} warnings`);

    } catch (err: any) {
      setError(err.message);
      Logger.error('Manual cleanup failed:', err)
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading cleanup data...</span>
      </div>
    );
  }

  const summary = stats ? AudioCleanupService.formatCleanupSummary(stats.recentAudits) : null;
  const scheduleInfo = AudioCleanupService.getCleanupScheduleInfo();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audio Cleanup Management</h2>
          <p className="text-gray-600">Monitor and manage automated audio file deletion</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={triggerManualCleanup}
            disabled={triggering}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${triggering ? 'animate-spin' : ''}`} />
            {triggering ? 'Running...' : 'Run Manual Cleanup'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Health Status */}
      {health && (
        <div className={`p-4 rounded-lg border ${
          health.healthy 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {health.healthy ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            )}
            <h3 className={`font-semibold ${
              health.healthy ? 'text-green-900' : 'text-yellow-900'
            }`}>
              Cleanup System {health.healthy ? 'Healthy' : 'Needs Attention'}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Last Cleanup:</p>
              <p className="font-medium">
                {health.lastCleanup 
                  ? health.lastCleanup.toLocaleString()
                  : 'Never'
                }
              </p>
            </div>
            <div>
              <p className="text-gray-600">Days Since Last Run:</p>
              <p className="font-medium">{health.daysSinceLastCleanup}</p>
            </div>
          </div>

          {health.issues.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-yellow-900 mb-1">Issues:</p>
              <ul className="text-sm text-yellow-800 space-y-1">
                {health.issues.map((issue, index) => (
                  <li key={index} className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-yellow-600 rounded-full"></span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Trash2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Deletions</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalDeletions.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{summary.successRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Processing</p>
                <p className="text-2xl font-bold text-gray-900">{summary.averageProcessingTime}ms</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Cleanup</p>
                <p className="text-lg font-bold text-gray-900">
                  {summary.lastCleanupDate || 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Cleanup Schedule
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Frequency:</p>
            <p className="font-medium">{scheduleInfo.frequency}</p>
          </div>
          <div>
            <p className="text-gray-600">Next Run:</p>
            <p className="font-medium">{scheduleInfo.nextRun}</p>
          </div>
          <div>
            <p className="text-gray-600">Timezone:</p>
            <p className="font-medium">{scheduleInfo.timezone}</p>
          </div>
        </div>
        
        <p className="text-gray-600 mt-3 text-sm">{scheduleInfo.description}</p>
      </div>

      {/* Recent Audit Logs */}
      {stats && stats.recentAudits.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Recent Cleanup Logs
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Date</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Scanned</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Expired</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Deleted</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Failed</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Processing</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Orgs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.recentAudits.slice(0, 10).map((audit) => (
                  <tr key={audit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {new Date(audit.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">{audit.result.totalScanned}</td>
                    <td className="px-6 py-4">{audit.result.totalExpired}</td>
                    <td className="px-6 py-4 text-green-600 font-medium">
                      {audit.result.successfulDeletions}
                    </td>
                    <td className="px-6 py-4 text-red-600 font-medium">
                      {audit.result.failedDeletions}
                    </td>
                    <td className="px-6 py-4">{audit.result.processingTime}ms</td>
                    <td className="px-6 py-4">{audit.result.organizationsProcessed.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Errors */}
      {summary && summary.recentErrors.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Recent Errors
          </h3>
          
          <div className="space-y-2">
            {summary.recentErrors.map((error, index) => (
              <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Shield className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Compliance & Data Protection</h3>
            <p className="text-blue-800 text-sm mb-3">
              Audio recordings are automatically deleted when warnings expire to ensure compliance with data protection regulations. 
              All deletion activities are logged for audit purposes.
            </p>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Audio files are deleted from Firebase Storage</li>
              <li>• Warning documents remain with deletion metadata</li>
              <li>• All deletion activities are audited and logged</li>
              <li>• Manual cleanup can be triggered by administrators</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};