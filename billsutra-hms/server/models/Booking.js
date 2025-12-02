// Booking/Reservation Model with Enhanced Status and Validation
export const BOOKING_STATUS = {
  INQUIRY: 'INQUIRY',
  TENTATIVE: 'TENTATIVE',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  CHECKED_OUT: 'CHECKED_OUT',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW'
};

export class Booking {
  constructor(data) {
    this.id = data.id || null;
    this.hotelId = data.hotelId; // Required for multi-tenancy
    this.reservationNumber = data.reservationNumber;
    this.guestName = data.guestName;
    this.guestEmail = data.guestEmail || '';
    this.guestPhone = data.guestPhone || '';
    this.guestAddress = data.guestAddress || '';
    this.guestIdType = data.guestIdType || '';
    this.guestIdNumber = data.guestIdNumber || '';
    this.roomId = data.roomId;
    this.roomNumber = data.roomNumber || '';
    this.roomTypeId = data.roomTypeId;
    this.checkInDate = data.checkInDate;
    this.checkOutDate = data.checkOutDate;
    this.actualCheckInTime = data.actualCheckInTime || null;
    this.actualCheckOutTime = data.actualCheckOutTime || null;
    this.adults = data.adults || 1;
    this.children = data.children || 0;
    this.status = data.status || BOOKING_STATUS.INQUIRY;
    this.ratePerNight = data.ratePerNight || 0;
    this.totalAmount = data.totalAmount || 0;
    this.paidAmount = data.paidAmount || 0;
    this.balanceAmount = data.balanceAmount || 0;
    this.gstAmount = data.gstAmount || 0;
    this.discountAmount = data.discountAmount || 0;
    this.paymentMethod = data.paymentMethod || '';
    this.source = data.source || 'WALK_IN'; // WALK_IN, ONLINE, PHONE, AGENT
    this.specialRequests = data.specialRequests || '';
    this.notes = data.notes || '';
    this.folioId = data.folioId || null;
    this.createdBy = data.createdBy || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  validate() {
    const errors = [];
    
    if (!this.hotelId) errors.push('Hotel ID is required');
    if (!this.guestName || this.guestName.trim() === '') errors.push('Guest name is required');
    if (!this.roomId) errors.push('Room is required');
    if (!this.checkInDate) errors.push('Check-in date is required');
    if (!this.checkOutDate) errors.push('Check-out date is required');
    
    const checkIn = new Date(this.checkInDate);
    const checkOut = new Date(this.checkOutDate);
    
    if (checkOut <= checkIn) {
      errors.push('Check-out date must be after check-in date');
    }
    
    if (!Object.values(BOOKING_STATUS).includes(this.status)) {
      errors.push(`Invalid status. Must be one of: ${Object.values(BOOKING_STATUS).join(', ')}`);
    }
    
    if (this.adults < 1) errors.push('At least 1 adult is required');
    if (this.children < 0) errors.push('Children count cannot be negative');
    
    return errors;
  }

  calculateNights() {
    const checkIn = new Date(this.checkInDate);
    const checkOut = new Date(this.checkOutDate);
    const diffTime = Math.abs(checkOut - checkIn);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  calculateTotalAmount() {
    const nights = this.calculateNights();
    const baseAmount = this.ratePerNight * nights;
    const afterDiscount = baseAmount - this.discountAmount;
    return afterDiscount + this.gstAmount;
  }

  isActive() {
    return [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CHECKED_IN].includes(this.status);
  }

  canCheckIn() {
    return this.status === BOOKING_STATUS.CONFIRMED;
  }

  canCheckOut() {
    return this.status === BOOKING_STATUS.CHECKED_IN;
  }

  canCancel() {
    return [BOOKING_STATUS.INQUIRY, BOOKING_STATUS.TENTATIVE, BOOKING_STATUS.CONFIRMED].includes(this.status);
  }
}
