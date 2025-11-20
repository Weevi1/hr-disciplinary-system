// frontend/src/hooks/useAsyncData.ts
// 🎯 CENTRALIZED ASYNC DATA HOOK
// ✅ Replaces 44+ duplicate loading/error/data patterns
// ✅ Standardized async data fetching with automatic state management
// ✅ Built-in error handling, retry logic, and caching support

import { useState, useEffect, useCallback, useRef } from 'react';
import Logger from '../utils/logger';

/**
 * Configuration options for useAsyncData
 */
interface UseAsyncDataOptions<T> {
  /**
   * Fetch function that returns a Promise
   */
  fetchFn: () => Promise<T>;

  /**
   * Dependencies that trigger refetch when changed
   * @default []
   */
  dependencies?: any[];

  /**
   * Whether to fetch immediately on mount
   * @default true
   */
  immediate?: boolean;

  /**
   * Initial data value
   * @default null
   */
  initialData?: T | null;

  /**
   * Callback fired on successful fetch
   */
  onSuccess?: (data: T) => void;

  /**
   * Callback fired on error
   */
  onError?: (error: Error) => void;

  /**
   * Enable automatic retry on failure
   * @default false
   */
  retry?: boolean;

  /**
   * Number of retry attempts
   * @default 3
   */
  retryAttempts?: number;

  /**
   * Delay between retries in ms
   * @default 1000
   */
  retryDelay?: number;

  /**
   * Cache key for storing/retrieving cached data
   */
  cacheKey?: string;

  /**
   * Cache time-to-live in milliseconds
   * @default 5 minutes
   */
  cacheTTL?: number;
}

/**
 * Return type for useAsyncData hook
 */
interface UseAsyncDataReturn<T> {
  /**
   * The fetched data
   */
  data: T | null;

  /**
   * Whether data is currently being fetched
   */
  loading: boolean;

  /**
   * Error object if fetch failed
   */
  error: Error | null;

  /**
   * Manually trigger a refetch
   */
  refetch: () => Promise<void>;

  /**
   * Reset state to initial values
   */
  reset: () => void;

  /**
   * Manually set data (useful for optimistic updates)
   */
  setData: (data: T | null) => void;

  /**
   * Whether this is the first load (no cached data)
   */
  isFirstLoad: boolean;
}

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();

/**
 * Hook for managing async data fetching with loading/error states
 *
 * @example
 * // Basic usage
 * const { data, loading, error } = useAsyncData({
 *   fetchFn: () => API.users.getAll()
 * });
 *
 * @example
 * // With dependencies
 * const { data, loading, error, refetch } = useAsyncData({
 *   fetchFn: () => API.users.getById(userId),
 *   dependencies: [userId],
 *   onSuccess: (user) => console.log('User loaded:', user)
 * });
 *
 * @example
 * // With caching
 * const { data, loading, error } = useAsyncData({
 *   fetchFn: () => API.organizations.getAll(),
 *   cacheKey: 'organizations',
 *   cacheTTL: 60000 // 1 minute
 * });
 *
 * @example
 * // With retry
 * const { data, loading, error, refetch } = useAsyncData({
 *   fetchFn: () => API.warnings.getAll(),
 *   retry: true,
 *   retryAttempts: 3,
 *   onError: (err) => Logger.error('Failed to load warnings:', err)
 * });
 */
export function useAsyncData<T = any>(
  options: UseAsyncDataOptions<T>
): UseAsyncDataReturn<T> {
  const {
    fetchFn,
    dependencies = [],
    immediate = true,
    initialData = null,
    onSuccess,
    onError,
    retry = false,
    retryAttempts = 3,
    retryDelay = 1000,
    cacheKey,
    cacheTTL = 300000 // 5 minutes
  } = options;

  // State
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);

  // Check cache
  const getCachedData = useCallback((): T | null => {
    if (!cacheKey) return null;

    const cached = cache.get(cacheKey);
    if (!cached) return null;

    const now = Date.now();
    const isExpired = now - cached.timestamp > cacheTTL;

    if (isExpired) {
      cache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }, [cacheKey, cacheTTL]);

  // Store in cache
  const setCachedData = useCallback((newData: T) => {
    if (!cacheKey) return;

    cache.set(cacheKey, {
      data: newData,
      timestamp: Date.now()
    });
  }, [cacheKey]);

  // Fetch data
  const fetchData = useCallback(async () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check cache first
    const cachedData = getCachedData();
    if (cachedData !== null) {
      setData(cachedData);
      setLoading(false);
      setError(null);
      setIsFirstLoad(false);
      return;
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();

      // Only update if component is still mounted
      if (isMountedRef.current) {
        setData(result);
        setError(null);
        setIsFirstLoad(false);

        // Cache the result
        setCachedData(result);

        // Call success callback
        onSuccess?.(result);

        // Reset retry count on success
        retryCountRef.current = 0;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      // Only update if component is still mounted and not aborted
      if (isMountedRef.current && error.name !== 'AbortError') {
        // Retry logic
        if (retry && retryCountRef.current < retryAttempts) {
          retryCountRef.current += 1;
          Logger.warn(`Retrying fetch (attempt ${retryCountRef.current}/${retryAttempts})...`);

          // Wait before retrying
          setTimeout(() => {
            if (isMountedRef.current) {
              fetchData();
            }
          }, retryDelay);

          return;
        }

        setError(error);
        onError?.(error);
        Logger.error('useAsyncData fetch failed:', error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFn, getCachedData, setCachedData, onSuccess, onError, retry, retryAttempts, retryDelay]);

  // Reset function
  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
    setIsFirstLoad(true);
    retryCountRef.current = 0;
  }, [initialData]);

  // Effect to fetch on mount or when dependencies change
  useEffect(() => {
    isMountedRef.current = true;

    if (immediate) {
      fetchData();
    }

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    reset,
    setData,
    isFirstLoad
  };
}

/**
 * Hook for loading multiple async data sources in parallel
 *
 * @example
 * const { data, loading, error } = useAsyncDataParallel({
 *   users: () => API.users.getAll(),
 *   organizations: () => API.organizations.getAll(),
 *   warnings: () => API.warnings.getAll()
 * });
 *
 * // Access: data.users, data.organizations, data.warnings
 */
export function useAsyncDataParallel<T extends Record<string, () => Promise<any>>>(
  fetchFns: T
): UseAsyncDataReturn<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  type DataType = { [K in keyof T]: Awaited<ReturnType<T[K]>> };

  const [data, setData] = useState<DataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const keys = Object.keys(fetchFns);
      const promises = Object.values(fetchFns).map((fn) => fn());

      const results = await Promise.all(promises);

      const combinedData = keys.reduce((acc, key, index) => {
        acc[key as keyof DataType] = results[index];
        return acc;
      }, {} as DataType);

      setData(combinedData);
      setIsFirstLoad(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      Logger.error('useAsyncDataParallel fetch failed:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchFns]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    reset: () => {
      setData(null);
      setLoading(false);
      setError(null);
      setIsFirstLoad(true);
    },
    setData,
    isFirstLoad
  };
}

export default useAsyncData;
