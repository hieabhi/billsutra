import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import Bill from '../models/Bill.js';
import Settings from '../models/Settings.js';
import { readJSON, writeJSON } from '../utils/fileStore.js';

const FILE_BILLS = 'bills.json';
const FILE_SETTINGS = 'settings.json';

function isMongoConnected() {
  // Be strict: require an active DB handle to avoid buffered ops/timeouts
  return mongoose.connection?.readyState === 1 && !!mongoose.connection?.db;
}

// ------- File-store helpers -------
function readAllBills() {
  return readJSON(FILE_BILLS, []);
}

function saveAllBills(bills) {
  writeJSON(FILE_BILLS, bills);
}

function readSettings() {
  const def = { hotelName: 'Hotel Name', invoicePrefix: 'INV', nextBillNumber: 1 };
  const s = readJSON(FILE_SETTINGS, def);
  // ensure defaults
  if (!s.invoicePrefix) s.invoicePrefix = 'INV';
  if (typeof s.nextBillNumber !== 'number') s.nextBillNumber = 1;
  return s;
}

function saveSettings(s) {
  writeJSON(FILE_SETTINGS, s);
}

function pad(num, size = 5) {
  const s = String(num);
  return s.length >= size ? s : '0'.repeat(size - s.length) + s;
}

function calcItemTotals(item) {
  const qty = Number(item.quantity || 0);
  const rate = Number(item.rate || 0);
  const cgst = Number(item.cgst || 0);
  const sgst = Number(item.sgst || 0);
  const igst = Number(item.igst || 0);
  const amount = qty * rate;
  const taxAmount = amount * (cgst + sgst + igst) / 100;
  const totalAmount = amount + taxAmount;
  return {
    ...item,
    quantity: qty,
    rate: rate,
    cgst, sgst, igst,
    amount: Number(amount.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
  };
}

function computeBillTotals(payload) {
  const items = (payload.items || []).map(calcItemTotals);
  const subtotal = items.reduce((s, it) => s + it.amount, 0);
  const cgstTotal = items.reduce((s, it) => s + (it.amount * it.cgst / 100), 0);
  const sgstTotal = items.reduce((s, it) => s + (it.amount * it.sgst / 100), 0);
  const igstTotal = items.reduce((s, it) => s + (it.amount * it.igst / 100), 0);
  const totalTax = cgstTotal + sgstTotal + igstTotal;
  const grandTotal = subtotal + totalTax;
  return {
    items,
    subtotal: Number(subtotal.toFixed(2)),
    cgstTotal: Number(cgstTotal.toFixed(2)),
    sgstTotal: Number(sgstTotal.toFixed(2)),
    igstTotal: Number(igstTotal.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2)),
  };
}

