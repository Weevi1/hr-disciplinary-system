// frontend/src/services/WarningService.ts
//
// Public WarningService facade. Phase 2 Tier 3A split the file into:
//   - `services/warning/types.ts`         — type definitions
//   - `services/warning/EscalationEngine` — progressive-discipline analysis
//   - `services/warning/ReviewTracker`    — review-status CRUD
//
// This file keeps the core CRUD + cache + I/O methods that don't belong in
// either of the specialised classes:
//   - clearActiveWarningsCache / clearAllActiveWarningsCache
//   - getActiveWarnings  (fraud-proof server-time lookup with caching)
//   - saveWarning / getWarningById
//   - normalizeWarningLevel  (small utility)
//
// It also re-exports types and proxies the escalation + review methods so the
// 60+ external importers that historically did `import { ... } from
// '@/services/WarningService'` keep working without churn.

import Logger from '../utils/logger';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { TimeService } from './TimeService';
import { EscalationEngine } from './warning/EscalationEngine';
import { ReviewTracker } from './warning/ReviewTracker';

// ============================================
// PUBLIC TYPE RE-EXPORTS (back-compat for external importers)
// ============================================

export type {
  WarningLevel,
  UniversalCategory,
  DeliveryMethod,
  Warning,
  AudioRecordingData,
  WarningCategory,
  EmployeeWithContext,
  EnhancedWarningFormData,
  SimplifiedWarningSummary,
  EscalationRecommendation,
} from './warning/types';

// Local imports of types for use within this file
import type { Warning, WarningLevel, EscalationRecommendation } from './warning/types';

// ============================================
// 💰 COST OPTIMIZATION: Active Warnings Cache
// ============================================
// Caches server-side active warnings queries to reduce Cloud Function invocations.
// Cache is per-employee, with 5-minute TTL. Security is maintained because:
// 1. Initial fetch still uses server-side time validation (fraud-proof)
// 2. Cache only affects repeated lookups within same wizard session
// 3. Final warning submission uses fresh server-side validation
// 4. Managers can always override recommendations anyway

interface ActiveWarningsCache {
  data: Warning[];
  timestamp: number;
  serverTime: string;
}

const activeWarningsCache = new Map<string, ActiveWarningsCache>();
const CACHE_TTL_MS = 300000; // 5 minutes

export class WarningService {

  // ============================================
  // CACHE MANAGEMENT
  // ============================================

  /**
   * Clear cache for a specific employee (call after creating/updating warnings).
   */
  static clearActiveWarningsCache(employeeId: string, organizationId: string): void {
    const cacheKey = `${employeeId}-${organizationId}`;
    if (activeWarningsCache.has(cacheKey)) {
      activeWarningsCache.delete(cacheKey);
      Logger.debug(`🗑️ [CACHE] Cleared active warnings cache for ${cacheKey}`);
    }
  }

  /**
   * Clear all cached active warnings (call on logout or major state changes).
   */
  static clearAllActiveWarningsCache(): void {
    const size = activeWarningsCache.size;
    activeWarningsCache.clear();
    Logger.debug(`🗑️ [CACHE] Cleared all active warnings cache (${size} entries)`);
  }

  // ============================================
  // ESCALATION (proxied to EscalationEngine)
  // ============================================

  /**
   * Generate escalation recommendation. Thin proxy to EscalationEngine — kept
   * here so existing call sites (`WarningService.getEscalationRecommendation`)
   * continue to work without code churn.
   */
  static async getEscalationRecommendation(
    employeeId: string,
    categoryId: string,
    organizationId?: string,
    providedCategory?: any,
    preloadedWarnings?: any[]
  ): Promise<EscalationRecommendation> {
    return EscalationEngine.getEscalationRecommendation(
      employeeId,
      categoryId,
      organizationId,
      providedCategory,
      preloadedWarnings
    );
  }

  // ============================================
  // ACTIVE WARNINGS RETRIEVAL
  // ============================================

