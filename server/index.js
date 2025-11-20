import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import billRoutes from './routes/bills.js';
import customerRoutes from './routes/customers.js';
import itemRoutes from './routes/items.js';
import settingsRoutes from './routes/settings.js';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import bookingRoutes from './routes/bookings.js';
import housekeepingRoutes from './routes/housekeeping.js';
import statsRoutes from './routes/stats.js';
import roomTypesRoutes from './routes/roomTypes.js';
import ratePlansRoutes from './routes/ratePlans.js';
import hotelRoutes from './routes/hotels.js';
import { authenticate } from './middleware/auth.js';
import { createClient } from '@supabase/supabase-js';

// INDUSTRY STANDARD: Dual-Status Sync (Opera PMS, Maestro, Cloudbeds, Mews)
import { runDualStatusSync, startPeriodicDualStatusSync } from './utils/dualStatusSync.js';

// PRODUCTION SAFETY: Environment validation
import { validateEnvironment } from './utils/validateEnv.js';

dotenv.config();

// Validate environment variables before proceeding
validateEnvironment();

const app = express();
const PORT = process.env.PORT || 5051;

// CORS Configuration - Production-ready with strict origin control
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://billsutra-hms.web.app',
  'https://billsutra-hms.firebaseapp.com'
];

// Middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.warn(`🚫 Blocked CORS request from: ${origin}`);
      return callback(new Error('CORS policy violation'), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// SECURITY: HTTP security headers - Production-grade configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://billsutra-backend-119258942950.us-central1.run.app"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
}));

// PERFORMANCE: Gzip compression for responses
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Balance between compression ratio and speed
}));

// SECURITY: Rate limiting to prevent DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased limit for auto-refresh (was 100)
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit login attempts
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// SECURITY: Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

app.use(express.json({ limit: '10mb' })); // Limit payload size

// Optional MongoDB Connection (skip if no URI provided)
const MONGO_URI = process.env.MONGODB_URI;
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch((err) => console.error('MongoDB connection error:', err));
} else {
  console.log('MongoDB URI not provided; running with file-based storage.');
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/housekeeping', housekeepingRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/room-types', roomTypesRoutes);
app.use('/api/rate-plans', ratePlansRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'BillSutra Multi-Tenant Hotel Management API' });
});

app.get('/api/debug/status', authenticate, async (req, res) => {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  
  // Try to fetch 1 room just to check connection
  const { data, error } = await supabase
    .from('rooms')
    .select('count')
    .limit(1);

  res.json({
    status: 'ok',
    db_connected: !error,
    db_error: error ? error.message : null,
    env_check: {
      has_url: !!process.env.SUPABASE_URL,
      has_key: !!process.env.SUPABASE_SERVICE_KEY
    }
  });
});

// Public health check with DB connectivity test and metrics
app.get('/api/public-health-check', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    
    // Try to fetch 1 room just to check connection
    const dbStart = Date.now();
    const { data, error } = await supabase
      .from('rooms')
      .select('count')
      .limit(1);
    const dbLatency = Date.now() - dbStart;

    const totalLatency = Date.now() - startTime;

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      db_connected: !error,
      db_latency_ms: dbLatency,
      total_latency_ms: totalLatency,
      memory_usage: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heap_used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        heap_total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
      },
      node_version: process.version,
      env: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // INDUSTRY STANDARD: Dual-Status Sync on startup (Opera PMS, Maestro, Cloudbeds, Mews)
  console.log('[STARTUP] Running dual-status synchronization...');
  try {
    await runDualStatusSync();
    console.log('[STARTUP] ✅ Dual-status sync completed successfully');
  } catch (error) {
    console.error('[STARTUP] ❌ Dual-status sync failed:', error.message);
  }
  
  // INDUSTRY STANDARD: Start periodic background sync (runs every 5 minutes)
  startPeriodicDualStatusSync(5);
  console.log('[STARTUP] ✅ Periodic dual-status sync enabled (every 5 minutes)');
});
