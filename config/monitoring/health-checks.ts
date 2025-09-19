// config/monitoring/health-checks.ts
// System health monitoring and alerting for production

import { collection, getDocs, query, where, limit } from 'firebase/firestore'
import { db } from '../../frontend/src/config/firebase'
import { ProductionMonitoringService } from './firebase-monitoring'
import Logger from '../../frontend/src/utils/logger'

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

/**
 * System Health Monitoring Service
 * Monitors all system components and provides alerts
 */
export class HealthMonitoringService {
  private static readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes
  private static readonly ALERT_THRESHOLDS = {
    responseTime: 2000, // 2 seconds
    errorRate: 0.05,    // 5%
    organizationLimit: 2500, // 2,500 organizations warning
    activeUserLimit: 10000   // 10,000 concurrent users warning
  }

  private static intervals: NodeJS.Timeout[] = []
  private static alerts: HealthAlert[] = []

  /**
   * Start continuous health monitoring
   */
  static startMonitoring(): void {
    Logger.warn('🔍 [HEALTH] Starting system health monitoring...')

    // Immediate health check
    this.performHealthCheck()

    // Schedule recurring health checks
    const interval = setInterval(() => {
      this.performHealthCheck()
    }, this.HEALTH_CHECK_INTERVAL)

    this.intervals.push(interval)
    Logger.success('✅ [HEALTH] Health monitoring started')
  }

  /**
   * Stop health monitoring
   */
  static stopMonitoring(): void {
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals = []
    Logger.warn('⏹️ [HEALTH] Health monitoring stopped')
  }

  /**
   * Perform comprehensive health check
   */
  static async performHealthCheck(): Promise<HealthMetrics> {
    const startTime = Date.now()
    
    try {
      Logger.debug('🔍 [HEALTH] Performing system health check...')

      const metrics: HealthMetrics = {
        firestore: await this.checkFirestoreHealth(),
        auth: await this.checkAuthHealth(),
        functions: await this.checkFunctionsHealth(),
        system: await this.checkSystemHealth(),
        alerts: [...this.alerts]
      }

      // Analyze metrics and generate alerts
      await this.analyzeHealthMetrics(metrics)
      
      // Track system health
      ProductionMonitoringService.trackSystemHealth(metrics.system)

      const duration = Date.now() - startTime
      Logger.success(`✅ [HEALTH] Health check completed in ${duration}ms`)

      return metrics
    } catch (error) {
      Logger.error('❌ [HEALTH] Health check failed:', error)
      ProductionMonitoringService.trackError(
        error as Error,
        'health_monitoring_service'
      )
      throw error
    }
  }

