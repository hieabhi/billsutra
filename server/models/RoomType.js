// RoomType Model with Multi-Tenancy and Pricing
export class RoomType {
  constructor(data) {
    this.id = data.id || null;
    this.hotelId = data.hotelId; // Required for multi-tenancy
    this.name = data.name;
    this.code = data.code || this.generateCode(data.name);
    this.description = data.description || '';
    this.baseRate = data.baseRate || 0;
    this.maxOccupancy = data.maxOccupancy || 2;
    this.defaultAmenities = data.defaultAmenities || [];
    this.images = data.images || [];
    this.active = data.active !== undefined ? data.active : true;
    this.displayOrder = data.displayOrder || 0;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  generateCode(name) {
    return name.toUpperCase().replace(/\s+/g, '_').substring(0, 10);
  }

  validate() {
    const errors = [];
    
    if (!this.hotelId) errors.push('Hotel ID is required');
    if (!this.name || this.name.trim() === '') errors.push('Name is required');
    if (this.baseRate < 0) errors.push('Base rate cannot be negative');
    if (this.maxOccupancy < 1) errors.push('Max occupancy must be at least 1');
    
    return errors;
  }

  // Calculate GST based on Indian hotel tax slabs
  calculateGST(amount) {
    if (amount < 1000) {
      return { rate: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
    } else if (amount >= 1000 && amount < 2500) {
      return { rate: 12, cgst: 6, sgst: 6, igst: 12, total: amount * 0.12 };
    } else if (amount >= 2500 && amount < 7500) {
      return { rate: 18, cgst: 9, sgst: 9, igst: 18, total: amount * 0.18 };
    } else {
      return { rate: 28, cgst: 14, sgst: 14, igst: 28, total: amount * 0.28 };
    }
  }
}
