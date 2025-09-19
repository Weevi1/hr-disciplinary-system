import React, { Component, ErrorInfo, ReactNode } from 'react';import Logger from '../utils/logger';

import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { ErrorTrackingService } from '../services/ErrorTrackingService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      Logger.error('🚨 ErrorBoundary caught an error:', error)
      Logger.error('📍 Error Info:', errorInfo)
    }

    // Log to external service in production
    this.logErrorToService(error, errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private logErrorToService = async (error: Error, errorInfo: ErrorInfo) => {
    // ✅ Now using comprehensive ErrorTrackingService
    try {
      await ErrorTrackingService.trackComponentError(
        error, 
        errorInfo, 
        this.state.errorId,
        {
          componentName: this.constructor.name,
          props: Object.keys(this.props),
          timestamp: new Date().toISOString(),
          buildVersion: process.env.REACT_APP_VERSION || 'unknown'
        }
      );
      
      Logger.debug(`📊 Error ${this.state.errorId} tracked successfully`);
    } catch (trackingError) {
      Logger.error('❌ Failed to track error:', trackingError);
      
      // Fallback: still log to console for debugging
      Logger.error('🚨 Original error:', error);
      Logger.error('📍 Component stack:', errorInfo.componentStack);
    }
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            {/* Error Icon */}
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            {/* Error Title */}
            <h1 className="text-xl font-bold text-slate-900 text-center mb-2">
              Something went wrong
            </h1>

            {/* Error Message */}
            <p className="text-slate-600 text-center mb-6">
              We encountered an unexpected error. Our team has been notified and is working on a fix.
            </p>

            {/* Error ID for support */}
            <div className="bg-slate-100 rounded-lg p-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Bug className="w-4 h-4" />
                <span className="font-mono">Error ID: {this.state.errorId}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={this.handleRefresh}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Home
                </button>
              </div>
            </div>

            {/* Error Details (Development/Debug Mode) */}
            {(this.props.showDetails || process.env.NODE_ENV === 'development') && this.state.error && (
              <details className="mt-6 bg-red-50 border border-red-200 rounded-lg">
                <summary className="px-4 py-2 text-sm font-medium text-red-800 cursor-pointer hover:bg-red-100">
                  Technical Details (Debug)
                </summary>
                <div className="px-4 pb-4 text-xs">
                  <div className="mb-3">
                    <strong className="text-red-800">Error:</strong>
                    <pre className="mt-1 bg-red-100 p-2 rounded text-red-900 overflow-auto">
                      {this.state.error.message}
                    </pre>
                  </div>
                  
                  {this.state.error.stack && (
                    <div className="mb-3">
                      <strong className="text-red-800">Stack Trace:</strong>
                      <pre className="mt-1 bg-red-100 p-2 rounded text-red-900 overflow-auto max-h-40">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}

                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong className="text-red-800">Component Stack:</strong>
                      <pre className="mt-1 bg-red-100 p-2 rounded text-red-900 overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized Error Boundaries for different parts of the app

export const WarningErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallback={
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <div className="flex items-center gap-2 text-red-800 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-semibold">Warning System Error</h3>
        </div>
        <p className="text-red-700 text-sm mb-3">
          There was an error loading the warning management system. Please try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
        >
          Refresh Page
        </button>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export const EmployeeErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallback={
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 m-4">
        <div className="flex items-center gap-2 text-orange-800 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-semibold">Employee Management Error</h3>
        </div>
        <p className="text-orange-700 text-sm mb-3">
          There was an error loading the employee management system. Please try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded text-sm font-medium"
        >
          Refresh Page
        </button>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export const DashboardErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallback={
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 m-4">
        <div className="flex items-center gap-2 text-blue-800 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-semibold">Dashboard Error</h3>
        </div>
        <p className="text-blue-700 text-sm mb-3">
          There was an error loading the dashboard. You can try refreshing or navigate to a different section.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            Refresh
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;