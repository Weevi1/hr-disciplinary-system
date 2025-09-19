// frontend/src/services/TimeService.ts
// 🕐 SECURE TIME SERVICE - Prevents client-side timestamp fraud
// Uses Firebase serverTimestamp for all critical operations

import { serverTimestamp, FieldValue } from 'firebase/firestore';
import Logger from '../utils/logger';

/**
 * Secure Time Service
 * Ensures all timestamps come from server to prevent fraud
 * Critical for HR system audit trails and legal compliance
 */
export class TimeService {
  
  /**
   * Get Firebase server timestamp - USE FOR ALL DATABASE OPERATIONS
   * This is tamper-proof and synchronized with Firebase servers
   */
  static getServerTimestamp(): FieldValue {
    return serverTimestamp();
  }
  
  /**
   * Get current client time for UI display only (NOT for database storage)
   * Should only be used for non-critical UI elements
   */
  static getClientTimeForDisplay(): Date {
    Logger.debug('⚠️ Using client time for display only - NOT stored in database');
    return new Date();
  }
  
  /**
   * Format timestamp for South African locale (display purposes)
   */
  static formatSADateTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('en-ZA', {
      timeZone: 'Africa/Johannesburg',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }
  
  /**
   * Format date for South African locale (display purposes)
   */
  static formatSADate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-ZA', {
      timeZone: 'Africa/Johannesburg',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
  
  /**
   * Get ISO string for client-side calculations (display only)
   * WARNING: Never store this in database - use getServerTimestamp() instead
   */
  static getClientISOString(): string {
    Logger.warn('⚠️ CLIENT ISO STRING - For display/calculation only, NOT for database storage');
    return new Date().toISOString();
  }
  
  /**
   * Calculate days between dates (for UI calculations)
   */
  static daysBetween(startDate: Date | string, endDate: Date | string): number {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Check if a timestamp is from server (for validation)
   */
  static isServerTimestamp(value: any): value is FieldValue {
    return value && typeof value === 'object' && '_methodName' in value;
  }
  
  /**
   * Get warning expiry date (90 days from issue date)
   * Returns server timestamp for database storage
   */
  static getWarningExpiryTimestamp(): FieldValue {
    // Cannot calculate exact future server timestamp
    // This will be handled by Cloud Functions on server side
    return serverTimestamp();
  }
  
  /**
   * Security audit log entry with server timestamp
   */
  static createAuditTimestamp(action: string, userId: string): {
    action: string;
    userId: string;
    timestamp: FieldValue;
    source: string;
  } {
    return {
      action,
      userId,
      timestamp: serverTimestamp(), // Server-side timestamp for security
      source: 'web-client'
    };
  }
}

/**
 * IMPORTANT SECURITY NOTES:
 * 
 * 1. ALWAYS use TimeService.getServerTimestamp() for database operations
 * 2. NEVER store client-side dates in critical documents (warnings, employees, audit logs)
 * 3. Client time is only for UI display and non-critical calculations
 * 4. All audit trails must use server timestamps for legal compliance
 * 5. Warning issue dates, expiry dates, and delivery confirmations must be server-side
 */