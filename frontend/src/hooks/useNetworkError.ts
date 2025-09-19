import { useState, useCallback, useEffect } from 'react';import Logger from '../utils/logger';

import { NetworkErrorHandler, NetworkError, RetryConfig } from '../utils/networkErrorHandler';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/common/ToastContainer';

interface UseNetworkErrorReturn {
  error: NetworkError | null;
  isOnline: boolean;
  clearError: () => void;
  handleError: (error: any) => NetworkError;
  withRetry: <T>(operation: () => Promise<T>, config?: Partial<RetryConfig>) => Promise<T>;
  showErrorToast: (error: NetworkError) => void;
}

/**
 * Hook for handling network errors in multi-tenant HR system
 * Provides consistent error handling across all components
 */
export const useNetworkError = (): UseNetworkErrorReturn => {
  const [error, setError] = useState<NetworkError | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { user, organization } = useAuth();
  const { showError } = useToast();

  // Monitor connection status
  useEffect(() => {
    const cleanup = NetworkErrorHandler.createConnectionMonitor(setIsOnline);
    return cleanup;
  }, []);

  // Create context for error tracking
  const getContext = useCallback(() => ({
    organizationId: organization?.id,
    userId: user?.id
  }), [organization?.id, user?.id]);

  // Handle and parse errors
  const handleError = useCallback((error: any): NetworkError => {
    const parsedError = NetworkErrorHandler.parseError(error, getContext());
    setError(parsedError);
    NetworkErrorHandler.logError(parsedError);
    return parsedError;
  }, [getContext]);

  // Clear current error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Retry wrapper with organization context
  const withRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>
  ): Promise<T> => {
    try {
      clearError();
      return await NetworkErrorHandler.withRetry(operation, config, getContext());
    } catch (error) {
      const parsedError = error as NetworkError;
      setError(parsedError);
      NetworkErrorHandler.logError(parsedError);
      throw parsedError;
    }
  }, [getContext, clearError]);

  // Show user-friendly error toast
  const showErrorToast = useCallback((error: NetworkError) => {
    const toast = NetworkErrorHandler.createErrorToast(error);
    
    // ✅ Now integrated with toast notification system
    Logger.debug('📢 Error Toast:', toast)
    
    showError(toast.title, toast.message, toast.actions);
  }, [showError]);

  return {
    error,
    isOnline,
    clearError,
    handleError,
    withRetry,
    showErrorToast
  };
};

/**
 * Higher-order component for wrapping components with network error handling
 */
export const withNetworkErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: NetworkError; retry: () => void }>
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const { error, clearError } = useNetworkError();
    
    if (error && fallback) {
      const FallbackComponent = fallback;
      return <FallbackComponent error={error} retry={clearError} />;
    }
    
    return <Component {...props} ref={ref} />;
  });
};

/**
 * Hook for handling specific Firebase operations with retry
 */
export const useFirebaseOperation = () => {
  const { withRetry, handleError } = useNetworkError();
  
  const executeFirebaseOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string = 'Firebase operation'
  ): Promise<T> => {
    try {
      return await withRetry(operation, {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 5000,
        backoffMultiplier: 2
      });
    } catch (error) {
      Logger.error(`❌ ${operationName} failed:`, error)
      throw error;
    }
  }, [withRetry]);
  
  return { executeFirebaseOperation, handleError };
};
