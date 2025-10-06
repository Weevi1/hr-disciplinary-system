/**
 * 🚨 COMPREHENSIVE ERROR HANDLING FOR 2012-ERA DEVICES
 * Graceful degradation and user-friendly error messages
 */

import { globalDeviceCapabilities } from './deviceDetection';
import Logger from '../utils/logger';

export interface ErrorContext {
  component: string;
  action: string;
  userId?: string;
  organizationId?: string;
  deviceInfo?: any;
}

export interface ErrorResponse {
  message: string;
  userMessage: string;
  canRetry: boolean;
  fallbackAction?: string;
  isDeviceIssue: boolean;
}

export class LegacyErrorHandler {
  /**
   * Handle errors with device-aware messaging
   */
  static handleError(error: any, context: ErrorContext): ErrorResponse {
    const isLegacyDevice = globalDeviceCapabilities?.isLegacyDevice || false;

    Logger.error(`[${context.component}] Error during ${context.action}:`, error);

    // Device capability issues
    if (this.isDeviceCapabilityError(error)) {
      return this.handleDeviceCapabilityError(error, context, isLegacyDevice);
    }

    // Memory/performance issues
    if (this.isMemoryError(error)) {
      return this.handleMemoryError(error, context, isLegacyDevice);
    }

    // Network issues
    if (this.isNetworkError(error)) {
      return this.handleNetworkError(error, context, isLegacyDevice);
    }

    // Authentication issues
    if (this.isAuthError(error)) {
      return this.handleAuthError(error, context, isLegacyDevice);
    }

    // Firebase/Firestore issues
    if (this.isFirebaseError(error)) {
      return this.handleFirebaseError(error, context, isLegacyDevice);
    }

    // Generic error handling
    return this.handleGenericError(error, context, isLegacyDevice);
  }

