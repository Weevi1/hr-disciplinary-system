#!/usr/bin/env node

/**
 * Setup script for Sentry error tracking and performance monitoring
 * Run with: node scripts/monitoring/setup-sentry.js [environment]
 */

const fs = require('fs');
const path = require('path');

const ENVIRONMENTS = ['development', 'staging', 'production'];

function getEnvironment() {
  const env = process.argv[2] || 'development';
  if (!ENVIRONMENTS.includes(env)) {
    console.error(`❌ Invalid environment: ${env}. Must be one of: ${ENVIRONMENTS.join(', ')}`);
    process.exit(1);
  }
  return env;
}

function generateSentryConfig(environment) {
  const isProduction = environment === 'production';
  const isStaging = environment === 'staging';
  
  return {
    // Frontend configuration
    frontend: {
      dsn: process.env.VITE_SENTRY_DSN || '',
      environment: environment,
      debug: !isProduction,
      tracesSampleRate: isProduction ? 0.1 : 1.0,
      replaysSessionSampleRate: isProduction ? 0.01 : 0.1,
      replaysOnErrorSampleRate: 1.0,
      beforeSend: isProduction ? 'filterSensitiveData' : undefined,
      integrations: [
        'BrowserTracing',
        'Replay'
      ],
      tags: {
        component: 'frontend',
        environment: environment
      },
      release: process.env.GITHUB_SHA || 'development'
    },
    
    // Functions/Backend configuration
    backend: {
      dsn: process.env.SENTRY_DSN || '',
      environment: environment,
      debug: !isProduction,
      tracesSampleRate: isProduction ? 0.1 : 1.0,
      beforeSend: isProduction ? 'filterSensitiveData' : undefined,
      integrations: [
        'Http',
        'OnUncaughtException',
        'OnUnhandledRejection'
      ],
      tags: {
        component: 'backend',
        environment: environment
      },
      release: process.env.GITHUB_SHA || 'development'
    }
  };
}

function createSentrySetup(environment) {
  const config = generateSentryConfig(environment);
  
  // Frontend Sentry setup
  const frontendSetup = `
// Frontend Sentry Configuration - Auto-generated
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || 'development';
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    debug: ${config.frontend.debug},
    tracesSampleRate: ${config.frontend.tracesSampleRate},
    replaysSessionSampleRate: ${config.frontend.replaysSessionSampleRate},
    replaysOnErrorSampleRate: ${config.frontend.replaysOnErrorSampleRate},
    release: "${config.frontend.release}",
    
    integrations: [
      new BrowserTracing({
        // Capture interactions and navigation
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
      }),
      new Sentry.Replay({
        // Capture 10% of all sessions in production
        // Capture 100% of sessions with an error
        maskAllText: ${isProduction},
        blockAllMedia: ${isProduction},
      }),
    ],
    
    // Filter sensitive data in production
    beforeSend(event) {
      if (ENVIRONMENT === 'production') {
        return filterSensitiveData(event);
      }
      return event;
    },
    
    // Add custom tags
    tags: {
      component: 'frontend',
      environment: ENVIRONMENT,
    },
    
    // Custom error boundaries
    beforeErrorSampling: (event) => {
      // Don't sample certain types of errors in development
      if (ENVIRONMENT === 'development' && event.exception) {
        const error = event.exception.values?.[0];
        if (error?.type === 'ChunkLoadError' || error?.type === 'ResizeObserver loop limit exceeded') {
          return null;
        }
      }
      return event;
    }
  });
  
  // Add user context when available
  export const setSentryUser = (user) => {
    Sentry.setUser({
      id: user.uid,
      email: user.email,
      role: user.role?.name,
      organization: user.organizationId
    });
  };
  
  // Add breadcrumb for important actions
  export const addBreadcrumb = (message, category = 'action', level = 'info', data = {}) => {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000
    });
  };
  
  // Filter sensitive data
  function filterSensitiveData(event) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['Authorization'];
      delete event.request.headers['Cookie'];
    }
    
    // Remove sensitive form data
    if (event.request?.data) {
      const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
      sensitiveFields.forEach(field => {
        if (event.request.data[field]) {
          event.request.data[field] = '[Filtered]';
        }
      });
    }
    
    // Remove sensitive user data
    if (event.user) {
      delete event.user.ip_address;
      delete event.user.email; // Remove in production for privacy
    }
    
    return event;
  }
}

console.log('Sentry initialized for environment:', ENVIRONMENT);
`;

  // Backend Sentry setup for Cloud Functions
  const backendSetup = `
// Backend Sentry Configuration - Auto-generated
import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";

const ENVIRONMENT = process.env.NODE_ENV || 'development';
const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    debug: ${config.backend.debug},
    tracesSampleRate: ${config.backend.tracesSampleRate},
    profilesSampleRate: ${environment === 'production' ? '0.1' : '1.0'},
    release: "${config.backend.release}",
    
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
      new ProfilingIntegration(),
    ],
    
    // Filter sensitive data
    beforeSend(event) {
      if (ENVIRONMENT === 'production') {
        return filterSensitiveData(event);
      }
      return event;
    },
    
    tags: {
      component: 'backend',
      environment: ENVIRONMENT,
      runtime: 'nodejs'
    }
  });
}

// Middleware for Express/Cloud Functions
export const sentryMiddleware = (req, res, next) => {
  // Add request context
  Sentry.setTag("http.method", req.method);
  Sentry.setTag("http.url", req.url);
  
  // Add user context if available
  if (req.user) {
    Sentry.setUser({
      id: req.user.uid,
      role: req.user.role,
      organization: req.user.organizationId
    });
  }
  
  next();
};

// Error handler for Cloud Functions
export const handleError = (error, context = {}) => {
  console.error('Function error:', error);
  
  Sentry.withScope((scope) => {
    scope.setTag("function.name", context.functionName || 'unknown');
    scope.setContext("function", context);
    
    if (context.request) {
      scope.setTag("http.method", context.request.method);
      scope.setTag("http.url", context.request.url);
    }
    
    Sentry.captureException(error);
  });
  
  return {
    error: true,
    message: ENVIRONMENT === 'production' ? 'Internal server error' : error.message,
    code: error.code || 'internal-error'
  };
};

// Performance tracking
export const trackPerformance = (operationName) => {
  return Sentry.startTransaction({
    name: operationName,
    op: 'function'
  });
};

function filterSensitiveData(event) {
  // Remove sensitive data from request
  if (event.request?.data) {
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'privateKey'];
    sensitiveFields.forEach(field => {
      if (event.request.data[field]) {
        event.request.data[field] = '[Filtered]';
      }
    });
  }
  
  // Remove sensitive headers
  if (event.request?.headers) {
    delete event.request.headers['authorization'];
    delete event.request.headers['cookie'];
  }
  
  return event;
}

console.log('Backend Sentry initialized for environment:', ENVIRONMENT);
`;

  return { frontendSetup, backendSetup };
}

function main() {
  const environment = getEnvironment();
  console.log(`🔧 Setting up Sentry for ${environment} environment...`);
  
  const { frontendSetup, backendSetup } = createSentrySetup(environment);
  
  // Ensure directories exist
  const frontendDir = path.join(process.cwd(), 'frontend', 'src', 'monitoring');
  const backendDir = path.join(process.cwd(), 'functions', 'src', 'monitoring');
  
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }
  
  if (!fs.existsSync(backendDir)) {
    fs.mkdirSync(backendDir, { recursive: true });
  }
  
  // Write configuration files
  fs.writeFileSync(
    path.join(frontendDir, `sentry-${environment}.ts`),
    frontendSetup
  );
  
  fs.writeFileSync(
    path.join(backendDir, `sentry-${environment}.ts`),
    backendSetup
  );
  
  // Create environment-specific package.json updates
  const packageUpdates = {
    frontend: {
      dependencies: {
        "@sentry/react": "^7.100.0",
        "@sentry/tracing": "^7.100.0"
      },
      devDependencies: {
        "@sentry/webpack-plugin": "^2.10.0"
      }
    },
    backend: {
      dependencies: {
        "@sentry/node": "^7.100.0",
        "@sentry/profiling-node": "^1.3.0"
      }
    }
  };
  
  console.log('✅ Sentry configuration files generated successfully!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Install required packages:');
  console.log('   Frontend: npm install @sentry/react @sentry/tracing');
  console.log('   Backend:  npm install @sentry/node @sentry/profiling-node');
  console.log('');
  console.log('2. Set environment variables:');
  console.log(`   VITE_SENTRY_DSN (frontend)`);
  console.log(`   SENTRY_DSN (backend)`);
  console.log('');
  console.log('3. Import and initialize in your application:');
  console.log(`   Frontend: import './monitoring/sentry-${environment}';`);
  console.log(`   Backend:  import './monitoring/sentry-${environment}';`);
}

if (require.main === module) {
  main();
}

module.exports = {
  generateSentryConfig,
  createSentrySetup
};