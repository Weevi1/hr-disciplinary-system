// UserOrgIndexService.ts - Production-level scalable user-organization mapping
import Logger from '../utils/logger';
import { FirebaseService } from './FirebaseService';
import { DatabaseShardingService } from './DatabaseShardingService';
import type { User } from '../types';

/**
 * UserOrgIndex document structure for instant user lookup
 */
export interface UserOrgIndexEntry {
  userId: string;
  organizationId: string;
  role: string;
  email: string;
  isActive: boolean;
  lastUpdated: Date;
  userType: 'flat' | 'sharded'; // flat = super-user/reseller, sharded = org user
}

/**
 * Production-level service for managing user-organization mappings
 * Eliminates O(n) organization searches by providing O(1) lookups
 */
export class UserOrgIndexService {
  private static readonly COLLECTION = 'userOrgIndex';
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static cache = new Map<string, { entry: UserOrgIndexEntry, timestamp: number }>();

  /**
   * Get user's organization mapping with caching
   * O(1) complexity instead of O(n) organization search
   */
  static async getUserOrganization(userId: string): Promise<UserOrgIndexEntry | null> {
    try {
      // Check cache first
      const cached = this.cache.get(userId);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
        Logger.debug(`📋 Cache hit for user ${userId}`);
        return cached.entry;
      }

      // Fetch from Firestore
      const indexEntry = await FirebaseService.getDocument<UserOrgIndexEntry>(
        this.COLLECTION,
        userId
      );

      if (indexEntry) {
        // Cache the result
        this.cache.set(userId, {
          entry: indexEntry,
          timestamp: Date.now()
        });

        Logger.success(`✅ Found user organization mapping: ${userId} → ${indexEntry.organizationId}`);
        return indexEntry;
      }

      Logger.debug(`❌ No organization mapping found for user: ${userId}`);
      return null;

    } catch (error) {
      Logger.error('❌ Error fetching user organization mapping:', error);
      return null;
    }
  }

  /**
   * Create or update user organization mapping
   * Called when users are created or moved between organizations
   */
  static async setUserOrganization(
    userId: string,
    organizationId: string,
    role: string,
    email: string,
    userType: 'flat' | 'sharded' = 'sharded'
  ): Promise<void> {
    try {
      const indexEntry: UserOrgIndexEntry = {
        userId,
        organizationId,
        role,
        email,
        isActive: true,
        lastUpdated: new Date(),
        userType
      };

      await FirebaseService.setDocument(this.COLLECTION, userId, indexEntry);

      // Update cache
      this.cache.set(userId, {
        entry: indexEntry,
        timestamp: Date.now()
      });

      Logger.success(`✅ User organization mapping created: ${userId} → ${organizationId}`);

    } catch (error) {
      Logger.error('❌ Error creating user organization mapping:', error);
      throw error;
    }
  }

  /**
   * Remove user from organization mapping (when user is deleted/deactivated)
   */
  static async removeUserOrganization(userId: string): Promise<void> {
    try {
      await FirebaseService.deleteDocument(this.COLLECTION, userId);
      this.cache.delete(userId);
      Logger.success(`✅ User organization mapping removed: ${userId}`);
    } catch (error) {
      Logger.error('❌ Error removing user organization mapping:', error);
      throw error;
    }
  }

  /**
   * Update user's active status (for soft deletes)
   */
  static async setUserActiveStatus(userId: string, isActive: boolean): Promise<void> {
    try {
      const existingEntry = await this.getUserOrganization(userId);
      if (existingEntry) {
        const updatedEntry = {
          ...existingEntry,
          isActive,
          lastUpdated: new Date()
        };

        await FirebaseService.updateDocument(this.COLLECTION, userId, updatedEntry);

        // Update cache
        this.cache.set(userId, {
          entry: updatedEntry,
          timestamp: Date.now()
        });

        Logger.success(`✅ User active status updated: ${userId} → ${isActive}`);
      }
    } catch (error) {
      Logger.error('❌ Error updating user active status:', error);
      throw error;
    }
  }

  /**
   * Get all users for an organization (for admin purposes)
   */
  static async getOrganizationUsers(organizationId: string): Promise<UserOrgIndexEntry[]> {
    try {
      const allEntries = await FirebaseService.queryDocuments<UserOrgIndexEntry>(
        this.COLLECTION,
        [
          { field: 'organizationId', operator: '==', value: organizationId },
          { field: 'isActive', operator: '==', value: true }
        ]
      );

      Logger.success(`✅ Found ${allEntries.length} users for organization: ${organizationId}`);
      return allEntries;

    } catch (error) {
      Logger.error('❌ Error fetching organization users:', error);
      return [];
    }
  }

  /**
   * Get user data using the index (production optimized)
   */
  static async getUserWithOrganization(userId: string): Promise<{ user: User; organizationId: string } | null> {
    try {
      const indexEntry = await this.getUserOrganization(userId);
      if (!indexEntry) {
        return null;
      }

      let userData: User | null = null;

      if (indexEntry.userType === 'flat') {
        // Super-user or reseller - flat structure
        userData = await FirebaseService.getDocument<User>('users', userId);
      } else {
        // Organization user - sharded structure
        userData = await DatabaseShardingService.getDocument<User>(
          indexEntry.organizationId,
          'users',
          userId
        );
      }

      if (userData) {
        return {
          user: userData,
          organizationId: indexEntry.organizationId
        };
      }

      // Index exists but user data is missing - cleanup needed
      Logger.warn(`⚠️ Index exists but user data missing for ${userId}, cleaning up index...`);
      await this.removeUserOrganization(userId);
      return null;

    } catch (error) {
      Logger.error('❌ Error getting user with organization:', error);
      return null;
    }
  }

  /**
   * Clear cache (for development/testing)
   */
  static clearCache(): void {
    this.cache.clear();
    Logger.debug('🧹 User organization cache cleared');
  }

  /**
   * Migration helper - scan existing users and create index entries
   */
  static async migrateExistingUsers(): Promise<void> {
    try {
      Logger.debug('🔄 Starting user organization index migration...');

      // Migrate flat users (super-users, resellers)
      const flatUsers = await FirebaseService.getCollection<User>('users');
      for (const user of flatUsers) {
        if (user.id && user.email && user.role) {
          await this.setUserOrganization(
            user.id,
            user.organizationId || 'system', // Default org for super-users
            user.role,
            user.email,
            'flat'
          );
        }
      }

      // Migrate sharded users
      const organizations = await FirebaseService.getCollection('organizations');
      for (const org of organizations) {
        try {
          const orgUsers = await DatabaseShardingService.getCollection<User>(org.id, 'users');
          for (const user of orgUsers) {
            if (user.id && user.email && user.role) {
              await this.setUserOrganization(
                user.id,
                org.id,
                user.role,
                user.email,
                'sharded'
              );
            }
          }
          Logger.debug(`✅ Migrated ${orgUsers.length} users from organization: ${org.id}`);
        } catch (error) {
          Logger.error(`❌ Error migrating users from organization ${org.id}:`, error);
        }
      }

      Logger.success('✅ User organization index migration completed');

    } catch (error) {
      Logger.error('❌ Error during migration:', error);
      throw error;
    }
  }

  /**
   * Health check - verify index integrity
   */
  static async healthCheck(): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Check for orphaned index entries
      const allIndexEntries = await FirebaseService.getCollection<UserOrgIndexEntry>(this.COLLECTION);

      for (const entry of allIndexEntries) {
        try {
          if (entry.userType === 'flat') {
            const userData = await FirebaseService.getDocument('users', entry.userId);
            if (!userData) {
              issues.push(`Orphaned flat user index: ${entry.userId}`);
            }
          } else {
            const userData = await DatabaseShardingService.getDocument(
              entry.organizationId,
              'users',
              entry.userId
            );
            if (!userData) {
              issues.push(`Orphaned sharded user index: ${entry.userId} in ${entry.organizationId}`);
            }
          }
        } catch (error) {
          issues.push(`Error checking user ${entry.userId}: ${error}`);
        }
      }

      const healthy = issues.length === 0;

      if (healthy) {
        Logger.success(`✅ User organization index health check passed`);
      } else {
        Logger.warn(`⚠️ User organization index health check found ${issues.length} issues`);
      }

      return { healthy, issues };

    } catch (error) {
      Logger.error('❌ Error during health check:', error);
      return { healthy: false, issues: [`Health check failed: ${error}`] };
    }
  }
}

export default UserOrgIndexService;