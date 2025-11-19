import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.join(__dirname, '..', 'logs');
const AUDIT_LOG_FILE = path.join(LOG_DIR, 'audit.log');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Audit Logger - Track security-sensitive operations
 * COMPLIANCE: Required for PCI-DSS, GDPR, SOC2
 */

export const AuditEvents = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  USER_CREATED: 'USER_CREATED',
  USER_DELETED: 'USER_DELETED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  DATA_EXPORT: 'DATA_EXPORT',
  BOOKING_CREATED: 'BOOKING_CREATED',
  BOOKING_MODIFIED: 'BOOKING_MODIFIED',
  BOOKING_DELETED: 'BOOKING_DELETED',
  CHECKOUT: 'CHECKOUT',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  REFUND_ISSUED: 'REFUND_ISSUED',
  SETTINGS_CHANGED: 'SETTINGS_CHANGED',
  BACKUP_CREATED: 'BACKUP_CREATED',
  RESTORE_PERFORMED: 'RESTORE_PERFORMED',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
};

export const log = (event, details = {}, user = null, ipAddress = null) => {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    event,
    user: user || 'SYSTEM',
    userId: user?.id || null,
    hotelId: user?.hotelId || null,
    ipAddress: ipAddress || 'unknown',
    details,
    severity: getSeverity(event)
  };

  const logLine = JSON.stringify(entry) + '\n';

  // Write to file (append)
  fs.appendFileSync(AUDIT_LOG_FILE, logLine, 'utf8');

  // Also log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[AUDIT] ${event}:`, details);
  }

  // In production, send critical events to monitoring service
  if (process.env.NODE_ENV === 'production' && entry.severity === 'CRITICAL') {
    // TODO: Send to Sentry, LogRocket, or similar
    console.error('[CRITICAL AUDIT EVENT]', entry);
  }
};

const getSeverity = (event) => {
  const criticalEvents = [
    AuditEvents.USER_DELETED,
    AuditEvents.RESTORE_PERFORMED,
    AuditEvents.UNAUTHORIZED_ACCESS,
    AuditEvents.REFUND_ISSUED
  ];

  const highEvents = [
    AuditEvents.ROLE_CHANGED,
    AuditEvents.PASSWORD_CHANGE,
    AuditEvents.SETTINGS_CHANGED,
    AuditEvents.DATA_EXPORT,
    AuditEvents.LOGIN_FAILED
  ];

  if (criticalEvents.includes(event)) return 'CRITICAL';
  if (highEvents.includes(event)) return 'HIGH';
  return 'INFO';
};

/**
 * Middleware to log API requests
 */
export const auditMiddleware = (event) => {
  return (req, res, next) => {
    const user = req.user;
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    // Extract relevant data from request
    const details = {
      method: req.method,
      path: req.path,
      params: req.params,
      body: sanitizeBody(req.body), // Don't log passwords!
      query: req.query
    };

    log(event, details, user, ipAddress);
    next();
  };
};

/**
 * Remove sensitive data from logs
 */
const sanitizeBody = (body) => {
  if (!body) return {};
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'privateKey', 'cardNumber', 'cvv'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });

  return sanitized;
};

/**
 * Read audit logs (for admin dashboard)
 */
export const getAuditLogs = (options = {}) => {
  const { limit = 100, event = null, userId = null, startDate = null, endDate = null } = options;

  if (!fs.existsSync(AUDIT_LOG_FILE)) {
    return [];
  }

  const content = fs.readFileSync(AUDIT_LOG_FILE, 'utf8');
  const lines = content.trim().split('\n').filter(line => line);

  let logs = lines
    .map(line => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null;
      }
    })
    .filter(log => log !== null);

  // Apply filters
  if (event) {
    logs = logs.filter(log => log.event === event);
  }

  if (userId) {
    logs = logs.filter(log => log.userId === userId);
  }

  if (startDate) {
    logs = logs.filter(log => new Date(log.timestamp) >= new Date(startDate));
  }

  if (endDate) {
    logs = logs.filter(log => new Date(log.timestamp) <= new Date(endDate));
  }

  // Sort by timestamp descending (most recent first)
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Limit results
  return logs.slice(0, limit);
};

/**
 * Clear old logs (log rotation)
 * Call this periodically to prevent disk space issues
 */
export const rotateAuditLogs = () => {
  if (!fs.existsSync(AUDIT_LOG_FILE)) return;

  const stats = fs.statSync(AUDIT_LOG_FILE);
  const fileSizeMB = stats.size / (1024 * 1024);

  // If file > 10MB, archive it
  if (fileSizeMB > 10) {
    const archiveName = `audit_${new Date().toISOString().split('T')[0]}.log`;
    const archivePath = path.join(LOG_DIR, archiveName);
    
    fs.renameSync(AUDIT_LOG_FILE, archivePath);
    fs.writeFileSync(AUDIT_LOG_FILE, '', 'utf8');

    log(AuditEvents.BACKUP_CREATED, { 
      archived: archiveName, 
      sizeMB: fileSizeMB.toFixed(2) 
    });
  }
};

export default {
  log,
  AuditEvents,
  auditMiddleware,
  getAuditLogs,
  rotateAuditLogs
};