  /**
   * Check if error is related to device capabilities
   */
  private static isDeviceCapabilityError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    return (
      message.includes('mediarecorder') ||
      message.includes('not supported') ||
      message.includes('permission denied') ||
      message.includes('feature not available') ||
      error.name === 'NotSupportedError'
    );
  }

  /**
   * Check if error is memory-related
   */
  private static isMemoryError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    return (
      message.includes('out of memory') ||
      message.includes('maximum call stack') ||
      message.includes('heap') ||
      error.name === 'RangeError'
    );
  }

  /**
   * Check if error is network-related
   */
  private static isNetworkError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('offline') ||
      message.includes('fetch') ||
      error.code === 'NETWORK_ERROR' ||
      error.name === 'NetworkError'
    );
  }

  /**
   * Check if error is authentication-related
   */
  private static isAuthError(error: any): boolean {
    return (
      error?.code?.includes('auth/') ||
      error?.message?.includes('unauthorized') ||
      error?.status === 401 ||
      error?.status === 403
    );
  }

  /**
   * Check if error is Firebase-related
   */
  private static isFirebaseError(error: any): boolean {
    return (
      error?.code?.includes('firestore/') ||
      error?.code?.includes('storage/') ||
      error?.code?.includes('functions/') ||
      error?.message?.includes('Firebase')
    );
  }

  /**
   * Handle device capability errors
   */
  private static handleDeviceCapabilityError(error: any, context: ErrorContext, isLegacyDevice: boolean): ErrorResponse {
    if (context.action.includes('audio') || context.action.includes('recording')) {
      return {
        message: `Audio recording not supported: ${error.message}`,
        userMessage: isLegacyDevice
          ? 'Your device doesn\'t support audio recording. You can add written notes instead.'
          : 'Audio recording is not available. Please allow microphone access or use written notes.',
        canRetry: false,
        fallbackAction: 'Use text notes instead',
        isDeviceIssue: true
      };
    }

    if (context.action.includes('pdf') || context.action.includes('download')) {
      return {
        message: `PDF generation not supported: ${error.message}`,
        userMessage: isLegacyDevice
          ? 'PDF creation failed on your device. Try using a newer device or contact support.'
          : 'PDF generation failed. Please try again or contact support.',
        canRetry: true,
        fallbackAction: 'Contact support for document',
        isDeviceIssue: true
      };
    }

    return {
      message: `Device capability error: ${error.message}`,
      userMessage: isLegacyDevice
        ? 'This feature is not supported on your device. Please use a newer device or contact support.'
        : 'This feature is not available. Please check your browser settings.',
      canRetry: false,
      fallbackAction: 'Use alternative method',
      isDeviceIssue: true
    };
  }

  /**
   * Handle memory errors
   */
  private static handleMemoryError(error: any, context: ErrorContext, isLegacyDevice: boolean): ErrorResponse {
    return {
      message: `Memory error in ${context.component}: ${error.message}`,
      userMessage: isLegacyDevice
        ? 'Your device is running low on memory. Please close other apps and try again.'
        : 'The operation requires more memory. Please close other browser tabs and try again.',
      canRetry: true,
      fallbackAction: 'Use simplified version',
      isDeviceIssue: true
    };
  }

  /**
   * Handle network errors
   */
  private static handleNetworkError(error: any, context: ErrorContext, isLegacyDevice: boolean): ErrorResponse {
    return {
      message: `Network error: ${error.message}`,
      userMessage: isLegacyDevice
        ? 'Connection problem. Please check your internet and try again. This may take longer on slower connections.'
        : 'Network connection failed. Please check your internet connection and try again.',
      canRetry: true,
      fallbackAction: 'Check connection and retry',
      isDeviceIssue: false
    };
  }

  /**
   * Handle authentication errors
   */
  private static handleAuthError(error: any, context: ErrorContext, isLegacyDevice: boolean): ErrorResponse {
    return {
      message: `Authentication error: ${error.message}`,
      userMessage: 'Your session has expired. Please sign in again.',
      canRetry: false,
      fallbackAction: 'Sign in again',
      isDeviceIssue: false
    };
  }

  /**
   * Handle Firebase errors
   */
  private static handleFirebaseError(error: any, context: ErrorContext, isLegacyDevice: boolean): ErrorResponse {
    if (error?.code === 'firestore/permission-denied') {
      return {
        message: `Permission denied: ${error.message}`,
        userMessage: 'You don\'t have permission to perform this action. Please contact your administrator.',
        canRetry: false,
        fallbackAction: 'Contact administrator',
        isDeviceIssue: false
      };
    }

    if (error?.code === 'firestore/unavailable') {
      return {
        message: `Service unavailable: ${error.message}`,
        userMessage: isLegacyDevice
          ? 'Service temporarily unavailable. Please try again in a few minutes.'
          : 'Service is temporarily unavailable. Please try again later.',
        canRetry: true,
        fallbackAction: 'Try again later',
        isDeviceIssue: false
      };
    }

    return {
      message: `Firebase error: ${error.message}`,
      userMessage: 'A system error occurred. Please try again or contact support.',
      canRetry: true,
      fallbackAction: 'Contact support if problem persists',
      isDeviceIssue: false
    };
  }

  /**
   * Handle generic errors
   */
  private static handleGenericError(error: any, context: ErrorContext, isLegacyDevice: boolean): ErrorResponse {
    return {
      message: `Unexpected error in ${context.component}: ${error.message}`,
      userMessage: isLegacyDevice
        ? 'Something went wrong. This may be due to device limitations. Please try again or contact support.'
        : 'An unexpected error occurred. Please try again.',
      canRetry: true,
      fallbackAction: 'Contact support if problem continues',
      isDeviceIssue: isLegacyDevice
    };
  }

  /**
   * Log error with device context
   */
  static logError(error: any, context: ErrorContext): void {
    const deviceInfo = {
      isLegacyDevice: globalDeviceCapabilities?.isLegacyDevice,
      browserInfo: globalDeviceCapabilities?.browserInfo,
      hasModernAudio: globalDeviceCapabilities?.hasModernAudio,
      hasModernCSS: globalDeviceCapabilities?.hasModernCSS
    };

    Logger.error('Error logged:', {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      deviceInfo
    });

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Analytics.trackError(error, context, deviceInfo);
    }
  }

  /**
   * Create user-friendly error component props
   */
  static getErrorComponentProps(error: any, context: ErrorContext) {
    const response = this.handleError(error, context);
    this.logError(error, context);

    return {
      title: response.isDeviceIssue && globalDeviceCapabilities?.isLegacyDevice
        ? 'Device Compatibility Issue'
        : 'Error',
      message: response.userMessage,
      canRetry: response.canRetry,
      fallbackAction: response.fallbackAction,
      isDeviceIssue: response.isDeviceIssue,
      showTechnicalDetails: !globalDeviceCapabilities?.isLegacyDevice,
      technicalMessage: response.message
    };
  }
}

/**
 * React hook for error handling
 */
export const useErrorHandler = () => {
  return {
    handleError: (error: any, context: ErrorContext) => {
      return LegacyErrorHandler.handleError(error, context);
    },
    logError: (error: any, context: ErrorContext) => {
      LegacyErrorHandler.logError(error, context);
    },
    getErrorProps: (error: any, context: ErrorContext) => {
      return LegacyErrorHandler.getErrorComponentProps(error, context);
    }
  };
};