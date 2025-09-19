import Logger from '../logger';
// frontend/src/utils/dashboard/performanceUtils.ts
// 🚀 PERFORMANCE OPTIMIZATION UTILITIES
// ✅ Caching, debouncing, memoization helpers

import { useCallback, useRef, useEffect } from 'react';

// 🎯 DEBOUNCE HOOK
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
};

// 🎯 THROTTLE HOOK
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCallRef = useRef<number>(0);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callback(...args);
    }
  }, [callback, delay]) as T;
};

// 🎯 LOCAL STORAGE CACHE MANAGER
export class CacheManager {
  private static readonly PREFIX = 'dashboard_cache_';
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  static set<T>(key: string, data: T, ttl: number = CacheManager.DEFAULT_TTL): void {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        ttl
      };
      localStorage.setItem(
        `${CacheManager.PREFIX}${key}`, 
        JSON.stringify(cacheItem)
      );
    } catch (error) {
      Logger.warn('⚠️ Cache write failed:', error)
    }
  }

  static get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(`${CacheManager.PREFIX}${key}`);
      if (!cached) return null;

      const { data, timestamp, ttl } = JSON.parse(cached);
      const now = Date.now();

      if (now - timestamp > ttl) {
        CacheManager.remove(key);
        return null;
      }

      return data;
    } catch (error) {
      Logger.warn('⚠️ Cache read failed:', error)
      CacheManager.remove(key);
      return null;
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(`${CacheManager.PREFIX}${key}`);
    } catch (error) {
      Logger.warn('⚠️ Cache remove failed:', error)
    }
  }

  static clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CacheManager.PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      Logger.warn('⚠️ Cache clear failed:', error)
    }
  }

  static getSize(): number {
    try {
      const keys = Object.keys(localStorage);
      return keys.filter(key => key.startsWith(CacheManager.PREFIX)).length;
    } catch (error) {
      return 0;
    }
  }
}

// 🎯 INTERSECTION OBSERVER HOOK (for lazy loading)
export const useIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) => {
  const targetRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!targetRef.current) return;

    observerRef.current = new IntersectionObserver(callback, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    });

    observerRef.current.observe(targetRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback, options]);

  return targetRef;
};

// 🎯 PERFORMANCE MONITORING
export class PerformanceMonitor {
  private static measurements: Map<string, number> = new Map();

  static start(label: string): void {
    this.measurements.set(label, performance.now());
  }

  static end(label: string): number {
    const startTime = this.measurements.get(label);
    if (!startTime) {
      Logger.warn(`⚠️ No start time found for: ${label}`)
      return 0;
    }

    const duration = performance.now() - startTime;
    this.measurements.delete(label);
    
    Logger.debug(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  static measure<T>(label: string, fn: () => T): T {
    this.start(label);
    const result = fn();
    this.end(label);
    return result;
  }

  static async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    const result = await fn();
    this.end(label);
    return result;
  }
}

// 🎯 MEMORY MANAGEMENT UTILITIES
export class MemoryManager {
  private static observers: Set<() => void> = new Set();
  private static cleanupTasks: Set<() => void> = new Set();

  static addCleanupTask(task: () => void): void {
    this.cleanupTasks.add(task);
  }

  static removeCleanupTask(task: () => void): void {
    this.cleanupTasks.delete(task);
  }

  static cleanup(): void {
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        Logger.warn('⚠️ Cleanup task failed:', error)
      }
    });
    this.cleanupTasks.clear();
  }

  static addMemoryObserver(observer: () => void): void {
    this.observers.add(observer);
  }

  static removeMemoryObserver(observer: () => void): void {
    this.observers.delete(observer);
  }

  static notifyMemoryPressure(): void {
    this.observers.forEach(observer => {
      try {
        observer();
      } catch (error) {
        Logger.warn('⚠️ Memory observer failed:', error)
      }
    });
  }
}

// 🎯 PRELOAD UTILITIES
export class PreloadManager {
  private static preloadedData: Map<string, any> = new Map();
  private static loadingPromises: Map<string, Promise<any>> = new Map();

