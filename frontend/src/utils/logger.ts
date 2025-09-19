/**
 * Production-Safe Logger for White-Label HR System
 * 
 * Provides conditional logging that's safe for production environments
 * Critical for multi-tenant systems handling sensitive HR data
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  organizationId?: string;
  userId?: string;
  component?: string;
  action?: string;
  sessionId?: string;
}

class Logger {
  private static isDevelopment = process.env.NODE_ENV === 'development';
  private static isProduction = process.env.NODE_ENV === 'production';
  
  // Production logging whitelist - only these prefixes are allowed in production
  private static productionWhitelist = [
    '❌', // Errors
    '🚨', // Critical alerts  
    '⚠️', // Warnings
    '✅', // Success confirmations for user feedback
    '🎯', // Important user-facing actions
  ];

  /**
   * Safe debug logging - only shows in development
   */
  static debug(message: string, data?: any, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('DEBUG', message, context), data);
    }
  }

  /**
   * Info logging - filtered in production
   */
  static info(message: string, data?: any, context?: LogContext): void {
    if (this.isDevelopment || this.isWhitelistedMessage(message)) {
      console.info(this.formatMessage('INFO', message, context), data);
    }
  }

  /**
   * Warning logging - always shown but sanitized in production
   */
  static warn(message: string, data?: any, context?: LogContext): void {
    const sanitizedData = this.isProduction ? this.sanitizeData(data) : data;
    console.warn(this.formatMessage('WARN', message, context), sanitizedData);
  }

  /**
   * Error logging - always shown but sanitized in production
   */
  static error(message: string, error?: any, context?: LogContext): void {
    const sanitizedError = this.isProduction ? this.sanitizeError(error) : error;
    console.error(this.formatMessage('ERROR', message, context), sanitizedError);
    
    // In production, also send to monitoring service
    if (this.isProduction) {
      this.sendToMonitoring('error', message, sanitizedError, context);
    }
  }

  /**
   * Success logging - user-facing confirmations
   */
  static success(message: string | number, data?: any, context?: LogContext): void {
    const messageStr = String(message);
    if (this.isDevelopment || this.isWhitelistedMessage(message)) {
      console.log(this.formatMessage('SUCCESS', messageStr, context), data);
    }
  }

  /**
   * Performance timing logging - development only
   */
  static perf(operation: string, startTime: number, context?: LogContext): void {
    if (this.isDevelopment) {
      const duration = Date.now() - startTime;
      console.debug(this.formatMessage('PERF', `${operation} completed in ${duration}ms`, context));
    }
  }

  /**
   * Check if message is whitelisted for production
   */
  private static isWhitelistedMessage(message: string | number): boolean {
    const messageStr = String(message);
    return this.productionWhitelist.some(prefix => messageStr.startsWith(prefix));
  }

  /**
   * Format log message with context
   */
  private static formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? this.formatContext(context) : '';
    return `[${timestamp}] ${level}: ${message}${contextStr}`;
  }

  /**
   * Format context for logging
   */
  private static formatContext(context: LogContext): string {
    const parts = [];
    if (context.organizationId) parts.push(`org:${context.organizationId.slice(-8)}`); // Last 8 chars only
    if (context.userId) parts.push(`user:${context.userId.slice(-8)}`); // Last 8 chars only
    if (context.component) parts.push(`comp:${context.component}`);
    if (context.action) parts.push(`action:${context.action}`);
    
    return parts.length > 0 ? ` [${parts.join(', ')}]` : '';
  }

  /**
   * Sanitize sensitive data for production logging
   */
  private static sanitizeData(data: any): any {
    if (!data) return data;
    
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }
    
    if (typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (this.isSensitiveKey(key)) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          sanitized[key] = this.sanitizeData(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }
    
    return data;
  }

  /**
   * Sanitize error objects for production
   */
  private static sanitizeError(error: any): any {
    if (!error) return error;
    
    if (error instanceof Error) {
      return {
        name: error.name,
        message: this.sanitizeString(error.message),
        // Don't include stack traces in production logs
        stack: this.isDevelopment ? error.stack : '[REDACTED]'
      };
    }
    
    return this.sanitizeData(error);
  }

  /**
   * Check if a key contains sensitive data
   */
  private static isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'auth', 'credential',
      'email', 'phone', 'address', 'ssn', 'id_number', 'passport',
      'salary', 'wage', 'bank', 'account', 'credit', 'personal',
      'medical', 'health', 'disciplinary', 'performance'
    ];
    
    const lowerKey = key.toLowerCase();
    return sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));
  }

  /**
   * Sanitize strings to remove sensitive patterns
   */
  private static sanitizeString(str: string): string {
    if (!str || typeof str !== 'string') return str;
    
    // Email pattern
    str = str.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
    
    // Phone patterns (SA numbers)
    str = str.replace(/(\+27|0)[6-8][0-9]{8}/g, '[PHONE]');
    
    // ID numbers (13 digits)
    str = str.replace(/\b\d{13}\b/g, '[ID_NUMBER]');
    
    // Firebase UIDs and tokens (long alphanumeric strings)
    str = str.replace(/\b[a-zA-Z0-9]{20,}\b/g, '[TOKEN]');
    
    return str;
  }

  /**
   * Send critical errors to monitoring service in production
   */
  private static sendToMonitoring(level: string, message: string, data: any, context?: LogContext): void {
    try {
      // Store in localStorage for now - replace with actual monitoring service
      const errorLog = {
        level,
        message,
        data,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      const existingLogs = JSON.parse(localStorage.getItem('hr_production_errors') || '[]');
      existingLogs.push(errorLog);
      
      // Keep only last 20 error logs
      if (existingLogs.length > 20) {
        existingLogs.shift();
      }
      
      localStorage.setItem('hr_production_errors', JSON.stringify(existingLogs));
    } catch (err) {
      // Fail silently - don't break app if monitoring fails
    }
  }

  /**
   * Get production error logs for debugging
   */
  static getProductionLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem('hr_production_errors') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Clear production error logs
   */
  static clearProductionLogs(): void {
    localStorage.removeItem('hr_production_errors');
  }
}

// Export as default and named export for flexibility
export default Logger;
export { Logger };

// Convenience functions
export const log = {
  debug: Logger.debug.bind(Logger),
  info: Logger.info.bind(Logger),
  warn: Logger.warn.bind(Logger),
  error: Logger.error.bind(Logger),
  success: Logger.success.bind(Logger),
  perf: Logger.perf.bind(Logger)
};