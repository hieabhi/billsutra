import jwt from 'jsonwebtoken';
import { usersRepo } from '../repositories/usersRepo.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'billsutra-secret-key-change-in-production';

// Middleware to verify JWT token
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await usersRepo.getById(decoded.userId);

    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    // Attach user info to request
    req.user = {
      userId: user._id,
      hotelId: user.hotelId,
      role: user.role,
      permissions: user.permissions
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to check if user is super admin
export const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'superAdmin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

// Middleware to check if user is hotel admin or super admin
export const requireHotelAdmin = (req, res, next) => {
  if (req.user.role !== 'hotelAdmin' && req.user.role !== 'superAdmin') {
    return res.status(403).json({ error: 'Hotel admin access required' });
  }
  next();
};

// Middleware to check specific roles
export const requireRole = (...roles) => {
  return (req, res, next) => {
    // Super admin bypasses role checks
    if (req.user.role === 'superAdmin') {
      return next();
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Middleware to ensure user can only access their hotel data
export const tenantIsolation = (req, res, next) => {
  // Super admin can access all hotels
  if (req.user.role === 'superAdmin') {
    return next();
  }

  // Check if trying to access different hotel's data
  const hotelId = req.params.hotelId || req.body.hotelId || req.query.hotelId;
  
  if (hotelId && hotelId !== req.user.hotelId) {
    return res.status(403).json({ error: 'Access denied to this hotel data' });
  }

  // Inject user's hotelId into request for filtering
  req.hotelId = req.user.hotelId;
  next();
};
