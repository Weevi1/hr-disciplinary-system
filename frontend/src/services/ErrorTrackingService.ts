import Logger from '../utils/logger';
import { ErrorInfo } from 'react';

export interface ErrorTrackingData {
  message: string;
  stack?: string;
  componentStack?: string;
  errorId: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  organizationId?: string;
  errorType: 'component' | 'network' | 'api' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  breadcrumbs?: string[];
}

/**
 * Enterprise Error Tracking Service
 * Handles error logging, tracking, and integration with external services
 */
export class ErrorTrackingService {
  private static readonly MAX_LOCAL_ERRORS = 100;
  private static readonly LOCAL_STORAGE_KEY = 'hr_system_errors';

  /**
   * Track a React component error from ErrorBoundary
   */
  static async trackComponentError(
    error: Error, 
    errorInfo: ErrorInfo, 
    errorId: string, 
    context?: Record<string, any>
  ): Promise<void> {
    const errorData: ErrorTrackingData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
      organizationId: this.getCurrentOrganizationId(),
      errorType: 'component',
      severity: this.determineSeverity(error),
      context,
      breadcrumbs: this.getBreadcrumbs()
    };

    await this.sendToTrackingServices(errorData);
  }

  /**
   * Track a network or API error
   */
  static async trackNetworkError(
    error: any,
    endpoint?: string,
    operation?: string,
    context?: Record<string, any>
  ): Promise<void> {
    const errorData: ErrorTrackingData = {
      message: error.message || 'Network error occurred',
      stack: error.stack,
      errorId: `net_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
      organizationId: this.getCurrentOrganizationId(),
      errorType: 'network',
      severity: error.code === 'permission-denied' ? 'critical' : 'high',
      context: {
        ...context,
        endpoint,
        operation,
        errorCode: error.code
      },
      breadcrumbs: this.getBreadcrumbs()
    };

    await this.sendToTrackingServices(errorData);
  }

  /**
   * Track a general application error
   */
  static async trackGeneralError(
    error: Error,
    errorType: ErrorTrackingData['errorType'] = 'unknown',
    severity: ErrorTrackingData['severity'] = 'medium',
    context?: Record<string, any>
  ): Promise<void> {
    const errorData: ErrorTrackingData = {
      message: error.message,
      stack: error.stack,
      errorId: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
      organizationId: this.getCurrentOrganizationId(),
      errorType,
      severity,
      context,
      breadcrumbs: this.getBreadcrumbs()
    };

    await this.sendToTrackingServices(errorData);
  }

  /**
   * Send error data to all configured tracking services
   */
  private static async sendToTrackingServices(errorData: ErrorTrackingData): Promise<void> {
    try {
      // 1. Log to console for development
      if (process.env.NODE_ENV === 'development') {
        Logger.error(`🚨 [${errorData.errorType.toUpperCase()}] Error tracked:`, errorData);
      }

      // 2. Store locally for debugging and offline resilience
      this.storeErrorLocally(errorData);

      // 3. Send to external services (when configured)
      await this.sendToExternalServices(errorData);

      // 4. Send to Firebase Analytics (for production monitoring)
      await this.sendToFirebaseAnalytics(errorData);

      Logger.debug(`📊 Error ${errorData.errorId} successfully tracked`);
    } catch (trackingError) {
      Logger.error('❌ Failed to track error:', trackingError);
      // Even if tracking fails, store locally as fallback
      this.storeErrorLocally(errorData);
    }
  }

  /**
   * Store error data locally for debugging and offline resilience
   */
  private static storeErrorLocally(errorData: ErrorTrackingData): void {
    try {
      const existingErrors = this.getLocalErrors();
      existingErrors.push(errorData);

      // Keep only the most recent errors
      if (existingErrors.length > this.MAX_LOCAL_ERRORS) {
        existingErrors.splice(0, existingErrors.length - this.MAX_LOCAL_ERRORS);
      }

      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(existingErrors));
    } catch (storageError) {
      Logger.warn('⚠️ Failed to store error locally:', storageError);
    }
  }

  /**
   * Send to external error tracking services (Sentry, LogRocket, etc.)
   */
  private static async sendToExternalServices(errorData: ErrorTrackingData): Promise<void> {
    // TODO: Configure external error tracking services
    // Example implementations:
    
    // Sentry integration:
    // if (window.Sentry) {
    //   window.Sentry.withScope((scope) => {
    //     scope.setTag('errorType', errorData.errorType);
    //     scope.setLevel(this.mapSeverityToSentryLevel(errorData.severity));
    //     scope.setContext('errorDetails', errorData.context || {});
    //     window.Sentry.captureMessage(errorData.message);
    //   });
    // }

    // LogRocket integration:
    // if (window.LogRocket) {
    //   window.LogRocket.captureException(new Error(errorData.message));
    // }

    // Custom API endpoint:
    // try {
    //   await fetch('/api/errors', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(errorData)
    //   });
    // } catch (apiError) {
    //   Logger.warn('Failed to send to error API:', apiError);
    // }

    Logger.debug('🔌 External error tracking services ready for configuration');
  }

  /**
   * Send error data to Firebase Analytics for production monitoring
   */
  private static async sendToFirebaseAnalytics(errorData: ErrorTrackingData): Promise<void> {
    try {
      // Use Firebase Analytics to track errors if available
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: errorData.message,
          fatal: errorData.severity === 'critical',
          error_id: errorData.errorId,
          error_type: errorData.errorType,
          organization_id: errorData.organizationId,
          custom_parameters: {
            severity: errorData.severity,
            url: errorData.url,
            timestamp: errorData.timestamp
          }
        });
      }
    } catch (analyticsError) {
      Logger.warn('⚠️ Failed to send to Firebase Analytics:', analyticsError);
    }
  }

  /**
   * Get locally stored errors for debugging
   */
  static getLocalErrors(): ErrorTrackingData[] {
    try {
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (parseError) {
      Logger.warn('⚠️ Failed to parse local errors:', parseError);
      return [];
    }
  }

  /**
   * Clear local error storage
   */
  static clearLocalErrors(): void {
    try {
      localStorage.removeItem(this.LOCAL_STORAGE_KEY);
      Logger.debug('🧹 Local error storage cleared');
    } catch (clearError) {
      Logger.warn('⚠️ Failed to clear local errors:', clearError);
    }
  }

  /**
   * Get error statistics for monitoring dashboards
   */
  static getErrorStats(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    recent: ErrorTrackingData[];
  } {
    const errors = this.getLocalErrors();
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const recent: ErrorTrackingData[] = [];

    errors.forEach(error => {
      // Count by type
      byType[error.errorType] = (byType[error.errorType] || 0) + 1;
      
      // Count by severity
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      
      // Collect recent errors
      if (new Date(error.timestamp) > last24Hours) {
        recent.push(error);
      }
    });

    return {
      total: errors.length,
      byType,
      bySeverity,
      recent: recent.slice(-10) // Last 10 recent errors
    };
  }

  // Helper methods
  private static getCurrentUserId(): string {
    return localStorage.getItem('userId') || 
           sessionStorage.getItem('userId') || 
           'anonymous';
  }

  private static getCurrentOrganizationId(): string | undefined {
    return localStorage.getItem('organizationId') || 
           sessionStorage.getItem('organizationId') || 
           undefined;
  }

  private static determineSeverity(error: Error): ErrorTrackingData['severity'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'critical';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'high';
    }
    if (message.includes('render') || message.includes('component')) {
      return 'medium';
    }
    
    return 'low';
  }

  private static getBreadcrumbs(): string[] {
    // Simple breadcrumb trail based on URL history
    const breadcrumbs: string[] = [];
    
    // Add current page
    breadcrumbs.push(window.location.pathname);
    
    // Add referrer if available
    if (document.referrer) {
      try {
        const referrerUrl = new URL(document.referrer);
        breadcrumbs.unshift(referrerUrl.pathname);
      } catch (e) {
        // Ignore invalid referrer URLs
      }
    }
    
    return breadcrumbs.slice(0, 5); // Keep last 5 breadcrumbs
  }
}