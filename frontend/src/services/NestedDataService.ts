// src/services/NestedDataService.ts
// Nested Data Service for Employee-Centric Data Architecture
// Replaces flat collections with employee-nested subcollections for scalability

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  serverTimestamp,
  collectionGroup,
  DocumentSnapshot,
  Query
} from 'firebase/firestore';
import { db } from '../config/firebase';
import Logger from '../utils/logger';
import type { Warning, Employee } from '../types';

export interface EmployeeSummary {
  employeeId: string;
  warningStats: {
    total: number;
    active: number;
    lastIssued?: Date;
    byLevel: Record<string, number>;
    finalWarnings: number;
  };
  meetingStats: {
    total: number;
    upcoming: number;
    lastMeeting?: Date;
    pendingRequests: number;
  };
  absenceStats: {
    totalDays: number;
    lastAbsence?: Date;
    thisMonth: number;
    unpaidDays: number;
  };
  lastUpdated: Date;
}

export interface IndexEntry {
  id: string;
  employeeId: string;
  organizationId: string;
  type: 'warning' | 'meeting' | 'absence';
  title: string;
  date: Date;
  status: string;
  priority: 'high' | 'medium' | 'low';
  metadata: Record<string, any>;
}

export interface PaginationConfig {
  pageSize: number;
  lastDoc?: DocumentSnapshot;
  orderField: string;
  orderDirection: 'asc' | 'desc';
}

/**
 * Nested Data Service for Employee-Centric Architecture
 *
 * Data Structure:
 * organizations/{orgId}/employees/{employeeId}/
 *   ├── profile (document) - employee data + summary stats
 *   ├── warnings/ (subcollection)
 *   ├── meetings/ (subcollection)
 *   └── absences/ (subcollection)
 *
 * organizations/{orgId}/indexes/
 *   ├── activeWarnings/ - recent/active warnings across org
 *   ├── upcomingMeetings/ - scheduled meetings
 *   └── recentAbsences/ - recent absences
 */
export class NestedDataService {
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static cache = new Map<string, { data: any; timestamp: number }>();

  // ============================================
  // CACHE MANAGEMENT
  // ============================================

  private static getCacheKey(operation: string, orgId: string, params?: any): string {
    return `${operation}:${orgId}:${JSON.stringify(params || {})}`;
  }

  private static isValidCache(key: string): boolean {
    const cached = this.cache.get(key);
    return cached ? (Date.now() - cached.timestamp) < this.CACHE_DURATION : false;
  }

