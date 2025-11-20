/**
 * Supabase Client Configuration
 * Uses ANON_KEY with permissive RLS policies
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Use SERVICE_KEY to bypass RLS since backend handles its own auth/tenant isolation
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

export default supabase;

/**
 * Map column names from Supabase to application format
 */
export const mapRoomFromDB = (room) => ({
  _id: room.id,
  hotelId: room.tenant_id,
  number: room.room_number,
  type: room.room_type || 'Standard',
  status: room.status,
  housekeepingStatus: room.housekeeping_status || 'CLEAN',
  rate: room.base_price || 0,
  floor: room.floor,
  roomTypeId: room.room_type,
  floorId: room.floor ? `floor-${room.floor}` : null,
  amenities: room.amenities || [],
  features: room.amenities || [],
  notes: room.notes,
  isBlocked: room.status === 'BLOCKED',
  blockReason: room.notes,
  createdAt: room.created_at,
  updatedAt: room.updated_at
});

export const mapBookingFromDB = (booking) => ({
  _id: booking.id,
  hotelId: booking.tenant_id,
  reservationNumber: booking.reservation_number,
  roomId: booking.room_id,
  roomNumber: booking.room_number,
  guest: { name: booking.guest_name },
  guestName: booking.guest_name,
  checkInDate: booking.check_in,
  checkOutDate: booking.check_out,
  rate: booking.room_rate || 0,
  nights: booking.number_of_nights || 1,
  amount: booking.total_amount || booking.amount || 0,
  balance: booking.total_amount || booking.amount || 0,
  status: booking.status,
  guestsCount: 1,
  paymentMethod: 'Cash',
  notes: '',
  folio: { lines: [], payments: [], total: 0, balance: 0 },
  createdAt: booking.created_at,
  updatedAt: booking.updated_at,
  billId: booking.bill_id,
  billNumber: booking.bill_number
});

export const mapBillFromDB = (bill) => ({
  _id: bill.id,
  hotelId: bill.tenant_id,
  billNumber: bill.bill_number,
  date: bill.date,
  customer: {
    name: bill.customer_name,
    phone: bill.customer_phone,
    email: bill.customer_email,
    idProof: bill.customer_id_proof,
    address: bill.customer_address
  },
  items: bill.items || [],
  subtotal: bill.subtotal || 0,
  cgstTotal: bill.cgst_total || 0,
  sgstTotal: bill.sgst_total || 0,
  igstTotal: bill.igst_total || 0,
  totalTax: bill.total_tax || 0,
  grandTotal: bill.grand_total || 0,
  paymentMethod: bill.payment_method || 'Cash',
  status: bill.status || 'Paid',
  advancePayment: bill.advance_payment || 0,
  balanceDue: bill.balance_due || 0,
  checkInDate: bill.check_in_date,
  checkOutDate: bill.check_out_date,
  nights: bill.nights || 0,
  notes: bill.notes,
  createdAt: bill.created_at
});

export const mapItemFromDB = (item) => ({
  _id: item.id,
  hotelId: item.tenant_id,
  name: item.name,
  category: item.category,
  rate: item.price || 0,
  price: item.price || 0,
  hsn: item.hsn,
  cgst: item.cgst || 0,
  sgst: item.sgst || 0,
  igst: item.igst || 0,
  description: item.description,
  isActive: item.is_active !== false,
  createdAt: item.created_at,
  updatedAt: item.updated_at
});

export const mapCustomerFromDB = (customer) => ({
  _id: customer.id,
  hotelId: customer.tenant_id,
  name: customer.name,
  phone: customer.phone,
  email: customer.email,
  address: customer.address,
  idProofType: customer.id_proof_type,
  idProofNumber: customer.id_proof_number,
  gstNumber: customer.gstin,
  gstin: customer.gstin,
  type: 'Walk-in',
  createdAt: customer.created_at,
  updatedAt: customer.updated_at
});