  static async preload<T>(
    key: string,
    loader: () => Promise<T>,
    priority: 'high' | 'low' = 'low'
  ): Promise<T> {
    // Check if already loaded
    if (this.preloadedData.has(key)) {
      return this.preloadedData.get(key);
    }

    // Check if currently loading
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key);
    }

    // Start loading
    const loadPromise = this.executeLoad(key, loader, priority);
    this.loadingPromises.set(key, loadPromise);

    try {
      const result = await loadPromise;
      this.preloadedData.set(key, result);
      this.loadingPromises.delete(key);
      return result;
    } catch (error) {
      this.loadingPromises.delete(key);
      throw error;
    }
  }

  private static async executeLoad<T>(
    key: string,
    loader: () => Promise<T>,
    priority: 'high' | 'low'
  ): Promise<T> {
    if (priority === 'low') {
      // Use requestIdleCallback for low priority loads
      return new Promise((resolve, reject) => {
        const callback = () => {
          loader().then(resolve).catch(reject);
        };

        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(callback);
        } else {
          setTimeout(callback, 0);
        }
      });
    }

    return loader();
  }

  static get<T>(key: string): T | null {
    return this.preloadedData.get(key) || null;
  }

  static clear(key?: string): void {
    if (key) {
      this.preloadedData.delete(key);
      this.loadingPromises.delete(key);
    } else {
      this.preloadedData.clear();
      this.loadingPromises.clear();
    }
  }
}

// frontend/src/utils/dashboard/constants.ts
// 🎯 DASHBOARD CONSTANTS AND CONFIGURATIONS

export const DASHBOARD_CONFIG = {
  // 🔄 Refresh intervals (in milliseconds)
  REFRESH_INTERVALS: {
    HR_REPORTS: 60000,        // 1 minute
    WEATHER: 600000,          // 10 minutes
    QUOTES: 15000,            // 15 seconds
    NOTIFICATIONS: 30000,     // 30 seconds
    WARNINGS_STATS: 120000    // 2 minutes
  },

  // 📦 Cache configurations
  CACHE_DURATION: {
    WEATHER: 600000,          // 10 minutes
    USER_PREFERENCES: 86400000, // 24 hours
    NAVIGATION_ITEMS: 300000,  // 5 minutes
    ORGANIZATION_DATA: 1800000 // 30 minutes
  },

  // 🎨 Animation timings
  ANIMATIONS: {
    FADE_DURATION: 300,
    SLIDE_DURATION: 250,
    SCALE_DURATION: 200,
    STAGGER_DELAY: 50
  },

  // 📱 Responsive breakpoints
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1280,
    LARGE: 1536
  },

  // 🎯 Performance thresholds
  PERFORMANCE: {
    SLOW_COMPONENT_THRESHOLD: 100, // ms
    MEMORY_WARNING_THRESHOLD: 50,  // MB
    MAX_CACHE_SIZE: 100,          // items
    DEBOUNCE_DELAY: 300,          // ms
    THROTTLE_DELAY: 100           // ms
  },

  // 🔔 Notification settings
  NOTIFICATIONS: {
    MAX_VISIBLE: 5,
    AUTO_DISMISS_DELAY: 5000,
    POSITION: 'top-right' as const
  }
} as const;

// 🎨 THEME CONSTANTS
export const DASHBOARD_THEMES = {
  ROLE_GRADIENTS: {
    'business-owner': 'from-purple-500 to-indigo-600',
    'hr-manager': 'from-emerald-500 to-teal-600',
    'hod-manager': 'from-blue-500 to-cyan-600',
    'supervisor': 'from-orange-500 to-amber-600',
    'employee': 'from-gray-500 to-slate-600',
    'admin': 'from-red-500 to-rose-600',
    'super-user': 'from-violet-500 to-purple-600'
  },

  ROLE_COLORS: {
    'business-owner': 'purple',
    'hr-manager': 'emerald',
    'hod-manager': 'blue',
    'supervisor': 'orange',
    'employee': 'gray',
    'admin': 'red',
    'super-user': 'violet'
  },

  STATUS_COLORS: {
    success: 'green',
    warning: 'yellow',
    error: 'red',
    info: 'blue',
    pending: 'orange'
  }
} as const;

