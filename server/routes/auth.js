import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/auth/me
 * Get current authenticated user info
 */
router.get('/me', authenticate, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      firebaseUid: req.user.firebaseUid,
      role: req.user.role,
      phoneNumber: req.user.phoneNumber,
      email: req.user.email,
      tenant: {
        id: req.user.tenant.id,
        name: req.user.tenant.name,
        subscriptionStatus: req.user.tenant.subscription_status
      }
    }
  });
});

/**
 * GET /api/auth/verify
 * Simple endpoint to verify token is valid
 */
router.get('/verify', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    userId: req.user.id,
    tenantId: req.user.tenantId
  });
});

export default router;