  /**
   * Get active warnings for employee using SERVER-SIDE time validation.
   * 🔒 FRAUD-PROOF: Uses server time to prevent device clock manipulation
   * 💰 COST-OPTIMIZED: Caches results for 5 minutes to reduce Cloud Function calls
   */
  static async getActiveWarnings(employeeId: string, organizationId: string): Promise<Warning[]> {
    try {
      Logger.debug('📋 [WARNINGS] Getting active warnings for employee:', employeeId);

      // 💰 CHECK CACHE FIRST - reduces Cloud Function invocations by ~70% during wizard flows
      const cacheKey = `${employeeId}-${organizationId}`;
      const cached = activeWarningsCache.get(cacheKey);

      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
        const ageSeconds = Math.round((Date.now() - cached.timestamp) / 1000);
        Logger.debug(`💰 [CACHE HIT] Using cached active warnings (${cached.data.length} warnings, ${ageSeconds}s old, server time: ${cached.serverTime})`);
        return cached.data;
      }

      // 🔒 USE SERVER-SIDE FUNCTION for fraud-proof validation
      const functions = await import('firebase/functions');
      const { getFunctions, httpsCallable } = functions;
      const functionsInstance = getFunctions();
      const getActiveWarningsServerSide = httpsCallable(functionsInstance, 'getActiveWarningsServerSide');

      const result = await getActiveWarningsServerSide({
        employeeId,
        organizationId,
      });

      if (result.data && typeof result.data === 'object' && 'success' in result.data && result.data.success) {
        const data = result.data as { success: boolean; warnings: any[]; serverTime: string };
        const warnings = data.warnings.map(w => ({
          ...w,
          issueDate: new Date(w.issueDate),
          expiryDate: new Date(w.expiryDate),
          incidentDate: new Date(w.incidentDate),
          createdAt: new Date(w.createdAt),
          updatedAt: new Date(w.updatedAt),
          deliveryDate: w.deliveryDate ? new Date(w.deliveryDate) : undefined,
          signatureDate: w.signatureDate ? new Date(w.signatureDate) : undefined,
        })) as Warning[];

        // 💰 CACHE THE RESULT
        activeWarningsCache.set(cacheKey, {
          data: warnings,
          timestamp: Date.now(),
          serverTime: data.serverTime,
        });

        Logger.success(`📋 [WARNINGS] Retrieved ${warnings.length} active warnings using SERVER time (${data.serverTime}) - cached for 5 min`);
        return warnings;
      }

      Logger.warn('⚠️ [WARNINGS] Server function returned unexpected result, using fallback');
      return [];

    } catch (error) {
      Logger.error('❌ [WARNINGS] Error getting active warnings from server, using client fallback:', error);

      // Fallback to client-side query if server function fails
      try {
        const warningsRef = collection(db, 'organizations', organizationId!, 'warnings');
        const q = query(
          warningsRef,
          where('employeeId', '==', employeeId),
          where('isActive', '==', true),
          orderBy('issueDate', 'desc')
        );

        const snapshot = await getDocs(q);
        const warnings = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          issueDate: d.data().issueDate?.toDate() || new Date(),
          expiryDate: d.data().expiryDate?.toDate() || new Date(),
          incidentDate: d.data().incidentDate?.toDate() || new Date(),
          createdAt: d.data().createdAt?.toDate() || new Date(),
          updatedAt: d.data().updatedAt?.toDate() || new Date(),
        })) as Warning[];

        Logger.warn(`⚠️ [WARNINGS] Fallback succeeded with ${warnings.length} warnings (client time)`);
        return warnings;
      } catch (fallbackError) {
        Logger.error('❌ [WARNINGS] Fallback also failed:', fallbackError);
        return [];
      }
    }
  }

  // ============================================
  // HELPER UTILITIES
  // ============================================

  /**
   * Normalize warning level strings to standard format.
   */
  static normalizeWarningLevel(level: string): WarningLevel {
    const normalized = level.toLowerCase().replace(/\s+/g, '_');

    const mapping: Record<string, WarningLevel> = {
      'counselling': 'counselling',
      'counseling': 'counselling',
      'verbal': 'verbal',
      'verbal_warning': 'verbal',
      'first_written': 'first_written',
      'first_written_warning': 'first_written',
      'second_written': 'second_written',
      'second_written_warning': 'second_written',
      'final_written': 'final_written',
      'final_written_warning': 'final_written',
    };

    return mapping[normalized] || 'counselling';
  }

  // ============================================
  // WARNING CRUD OPERATIONS
  // ============================================

  /**
   * Save warning to database.
   * ✅ Handles all warning fields including new corrective counselling fields.
   */
  static async saveWarning(warningData: Partial<Warning>, organizationId: string): Promise<string> {
    try {
      Logger.debug('💾 [SAVE] Saving warning to database...');

      const warningRef = warningData.id
        ? doc(db, 'organizations', organizationId, 'warnings', warningData.id)
        : doc(collection(db, 'organizations', organizationId, 'warnings'));

      // Convert date strings to proper Timestamps
      const issueDate = warningData.issueDate
        ? (typeof warningData.issueDate === 'string' ? new Date(warningData.issueDate) : warningData.issueDate)
        : new Date();

      const incidentDate = warningData.incidentDate
        ? (typeof warningData.incidentDate === 'string' ? new Date(warningData.incidentDate) : warningData.incidentDate)
        : new Date();

      // Calculate expiry date based on validity period (default 6 months)
      const validityMonths = warningData.validityPeriod || 6;
      const expiryDate = new Date(issueDate);
      expiryDate.setMonth(expiryDate.getMonth() + validityMonths);

      // 🆕 Convert reviewDate to Firestore Timestamp if provided
      const reviewDate = warningData.reviewDate
        ? (warningData.reviewDate instanceof Date
            ? Timestamp.fromDate(warningData.reviewDate)
            : (typeof warningData.reviewDate === 'string'
                ? Timestamp.fromDate(new Date(warningData.reviewDate))
                : warningData.reviewDate))
        : undefined;

      // 🆕 Validate improvement commitments if provided
      const improvementCommitments = warningData.improvementCommitments
        ? warningData.improvementCommitments.map(commitment => ({
            commitment: commitment.commitment || '',
            timeline: commitment.timeline || '',
            completedDate: commitment.completedDate || null,
          }))
        : undefined;

      const dataToSave = {
        ...warningData,
        organizationId,
        issueDate: Timestamp.fromDate(issueDate),
        expiryDate: Timestamp.fromDate(expiryDate),
        incidentDate: Timestamp.fromDate(incidentDate),
        updatedAt: TimeService.getServerTimestamp(),
        ...(warningData.id ? {} : { createdAt: TimeService.getServerTimestamp() }),

        // 🆕 Corrective Counselling Fields (only include if provided)
        ...(warningData.employeeStatement && { employeeStatement: warningData.employeeStatement }),
        ...(warningData.expectedBehaviorStandards && { expectedBehaviorStandards: warningData.expectedBehaviorStandards }),
        ...(warningData.factsLeadingToDecision && { factsLeadingToDecision: warningData.factsLeadingToDecision }),
        ...(improvementCommitments && { improvementCommitments }),
        ...(reviewDate && { reviewDate }),
        ...(warningData.interventionDetails && { interventionDetails: warningData.interventionDetails }),
        ...(warningData.resourcesProvided && { resourcesProvided: warningData.resourcesProvided }),
        ...(warningData.trainingProvided && { trainingProvided: warningData.trainingProvided }),
      };

      if (warningData.id) {
        await updateDoc(warningRef, dataToSave as any);
      } else {
        await setDoc(warningRef, dataToSave as any);
      }

      // 💰 INVALIDATE CACHE after saving - ensures next fetch gets fresh data
      if (warningData.employeeId) {
        this.clearActiveWarningsCache(warningData.employeeId, organizationId);
      }

      Logger.success(`💾 [SAVE] Warning saved: ${warningRef.id}`);
      return warningRef.id;

    } catch (error) {
      Logger.error('❌ [SAVE] Error saving warning:', error);
      throw error;
    }
  }

  /**
   * Get warning by ID.
   * ✅ Properly converts all Firestore Timestamps including counselling fields.
   */
  static async getWarningById(warningId: string, organizationId: string): Promise<Warning | null> {
    try {
      const warningRef = doc(db, 'organizations', organizationId, 'warnings', warningId);
      const warningDoc = await getDoc(warningRef);

      if (!warningDoc.exists()) {
        return null;
      }

      const data = warningDoc.data();

      return {
        id: warningDoc.id,
        ...data,
        issueDate: data.issueDate?.toDate() || new Date(),
        expiryDate: data.expiryDate?.toDate() || new Date(),
        incidentDate: data.incidentDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        reviewDate: data.reviewDate?.toDate() || undefined,
        improvementCommitments: data.improvementCommitments
          ? data.improvementCommitments.map((c: any) => ({
              commitment: c.commitment || '',
              timeline: c.timeline || '',
              completedDate: c.completedDate?.toDate() || undefined,
            }))
          : undefined,
      } as Warning;

    } catch (error) {
      Logger.error('❌ [GET] Error getting warning by ID:', error);
      return null;
    }
  }

  // ============================================
  // 🔄 REVIEW TRACKING (proxied to ReviewTracker)
  // ============================================

  /**
   * Get warnings needing review. Thin proxy to ReviewTracker.
   */
  static async getWarningsNeedingReview(organizationId: string): Promise<Warning[]> {
    return ReviewTracker.getWarningsNeedingReview(organizationId);
  }

  /**
   * Update review status. Thin proxy to ReviewTracker.
   */
  static async updateReviewStatus(
    warningId: string,
    organizationId: string,
    statusData: Parameters<typeof ReviewTracker.updateReviewStatus>[2]
  ): Promise<void> {
    return ReviewTracker.updateReviewStatus(warningId, organizationId, statusData);
  }

  /**
   * Mark review satisfactory. Thin proxy to ReviewTracker.
   */
  static async markReviewSatisfactory(
    warningId: string,
    organizationId: string,
    hrUserId: string,
    hrUserName: string,
    hrNotes?: string
  ): Promise<void> {
    return ReviewTracker.markReviewSatisfactory(warningId, organizationId, hrUserId, hrUserName, hrNotes);
  }

  /**
   * Mark review unsatisfactory. Thin proxy to ReviewTracker.
   */
  static async markReviewUnsatisfactory(
    warningId: string,
    organizationId: string,
    hrUserId: string,
    hrUserName: string,
    feedback: string,
    nextSteps: string
  ): Promise<void> {
    return ReviewTracker.markReviewUnsatisfactory(warningId, organizationId, hrUserId, hrUserName, feedback, nextSteps);
  }

  /**
   * Get review statistics. Thin proxy to ReviewTracker.
   */
  static async getReviewStatistics(
    organizationId: string
  ): ReturnType<typeof ReviewTracker.getReviewStatistics> {
    return ReviewTracker.getReviewStatistics(organizationId);
  }
}
