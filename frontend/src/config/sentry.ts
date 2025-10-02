// frontend/src/config/sentry.ts
// 🔍 Sentry Error Tracking Configuration

import * as Sentry from '@sentry/react';

export const initSentry = () => {
  // Only initialize in production
  if (import.meta.env.MODE === 'production') {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,

      // Performance Monitoring
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // Performance trace sample rate (100% = all transactions)
      tracesSampleRate: 0.1, // 10% of transactions for performance monitoring

      // Session Replay sample rate (errors are always captured)
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

      // Release tracking
      release: `hr-disciplinary-system@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,

      // Environment
      environment: import.meta.env.MODE,

      // Before sending error, add context
      beforeSend(event, hint) {
        // Add user context if available
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.email) {
          event.user = {
            id: user.uid,
            email: user.email,
            username: `${user.firstName} ${user.lastName}`,
          };
        }

        // Add organization context if available
        const orgId = localStorage.getItem('organizationId');
        if (orgId) {
          event.contexts = {
            ...event.contexts,
            organization: { id: orgId },
          };
        }

        return event;
      },

      // Ignore certain errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        // Random plugins/extensions
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        // Facebook
        'fb_xd_fragment',
        // Network errors (handled separately)
        'Network request failed',
        'Failed to fetch',
      ],

      // Deny URLs (don't track errors from these sources)
      denyUrls: [
        // Browser extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^chrome-extension:\/\//i,
      ],
    });

    console.log('✅ Sentry initialized for error tracking');
  } else {
    console.log('ℹ️ Sentry disabled in development mode');
  }
};

// Custom error tracking functions
export const logError = (error: Error, context?: Record<string, any>) => {
  if (import.meta.env.MODE === 'production') {
    Sentry.captureException(error, {
      contexts: { custom: context },
    });
  } else {
    console.error('Error:', error, 'Context:', context);
  }
};

export const logMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  if (import.meta.env.MODE === 'production') {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[${level.toUpperCase()}]`, message);
  }
};

export const setUserContext = (user: { id: string; email: string; name?: string }) => {
  if (import.meta.env.MODE === 'production') {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    });
  }
};

export const clearUserContext = () => {
  if (import.meta.env.MODE === 'production') {
    Sentry.setUser(null);
  }
};
