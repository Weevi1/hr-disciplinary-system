// frontend/src/config/performance.ts
// Firebase Performance Monitoring Configuration
// Tracks app performance metrics and user experience

import { getPerformance, trace, type Performance } from 'firebase/performance';
import { app } from './firebase';
import Logger from '../utils/logger';

let performanceInstance: Performance | null = null;
let performanceEnabled = false;

/**
 * Initialize Firebase Performance Monitoring
 * Only enabled in production
 */
export function initPerformance(): void {
  // Only enable in production
  if (import.meta.env.MODE !== 'production') {
    Logger.debug('📊 [PERFORMANCE] Disabled in development mode');
    return;
  }

  try {
    performanceInstance = getPerformance(app);
    performanceEnabled = true;
    Logger.debug('📊 [PERFORMANCE] Monitoring initialized');
  } catch (error) {
    Logger.error('❌ [PERFORMANCE] Failed to initialize:', error);
  }
}

/**
 * Create a custom trace for measuring performance
 *
 * @param traceName - Name of the trace (e.g., 'load_dashboard', 'generate_pdf')
 * @returns Trace object with start() and stop() methods
 *
 * @example
 * const perfTrace = createTrace('generate_warning_pdf');
 * perfTrace.start();
 * // ... do work
 * perfTrace.stop();
 */
export function createTrace(traceName: string) {
  if (!performanceEnabled || !performanceInstance) {
    // Return no-op trace for development
    return {
      start: () => {},
      stop: () => {},
      putAttribute: () => {},
      putMetric: () => {},
      incrementMetric: () => {},
      getAttribute: () => null,
      getMetric: () => 0
    };
  }

  return trace(performanceInstance, traceName);
}

/**
 * Measure an async function's execution time
 *
 * @param traceName - Name for the trace
 * @param fn - Async function to measure
 * @param attributes - Optional custom attributes
 * @returns Result of the function
 *
 * @example
 * const employees = await measureAsync('load_employees', async () => {
 *   return await EmployeeService.getAll(orgId);
 * }, { organizationId: orgId });
 */
export async function measureAsync<T>(
  traceName: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string>
): Promise<T> {
  const perfTrace = createTrace(traceName);

  try {
    perfTrace.start();

    // Add custom attributes
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        perfTrace.putAttribute(key, value);
      });
    }

    const result = await fn();
    perfTrace.stop();
    return result;

  } catch (error) {
    perfTrace.putAttribute('error', 'true');
    perfTrace.stop();
    throw error;
  }
}

/**
 * Measure a synchronous function's execution time
 *
 * @param traceName - Name for the trace
 * @param fn - Function to measure
 * @param attributes - Optional custom attributes
 * @returns Result of the function
 */
export function measureSync<T>(
  traceName: string,
  fn: () => T,
  attributes?: Record<string, string>
): T {
  const perfTrace = createTrace(traceName);

  try {
    perfTrace.start();

    // Add custom attributes
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        perfTrace.putAttribute(key, value);
      });
    }

    const result = fn();
    perfTrace.stop();
    return result;

  } catch (error) {
    perfTrace.putAttribute('error', 'true');
    perfTrace.stop();
    throw error;
  }
}

/**
 * Track custom metrics for specific operations
 *
 * @example
 * trackMetric('pdf_generation', {
 *   size_kb: pdfBlob.size / 1024,
 *   page_count: 3
 * });
 */
export function trackMetric(
  metricName: string,
  metrics: Record<string, number>
): void {
  if (!performanceEnabled) return;

  const perfTrace = createTrace(metricName);
  perfTrace.start();

  Object.entries(metrics).forEach(([key, value]) => {
    perfTrace.putMetric(key, value);
  });

  perfTrace.stop();
}

/**
 * Common trace names for consistency
 */
export const TraceNames = {
  // Dashboard loading
  LOAD_DASHBOARD: 'load_dashboard',
  LOAD_BUSINESS_OWNER_DASHBOARD: 'load_executive_management_dashboard',
  LOAD_HR_DASHBOARD: 'load_hr_dashboard',
  LOAD_HOD_DASHBOARD: 'load_hod_dashboard',

  // Employee operations
  LOAD_EMPLOYEES: 'load_employees',
  CREATE_EMPLOYEE: 'create_employee',
  UPDATE_EMPLOYEE: 'update_employee',
  ARCHIVE_EMPLOYEE: 'archive_employee',

  // Warning operations
  LOAD_WARNINGS: 'load_warnings',
  CREATE_WARNING: 'create_warning',
  GENERATE_WARNING_PDF: 'generate_warning_pdf',
  SEND_WARNING: 'send_warning',

  // Auth operations
  LOGIN: 'user_login',
  LOGOUT: 'user_logout',
  REFRESH_CLAIMS: 'refresh_claims',

  // Data loading
  LOAD_ORGANIZATION: 'load_organization',
  LOAD_DEPARTMENTS: 'load_departments',
  LOAD_CATEGORIES: 'load_categories',

  // File operations
  UPLOAD_FILE: 'upload_file',
  DOWNLOAD_FILE: 'download_file',
  GENERATE_PDF: 'generate_pdf',

  // Search operations
  SEARCH_EMPLOYEES: 'search_employees',
  SEARCH_WARNINGS: 'search_warnings',
  FILTER_DATA: 'filter_data'
} as const;

/**
 * Track page navigation performance
 */
export function trackPageLoad(pageName: string): void {
  if (!performanceEnabled) return;

  const perfTrace = createTrace(`page_load_${pageName}`);
  perfTrace.start();

  // Stop trace after DOM content loaded
  if (document.readyState === 'complete') {
    perfTrace.stop();
  } else {
    window.addEventListener('load', () => {
      perfTrace.stop();
    }, { once: true });
  }
}

/**
 * Track API call performance
 */
export async function trackApiCall<T>(
  functionName: string,
  apiCall: () => Promise<T>
): Promise<T> {
  return measureAsync(
    `api_call_${functionName}`,
    apiCall,
    { function: functionName }
  );
}

// Export singleton getter
export function getPerformanceInstance(): Performance | null {
  return performanceInstance;
}
