import admin from '../config/firebase-admin.js';
import supabase from '../config/supabase.js';
import { log, AuditEvents } from '../utils/auditLogger.js';

/**
 * Middleware to verify Firebase authentication token
 * and map user to Supabase tenant/user
 */
export const authenticate = async (req, res, next) => {
  const ipAddress = req.ip || req.connection.remoteAddress;
  
  console.log('🔐 AUTH MIDDLEWARE - Path:', req.path, 'Method:', req.method);
  
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    console.log('🔑 Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ AUTH FAILED: No token provided');
      log(AuditEvents.UNAUTHORIZED_ACCESS, { 
        path: req.path,
        reason: 'No token provided'
      }, null, ipAddress);
      
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No token provided' 
      });
    }

    const token = authHeader.split('Bearer ')[1];

    console.log('🎫 Token extracted, length:', token?.length);

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const firebaseUid = decodedToken.uid;
    const phoneNumber = decodedToken.phone_number;
    const email = decodedToken.email;

    console.log('✅ Firebase token verified - UID:', firebaseUid, 'Email:', email);

    // Find or create user in Supabase
    let { data: user, error } = await supabase
      .from('users')
      .select('*, tenants(*)')
      .eq('firebase_uid', firebaseUid)
      .single();

    console.log('👤 Supabase user lookup - Found:', !!user, 'Error:', error?.code);

    // If user doesn't exist, create them
    if (error && error.code === 'PGRST116') {
      console.log('📝 User not found, creating new user...');
      
      // Assign to first available tenant
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id')
        .limit(1);

      console.log('🏢 Available tenants:', tenants?.length || 0);

      if (!tenants || tenants.length === 0) {
        console.log('❌ NO TENANT FOUND IN DATABASE!');
        return res.status(500).json({ 
          error: 'Setup Error', 
          message: 'No tenant found. Please contact support.' 
        });
      }

      const tenant = tenants[0];
      
      console.log('🏢 Assigning user to tenant:', tenant.id);

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
      hotelId: user.tenant_id,
      role: user.role,
      phoneNumber: phoneNumber,
      email: email,
      tenant: user.tenants
    };

    console.log('✅ AUTH SUCCESS - User ID:', user.id, 'Tenant ID:', user.tenant_id, 'Hotel ID:', req.user.hotelId);

    next();
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    
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
