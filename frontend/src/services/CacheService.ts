// CacheService.ts - Centralized caching layer for performance optimization
import Logger from '../utils/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiryTime: number;
}

interface CacheConfig {
  defaultTTL: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of cache entries
}

/**
 * Production-level caching service for performance optimization
 * Implements LRU eviction and configurable TTL
 */
export class CacheService {
  private static cache = new Map<string, CacheEntry<any>>();
  private static accessOrder = new Map<string, number>(); // For LRU tracking
  private static accessCounter = 0;

  private static config: CacheConfig = {
    defaultTTL: 5 * 60 * 1000, // 5 minutes default
    maxSize: 1000 // Max 1000 cached items
  };

  /**
   * Cache TTL configurations for different data types
   */
  private static TTL_CONFIG = {
    // Frequently changing data
    employees: 2 * 60 * 1000,        // 2 minutes
    warnings: 1 * 60 * 1000,         // 1 minute
    followUps: 30 * 1000,            // 30 seconds

    // Moderately changing data
    categories: 10 * 60 * 1000,      // 10 minutes
    organization: 15 * 60 * 1000,    // 15 minutes
    settings: 15 * 60 * 1000,        // 15 minutes

    // Rarely changing data
    userOrgIndex: 30 * 60 * 1000,    // 30 minutes
    sectors: 60 * 60 * 1000,         // 1 hour
    roles: 60 * 60 * 1000,           // 1 hour
  };

  /**
   * Get data from cache
   */
  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiryTime) {
      this.delete(key);
      Logger.debug(`🗑️ [CACHE] Expired entry removed: ${key}`);
      return null;
    }

    // Update access order for LRU
    this.accessOrder.set(key, ++this.accessCounter);

    Logger.debug(`💰 [CACHE] Hit: ${key}`);
    return entry.data;
  }

  /**
   * Set data in cache with automatic TTL based on data type
   */
  static set<T>(key: string, data: T, customTTL?: number): void {
    // Determine TTL based on key prefix
    const ttl = customTTL || this.getTTLForKey(key);
    const expiryTime = Date.now() + ttl;

    // Check cache size and evict if necessary
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiryTime
    });

    this.accessOrder.set(key, ++this.accessCounter);

    Logger.debug(`💾 [CACHE] Set: ${key} (TTL: ${ttl / 1000}s)`);
  }

  /**
   * Delete specific cache entry
   */
  static delete(key: string): void {
    this.cache.delete(key);
    this.accessOrder.delete(key);
    Logger.debug(`🗑️ [CACHE] Deleted: ${key}`);
  }

  /**
   * Clear cache entries by prefix (e.g., "employees:" to clear all employee cache)
   */
  static clearByPrefix(prefix: string): void {
    let deletedCount = 0;

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        this.accessOrder.delete(key);
        deletedCount++;
      }
    }

    Logger.success(`🧹 [CACHE] Cleared ${deletedCount} entries with prefix: ${prefix}`);
  }

  /**
   * Clear entire cache
   */
  static clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
    Logger.success(`🧹 [CACHE] Cleared all ${size} entries`);
  }

  /**
   * Get cache statistics
   */
  static getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestEntry: string | null;
    newestEntry: string | null;
  } {
    const entries = Array.from(this.cache.entries());
    const accessEntries = Array.from(this.accessOrder.entries());

    const oldestAccess = accessEntries.reduce((min, [key, access]) =>
      access < min.access ? { key, access } : min,
      { key: '', access: Infinity }
    );

    const newestAccess = accessEntries.reduce((max, [key, access]) =>
      access > max.access ? { key, access } : max,
      { key: '', access: -1 }
    );

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0, // Would need hit/miss tracking for accurate calculation
      oldestEntry: oldestAccess.key || null,
      newestEntry: newestAccess.key || null
    };
  }

  /**
   * Wrapper for async operations with caching
   */
  static async getOrFetch<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    customTTL?: number
  ): Promise<T> {
    // Try cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    Logger.debug(`🔄 [CACHE] Miss: ${key} - fetching...`);
    const data = await fetchFunction();
    this.set(key, data, customTTL);

    return data;
  }

  /**
   * Get TTL based on cache key pattern
   */
  private static getTTLForKey(key: string): number {
    for (const [type, ttl] of Object.entries(this.TTL_CONFIG)) {
      if (key.includes(type)) {
        return ttl;
      }
    }
    return this.config.defaultTTL;
  }

  /**
   * 🚀 OPTIMIZATION: Check if key exists in cache (without fetching data)
   */
  static has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() > entry.expiryTime) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 🚀 OPTIMIZATION: Pre-warm cache with predicted data needs
   * Starts fetching data in background without blocking
   */
  static async preWarmCache(userId: string, organizationId: string): Promise<void> {
    Logger.debug(`🔥 [CACHE] Pre-warming cache for user ${userId} in org ${organizationId}`);

    const predictions = [
      this.generateOrgKey(organizationId, 'employees:all'),
      this.generateOrgKey(organizationId, 'categories'),
      this.generateOrgKey(organizationId, 'organization'),
    ];

    // Check which keys are missing from cache
    const missingKeys = predictions.filter(key => !this.has(key));

    if (missingKeys.length === 0) {
      Logger.debug(`✅ [CACHE] All predicted data already cached`);
      return;
    }

    Logger.debug(`🔄 [CACHE] Pre-warming ${missingKeys.length} missing keys:`, missingKeys);

    // Note: Actual fetching would happen in the components that use getOrFetch()
    // This just identifies what's missing for monitoring purposes
  }

  /**
   * Evict least recently used entry
   */
  private static evictLRU(): void {
    if (this.accessOrder.size === 0) return;

    // Find least recently used entry
    let lruKey = '';
    let lruAccess = Infinity;

    for (const [key, access] of this.accessOrder.entries()) {
      if (access < lruAccess) {
        lruAccess = access;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.delete(lruKey);
      Logger.debug(`♻️ [CACHE] LRU evicted: ${lruKey}`);
    }
  }

  /**
   * Start background cleanup of expired entries
   */
  static startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpired();
    }, 60 * 1000); // Run every minute

    Logger.debug('🕐 [CACHE] Cleanup timer started');
  }

  /**
   * Clean up expired entries
   */
  private static cleanupExpired(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiryTime) {
        this.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      Logger.debug(`🧹 [CACHE] Cleaned ${cleanedCount} expired entries`);
    }
  }

  /**
   * Generate cache key for organization-specific data
   */
  static generateOrgKey(organizationId: string, type: string, ...params: string[]): string {
    const paramString = params.length > 0 ? `:${params.join(':')}` : '';
    return `org:${organizationId}:${type}${paramString}`;
  }

  /**
   * Generate cache key for user-specific data
   */
  static generateUserKey(userId: string, type: string, ...params: string[]): string {
    const paramString = params.length > 0 ? `:${params.join(':')}` : '';
    return `user:${userId}:${type}${paramString}`;
  }
}

// Start cleanup timer when service is imported
CacheService.startCleanupTimer();

export default CacheService;