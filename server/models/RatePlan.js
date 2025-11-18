// RatePlan Model for Dynamic Pricing
export const RATE_PLAN_TYPE = {
  BASE: 'BASE',
  SEASONAL: 'SEASONAL',
  CORPORATE: 'CORPORATE',
  WEEKEND: 'WEEKEND',
  PROMOTIONAL: 'PROMOTIONAL'
};

export class RatePlan {
  constructor(data) {
    this.id = data.id || null;
    this.hotelId = data.hotelId; // Required for multi-tenancy
    this.name = data.name;
    this.code = data.code || this.generateCode(data.name);
    this.type = data.type || RATE_PLAN_TYPE.BASE;
    this.roomTypeId = data.roomTypeId || null; // null means applies to all types
    this.baseRateAdjustment = data.baseRateAdjustment || 0; // Amount or percentage
    this.adjustmentType = data.adjustmentType || 'PERCENTAGE'; // PERCENTAGE or FIXED
    this.validFrom = data.validFrom || null;
    this.validTo = data.validTo || null;
    this.daysOfWeek = data.daysOfWeek || []; // [0-6] where 0 is Sunday
    this.minStay = data.minStay || 1;
    this.maxStay = data.maxStay || null;
    this.includesBreakfast = data.includesBreakfast || false;
    this.refundable = data.refundable !== undefined ? data.refundable : true;
    this.cancellationPolicy = data.cancellationPolicy || '';
    this.active = data.active !== undefined ? data.active : true;
    this.priority = data.priority || 0; // Higher priority wins when multiple plans apply
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  generateCode(name) {
    return name.toUpperCase().replace(/\s+/g, '_').substring(0, 15);
  }

  validate() {
    const errors = [];
    
    if (!this.hotelId) errors.push('Hotel ID is required');
    if (!this.name || this.name.trim() === '') errors.push('Name is required');
    if (!Object.values(RATE_PLAN_TYPE).includes(this.type)) {
      errors.push(`Invalid type. Must be one of: ${Object.values(RATE_PLAN_TYPE).join(', ')}`);
    }
    if (this.minStay < 1) errors.push('Min stay must be at least 1');
    if (this.maxStay !== null && this.maxStay < this.minStay) {
      errors.push('Max stay must be greater than or equal to min stay');
    }
    
    return errors;
  }

  isValid(date) {
    if (!this.active) return false;
    
    const bookingDate = new Date(date);
    
    if (this.validFrom && new Date(this.validFrom) > bookingDate) return false;
    if (this.validTo && new Date(this.validTo) < bookingDate) return false;
    
    if (this.daysOfWeek.length > 0) {
      const dayOfWeek = bookingDate.getDay();
      if (!this.daysOfWeek.includes(dayOfWeek)) return false;
    }
    
    return true;
  }

  calculateRate(baseRate) {
    if (this.adjustmentType === 'PERCENTAGE') {
      return baseRate * (1 + this.baseRateAdjustment / 100);
    } else {
      return baseRate + this.baseRateAdjustment;
    }
  }
}