  private static invalidateCache(pattern: string): void {
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // ============================================
  // EMPLOYEE MANAGEMENT
  // ============================================

  /**
   * Get employee profile with summary stats
   */
  static async getEmployeeProfile(
    organizationId: string,
    employeeId: string
  ): Promise<Employee & { summary?: EmployeeSummary }> {
    try {
      const employeeRef = doc(db, `organizations/${organizationId}/employees`, employeeId);
      const employeeSnap = await getDoc(employeeRef);

      if (!employeeSnap.exists()) {
        throw new Error(`Employee ${employeeId} not found`);
      }

      const employeeData = employeeSnap.data() as Employee;

      // Get summary stats if they exist
      const summaryRef = doc(employeeRef, 'summary', 'stats');
      const summarySnap = await getDoc(summaryRef);

      const result = {
        ...employeeData,
        id: employeeSnap.id,
        summary: summarySnap.exists() ? summarySnap.data() as EmployeeSummary : undefined
      };

      Logger.debug(`📋 [NESTED] Loaded employee profile: ${employeeId}`);
      return result;
    } catch (error) {
      Logger.error(`❌ [NESTED] Failed to get employee profile:`, error);
      throw error;
    }
  }

  // ============================================
  // WARNING OPERATIONS
  // ============================================

  /**
   * Create warning in nested structure
   */
  static async createWarning(
    organizationId: string,
    employeeId: string,
    warningData: Omit<Warning, 'id' | 'organizationId' | 'employeeId'>
  ): Promise<string> {
    try {
      const batch = writeBatch(db);

      // 1. Add warning to employee's subcollection
      const warningsRef = collection(db, `organizations/${organizationId}/employees/${employeeId}/warnings`);
      const warningRef = doc(warningsRef);

      const warning: Warning = {
        ...warningData,
        id: warningRef.id,
        organizationId,
        employeeId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      batch.set(warningRef, warning);

      // 2. Add to activeWarnings index if warning is active
      if (warning.isActive !== false) {
        const indexRef = doc(db, `organizations/${organizationId}/indexes/activeWarnings`, warningRef.id);
        const indexEntry: IndexEntry = {
          id: warningRef.id,
          employeeId,
          organizationId,
          type: 'warning',
          title: `${warning.level} - ${warning.category}`,
          date: warning.issueDate || new Date(),
          status: warning.status || 'issued',
          priority: warning.level === 'final_written' ? 'high' :
                   warning.level === 'written' ? 'medium' : 'low',
          metadata: {
            level: warning.level,
            category: warning.category,
            employeeName: warning.employeeName
          }
        };
        batch.set(indexRef, indexEntry);
      }

      // 3. Update employee summary stats
      await this.updateEmployeeSummaryStats(batch, organizationId, employeeId, 'warning');

      await batch.commit();

      // Invalidate caches
      this.invalidateCache(`warnings:${organizationId}`);
      this.invalidateCache(`employee:${organizationId}:${employeeId}`);

      Logger.success(`✅ [NESTED] Created warning ${warningRef.id} for employee ${employeeId}`);
      return warningRef.id;
    } catch (error) {
      Logger.error(`❌ [NESTED] Failed to create warning:`, error);
      throw error;
    }
  }

  /**
   * Get warnings for specific employee
   */
  static async getEmployeeWarnings(
    organizationId: string,
    employeeId: string,
    filters?: { status?: string; level?: string; isActive?: boolean },
    pagination?: PaginationConfig
  ): Promise<{ warnings: Warning[]; hasMore: boolean; lastDoc?: DocumentSnapshot }> {
    try {
      let warningsQuery: Query = collection(db, `organizations/${organizationId}/employees/${employeeId}/warnings`);

      // Add filters
      if (filters?.status) {
        warningsQuery = query(warningsQuery, where('status', '==', filters.status));
      }
      if (filters?.level) {
        warningsQuery = query(warningsQuery, where('level', '==', filters.level));
      }
      if (filters?.isActive !== undefined) {
        warningsQuery = query(warningsQuery, where('isActive', '==', filters.isActive));
      }

      // Add ordering and pagination
      const orderField = pagination?.orderField || 'issueDate';
      const orderDirection = pagination?.orderDirection || 'desc';
      warningsQuery = query(warningsQuery, orderBy(orderField, orderDirection));

      if (pagination?.pageSize) {
        warningsQuery = query(warningsQuery, limit(pagination.pageSize));
      }

      if (pagination?.lastDoc) {
        warningsQuery = query(warningsQuery, startAfter(pagination.lastDoc));
      }

      const snapshot = await getDocs(warningsQuery);
      const warnings = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Warning));

      const hasMore = pagination?.pageSize ? snapshot.docs.length === pagination.pageSize : false;
      const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;

      Logger.debug(`📋 [NESTED] Loaded ${warnings.length} warnings for employee ${employeeId}`);
      return { warnings, hasMore, lastDoc };
    } catch (error) {
      Logger.error(`❌ [NESTED] Failed to get employee warnings:`, error);
      throw error;
    }
  }

  /**
   * Get organization-wide warnings using collection group query
   */
  static async getOrganizationWarnings(
    organizationId: string,
    filters?: { status?: string; level?: string; employeeId?: string },
    pagination?: PaginationConfig
  ): Promise<{ warnings: Warning[]; hasMore: boolean; lastDoc?: DocumentSnapshot }> {
    try {
      // Use collection group query to get warnings across all employees
      let warningsQuery: Query = collectionGroup(db, 'warnings');

      // Filter by organization
      warningsQuery = query(warningsQuery, where('organizationId', '==', organizationId));

      // Add additional filters
      if (filters?.status) {
        warningsQuery = query(warningsQuery, where('status', '==', filters.status));
      }
      if (filters?.level) {
        warningsQuery = query(warningsQuery, where('level', '==', filters.level));
      }
      if (filters?.employeeId) {
        warningsQuery = query(warningsQuery, where('employeeId', '==', filters.employeeId));
      }

      // Add ordering and pagination
      const orderField = pagination?.orderField || 'issueDate';
      const orderDirection = pagination?.orderDirection || 'desc';
      warningsQuery = query(warningsQuery, orderBy(orderField, orderDirection));

      if (pagination?.pageSize) {
        warningsQuery = query(warningsQuery, limit(pagination.pageSize));
      }

      if (pagination?.lastDoc) {
        warningsQuery = query(warningsQuery, startAfter(pagination.lastDoc));
      }

      const snapshot = await getDocs(warningsQuery);
      const warnings = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Warning));

