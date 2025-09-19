import Logger from '../utils/logger';
// UPDATE FILE: frontend/src/services/AudioCleanupService.ts
// 🎯 SUPER USER ONLY AUDIO CLEANUP SERVICE
// ✅ Updated to use HTTPS endpoints with proper CORS

import { auth } from '../config/firebase';
import type { AudioCleanupAudit, AudioDeletionRequest } from '../types/warning';

// Firebase Cloud Functions base URL
const FUNCTIONS_BASE_URL = 'https://us-central1-hr-disciplinary-system.cloudfunctions.net';

export class AudioCleanupService {

  /**
   * Get authentication token for requests
   */
  private static async getAuthToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken(true);
  }

  /**
   * Make authenticated request to cloud function
   */
  private static async makeAuthenticatedRequest(
    endpoint: string, 
    data: any = {}
  ): Promise<any> {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${FUNCTIONS_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ data }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data; // Extract data from Firebase function response format
    } catch (error: any) {
      Logger.error(`❌ Request to ${endpoint} failed:`, error)
      throw error;
    }
  }

  /**
   * Trigger manual audio cleanup (super-user only)
   */
  static async triggerManualCleanup(): Promise<{
    success: boolean;
    result: any;
    triggeredBy: string;
    triggeredAt: string;
  }> {
    try {
      Logger.debug('🔧 Triggering manual global audio cleanup...')
      
      const result = await this.makeAuthenticatedRequest('manualAudioCleanup');
      
      Logger.success(2143)
      return result;
      
    } catch (error: any) {
      Logger.error('❌ Manual cleanup failed:', error)
      
      // Handle specific permission errors
      if (error.message.includes('Access denied') || error.message.includes('PERMISSION_DENIED')) {
        throw new Error('Access denied: Audio cleanup is restricted to super-users only');
      }
      
      throw new Error(`Manual cleanup failed: ${error.message}`);
    }
  }

  /**
   * Get cleanup statistics and recent audit logs (super-user only)
   */
  static async getCleanupStats(): Promise<{
    success: boolean;
    recentAudits: AudioCleanupAudit[];
    totalAudits: number;
    lastCleanup: Date | null;
  }> {
    try {
      Logger.debug(2927)
      
      const result = await this.makeAuthenticatedRequest('getCleanupStats');
      
      Logger.success(3047)
      return result;
      
    } catch (error: any) {
      Logger.error('❌ Failed to fetch cleanup stats:', error)
      
      if (error.message.includes('Access denied') || error.message.includes('PERMISSION_DENIED')) {
        throw new Error('Access denied: Cleanup statistics are restricted to super-users only');
      }
      
      throw new Error(`Failed to fetch stats: ${error.message}`);
    }
  }

  /**
   * 🎯 Get global audio storage statistics (super-user only)
   */
  static async getGlobalAudioStats(): Promise<{
    success: boolean;
    globalStats: {
      totalOrganizations: number;
      totalAudioRecordings: number;
      totalExpiredRecordings: number;
      totalStorageUsed: number;
      totalStorageUsedFormatted: string;
      needsCleanup: boolean;
    };
    organizationBreakdown: any[];
    generatedAt: string;
  }> {
    try {
      Logger.debug(4037)
      
      const result = await this.makeAuthenticatedRequest('getGlobalAudioStats');
      
      Logger.success(4130)
      return result;
      
    } catch (error: any) {
      Logger.error('❌ Failed to fetch global audio stats:', error)
      
      if (error.message.includes('Access denied') || error.message.includes('PERMISSION_DENIED')) {
        throw new Error('Access denied: Global audio statistics are restricted to super-users only');
      }
      
      throw new Error(`Failed to fetch global stats: ${error.message}`);
    }
  }

  /**
   * 🎯 Preview what would be deleted without actually deleting (super-user only)
   */
  static async previewCleanup(): Promise<{
    success: boolean;
    preview: {
      totalScanned: number;
      totalExpired: number;
      organizationsAffected: any[];
      estimatedSpaceFreed: number;
      estimatedSpaceFreedFormatted: string;
      oldestExpiredDate: string | null;
      newestExpiredDate: string | null;
    };
    generatedAt: string;
    note: string;
  }> {
    try {
      Logger.debug('👁️ Previewing cleanup without deletion...')
      
      const result = await this.makeAuthenticatedRequest('previewAudioCleanup');
      
      Logger.success(5312)
      return result;
      
    } catch (error: any) {
      Logger.error('❌ Failed to preview cleanup:', error)
      
      if (error.message.includes('Access denied') || error.message.includes('PERMISSION_DENIED')) {
        throw new Error('Access denied: Cleanup preview is restricted to super-users only');
      }
      
      throw new Error(`Failed to preview cleanup: ${error.message}`);
    }
  }

  /**
   * Request manual deletion of specific audio recording (super-user only)
   * Note: This creates a deletion request rather than immediate deletion
   */
  static async requestAudioDeletion(request: AudioDeletionRequest): Promise<boolean> {
    try {
      console.log('🗑️ Requesting manual audio deletion:', {
        warningId: request.warningId,
        reason: request.reason
      });

      // For now, this could be implemented as a Firestore document
      // that the cleanup function processes, or as a direct Cloud Function call
      
      // TODO: Implement based on your admin workflow requirements
      // This could create a deletion request document that gets processed
      
      Logger.success(6517)
      return true;
      
    } catch (error: any) {
      Logger.error('❌ Audio deletion request failed:', error)
      throw new Error(`Deletion request failed: ${error.message}`);
    }
  }

  /**
   * Format cleanup audit data for display
   */
  static formatCleanupSummary(audits: AudioCleanupAudit[]): {
    totalDeletions: number;
    averageProcessingTime: number;
    successRate: number;
    lastCleanupDate: string | null;
    recentErrors: string[];
    totalOrganizationsProcessed: number;
    scheduledRuns: number;
    manualRuns: number;
  } {
    if (!audits.length) {
      return {
        totalDeletions: 0,
        averageProcessingTime: 0,
        successRate: 0,
        lastCleanupDate: null,
        recentErrors: [],
        totalOrganizationsProcessed: 0,
        scheduledRuns: 0,
        manualRuns: 0
      };
    }

    const totalDeletions = audits.reduce((sum, audit) => 
      sum + audit.result.successfulDeletions, 0
    );

    const averageProcessingTime = audits.reduce((sum, audit) => 
      sum + audit.result.processingTime, 0
    ) / audits.length;

    const totalAttempts = audits.reduce((sum, audit) => 
      sum + audit.result.successfulDeletions + audit.result.failedDeletions, 0
    );

    const successRate = totalAttempts > 0 ? 
      (totalDeletions / totalAttempts) * 100 : 100;

    const lastCleanupDate = audits[0]?.timestamp ? 
      new Date(audits[0].timestamp).toLocaleDateString() : null;

    const recentErrors = audits
      .flatMap(audit => audit.result.errors)
      .slice(0, 5); // Last 5 errors

    const totalOrganizationsProcessed = audits.reduce((sum, audit) => 
      sum + audit.result.organizationsProcessed.length, 0
    );

    const scheduledRuns = audits.filter(audit => 
      audit.result.triggerMethod === 'scheduled'
    ).length;

    const manualRuns = audits.filter(audit => 
      audit.result.triggerMethod === 'manual'
    ).length;

    return {
      totalDeletions,
      averageProcessingTime: Math.round(averageProcessingTime),
      successRate: Math.round(successRate * 100) / 100,
      lastCleanupDate,
      recentErrors,
      totalOrganizationsProcessed,
      scheduledRuns,
      manualRuns
    };
  }

  /**
   * Check if audio cleanup is healthy (for system monitoring)
   */
  static async isCleanupHealthy(): Promise<{
    healthy: boolean;
    issues: string[];
    lastCleanup: Date | null;
    daysSinceLastCleanup: number;
    requiresAttention: boolean;
  }> {
    try {
      const stats = await this.getCleanupStats();
      const issues: string[] = [];
      
      const lastCleanup = stats.lastCleanup ? new Date(stats.lastCleanup) : null;
      const daysSinceLastCleanup = lastCleanup ? 
        Math.floor((Date.now() - lastCleanup.getTime()) / (1000 * 60 * 60 * 24)) : 999;

      // Check if cleanup has run recently (should run daily)
      if (daysSinceLastCleanup > 2) {
        issues.push(`Cleanup hasn't run for ${daysSinceLastCleanup} days`);
      }

      // Check recent error rate
      if (stats.recentAudits.length > 0) {
        const recentAudit = stats.recentAudits[0];
        const errorRate = recentAudit.result.failedDeletions / 
          (recentAudit.result.successfulDeletions + recentAudit.result.failedDeletions);
        
        if (errorRate > 0.1) { // More than 10% failure rate
          issues.push(`High error rate: ${Math.round(errorRate * 100)}% failures`);
        }
      }

      // Check if there are expired files waiting for cleanup
      try {
        const preview = await this.previewCleanup();
        if (preview.preview.totalExpired > 50) {
          issues.push(`${preview.preview.totalExpired} expired audio files awaiting cleanup`);
        }
      } catch (error) {
        // Don't fail health check if preview fails
        Logger.warn('Could not check for expired files:', error)
      }

      return {
        healthy: issues.length === 0,
        issues,
        lastCleanup,
        daysSinceLastCleanup,
        requiresAttention: issues.length > 0
      };

    } catch (error: any) {
      // If we can't access cleanup functions, assume permission issue
      if (error.message.includes('Access denied')) {
        return {
          healthy: false,
          issues: ['Access denied: Super-user privileges required'],
          lastCleanup: null,
          daysSinceLastCleanup: 999,
          requiresAttention: true
        };
      }

      return {
        healthy: false,
        issues: [`Failed to check cleanup health: ${error.message}`],
        lastCleanup: null,
        daysSinceLastCleanup: 999,
        requiresAttention: true
      };
    }
  }

  /**
   * Get cleanup schedule info for display
   */
  static getCleanupScheduleInfo(): {
    frequency: string;
    nextRun: string;
    timezone: string;
    description: string;
    scope: string;
  } {
    // Calculate next 2 AM UTC
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setUTCHours(2, 0, 0, 0); // 2 AM UTC
    
    // If it's already past 2 AM today, schedule for tomorrow
    if (now.getUTCHours() >= 2) {
      nextRun.setUTCDate(nextRun.getUTCDate() + 1);
    }

    return {
      frequency: 'Daily',
      nextRun: nextRun.toLocaleString(),
      timezone: 'UTC',
      description: 'Automatically deletes expired audio recordings across all organizations',
      scope: 'Global (All Organizations)' // 🎯 Indicates global scope
    };
  }

  /**
   * 🎯 Verify user has super-user access (client-side check)
   */
  static async verifySuperUserAccess(): Promise<boolean> {
    try {
      // Try to fetch cleanup stats as a permission test
      await this.getCleanupStats();
      return true;
    } catch (error: any) {
      if (error.message.includes('Access denied')) {
        return false;
      }
      // If it's a different error, assume we have access but there's a technical issue
      return true;
    }
  }

  /**
   * 🎯 Enhanced error handling and retry logic
   */
  static async withRetry<T>(
    operation: () => Promise<T>, 
    retries: number = 2,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i <= retries; i++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on authentication/permission errors
        if (error.message.includes('Access denied') || 
            error.message.includes('UNAUTHENTICATED') ||
            error.message.includes('PERMISSION_DENIED')) {
          throw error;
        }
        
        // Don't retry on the last attempt
        if (i === retries) {
          break;
        }
        
        Logger.debug(`🔄 Retry attempt ${i + 1}/${retries} after ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Exponential backoff
      }
    }
    
    throw lastError!;
  }

  /**
   * 🎯 Batch operations for better performance
   */
  static async getFullDashboardData(): Promise<{
    stats: any;
    globalStats: any;
    preview: any;
    health: any;
    schedule: any;
  }> {
    try {
      const [stats, globalStats, preview, health] = await Promise.allSettled([
        this.withRetry(() => this.getCleanupStats()),
        this.withRetry(() => this.getGlobalAudioStats()),
        this.withRetry(() => this.previewCleanup()),
        this.withRetry(() => this.isCleanupHealthy())
      ]);

      const schedule = this.getCleanupScheduleInfo();

      return {
        stats: stats.status === 'fulfilled' ? stats.value : { error: stats.reason?.message },
        globalStats: globalStats.status === 'fulfilled' ? globalStats.value : { error: globalStats.reason?.message },
        preview: preview.status === 'fulfilled' ? preview.value : { error: preview.reason?.message },
        health: health.status === 'fulfilled' ? health.value : { error: health.reason?.message },
        schedule
      };
    } catch (error: any) {
      Logger.error('❌ Failed to load dashboard data:', error)
      throw error;
    }
  }
}