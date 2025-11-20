import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import helmet from 'helmet';
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

// INDUSTRY STANDARD: Dual-Status Sync (Opera PMS, Maestro, Cloudbeds, Mews)
import { runDualStatusSync, startPeriodicDualStatusSync } from './utils/dualStatusSync.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5051;

// CORS Configuration - Updated for production
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
  origin: true, // Allow all origins
  credentials: true
}));

// SECURITY: HTTP security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// SECURITY: Rate limiting to prevent DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
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
app.use('/api/guests', require('./routes/guests'));

// Debug route to check auth and db access
app.get('/api/debug/status', require('./middleware/auth'), async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('count')
      .eq('tenant_id', req.user.hotelId);

    res.json({
      status: 'ok',
      user: {
        email: req.user.email,
        tenant_id: req.user.hotelId,
        firebase_uid: req.user.firebaseUid
      },
      db_check: {
        rooms_count: rooms ? rooms.length : 0,
        error: roomsError
      },
      env: {
        has_service_key: !!process.env.SUPABASE_SERVICE_KEY
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'BillSutra Multi-Tenant Hotel Management API' });
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