export const mapHousekeepingFromDB = (task) => ({
  _id: task.id,
  hotelId: task.tenant_id,
  roomId: task.room_id,
  roomNumber: task.room_number,
  type: task.task_type,
  status: task.status,
  priority: task.priority,
  assignedTo: task.assigned_to,
  assignedToName: '',
  description: task.notes || '',
  notes: task.notes || '',
  reportedIssues: [],
  checklist: [],
  estimatedDuration: 30,
  actualDuration: 0,
  startTime: task.created_at,
  completedTime: task.status === 'COMPLETED' ? task.updated_at : null,
  verifiedBy: null,
  verifiedTime: null,
  nextArrivalTime: null,
  bookingId: null,
  task: task.notes || '',
  dueDate: '',
  createdAt: task.created_at,
  updatedAt: task.updated_at
});

export const mapBookingToDB = (booking) => ({
  id: booking._id,
  tenant_id: booking.hotelId,
  room_id: booking.roomId,
  guest_id: booking.guestId || null,
  check_in_date: booking.checkInDate,
  check_out_date: booking.checkOutDate,
  status: booking.status,
  adults: booking.adults || 1,
  children: booking.children || 0,
  total_amount: booking.totalAmount || 0,
  paid_amount: booking.paidAmount || 0,
  notes: booking.notes || (booking.guestName ? `Guest: ${booking.guestName}` : '')
});

export const mapBookingFromDBComplete = (booking) => {
  if (!booking) return null;
  
  return {
    _id: booking.id,
    id: booking.id, // Keep both for compatibility
    hotelId: booking.tenant_id,
    roomId: booking.room_id,
    roomNumber: booking.room_number,
    guestId: booking.guest_id,
    guestName: booking.guest_name || booking.notes?.replace('Guest: ', '') || '',
    guestPhone: booking.guest_phone,
    guestEmail: booking.guest_email,
    checkInDate: booking.check_in_date,
    checkOutDate: booking.check_out_date,
    actualCheckInDate: booking.actual_check_in_date,
    actualCheckOutDate: booking.actual_check_out_date,
    status: booking.status,
    reservationNumber: booking.reservation_number,
    nights: booking.nights,
    amount: booking.amount,
    advancePayment: booking.advance_payment,
    adults: booking.guest_counts?.adults || 1,
    children: booking.guest_counts?.children || 0,
    infants: booking.guest_counts?.infants || 0,
    guestCounts: booking.guest_counts,
    additionalGuests: booking.additional_guests || [],
    totalAmount: booking.amount || 0,
    paidAmount: booking.advance_payment || 0,
    balance: (booking.amount || 0) - (booking.advance_payment || 0),
    paymentMethod: booking.payment_method,
    bookingSource: booking.booking_source,
    specialRequests: booking.special_requests,
    folio: booking.folio,
    billId: booking.bill_id,
    billNumber: booking.bill_number,
    notes: booking.notes || '',
    createdAt: booking.created_at,
    updatedAt: booking.updated_at
  };
};

export const mapBillToDB = (bill) => ({
  id: bill._id,
  tenant_id: bill.hotelId,
  booking_id: bill.bookingId || null,
  customer_id: bill.customerId || null,
  bill_number: bill.billNumber,
  bill_date: bill.billDate || bill.date || new Date().toISOString(),
  items: JSON.stringify(bill.items || []),
  subtotal: bill.subtotal || 0,
  cgst_amount: bill.cgstAmount || 0,
  sgst_amount: bill.sgstAmount || 0,
  igst_amount: bill.igstAmount || 0,
  total_amount: bill.totalAmount || bill.grandTotal || 0,
  payment_method: bill.paymentMethod || 'Cash',
  payment_status: bill.paymentStatus || bill.status || 'PENDING'
});

export const mapBillFromDBComplete = (bill) => ({
  _id: bill.id,
  hotelId: bill.tenant_id,
  bookingId: bill.booking_id,
  customerId: bill.customer_id,
  billNumber: bill.bill_number,
  billDate: bill.bill_date,
  date: bill.bill_date,
  items: typeof bill.items === 'string' ? JSON.parse(bill.items) : (bill.items || []),
  subtotal: bill.subtotal || 0,
  cgstAmount: bill.cgst_amount || 0,
  sgstAmount: bill.sgst_amount || 0,
  igstAmount: bill.igst_amount || 0,
  totalAmount: bill.total_amount || 0,
  grandTotal: bill.total_amount || 0,
  paymentMethod: bill.payment_method || 'Cash',
  paymentStatus: bill.payment_status || 'PENDING',
  status: bill.payment_status || 'PENDING',
  createdAt: bill.created_at,
  updatedAt: bill.updated_at
});