// 🧭 NAVIGATION CONSTANTS
export const NAVIGATION_CONFIG = {
  MOBILE_MENU_WIDTH: 320,
  DESKTOP_SIDEBAR_WIDTH: 280,
  MOBILE_HEADER_HEIGHT: 64,
  DESKTOP_HEADER_HEIGHT: 80,
  
  QUICK_ACTIONS_LIMIT: {
    MOBILE: 4,
    DESKTOP: 8
  }
} as const;

// frontend/src/utils/dashboard/helpers.ts
// 🛠️ DASHBOARD HELPER FUNCTIONS

import { DASHBOARD_THEMES } from './constants';

// 🎨 ROLE-BASED STYLING HELPERS
export const getRoleGradient = (role: string): string => {
  return DASHBOARD_THEMES.ROLE_GRADIENTS[role as keyof typeof DASHBOARD_THEMES.ROLE_GRADIENTS] 
    || DASHBOARD_THEMES.ROLE_GRADIENTS['employee'];
};

export const getRoleColor = (role: string): string => {
  return DASHBOARD_THEMES.ROLE_COLORS[role as keyof typeof DASHBOARD_THEMES.ROLE_COLORS] 
    || DASHBOARD_THEMES.ROLE_COLORS['employee'];
};

// 📅 DATE & TIME HELPERS
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const getTimePeriod = (): 'Morning' | 'Afternoon' | 'Evening' => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString();
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-ZA', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};

// 🔢 NUMBER FORMATTING HELPERS
export const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
};

// 🎯 UTILITY TYPE GUARDS
export const isValidRole = (role: string): role is keyof typeof DASHBOARD_THEMES.ROLE_GRADIENTS => {
  return role in DASHBOARD_THEMES.ROLE_GRADIENTS;
};

export const isValidStatus = (status: string): status is keyof typeof DASHBOARD_THEMES.STATUS_COLORS => {
  return status in DASHBOARD_THEMES.STATUS_COLORS;
};

// 🔍 SEARCH & FILTER HELPERS
export const createSearchFilter = <T>(
  items: T[], 
  searchTerm: string, 
  searchFields: (keyof T)[]
): T[] => {
  if (!searchTerm.trim()) return items;
  
  const term = searchTerm.toLowerCase().trim();
  
  return items.filter(item =>
    searchFields.some(field => {
      const value = item[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(term);
      }
      if (typeof value === 'number') {
        return value.toString().includes(term);
      }
      return false;
    })
  );
};

// 🎨 CSS CLASS HELPERS
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const getStatusClasses = (status: string): string => {
  const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
  
  switch (status.toLowerCase()) {
    case 'success':
    case 'active':
    case 'approved':
      return `${baseClasses} bg-green-100 text-green-800`;
    case 'warning':
    case 'pending':
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    case 'error':
    case 'failed':
    case 'rejected':
      return `${baseClasses} bg-red-100 text-red-800`;
    case 'info':
    case 'draft':
      return `${baseClasses} bg-blue-100 text-blue-800`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
};

// 🔄 ASYNC HELPERS
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, delay * Math.pow(2, attempt - 1))
      );
    }
  }
  
  throw lastError!;
};

export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ]);
};

// 🎯 VALIDATION HELPERS
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

// 🎮 EVENT HELPERS
export const createKeyboardHandler = (
  handlers: Record<string, () => void>
) => (event: KeyboardEvent) => {
  const handler = handlers[event.key];
  if (handler) {
    event.preventDefault();
    handler();
  }
};

export const stopPropagation = (event: React.SyntheticEvent) => {
  event.stopPropagation();
};

export const preventDefault = (event: React.SyntheticEvent) => {
  event.preventDefault();
};

// 🔒 SECURITY HELPERS
export const sanitizeHtml = (html: string): string => {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};