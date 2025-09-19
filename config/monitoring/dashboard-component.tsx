// config/monitoring/dashboard-component.tsx
// Production monitoring dashboard for super admins

import React, { useState, useEffect } from 'react'
import { HealthMonitoringService } from './health-checks'
import { ProductionMonitoringService } from './firebase-monitoring'

interface HealthMetrics {
  firestore: {
    status: 'healthy' | 'degraded' | 'down'
    responseTime: number
    activeConnections: number
  }
  auth: {
    status: 'healthy' | 'degraded' | 'down'
    responseTime: number
  }
  functions: {
    status: 'healthy' | 'degraded' | 'down'
    responseTime: number
    errorRate: number
  }
  system: {
    totalOrganizations: number
    activeUsers: number
    totalWarnings: number
    averageResponseTime: number
  }
  alerts: HealthAlert[]
}

interface HealthAlert {
  severity: 'low' | 'medium' | 'high' | 'critical'
  component: string
  message: string
  timestamp: number
  resolved: boolean
}

interface DashboardData {
  status: string
  uptime: string
  metrics: HealthMetrics
  recentAlerts: HealthAlert[]
}

/**
 * Production Monitoring Dashboard
 * Real-time system health and performance monitoring
 */
export const ProductionMonitoringDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    loadDashboardData()

    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, 30000) // 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const loadDashboardData = async () => {
    try {
      const data = await HealthMonitoringService.getHealthDashboard()
      setDashboardData(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50'
      case 'degraded': return 'text-yellow-600 bg-yellow-50'
      case 'critical': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const handleResolveAlert = async (index: number) => {
    HealthMonitoringService.resolveAlert(index)
    await loadDashboardData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading monitoring dashboard...</span>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 font-medium">Failed to load monitoring data</div>
        <button 
          onClick={loadDashboardData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
          <p className="text-gray-600">Real-time production health and performance</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Auto-refresh</span>
          </label>
          
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className={`p-4 rounded-lg border ${getStatusColor(dashboardData.status)}`}>
          <div className="text-lg font-semibold">System Status</div>
          <div className="text-2xl font-bold capitalize">{dashboardData.status}</div>
        </div>

        <div className="p-4 rounded-lg border bg-gray-50">
          <div className="text-lg font-semibold text-gray-700">Uptime</div>
          <div className="text-2xl font-bold text-gray-900">{dashboardData.uptime}</div>
        </div>

        <div className="p-4 rounded-lg border bg-gray-50">
          <div className="text-lg font-semibold text-gray-700">Organizations</div>
          <div className="text-2xl font-bold text-gray-900">{dashboardData.metrics.system.totalOrganizations}</div>
        </div>

        <div className="p-4 rounded-lg border bg-gray-50">
          <div className="text-lg font-semibold text-gray-700">Active Users</div>
          <div className="text-2xl font-bold text-gray-900">{dashboardData.metrics.system.activeUsers}</div>
        </div>
      </div>

      {/* Service Health */}
      <div className="bg-white rounded-lg border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Service Health</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Firestore */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Firestore Database</span>
              <span className={`px-2 py-1 rounded text-sm ${getStatusColor(dashboardData.metrics.firestore.status)}`}>
                {dashboardData.metrics.firestore.status}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Response Time: {dashboardData.metrics.firestore.responseTime}ms
            </div>
            <div className="text-sm text-gray-600">
              Connections: {dashboardData.metrics.firestore.activeConnections}
            </div>
          </div>

          {/* Authentication */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Authentication</span>
              <span className={`px-2 py-1 rounded text-sm ${getStatusColor(dashboardData.metrics.auth.status)}`}>
                {dashboardData.metrics.auth.status}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Response Time: {dashboardData.metrics.auth.responseTime}ms
            </div>
          </div>

          {/* Cloud Functions */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Cloud Functions</span>
              <span className={`px-2 py-1 rounded text-sm ${getStatusColor(dashboardData.metrics.functions.status)}`}>
                {dashboardData.metrics.functions.status}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Response Time: {dashboardData.metrics.functions.responseTime}ms
            </div>
            <div className="text-sm text-gray-600">
              Error Rate: {(dashboardData.metrics.functions.errorRate * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{dashboardData.metrics.system.totalWarnings}</div>
            <div className="text-sm text-gray-600">Total Warnings</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{dashboardData.metrics.system.averageResponseTime}ms</div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{dashboardData.recentAlerts.length}</div>
            <div className="text-sm text-gray-600">Active Alerts</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">2.7K</div>
            <div className="text-sm text-gray-600">Max Organizations</div>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Alerts</h2>
        
        {dashboardData.recentAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-green-600 text-lg mb-2">✅ All systems operational</div>
            <div>No active alerts</div>
          </div>
        ) : (
          <div className="space-y-3">
            {dashboardData.recentAlerts.map((alert, index) => (
              <div key={index} className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getAlertSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-600">{alert.component}</span>
                    <span className="text-sm text-gray-400">{formatTimestamp(alert.timestamp)}</span>
                  </div>
                  <div className="mt-1 text-gray-900">{alert.message}</div>
                </div>
                
                {!alert.resolved && (
                  <button
                    onClick={() => handleResolveAlert(index)}
                    className="ml-4 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Resolve
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductionMonitoringDashboard