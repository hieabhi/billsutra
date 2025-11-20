/**
 * Sentry Configuration for Backend
 * Error tracking and performance monitoring for Node.js
 */

import * as Sentry from '@sentry/node';

export function initSentry(app) {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    console.log('ℹ️ Sentry DSN not configured, skipping error tracking');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    integrations: [
      // Express integration
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
    ],
    
    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      
      // Remove environment variables with secrets
      if (event.contexts?.runtime?.env) {
        const env = event.contexts.runtime.env;
        Object.keys(env).forEach(key => {
          if (key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD')) {
            env[key] = '[REDACTED]';
          }
        });
      }
      
      return event;
    },
  });

  // Express middleware
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
  
  console.log('✅ Sentry error tracking initialized');
  
  return Sentry;
}

// Error handler middleware (add AFTER all routes)
export function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors with status code >= 500
      return error.status >= 500;
    },
  });
}

// Helper to capture errors
export function captureError(error, context = {}) {
  Sentry.captureException(error, {
    extra: context,
  });
}

// Helper to set user context
export function setUserContext(user) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    tenant_id: user.tenant_id,
  });
}
