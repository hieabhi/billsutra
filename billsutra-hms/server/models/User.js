// User Model
export class User {
  constructor(data) {
    this.id = data.id || `user-${Date.now()}`;
    this.hotelId = data.hotelId || null; // null for super admin
    this.username = data.username;
    this.email = data.email;
    this.password = data.password; // Should be hashed
    this.role = data.role; // superAdmin, hotelAdmin, frontDesk, housekeeping, accounts
    this.permissions = data.permissions || [];
    this.status = data.status || 'active';
    this.profile = data.profile || {};
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  validate() {
    if (!this.username) throw new Error('Username is required');
    if (!this.email) throw new Error('Email is required');
    if (!this.password) throw new Error('Password is required');
    if (!this.role) throw new Error('Role is required');
    
    const validRoles = ['superAdmin', 'hotelAdmin', 'frontDesk', 'housekeeping', 'accounts'];
    if (!validRoles.includes(this.role)) {
      throw new Error('Invalid role');
    }
    
    return true;
  }

  isSuperAdmin() {
    return this.role === 'superAdmin' && this.hotelId === null;
  }

  canAccessHotel(hotelId) {
    if (this.isSuperAdmin()) return true;
    return this.hotelId === hotelId;
  }
}