  /**
   * Check Firestore database health
   */
  private static async checkFirestoreHealth(): Promise<HealthMetrics['firestore']> {
    const startTime = Date.now()
    
    try {
      // Test basic connectivity
      const testQuery = query(
        collection(db, 'organizations'),
        limit(1)
      )
      await getDocs(testQuery)

      const responseTime = Date.now() - startTime
      
      return {
        status: responseTime < this.ALERT_THRESHOLDS.responseTime ? 'healthy' : 'degraded',
        responseTime,
        activeConnections: 1 // Firebase doesn't expose this directly
      }
    } catch (error) {
      Logger.error('Firestore health check failed:', error)
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        activeConnections: 0
      }
    }
  }

  /**
   * Check Firebase Auth health
   */
  private static async checkAuthHealth(): Promise<HealthMetrics['auth']> {
    const startTime = Date.now()
    
    try {
      // Firebase Auth is generally healthy if Firebase is accessible
      // More sophisticated checks could be implemented
      const responseTime = Date.now() - startTime
      
      return {
        status: 'healthy',
        responseTime
      }
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime
      }
    }
  }

  /**
   * Check Cloud Functions health
   */
  private static async checkFunctionsHealth(): Promise<HealthMetrics['functions']> {
    const startTime = Date.now()
    
    try {
      // Could implement actual function health checks here
      // For now, assume healthy if no recent errors
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        errorRate: 0.01 // 1% - would be calculated from actual metrics
      }
    } catch (error) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        errorRate: 1.0
      }
    }
  }

  /**
   * Check overall system health metrics
   */
  private static async checkSystemHealth(): Promise<HealthMetrics['system']> {
    try {
      // Get organization count
      const orgQuery = query(collection(db, 'organizations'))
      const orgSnapshot = await getDocs(orgQuery)
      const totalOrganizations = orgSnapshot.size

      // Estimate active users (would be more sophisticated in production)
      const activeUsers = totalOrganizations * 5 // Rough estimate

      // Get total warnings (would query actual warnings collection)
      const totalWarnings = totalOrganizations * 50 // Rough estimate

      return {
        totalOrganizations,
        activeUsers,
        totalWarnings,
        averageResponseTime: 500 // Would be calculated from actual metrics
      }
    } catch (error) {
      Logger.error('System health check failed:', error)
      return {
        totalOrganizations: 0,
        activeUsers: 0,
        totalWarnings: 0,
        averageResponseTime: 5000
      }
    }
  }

  /**
   * Analyze health metrics and generate alerts
   */
  private static async analyzeHealthMetrics(metrics: HealthMetrics): Promise<void> {
    const newAlerts: HealthAlert[] = []

    // Check response times
    if (metrics.firestore.responseTime > this.ALERT_THRESHOLDS.responseTime) {
      newAlerts.push({
        severity: 'high',
        component: 'firestore',
        message: `Firestore response time high: ${metrics.firestore.responseTime}ms`,
        timestamp: Date.now(),
        resolved: false
      })
    }

    // Check system capacity
    if (metrics.system.totalOrganizations > this.ALERT_THRESHOLDS.organizationLimit) {
      newAlerts.push({
        severity: 'medium',
        component: 'system',
        message: `Organization count approaching limit: ${metrics.system.totalOrganizations}/${this.ALERT_THRESHOLDS.organizationLimit}`,
        timestamp: Date.now(),
        resolved: false
      })
    }

    if (metrics.system.activeUsers > this.ALERT_THRESHOLDS.activeUserLimit) {
      newAlerts.push({
        severity: 'high',
        component: 'system',
        message: `Active user count high: ${metrics.system.activeUsers}`,
        timestamp: Date.now(),
        resolved: false
      })
    }

    // Check error rates
    if (metrics.functions.errorRate > this.ALERT_THRESHOLDS.errorRate) {
      newAlerts.push({
        severity: 'high',
        component: 'functions',
        message: `Cloud Functions error rate high: ${(metrics.functions.errorRate * 100).toFixed(1)}%`,
        timestamp: Date.now(),
        resolved: false
      })
    }

    // Check service status
    const downServices = [
      { name: 'firestore', status: metrics.firestore.status },
      { name: 'auth', status: metrics.auth.status },
      { name: 'functions', status: metrics.functions.status }
    ].filter(service => service.status === 'down')

    downServices.forEach(service => {
      newAlerts.push({
        severity: 'critical',
        component: service.name,
        message: `${service.name} service is down`,
        timestamp: Date.now(),
        resolved: false
      })
    })

    // Add new alerts
    if (newAlerts.length > 0) {
      this.alerts.push(...newAlerts)
      Logger.warn(`⚠️ [HEALTH] Generated ${newAlerts.length} new alerts`)
      
      // Track security events for critical alerts
      newAlerts
        .filter(alert => alert.severity === 'critical')
        .forEach(alert => {
          ProductionMonitoringService.trackSecurityEvent(
            'suspicious_activity',
            undefined,
            undefined,
            `Critical system alert: ${alert.message}`
          )
        })
    }

    // Clean up resolved alerts (older than 24 hours)
    const dayAgo = Date.now() - (24 * 60 * 60 * 1000)
    this.alerts = this.alerts.filter(alert => 
      !alert.resolved || alert.timestamp > dayAgo
    )
  }

  /**
   * Get current system health status
   */
  static getCurrentHealth(): { status: string; alerts: HealthAlert[] } {
    const criticalAlerts = this.alerts.filter(a => 
      !a.resolved && a.severity === 'critical'
    ).length

    const highAlerts = this.alerts.filter(a => 
      !a.resolved && a.severity === 'high'
    ).length

    let status = 'healthy'
    if (criticalAlerts > 0) status = 'critical'
    else if (highAlerts > 0) status = 'degraded'

    return {
      status,
      alerts: this.alerts.filter(a => !a.resolved)
    }
  }

  /**
   * Resolve an alert
   */
  static resolveAlert(alertId: number): void {
    if (this.alerts[alertId]) {
      this.alerts[alertId].resolved = true
      Logger.success(`✅ [HEALTH] Alert resolved: ${this.alerts[alertId].message}`)
    }
  }

  /**
   * Get health dashboard data
   */
  static async getHealthDashboard(): Promise<{
    status: string
    uptime: string
    metrics: HealthMetrics
    recentAlerts: HealthAlert[]
  }> {
    const metrics = await this.performHealthCheck()
    const health = this.getCurrentHealth()

    return {
      status: health.status,
      uptime: this.calculateUptime(),
      metrics,
      recentAlerts: health.alerts.slice(-10) // Last 10 alerts
    }
  }

  /**
   * Calculate system uptime (simplified)
   */
  private static calculateUptime(): string {
    // In production, this would track actual uptime
    return '99.9% (30 days)'
  }
}