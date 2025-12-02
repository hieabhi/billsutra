// License Key Generator and Validator
// Industry-Standard License System using RSA-2048 Cryptography
// Based on best practices from Adobe, Autodesk, Microsoft, JetBrains

const crypto = require('crypto');
const CryptoJS = require('crypto-js');

/**
 * PRIVATE KEY - Keep this ABSOLUTELY SECRET and SECURE!
 * This is used to SIGN license keys (only on your license generation server)
 * 
 * In production:
 * 1. Store this on a secure offline machine
 * 2. Never include in the distributed application
 * 3. Use a separate license-generator.js file on your server
 * 4. Back up to encrypted USB drive + password manager
 */
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCq9jKL1zXzvzYB
1ZQogf4MWi80mTQ1WwvC2CIRHEaM54EPrevkpKo3AgO4hzLbxvqjJD0elH/lCwXH
jvyE5Dmn40y3y653imn+lgojVDUsS4RAkFb4gkhlnDEoKCWQtmlf0eoe8Na0c7h0
elUhxFrPVwzfjPkONJZBruhiIVWXGcbEuA2iMBUd7Frr8mCbmk36IZZ2fH8LGxaR
Io7BzqHEG6fFratvPlk8Nk61LeeeC4sh7ZiW0ufBChKa3iQFlOUXuypSO8rgzvY/
r3QtwUDasb1PrNT4S0j65QnZ642pJcn2wxnr7xx/VhMtgJQk/Bsks2AwXEwZKZxO
sckAREghAgMBAAECggEAByOukFzFkdnE1sZwCvxZZcj9sAEhMdniVQSIm6qmHuvr
Xa0XgkixcQhNASToO08FGCYDGrv8gU34s6Y60Q6Pgn2BWSrmLMjOIgXAWPcDHMfv
Nxuv/hhsDzjla/YNPOID5tlRy8amo1+HxEQi5PzvBo9DPYdaE+f0nxE/qXAXQ8Q2
xEUizoYHCXuSuX9XmqenpzBU/nbdnXEguSNMpduHSzOuKCvznyMqWuHusua9ASZy
2ZcxwsLwgtqHQVIjdlOO8l+PRmnihyDpzOHru3uF30NVT2VoZuXIz1z2gQjki9q9
0pwJuotfHn7099pOagMN8KqEN2l1uHyaLJqN4o9vrwKBgQDjzsS9UxoLPR1AOTbj
sZPoPqCfEFaPWgb3dENe+0atzmztZqbC+90TGB7g4Y6cVlMXtTvJKziRECyzg8D8
Airoqbt5xwPXJbATRr+G7z6TR1PmeYboyZ6KVHxDbxXJU4AA0ycV5TipmL+7zjEF
BSj/DGuTw6Awn/9h5srVBk2X1wKBgQDAHno4eQnDhT1l9YdEqpzXXY+iiBms4FL6
z3tinV+DtQy3bEijaShLQ/oY1MAmi6JQOBsmFo6y4IjdVb9/XcFDapmAD+NqAmsU
oSFh5WQSwgHyNNH1kerlvEWV8umS8EV8j3UCdaPpsRdxmLfIdwlx1Wt+m3DfyPRZ
sN9Irj7AxwKBgB3FpxarJqszWIBNOew2CAOBM9K1+uoPNPvgGPHv2wPaB4hbMw4m
hnT5YQe40r+B1KgzilW3LVRgDceEP5Nv4RW5IQRASzMx/Ln4NA25dK8g0kk7trLz
rqGbewYBHZLLM95nuiL1axtXGC++Oc/TJdF3WRPdrDDOqDyuQfHnOfrPAoGABnC/
HieImUJdNY7OkxG5IksjpoozeiUnAvtzonGuIwctvvRlVv0Oeb90oeJ38pLZxSCs
YFF/RSXb0LewLL/i27S2IqHluMcN+eoQ6Ww8N5jDYfA9XaMfocX2+zjidaeSXMOe
Y4+4B/yE0a0R9ClxapyB9wOU/BuLfXo9cf1NYz8CgYEA0b8+svhAwcTvlfpsYBaS
GvEh2umssJHc3S4apEGvmWxGsmEm89+BH49Kxqow4TJpT4mgsX6++zbRqpq9ThTU
2LlVTci+DEZIs4h9ePSI+Rg36Uu0fhhzmCAjS+e9noBEa2RrDaPWx/PzzKnWGjNv
Gi3bK59oLxVuTeVwq5wJIpU=
-----END PRIVATE KEY-----`;

/**
 * PUBLIC KEY - This is SAFE to include in your distributed application
 * This is used to VERIFY license signatures (included in Electron app)
 * 
 * Customers cannot generate fake licenses because they don't have the private key
 * Even if they see this public key, they cannot create valid signatures
 */
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqvYyi9c1878 2AdWUKIH+
DFovNJk0NVsLwtgiERxGjOeBD63r5KSqNwIDuIcy28b6oyQ9HpR/5QsFx478hOQ5
p+NMt8uud4pp/pYKI1Q1LEuEQJBW+IJIZZwxKCglkLZpX9HqHvDWtHO4dHpVIcRa
z1cM34z5DjSWQa7oYiFVlxnGxLgNojAVHexa6/Jgm5pN+iGWdnx/CxsWkSKOwc6h
xBunxa2rbz5ZPDZOtS3nnguLIe2YltLnwQoSmt4kBZTlF7sqUjvK4M72P690LcFA
2rG9T6zU+EtI+uUJ2euNqSXJ9sMZ6+8cf1YTLYCUJPwbJLNgMFxMGSmcTrHJAERI
IQIDAQAB
-----END PUBLIC KEY-----`;

