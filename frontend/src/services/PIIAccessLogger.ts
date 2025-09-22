/**
 * PII Access Logger Service
 * Logs all access to personally identifiable information for compliance
 */

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import Logger from '../utils/logger';

export interface PIIAccessEvent {
  id: string;
  userId: string;
  userEmail: string;
  action: 'view' | 'edit' | 'export' | 'delete';
  dataType: 'banking' | 'personal' | 'contact' | 'session';
  targetUserId?: string; // User whose data was accessed
  resellerId?: string;   // If accessing reseller data
  fieldAccessed?: string; // Specific field accessed
  ipAddress?: string;
  userAgent: string;
  timestamp: any; // Firebase serverTimestamp
  reason?: string; // Why the data was accessed
}

export class PIIAccessLogger {
  /**
   * Log access to sensitive PII data
   */
  static async logAccess(event: Omit<PIIAccessEvent, 'id' | 'userId' | 'userEmail' | 'timestamp' | 'userAgent'>): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
      Logger.warn('Attempted to log PII access without authenticated user');
      return;
    }

    try {
      const eventId = `${event.action}_${event.dataType}_${Date.now()}`;

      const accessEvent: PIIAccessEvent = {
        id: eventId,
        userId: user.uid,
        userEmail: user.email || 'unknown',
        userAgent: navigator.userAgent,
        timestamp: serverTimestamp(),
        ...event
      };

      // Get IP address if possible
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        accessEvent.ipAddress = ipData.ip;
      } catch {
        accessEvent.ipAddress = 'unknown';
      }

      // Store in security audit collection
      await setDoc(doc(db, 'piiAccessLogs', eventId), accessEvent);

      Logger.info('PII access logged', {
        action: event.action,
        dataType: event.dataType,
        user: user.email
      });
    } catch (error) {
      Logger.error('Failed to log PII access:', error);
    }
  }

  /**
   * Log banking details access
   */
  static async logBankingAccess(
    resellerId: string,
    action: 'view' | 'edit',
    reason?: string
  ): Promise<void> {
    await this.logAccess({
      action,
      dataType: 'banking',
      resellerId,
      fieldAccessed: 'bankDetails',
      reason: reason || 'Business operations'
    });
  }

  /**
   * Log personal information access
   */
  static async logPersonalInfoAccess(
    targetUserId: string,
    action: 'view' | 'edit' | 'export',
    fieldAccessed?: string,
    reason?: string
  ): Promise<void> {
    await this.logAccess({
      action,
      dataType: 'personal',
      targetUserId,
      fieldAccessed,
      reason: reason || 'User management'
    });
  }

  /**
   * Log session data access
   */
  static async logSessionAccess(
    targetUserId: string,
    action: 'view' | 'edit' | 'delete',
    reason?: string
  ): Promise<void> {
    await this.logAccess({
      action,
      dataType: 'session',
      targetUserId,
      fieldAccessed: 'sessionData',
      reason: reason || 'Session management'
    });
  }

  /**
   * Log bulk data export
   */
  static async logDataExport(
    dataType: 'banking' | 'personal' | 'contact',
    reason: string = 'Data export requested'
  ): Promise<void> {
    await this.logAccess({
      action: 'export',
      dataType,
      reason
    });
  }
}

// Convenience exports
export const logBankingAccess = PIIAccessLogger.logBankingAccess;
export const logPersonalInfoAccess = PIIAccessLogger.logPersonalInfoAccess;
export const logSessionAccess = PIIAccessLogger.logSessionAccess;
export const logDataExport = PIIAccessLogger.logDataExport;