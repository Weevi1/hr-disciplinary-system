import Logger from 'logger';
/**
 * Network Error Handler for Multi-Tenant HR System
 * 
 * Handles network failures, Firebase errors, and connection issues
 * Critical for white-label deployment serving thousands of organizations
 */

import { FirebaseError } from 'firebase/app';

export interface NetworkError {
  type: 'network' | 'firebase' | 'server' | 'timeout' | 'permission';
  code?: string;
  message: string;
  userMessage: string;
  retryable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  organizationId?: string;
  userId?: string;
  timestamp: number;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class NetworkErrorHandler {
  private static defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2
  };

  /**
   * Parse and categorize errors for user-friendly messaging
   */
  static parseError(error: any, context?: { organizationId?: string; userId?: string }): NetworkError {
    const timestamp = Date.now();
    
    // Firebase-specific errors
    if (error instanceof FirebaseError) {
      return this.parseFirebaseError(error, context, timestamp);
    }
    
    // Network/fetch errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        type: 'network',
        code: 'NETWORK_ERROR',
        message: error.message,
        userMessage: 'Unable to connect to the server. Please check your internet connection.',
        retryable: true,
        severity: 'high',
        ...context,
        timestamp
      };
    }
    
    // Timeout errors
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return {
        type: 'timeout',
        code: 'TIMEOUT',
        message: error.message,
        userMessage: 'The request took too long to complete. Please try again.',
        retryable: true,
        severity: 'medium',
        ...context,
        timestamp
      };
    }
    
    // Server errors (5xx)
    if (error.status >= 500 && error.status < 600) {
      return {
        type: 'server',
        code: `HTTP_${error.status}`,
        message: `Server error: ${error.status}`,
        userMessage: 'Our servers are experiencing issues. Please try again in a few minutes.',
        retryable: true,
        severity: 'high',
        ...context,
        timestamp
      };
    }
    
    // Client errors (4xx)
    if (error.status >= 400 && error.status < 500) {
      return {
        type: 'server',
        code: `HTTP_${error.status}`,
        message: `Client error: ${error.status}`,
        userMessage: error.status === 404 
          ? 'The requested resource was not found.'
          : 'There was a problem with your request. Please check and try again.',
        retryable: error.status === 429, // Rate limiting is retryable
        severity: 'medium',
        ...context,
        timestamp
      };
    }
    
    // Generic error
    return {
      type: 'network',
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      userMessage: 'An unexpected error occurred. Please try again.',
      retryable: true,
      severity: 'medium',
      ...context,
      timestamp
    };
  }

  /**
   * Parse Firebase-specific errors with organization context
   */
  private static parseFirebaseError(
    error: FirebaseError, 
    context: { organizationId?: string; userId?: string } = {},
    timestamp: number
  ): NetworkError {
    
    switch (error.code) {
      case 'permission-denied':
        return {
          type: 'permission',
          code: error.code,
          message: error.message,
          userMessage: 'You do not have permission to perform this action.',
          retryable: false,
          severity: 'high',
          ...context,
          timestamp
        };
        
      case 'not-found':
        return {
          type: 'firebase',
          code: error.code,
          message: error.message,
          userMessage: 'The requested data was not found.',
          retryable: false,
          severity: 'medium',
          ...context,
          timestamp
        };
        
      case 'unavailable':
      case 'deadline-exceeded':
        return {
          type: 'firebase',
          code: error.code,
          message: error.message,
          userMessage: 'The service is temporarily unavailable. Please try again.',
          retryable: true,
          severity: 'high',
          ...context,
          timestamp
        };
        
      case 'quota-exceeded':
        return {
          type: 'firebase',
          code: error.code,
          message: error.message,
          userMessage: 'System capacity exceeded. Please try again later.',
          retryable: true,
          severity: 'critical',
          ...context,
          timestamp
        };
        
      case 'unauthenticated':
        return {
          type: 'firebase',
          code: error.code,
          message: error.message,
          userMessage: 'Your session has expired. Please sign in again.',
          retryable: false,
          severity: 'high',
          ...context,
          timestamp
        };
        
      case 'cancelled':
        return {
          type: 'firebase',
          code: error.code,
          message: error.message,
          userMessage: 'The operation was cancelled.',
          retryable: true,
          severity: 'low',
          ...context,
          timestamp
        };
        
      default:
        return {
          type: 'firebase',
          code: error.code,
          message: error.message,
          userMessage: 'A database error occurred. Please try again.',
          retryable: true,
          severity: 'medium',
          ...context,
          timestamp
        };
    }
  }

  /**
   * Retry mechanism with exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    context?: { organizationId?: string; userId?: string }
  ): Promise<T> {
    const finalConfig = { ...this.defaultRetryConfig, ...config };
    let lastError: any;
    
    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const parsedError = this.parseError(error, context);
        
        // Don't retry non-retryable errors
        if (!parsedError.retryable || attempt === finalConfig.maxAttempts) {
          throw parsedError;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
          finalConfig.maxDelay
        );
        
        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;
        
        Logger.warn(`🔄 Retry attempt ${attempt}/${finalConfig.maxAttempts} in ${Math.round(jitteredDelay)}ms`, parsedError);
        
        await new Promise(resolve => setTimeout(resolve, jitteredDelay));
      }
    }
    
    // This shouldn't be reached, but just in case
    throw this.parseError(lastError, context);
  }

  /**
   * Enhanced error logging for multi-tenant environment
   */
  static logError(error: NetworkError): void {
    const logData = {
      errorType: error.type,
      errorCode: error.code,
      severity: error.severity,
      organizationId: error.organizationId,
      userId: error.userId,
      timestamp: new Date(error.timestamp).toISOString(),
      message: error.message,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Console logging with context
    const logLevel = error.severity === 'critical' ? 'error' : 
                    error.severity === 'high' ? 'error' :
                    error.severity === 'medium' ? 'warn' : 'info';
                    
    console[logLevel](`🚨 [${error.severity.toUpperCase()}] ${error.type} error:`, logData);
    
    // In production, send to monitoring service (async, non-blocking)
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(logData).catch(monitoringError => {
        Logger.warn('⚠️ Monitoring service call failed:', monitoringError);
      });
    }
  }

  /**
   * Send error data to monitoring service (Sentry, DataDog, etc.)
   */
  private static async sendToMonitoringService(errorData: any): Promise<void> {
    // ✅ Now using comprehensive ErrorTrackingService for monitoring integration
    try {
      // Import ErrorTrackingService dynamically to avoid circular imports
      const { ErrorTrackingService } = await import('../services/ErrorTrackingService');
      
      // Convert network error data to trackable error
      const error = new Error(errorData.userMessage || errorData.message || 'Network error occurred');
      error.stack = errorData.stack;
      
      await ErrorTrackingService.trackNetworkError(
        error,
        errorData.endpoint,
        errorData.operation,
        {
          errorCode: errorData.code,
          severity: errorData.severity,
          retryCount: errorData.retryCount,
          isRetriable: errorData.isRetriable,
          timestamp: errorData.timestamp,
          connectionType: navigator.onLine ? 'online' : 'offline',
          userAgent: navigator.userAgent
        }
      );
      
      Logger.debug(`📊 Network error tracked: ${errorData.code || 'unknown'}`);
    } catch (trackingError) {
      Logger.warn('⚠️ Failed to track network error:', trackingError);
      
      // Fallback: store in localStorage for debugging
      try {
        const existingErrors = JSON.parse(localStorage.getItem('hr_network_errors') || '[]');
        existingErrors.push({
          ...errorData,
          fallbackStored: true,
          fallbackTimestamp: new Date().toISOString()
        });
        
        // Keep only last 50 errors
        if (existingErrors.length > 50) {
          existingErrors.shift();
        }
        
        localStorage.setItem('hr_network_errors', JSON.stringify(existingErrors));
      } catch (storageError) {
        Logger.warn('⚠️ Failed to store error data:', storageError);
      }
    }
  }

  /**
   * Connection status monitoring for offline handling
   */
  static createConnectionMonitor(onConnectionChange: (online: boolean) => void): () => void {
    const handleOnline = () => onConnectionChange(true);
    const handleOffline = () => onConnectionChange(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial status
    onConnectionChange(navigator.onLine);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  /**
   * Create user-friendly error message component
   */
  static createErrorToast(error: NetworkError): {
    title: string;
    message: string;
    type: 'error' | 'warning' | 'info';
    actions: Array<{ label: string; action: () => void }>;
  } {
    return {
      title: this.getErrorTitle(error),
      message: error.userMessage,
      type: error.severity === 'critical' || error.severity === 'high' ? 'error' : 'warning',
      actions: this.getErrorActions(error)
    };
  }

  private static getErrorTitle(error: NetworkError): string {
    switch (error.type) {
      case 'network':
        return 'Connection Problem';
      case 'firebase':
        return 'Database Error';
      case 'permission':
        return 'Access Denied';
      case 'timeout':
        return 'Request Timeout';
      case 'server':
        return 'Server Error';
      default:
        return 'Error';
    }
  }

  private static getErrorActions(error: NetworkError): Array<{ label: string; action: () => void }> {
    const actions = [];
    
    if (error.retryable) {
      actions.push({
        label: 'Try Again',
        action: () => window.location.reload()
      });
    }
    
    if (error.type === 'permission') {
      actions.push({
        label: 'Contact Administrator',
        action: () => {
          // TODO: Open support modal or redirect to help
          Logger.debug('Contact administrator for permission issue')
        }
      });
    }
    
    if (error.type === 'network') {
      actions.push({
        label: 'Check Connection',
        action: () => {
          window.open('https://www.google.com', '_blank');
        }
      });
    }
    
    return actions;
  }
}