// Fallback symmetric encryption key (for backward compatibility)
const SECRET_KEY = 'BillSutra-2025-Hotel-PMS-Secret-Key-Change-This';

/**
 * License types and their limits
 */
const LICENSE_TYPES = {
  TRIAL: {
    name: 'Trial',
    maxRooms: 10,
    validDays: 30,
    features: ['basic']
  },
  BASIC: {
    name: 'Basic',
    maxRooms: 20,
    validDays: 365,
    features: ['basic', 'reports']
  },
  PROFESSIONAL: {
    name: 'Professional',
    maxRooms: 50,
    validDays: 365,
    features: ['basic', 'reports', 'advanced', 'multi-user']
  },
  ENTERPRISE: {
    name: 'Enterprise',
    maxRooms: 999,
    validDays: 365,
    features: ['basic', 'reports', 'advanced', 'multi-user', 'api', 'custom']
  }
};

/**
 * Generate a license key using RSA-2048 Digital Signature
 * This is the INDUSTRY-STANDARD approach used by Adobe, Microsoft, Autodesk
 * 
 * @param {Object} options - License options
 * @param {string} options.hotelName - Hotel name
 * @param {string} options.email - Customer email
 * @param {string} options.type - License type (TRIAL, BASIC, PROFESSIONAL, ENTERPRISE)
 * @param {string} options.machineId - Machine ID (optional, for binding)
 * @returns {string} Digitally signed license key
 */
function generateLicenseKey(options) {
  const { hotelName, email, type = 'TRIAL', machineId = null } = options;
  
  if (!LICENSE_TYPES[type]) {
    throw new Error(`Invalid license type: ${type}`);
  }
  
  // Generate unique license ID (like Windows product keys)
  const licenseId = generateLicenseId();
  
  const licenseData = {
    id: licenseId,
    hotelName,
    email,
    type,
    machineId,
    issuedDate: new Date().toISOString(),
    expiryDate: new Date(Date.now() + LICENSE_TYPES[type].validDays * 24 * 60 * 60 * 1000).toISOString(),
    maxRooms: LICENSE_TYPES[type].maxRooms,
    features: LICENSE_TYPES[type].features,
    version: '1.0.0'
  };
  
  // Convert to JSON string
  const licenseJson = JSON.stringify(licenseData);
  
  // Sign with private key (RSA-2048 with SHA-256)
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(licenseJson);
  const signature = sign.sign(PRIVATE_KEY, 'base64');
  
  // Combine data + signature
  const licensePackage = {
    data: licenseData,
    signature: signature
  };
  
  // Encode as base64 URL-safe string
  const licenseKey = Buffer.from(JSON.stringify(licensePackage))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return licenseKey;
}

/**
 * Generate a unique license ID (like Windows: XXXXX-XXXXX-XXXXX-XXXXX)
 */
function generateLicenseId() {
  const segments = [];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars: 0, O, 1, I
  
  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 5; j++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }
  
  return segments.join('-');
}

/**
 * Validate and decode a license key using RSA signature verification
 * This is CRYPTOGRAPHICALLY SECURE - cannot be faked without private key
 * 
 * @param {string} licenseKey - The license key to validate
 * @param {string} machineId - Current machine ID (optional)
 * @returns {Object} Decoded license data with validation status
 */
function validateLicenseKey(licenseKey, machineId = null) {
  try {
    // Restore base64 format
    let encoded = licenseKey
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Add padding if needed
    while (encoded.length % 4 !== 0) {
      encoded += '=';
    }
    
    // Decode
    const licensePackage = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    const { data: licenseData, signature } = licensePackage;
    
    // STEP 1: Verify digital signature (CRITICAL SECURITY CHECK)
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(JSON.stringify(licenseData));
    const isSignatureValid = verify.verify(PUBLIC_KEY, signature, 'base64');
    
    if (!isSignatureValid) {
      return {
        valid: false,
        expired: false,
        machineValid: false,
        signatureValid: false,
        error: 'Invalid license signature - This license key has been tampered with or is fake',
        data: null
      };
    }
    
    // STEP 2: Check expiry date
    const now = new Date();
    const expiryDate = new Date(licenseData.expiryDate);
    const isExpired = now > expiryDate;
    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    // STEP 3: Check machine binding (if license was bound to a machine)
    let isMachineValid = true;
    if (licenseData.machineId && machineId) {
      isMachineValid = licenseData.machineId === machineId;
    }
    
    return {
      valid: !isExpired && isMachineValid,
      expired: isExpired,
      machineValid: isMachineValid,
      signatureValid: isSignatureValid,
      daysRemaining,
      data: licenseData
    };
    
  } catch (error) {
    return {
      valid: false,
      expired: true,
      machineValid: false,
      signatureValid: false,
      error: 'Invalid license key format',
      data: null
    };
  }
}

/**
 * Generate a trial license key
 * @param {string} hotelName - Hotel name
 * @param {string} email - Customer email
 * @returns {string} Trial license key
 */
function generateTrialKey(hotelName, email) {
  return generateLicenseKey({
    hotelName,
    email,
    type: 'TRIAL'
  });
}

/**
 * Check if license is expiring soon (within 30 days)
 * @param {Object} licenseData - License data from validation
 * @returns {boolean} True if expiring soon
 */
function isExpiringSoon(licenseData) {
  if (!licenseData || !licenseData.data) return false;
  
  const expiryDate = new Date(licenseData.data.expiryDate);
  const now = new Date();
  const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  
  return daysRemaining > 0 && daysRemaining <= 30;
}

module.exports = {
  LICENSE_TYPES,
  generateLicenseKey,
  validateLicenseKey,
  generateTrialKey,
  isExpiringSoon
};
