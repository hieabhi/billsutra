// Hotel Model
export class Hotel {
  constructor(data) {
    this.id = data.id || `hotel-${Date.now()}`;
    this.name = data.name;
    this.code = data.code;
    this.status = data.status || 'trial';
    this.address = data.address || {};
    this.contact = data.contact || {};
    this.gstNumber = data.gstNumber || '';
    this.subscription = data.subscription || {
      plan: 'basic',
      startDate: new Date().toISOString(),
      endDate: null,
      maxRooms: 50
    };
    this.settings = data.settings || {
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      defaultCheckIn: '14:00',
      defaultCheckOut: '11:00',
      invoicePrefix: 'INV',
      nextBillNumber: 1
    };
    this.createdAt = data.createdAt || new Date().toISOString();
    this.createdBy = data.createdBy;
  }

  validate() {
    if (!this.name) throw new Error('Hotel name is required');
    if (!this.code) throw new Error('Hotel code is required');
    return true;
  }
}
