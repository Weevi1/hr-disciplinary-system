import Logger from '../../utils/logger';
// frontend/src/components/common/ErrorBoundary.tsx
import React, { Component, useState, useCallback } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { DataService } from '../../services/DataService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: `error-${Date.now()}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    Logger.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Update state with error info
    this.setState({
      error,
      errorInfo
    });
    
    // Log to audit system
    this.logErrorToAudit(error, errorInfo);
  }

  async logErrorToAudit(error: Error, errorInfo: ErrorInfo) {
    try {
      // Only try to log if DataService has logAuditEvent method
      if (DataService && typeof DataService.logAuditEvent === 'function') {
        await DataService.logAuditEvent('APPLICATION_ERROR', {
          errorMessage: error.message,
          errorStack: error.stack,
          componentStack: errorInfo.componentStack,
          errorId: this.state.errorId,
          url: window.location.href,
          timestamp: new Date().toISOString()
        });
      } else {
        // Fallback logging
        console.error('Error details:', {
          errorMessage: error.message,
          errorStack: error.stack,
          componentStack: errorInfo.componentStack,
          errorId: this.state.errorId,
          url: window.location.href,
          timestamp: new Date().toISOString()
        });
      }
    } catch (auditError) {
      Logger.error('Failed to log error to audit:', auditError)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
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
        <div className="hr-container" style={{ paddingTop: '2rem' }}>
          <div className="hr-card" style={{ 
            maxWidth: '600px', 
            margin: '0 auto',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '4rem', 
              marginBottom: '1rem',
              color: '#ef4444'
            }}>
              ⚠️
            </div>
            
            <h2 style={{ 
              color: '#ef4444', 
              marginBottom: '1rem',
              fontSize: '1.5rem'
            }}>
              Oops! Something went wrong
            </h2>
            
            <p style={{ 
              color: '#64748b', 
              marginBottom: '1.5rem',
              lineHeight: '1.6'
            }}>
              We apologize for the inconvenience. The error has been logged and our team will investigate.
            </p>

            {/* Error details in development */}
            {import.meta.env.DEV && this.state.error && (
              <details style={{ 
                textAlign: 'left',
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: '#fef2f2',
                borderRadius: '0.5rem',
                border: '1px solid #fecaca'
              }}>
                <summary style={{ 
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: '#991b1b',
                  marginBottom: '0.5rem'
                }}>
                  Error Details (Development Only)
                </summary>
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ 
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    color: '#991b1b',
                    marginBottom: '0.5rem'
                  }}>
                    <strong>Error:</strong> {this.state.error.message}
                  </p>
                  {this.state.errorId && (
                    <p style={{ 
                      fontSize: '0.75rem',
                      color: '#991b1b'
                    }}>
                      <strong>Error ID:</strong> {this.state.errorId}
                    </p>
                  )}
                  {this.state.error.stack && (
                    <pre style={{ 
                      fontSize: '0.75rem',
                      overflow: 'auto',
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      backgroundColor: '#fee2e2',
                      borderRadius: '0.25rem'
                    }}>
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                className="hr-button-primary"
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="hr-button"
                style={{
                  backgroundColor: 'white',
                  color: '#3b82f6',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #3b82f6',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Go to Dashboard
              </button>
            </div>

            {this.state.errorId && (
              <p style={{ 
                marginTop: '1.5rem',
                fontSize: '0.75rem',
                color: '#9ca3af'
              }}>
                Error reference: {this.state.errorId}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to reset error boundary
export const useErrorReset = () => {
  const [, setError] = useState<(() => void) | undefined>();
  
  return useCallback(
    () => setError(() => {
      throw new Error('Reset error boundary');
    }),
    []
  );
};

// HOC to wrap components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  // Set display name for debugging
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};
