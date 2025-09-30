/**
 * 🚨 LEGACY ERROR BOUNDARY FOR 2012-ERA DEVICES
 * Graceful error handling with device-appropriate UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Phone, Mail } from 'lucide-react';
import { LegacyErrorHandler, ErrorContext } from '../../utils/errorHandling';
import { globalDeviceCapabilities } from '../../utils/deviceDetection';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  context?: Partial<ErrorContext>;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorResponse?: any;
}

export class LegacyErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const context: ErrorContext = {
      component: this.props.context?.component || 'Unknown',
      action: this.props.context?.action || 'render',
      ...this.props.context
    };

    const errorResponse = LegacyErrorHandler.handleError(error, context);

    this.setState({
      error,
      errorInfo,
      errorResponse
    });

    // Log the error
    LegacyErrorHandler.logError(error, context);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorResponse: undefined });
  };

  render() {
    if (this.state.hasError) {
      const isLegacyDevice = globalDeviceCapabilities?.isLegacyDevice || false;
      const { errorResponse } = this.state;

      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render device-appropriate error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full">
            {isLegacyDevice ? (
              <LegacyErrorUI
                errorResponse={errorResponse}
                onRetry={this.handleRetry}
                error={this.state.error}
              />
            ) : (
              <ModernErrorUI
                errorResponse={errorResponse}
                onRetry={this.handleRetry}
                error={this.state.error}
                errorInfo={this.state.errorInfo}
              />
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Simplified error UI for legacy devices
 */
const LegacyErrorUI: React.FC<{
  errorResponse?: any;
  onRetry: () => void;
  error?: Error;
}> = ({ errorResponse, onRetry, error }) => (
  <div className="bg-white border border-red-200 rounded-lg p-6 text-center legacy-simple-layout">
    {/* Simple error icon */}
    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <AlertTriangle className="w-8 h-8 text-red-600" />
    </div>

    {/* Error title */}
    <h2 className="text-lg font-semibold text-gray-900 mb-2 legacy-text-size">
      {errorResponse?.isDeviceIssue ? 'Device Compatibility Issue' : 'Something went wrong'}
    </h2>

    {/* User-friendly message */}
    <p className="text-gray-600 mb-6 legacy-text-size">
      {errorResponse?.userMessage || 'An error occurred. Please try again or contact support.'}
    </p>

    {/* Action buttons */}
    <div className="space-y-3">
      {errorResponse?.canRetry && (
        <button
          onClick={onRetry}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 legacy-touch-target legacy-text-size"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}

      {errorResponse?.fallbackAction && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800 legacy-text-size">
            <strong>Alternative:</strong> {errorResponse.fallbackAction}
          </p>
        </div>
      )}

      {/* Contact support */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-3 legacy-text-size">
          Need help? Contact support:
        </p>
        <div className="flex gap-3 justify-center">
          <a
            href="tel:+27123456789"
            className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded text-xs hover:bg-green-700 legacy-touch-target"
          >
            <Phone className="w-3 h-3" />
            Call
          </a>
          <a
            href="mailto:support@hrsystem.co.za"
            className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 legacy-touch-target"
          >
            <Mail className="w-3 h-3" />
            Email
          </a>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Full-featured error UI for modern devices
 */
const ModernErrorUI: React.FC<{
  errorResponse?: any;
  onRetry: () => void;
  error?: Error;
  errorInfo?: ErrorInfo;
}> = ({ errorResponse, onRetry, error, errorInfo }) => {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-red-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-8 h-8" />
          <div>
            <h2 className="text-xl font-semibold">
              {errorResponse?.isDeviceIssue ? 'Compatibility Issue' : 'Application Error'}
            </h2>
            <p className="text-red-100 text-sm">
              Something unexpected happened
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-gray-600 mb-6">
          {errorResponse?.userMessage || 'An unexpected error occurred. Please try again.'}
        </p>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          {errorResponse?.canRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}

          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Reload Page
          </button>
        </div>

        {/* Fallback action */}
        {errorResponse?.fallbackAction && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
            <p className="text-sm text-blue-800">
              <strong>Alternative:</strong> {errorResponse.fallbackAction}
            </p>
          </div>
        )}

        {/* Technical details */}
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            {showDetails ? 'Hide' : 'Show'} technical details
          </button>

          {showDetails && (
            <div className="bg-gray-50 rounded-lg p-4 text-xs font-mono">
              <div className="mb-2">
                <strong>Error:</strong> {error?.name}: {error?.message}
              </div>
              {error?.stack && (
                <div className="mb-2">
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap text-xs mt-1">
                    {error.stack}
                  </pre>
                </div>
              )}
              {errorInfo?.componentStack && (
                <div>
                  <strong>Component Stack:</strong>
                  <pre className="whitespace-pre-wrap text-xs mt-1">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};