/**
 * Sentry Configuration for Frontend
 * Error tracking and performance monitoring
 */

import * as Sentry from '@sentry/react';

export function initSentry() {
  // Only initialize in production
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      
      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
      
      // Session Replay (optional - captures user interactions)
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      
      integrations: [
        new Sentry.BrowserTracing({
          // Track React Router navigation
          routingInstrumentation: Sentry.reactRouterV6Instrumentation(
            React.useEffect,
            useLocation,
            useNavigationType,
            createRoutesFromChildren,
            matchRoutes
          ),
        }),
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      
      // Filter out expected errors
      beforeSend(event, hint) {
        // Don't send network errors to Sentry (they're usually temporary)
        if (event.exception?.values?.[0]?.type === 'NetworkError') {
          return null;
        }
        
        // Don't send Firebase auth errors (user-facing)
        if (event.message?.includes('auth/')) {
          return null;
        }
        
        return event;
      },
      
      // Tag all events with app version
      initialScope: {
        tags: {
          app_version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        },
      },
    });
    
    console.log('✅ Sentry error tracking initialized');
  } else if (import.meta.env.DEV) {
    console.log('ℹ️ Sentry disabled in development mode');
  }
}

// Helper to manually capture errors
export function captureError(error, context = {}) {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('Error:', error, 'Context:', context);
  }
}

// Helper to capture custom messages
export function captureMessage(message, level = 'info') {
  if (import.meta.env.PROD) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[${level}] ${message}`);
  }
}
