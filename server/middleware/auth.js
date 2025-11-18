import admin from '../config/firebase-admin.js';
import supabase from '../config/supabase.js';

/**
 * Middleware to verify Firebase authentication token
 * and map user to Supabase tenant/user
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No token provided' 
      });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const firebaseUid = decodedToken.uid;
    const phoneNumber = decodedToken.phone_number;
    const email = decodedToken.email;

    // Find or create user in Supabase
    let { data: user, error } = await supabase
      .from('users')
      .select('*, tenants(*)')
      .eq('firebase_uid', firebaseUid)
      .single();

    // If user doesn't exist, create them
    if (error && error.code === 'PGRST116') {
      // For now, assign to Demo Hotel tenant
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('name', 'Demo Hotel')
        .single();

      if (!tenant) {
        return res.status(500).json({ 
          error: 'Setup Error', 
          message: 'No tenant found. Please contact support.' 
        });
      }

      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          tenant_id: tenant.id,
          firebase_uid: firebaseUid,
          phone_number: phoneNumber,
          email: email,
          role: 'staff'
        }])
        .select('*, tenants(*)')
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return res.status(500).json({ 
          error: 'Database Error', 
          message: 'Failed to create user' 
        });
      }

      user = newUser;
    } else if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ 
        error: 'Database Error', 
        message: 'Failed to fetch user data' 
      });
    }

    // Attach user and tenant info to request
    req.user = {
      id: user.id,
      firebaseUid: firebaseUid,
      tenantId: user.tenant_id,
      role: user.role,
      phoneNumber: phoneNumber,
      email: email,
      tenant: user.tenants
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        error: 'Token Expired', 
        message: 'Please sign in again' 
      });
    }

    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid token' 
    });
  }
};

// Backward compatibility - use authenticate as authMiddleware
export const authMiddleware = authenticate;

/**
 * Middleware to check if user has specific role
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `This action requires one of these roles: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
};

// Backward compatibility exports
export const requireSuperAdmin = requireRole('owner');
export const requireHotelAdmin = requireRole('owner', 'manager');

export const tenantIsolation = (req, res, next) => {
  // Simple passthrough for now
  next();
};