      const hasMore = pagination?.pageSize ? snapshot.docs.length === pagination.pageSize : false;
      const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;

      Logger.debug(`📋 [NESTED] Loaded ${warnings.length} organization warnings via collection group`);
      return { warnings, hasMore, lastDoc };
    } catch (error) {
      Logger.error(`❌ [NESTED] Failed to get organization warnings:`, error);
      throw error;
    }
  }

  /**
   * Update warning in nested structure
   */
  static async updateWarning(
    organizationId: string,
    employeeId: string,
    warningId: string,
    updates: Partial<Warning>
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      // 1. Update warning in employee's subcollection
      const warningRef = doc(db, `organizations/${organizationId}/employees/${employeeId}/warnings`, warningId);
      batch.update(warningRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // 2. Update activeWarnings index if needed
      const indexRef = doc(db, `organizations/${organizationId}/indexes/activeWarnings`, warningId);
      if (updates.status === 'archived' || updates.isActive === false) {
        // Remove from active index
        batch.delete(indexRef);
      } else if (updates.status || updates.level) {
        // Update index entry
        const indexUpdates: Partial<IndexEntry> = {};
        if (updates.status) indexUpdates.status = updates.status;
        if (updates.level) {
          indexUpdates.priority = updates.level === 'final_written' ? 'high' :
                                  updates.level === 'written' ? 'medium' : 'low';
          indexUpdates.metadata = { ...indexUpdates.metadata, level: updates.level };
        }
        batch.update(indexRef, indexUpdates);
      }

      // 3. Update employee summary if warning status changed
      if (updates.status || updates.isActive !== undefined) {
        await this.updateEmployeeSummaryStats(batch, organizationId, employeeId, 'warning');
      }

      await batch.commit();

      // Invalidate caches
      this.invalidateCache(`warnings:${organizationId}`);
      this.invalidateCache(`employee:${organizationId}:${employeeId}`);

      Logger.success(`✅ [NESTED] Updated warning ${warningId}`);
    } catch (error) {
      Logger.error(`❌ [NESTED] Failed to update warning:`, error);
      throw error;
    }
  }

  // ============================================
  // INDEX OPERATIONS
  // ============================================

  /**
   * Get active warnings from index (for dashboards)
   */
  static async getActiveWarningsIndex(
    organizationId: string,
    limit?: number
  ): Promise<IndexEntry[]> {
    try {
      const cacheKey = this.getCacheKey('activeWarnings', organizationId, { limit });

      if (this.isValidCache(cacheKey)) {
        return this.cache.get(cacheKey)!.data;
      }

      let indexQuery: Query = collection(db, `organizations/${organizationId}/indexes/activeWarnings`);
      indexQuery = query(indexQuery, orderBy('date', 'desc'));

      if (limit) {
        indexQuery = query(indexQuery, limit(limit));
      }

      const snapshot = await getDocs(indexQuery);
      const entries = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as IndexEntry));

      // Cache the results
      this.cache.set(cacheKey, { data: entries, timestamp: Date.now() });

      Logger.debug(`📊 [NESTED] Loaded ${entries.length} active warnings from index`);
      return entries;
    } catch (error) {
      Logger.error(`❌ [NESTED] Failed to get active warnings index:`, error);
      throw error;
    }
  }

  // ============================================
  // SUMMARY STATS MANAGEMENT
  // ============================================

  /**
   * Update employee summary statistics
   */
  private static async updateEmployeeSummaryStats(
    batch: any,
    organizationId: string,
    employeeId: string,
    type: 'warning' | 'meeting' | 'absence'
  ): Promise<void> {
    try {
      // This would typically be done in a Cloud Function for better performance
      // For now, we'll update the summary document directly

      const summaryRef = doc(db, `organizations/${organizationId}/employees/${employeeId}/summary`, 'stats');

      // In a real implementation, this would calculate stats from subcollections
      // For now, just update the timestamp
      batch.set(summaryRef, {
        lastUpdated: serverTimestamp(),
        [`${type}LastActivity`]: serverTimestamp()
      }, { merge: true });

      Logger.debug(`📊 [NESTED] Scheduled summary update for employee ${employeeId} (${type})`);
    } catch (error) {
      Logger.error(`❌ [NESTED] Failed to update employee summary:`, error);
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Clear all caches (for testing/debugging)
   */
  static clearCache(): void {
    this.cache.clear();
    Logger.debug('🗑️ [NESTED] Cache cleared');
  }
}