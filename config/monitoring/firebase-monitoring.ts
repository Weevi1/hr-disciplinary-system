// config/monitoring/firebase-monitoring.ts
// Firebase monitoring and observability configuration for production

import { Analytics } from 'firebase/analytics'
import { Performance } from 'firebase/performance'
import { getAnalytics, logEvent, setUserProperties } from 'firebase/analytics'
import { getPerformance, trace } from 'firebase/performance'
import { app } from '../../frontend/src/config/firebase'
import Logger from '../../frontend/src/utils/logger'

/**
 * Production Monitoring Service
 * Comprehensive monitoring and observability for HR Disciplinary System
 */
export class ProductionMonitoringService {
  private static analytics: Analytics
  private static performance: Performance
  private static initialized = false

  /**
   * Initialize monitoring stack
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Initialize Firebase Analytics
      this.analytics = getAnalytics(app)
      
      // Initialize Firebase Performance
      this.performance = getPerformance(app)

      // Set global user properties
      await this.setupGlobalTracking()
      
      this.initialized = true
      Logger.success('🔍 [MONITORING] Production monitoring initialized')
    } catch (error) {
      Logger.error('❌ [MONITORING] Failed to initialize monitoring:', error)
    }
  }

  /**
   * Setup global tracking properties
   */
  private static async setupGlobalTracking(): Promise<void> {
    try {
      setUserProperties(this.analytics, {
        app_version: '2.0.0',
        deployment_env: 'production',
        feature_set: 'enterprise'
      })
    } catch (error) {
      Logger.error('Failed to set global tracking properties:', error)
    }
  }

  /**
   * Track user authentication events
   */
  static trackUserAuth(event: 'login' | 'logout' | 'signup', userId?: string, role?: string): void {
    if (!this.initialized) return

    try {
      logEvent(this.analytics, event, {
        user_id: userId,
        user_role: role,
        timestamp: Date.now()
      })

      if (userId && role) {
        setUserProperties(this.analytics, {
          user_role: role,
          last_login: new Date().toISOString()
        })
      }
    } catch (error) {
      Logger.error('Failed to track user auth:', error)
    }
  }

  /**
   * Track business operations
   */
  static trackBusinessEvent(
    event: 'warning_created' | 'employee_added' | 'meeting_booked' | 'pdf_generated',
    organizationId: string,
    metadata?: Record<string, any>
  ): void {
    if (!this.initialized) return

    try {
      logEvent(this.analytics, event, {
        organization_id: organizationId,
        timestamp: Date.now(),
        ...metadata
      })
    } catch (error) {
      Logger.error('Failed to track business event:', error)
    }
  }

  /**
   * Track performance metrics
   */
  static trackPerformance(operation: string, duration: number, organizationId?: string): void {
    if (!this.initialized) return

    try {
      logEvent(this.analytics, 'performance_metric', {
        operation_name: operation,
        duration_ms: duration,
        organization_id: organizationId,
        timestamp: Date.now()
      })
    } catch (error) {
      Logger.error('Failed to track performance:', error)
    }
  }

  /**
   * Start performance trace
   */
  static startTrace(traceName: string): any {
    if (!this.initialized) return null

    try {
      return trace(this.performance, traceName)
    } catch (error) {
      Logger.error('Failed to start trace:', error)
      return null
    }
  }

  /**
   * Track errors and exceptions
   */
  static trackError(error: Error, context: string, organizationId?: string): void {
    if (!this.initialized) return

    try {
      logEvent(this.analytics, 'app_error', {
        error_message: error.message,
        error_context: context,
        error_stack: error.stack?.substring(0, 500), // Truncate stack trace
        organization_id: organizationId,
        timestamp: Date.now()
      })
    } catch (trackingError) {
      Logger.error('Failed to track error:', trackingError)
    }
  }

  /**
   * Track system health metrics
   */
  static trackSystemHealth(metrics: {
    activeUsers: number
    totalOrganizations: number
    totalWarnings: number
    averageResponseTime: number
  }): void {
    if (!this.initialized) return

    try {
      logEvent(this.analytics, 'system_health', {
        active_users: metrics.activeUsers,
        total_organizations: metrics.totalOrganizations,
        total_warnings: metrics.totalWarnings,
        avg_response_time: metrics.averageResponseTime,
        timestamp: Date.now()
      })
    } catch (error) {
      Logger.error('Failed to track system health:', error)
    }
  }

  /**
   * Track feature usage
   */
  static trackFeatureUsage(
    feature: 'warning_wizard' | 'employee_management' | 'pdf_download' | 'qr_delivery',
    organizationId: string,
    metadata?: Record<string, any>
  ): void {
    if (!this.initialized) return

    try {
      logEvent(this.analytics, 'feature_used', {
        feature_name: feature,
        organization_id: organizationId,
        timestamp: Date.now(),
        ...metadata
      })
    } catch (error) {
      Logger.error('Failed to track feature usage:', error)
    }
  }

  /**
   * Track security events
   */
  static trackSecurityEvent(
    event: 'unauthorized_access' | 'permission_denied' | 'suspicious_activity',
    userId?: string,
    organizationId?: string,
    details?: string
  ): void {
    if (!this.initialized) return

    try {
      logEvent(this.analytics, 'security_event', {
        security_event: event,
        user_id: userId,
        organization_id: organizationId,
        details: details,
        timestamp: Date.now()
      })
    } catch (error) {
      Logger.error('Failed to track security event:', error)
    }
  }
}

/**
 * Performance monitoring decorator
 */
export function MonitorPerformance(operationName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()
      const traceInstance = ProductionMonitoringService.startTrace(operationName)

      try {
        if (traceInstance) traceInstance.start()
        
        const result = await method.apply(this, args)
        
        const duration = Date.now() - startTime
        ProductionMonitoringService.trackPerformance(operationName, duration)
        
        if (traceInstance) traceInstance.stop()
        
        return result
      } catch (error) {
        ProductionMonitoringService.trackError(
          error as Error,
          `${target.constructor.name}.${propertyName}`,
          args[0] // Assume first arg might be organizationId
        )
        
        if (traceInstance) traceInstance.stop()
        throw error
      }
    }
  }
}

/**
 * Error boundary monitoring hook
 */
export function useMonitoringErrorBoundary(organizationId?: string) {
  return {
    onError: (error: Error, errorInfo: { componentStack: string }) => {
      ProductionMonitoringService.trackError(
        new Error(`${error.message}\nComponent: ${errorInfo.componentStack}`),
        'react_error_boundary',
        organizationId
      )
    }
  }
}