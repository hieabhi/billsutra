import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5051;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from client/dist for Electron
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

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

// Serve index.html for all non-API routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

// Start the server - it will only run when executed directly by Electron
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

    // INDUSTRY STANDARD: Room-Booking Status Sync (Opera PMS pattern)
    // Ensures rooms 2+ days from arrival show as AVAILABLE, not RESERVED
    console.log('[STARTUP] Running room-booking status synchronization...');
    try {
      const { validateAndFixRoomBookingSync, startPeriodicSync } = await import('./utils/roomBookingSync.js');
      const result = await validateAndFixRoomBookingSync();
      console.log(`[STARTUP] ✅ Room-booking sync completed: Fixed ${result.fixed} room(s)`);

      // Start periodic background sync (every 5 minutes)
      startPeriodicSync(5);
      console.log('[STARTUP] ✅ Periodic room-booking sync enabled (every 5 minutes)');
    } catch (error) {
      console.error('[STARTUP] ❌ Room-booking sync failed:', error.message);
    }

    // INDUSTRY STANDARD: Start periodic background sync (runs every 5 minutes)
    startPeriodicDualStatusSync(5);
    console.log('[STARTUP] ✅ Periodic dual-status sync enabled (every 5 minutes)');
  });

export default app;
