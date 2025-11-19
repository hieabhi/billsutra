import validator from 'validator';

/**
 * Input Validation Middleware
 * SECURITY: Sanitize and validate all user inputs
 */

// Sanitize string inputs
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return validator.escape(validator.trim(str));
};

// Validate email
export const isValidEmail = (email) => {
  return validator.isEmail(email || '');
};

// Validate phone
export const isValidPhone = (phone) => {
  if (!phone) return false;
  // Indian phone numbers: 10 digits
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 12; // With country code
};

// Validate date
export const isValidDate = (dateStr) => {
  if (!dateStr) return false;
  return validator.isISO8601(dateStr);
};

// Validate booking input
export const validateBookingInput = (req, res, next) => {
  const { guest, checkInDate, checkOutDate, roomNumber } = req.body;

  const errors = [];

  // Validate guest
  if (!guest || !guest.name) {
    errors.push('Guest name is required');
  } else if (guest.name.length > 100) {
    errors.push('Guest name is too long (max 100 characters)');
  }

  if (guest.email && !isValidEmail(guest.email)) {
    errors.push('Invalid email format');
  }

  if (guest.phone && !isValidPhone(guest.phone)) {
    errors.push('Invalid phone number (must be 10 digits)');
  }

  // Validate dates
  if (!checkInDate || !isValidDate(checkInDate)) {
    errors.push('Invalid check-in date');
  }

  if (!checkOutDate || !isValidDate(checkOutDate)) {
    errors.push('Invalid check-out date');
  }

  if (checkInDate && checkOutDate && checkInDate >= checkOutDate) {
    errors.push('Check-out date must be after check-in date');
  }

  // Validate room
  if (!roomNumber) {
    errors.push('Room number is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join(', '), errors });
  }

  // Sanitize inputs
  if (guest.name) guest.name = sanitizeString(guest.name);
  if (guest.email) guest.email = validator.normalizeEmail(guest.email);
  if (guest.address) guest.address = sanitizeString(guest.address);

  next();
};

// Validate customer input
export const validateCustomerInput = (req, res, next) => {
  const { name, email, phone } = req.body;

  const errors = [];

  if (!name || name.length < 2) {
    errors.push('Name must be at least 2 characters');
  } else if (name.length > 100) {
    errors.push('Name is too long (max 100 characters)');
  }

  if (email && !isValidEmail(email)) {
    errors.push('Invalid email format');
  }

  if (phone && !isValidPhone(phone)) {
    errors.push('Invalid phone number');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join(', '), errors });
  }

  // Sanitize
  if (name) req.body.name = sanitizeString(name);
  if (email) req.body.email = validator.normalizeEmail(email);

  next();
};

// Validate item input
export const validateItemInput = (req, res, next) => {
  const { name, rate, category } = req.body;

  const errors = [];

  if (!name || name.length < 2) {
    errors.push('Item name must be at least 2 characters');
  }

  if (rate !== undefined && (isNaN(rate) || rate < 0)) {
    errors.push('Rate must be a positive number');
  }

  if (category && category.length > 50) {
    errors.push('Category is too long');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join(', '), errors });
  }

  // Sanitize
  if (name) req.body.name = sanitizeString(name);
  if (category) req.body.category = sanitizeString(category);

  next();
};

// Validate room input
export const validateRoomInput = (req, res, next) => {
  const { number, type, rate, floor } = req.body;

  const errors = [];

  if (!number) {
    errors.push('Room number is required');
  }

  if (!type) {
    errors.push('Room type is required');
  }

  if (rate !== undefined && (isNaN(rate) || rate < 0)) {
    errors.push('Rate must be a positive number');
  }

  if (floor && (isNaN(floor) || floor < 0)) {
    errors.push('Floor must be a positive number');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join(', '), errors });
  }

  // Sanitize
  if (number) req.body.number = sanitizeString(number);
  if (type) req.body.type = sanitizeString(type);

  next();
};

// Generic number validation
export const validatePositiveNumber = (value, fieldName = 'Value') => {
  if (value === undefined || value === null) return null;
  const num = Number(value);
  if (isNaN(num) || num < 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }
  return num;
};

// SQL Injection prevention (even though we use JSON, good practice)
export const preventSQLInjection = (str) => {
  if (typeof str !== 'string') return str;
  // Remove common SQL injection patterns
  const dangerous = ['--', ';', '/*', '*/', 'xp_', 'sp_', 'DROP', 'DELETE', 'INSERT', 'UPDATE', 'SELECT'];
  let safe = str;
  dangerous.forEach(pattern => {
    safe = safe.replace(new RegExp(pattern, 'gi'), '');
  });
  return safe;
};

export default {
  sanitizeString,
  isValidEmail,
  isValidPhone,
  isValidDate,
  validateBookingInput,
  validateCustomerInput,
  validateItemInput,
  validateRoomInput,
  validatePositiveNumber,
  preventSQLInjection
};