export const billsRepo = {
  async list(query = {}) {
    if (isMongoConnected()) {
      const mongoQuery = {};
      if (query.startDate && query.endDate) {
        mongoQuery.date = { $gte: new Date(query.startDate), $lte: new Date(query.endDate) };
      }
      if (query.status) mongoQuery.status = query.status;
      return await Bill.find(mongoQuery).sort({ date: -1 });
    }

    let bills = readAllBills();
    if (query.startDate && query.endDate) {
      const s = new Date(query.startDate).getTime();
      const e = new Date(query.endDate).getTime();
      bills = bills.filter(b => {
        const t = new Date(b.date || b.createdAt || Date.now()).getTime();
        return t >= s && t <= e;
      });
    }
    if (query.status) bills = bills.filter(b => b.status === query.status);
    return bills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async getById(id) {
    if (isMongoConnected()) {
      return await Bill.findById(id);
    }
    const bills = readAllBills();
    return bills.find(b => b._id === id);
  },

  async create(data) {
    if (isMongoConnected()) {
      // Ensure settings exist and get next bill number
      let settings = await Settings.findOne();
      if (!settings) {
        settings = await Settings.create({ hotelName: 'Hotel Name', invoicePrefix: 'INV', nextBillNumber: 1 });
      }
      const billNumber = `${settings.invoicePrefix}${pad(settings.nextBillNumber)}`;
      const totals = computeBillTotals(data);
      const bill = new Bill({ ...data, ...totals, billNumber });
      const saved = await bill.save();
      settings.nextBillNumber += 1;
      await settings.save();
      return saved;
    }

    // file store
    const nowISO = new Date().toISOString();
    const settings = readSettings();
    const billNumber = `${settings.invoicePrefix}${pad(settings.nextBillNumber)}`;

    const totals = computeBillTotals(data);
    const bills = readAllBills();
    const bill = {
      _id: uuidv4(),
      billNumber,
      date: data.date ? new Date(data.date).toISOString() : nowISO,
      customer: data.customer || { name: 'Walk-in' },
      paymentMethod: data.paymentMethod || 'Cash',
      notes: data.notes || '',
      status: data.status || 'Paid',
      // INDUSTRY STANDARD: Store advance payment and booking details (Opera PMS, Maestro, Mews)
      advancePayment: data.advancePayment || 0,
      balanceDue: data.balanceDue || 0,
      checkInDate: data.checkInDate || null,
      checkOutDate: data.checkOutDate || null,
      nights: data.nights || 0,
      ...totals,
      createdAt: nowISO,
      updatedAt: nowISO,
    };
    bills.push(bill);
    saveAllBills(bills);
    // increment settings
    settings.nextBillNumber += 1;
    saveSettings(settings);
    return bill;
  },

  async update(id, data) {
    if (isMongoConnected()) {
      // Recompute totals if items or rates are changed
      const totals = data.items ? computeBillTotals(data) : {};
      return await Bill.findByIdAndUpdate(id, { ...data, ...totals }, { new: true });
    }
    const bills = readAllBills();
    const idx = bills.findIndex(b => b._id === id);
    if (idx === -1) return null;
    const nowISO = new Date().toISOString();
    const totals = data.items ? computeBillTotals({ ...bills[idx], ...data }) : {};
    bills[idx] = { ...bills[idx], ...data, ...totals, updatedAt: nowISO };
    saveAllBills(bills);
    return bills[idx];
  },

  async remove(id) {
    if (isMongoConnected()) {
      return await Bill.findByIdAndDelete(id);
    }
    const bills = readAllBills();
    const idx = bills.findIndex(b => b._id === id);
    if (idx === -1) return null;
    const [removed] = bills.splice(idx, 1);
    saveAllBills(bills);
    return removed;
  },

  async dashboardStats() {
    if (isMongoConnected()) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const todayBills = await Bill.find({ date: { $gte: today }, status: 'Paid' });
      const monthlyBills = await Bill.find({ date: { $gte: thisMonth }, status: 'Paid' });
      const totalBills = await Bill.countDocuments();

      const todayRevenue = todayBills.reduce((s, b) => s + (b.grandTotal || 0), 0);
      const monthlyRevenue = monthlyBills.reduce((s, b) => s + (b.grandTotal || 0), 0);

      return {
        todayRevenue,
        todayBillsCount: todayBills.length,
        monthlyRevenue,
        monthlyBillsCount: monthlyBills.length,
        totalBills,
      };
    }

    const bills = readAllBills();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthStr = thisMonth.toISOString().slice(0, 10);

    // Industry Standard: Include ALL bills (Paid + Unpaid) for revenue calculation
    // Opera PMS, Mews, Cloudbeds show total revenue including unpaid folios
    const todayBills = bills.filter(b => {
      const billDate = b.date ? new Date(b.date).toISOString().slice(0, 10) : '';
      return billDate === todayStr;
    });
    
    const monthlyBills = bills.filter(b => {
      const billDate = b.date ? new Date(b.date).toISOString().slice(0, 10) : '';
      return billDate >= thisMonthStr;
    });

    const sum = (arr) => arr.reduce((s, b) => s + Number(b.grandTotal || 0), 0);

    return {
      todayRevenue: Number(sum(todayBills).toFixed(2)),
      todayBillsCount: todayBills.length,
      monthlyRevenue: Number(sum(monthlyBills).toFixed(2)),
      monthlyBillsCount: monthlyBills.length,
      totalBills: bills.length,
      weeklyRevenue: 0 // TODO: Calculate last 7 days revenue
    };
  }
};
