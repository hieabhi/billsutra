import { v4 as uuidv4 } from 'uuid';
import supabase, { mapBillFromDBComplete, mapBillToDB } from '../config/supabase.js';

console.log('🚀 LOADING SUPABASE BILLSREPO');

function getTenantId(hotelId) {
  return hotelId;
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

export const billsRepo = {
  async list(query = {}) {
    try {
      const tenantId = getTenantId(query.hotelId);
      
      let supaQuery = supabase
        .from('bills')
        .select('*')
        .eq('tenant_id', tenantId);
      
      if (query.startDate) supaQuery = supaQuery.gte('bill_date', query.startDate);
      if (query.endDate) supaQuery = supaQuery.lte('bill_date', query.endDate);
      if (query.status) supaQuery = supaQuery.eq('payment_status', query.status);
      
      supaQuery = supaQuery.order('bill_date', { ascending: false });
      
      const { data, error } = await supaQuery;
      if (error) throw error;
      
      return (data || []).map(mapBillFromDBComplete);
    } catch (error) {
      console.error('[ERROR] Bills list:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      
      return mapBillFromDBComplete(data);
    } catch (error) {
      console.error('[ERROR] Get bill by ID:', error);
      return null;
    }
  },

  async getByBillNumber(billNumber, hotelId) {
    try {
      const tenantId = getTenantId(hotelId);
      
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('bill_number', billNumber)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      
      return mapBillFromDBComplete(data);
    } catch (error) {
      console.error('[ERROR] Get bill by number:', error);
      return null;
    }
  },

  async generateBillNumber(hotelId) {
    try {
      const tenantId = getTenantId(hotelId);
      
      // Get the latest bill number for this tenant
      const { data, error } = await supabase
        .from('bills')
        .select('bill_number')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastBillNumber = data[0].bill_number;
        const match = lastBillNumber.match(/\d+$/);
        if (match) {
          nextNumber = parseInt(match[0]) + 1;
        }
      }
      
      return `INV${pad(nextNumber)}`;
    } catch (error) {
      console.error('[ERROR] Generate bill number:', error);
      return `INV${pad(1)}`;
    }
  },

  async create(billData) {
    try {
      const tenantId = getTenantId(billData.hotelId);
      const newId = uuidv4();
      const now = new Date().toISOString();
      
      // Generate bill number if not provided
      const billNumber = billData.billNumber || await this.generateBillNumber(billData.hotelId);
      
      // Calculate totals from items
      const itemsWithTotals = (billData.items || []).map(calcItemTotals);
      const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.amount, 0);
      const cgstAmount = itemsWithTotals.reduce((sum, item) => sum + (item.amount * item.cgst / 100), 0);
      const sgstAmount = itemsWithTotals.reduce((sum, item) => sum + (item.amount * item.sgst / 100), 0);
      const igstAmount = itemsWithTotals.reduce((sum, item) => sum + (item.amount * item.igst / 100), 0);
      const totalAmount = subtotal + cgstAmount + sgstAmount + igstAmount;
      
      const bill = {
        id: newId,
        tenant_id: tenantId,
        booking_id: billData.bookingId || null,
        customer_id: billData.customerId || null,
        bill_number: billNumber,
        bill_date: billData.billDate || billData.date || now,
        items: JSON.stringify(itemsWithTotals),
        subtotal: Number(subtotal.toFixed(2)),
        cgst_amount: Number(cgstAmount.toFixed(2)),
        sgst_amount: Number(sgstAmount.toFixed(2)),
        igst_amount: Number(igstAmount.toFixed(2)),
        total_amount: Number(totalAmount.toFixed(2)),
        payment_method: billData.paymentMethod || 'Cash',
        payment_status: billData.paymentStatus || billData.status || 'PENDING',
        created_at: now,
        updated_at: now
      };
      
      const { data, error } = await supabase
        .from('bills')
        .insert(bill)
        .select()
        .single();
      
      if (error) throw error;
      
      return mapBillFromDBComplete(data);
    } catch (error) {
      console.error('[ERROR] Create bill:', error);
      throw error;
    }
  },

  async update(id, updates) {
    try {
      const tenantId = getTenantId(updates.hotelId);
      const now = new Date().toISOString();
      
      const updateData = {
        updated_at: now
      };
      
      if (updates.bookingId !== undefined) updateData.booking_id = updates.bookingId;
      if (updates.customerId !== undefined) updateData.customer_id = updates.customerId;
      if (updates.billDate || updates.date) updateData.bill_date = updates.billDate || updates.date;
      if (updates.paymentMethod) updateData.payment_method = updates.paymentMethod;
      if (updates.paymentStatus || updates.status) updateData.payment_status = updates.paymentStatus || updates.status;
      
      if (updates.items) {
        const itemsWithTotals = updates.items.map(calcItemTotals);
        const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.amount, 0);
        const cgstAmount = itemsWithTotals.reduce((sum, item) => sum + (item.amount * item.cgst / 100), 0);
        const sgstAmount = itemsWithTotals.reduce((sum, item) => sum + (item.amount * item.sgst / 100), 0);
        const igstAmount = itemsWithTotals.reduce((sum, item) => sum + (item.amount * item.igst / 100), 0);
        const totalAmount = subtotal + cgstAmount + sgstAmount + igstAmount;
        
        updateData.items = JSON.stringify(itemsWithTotals);
        updateData.subtotal = Number(subtotal.toFixed(2));
        updateData.cgst_amount = Number(cgstAmount.toFixed(2));
        updateData.sgst_amount = Number(sgstAmount.toFixed(2));
        updateData.igst_amount = Number(igstAmount.toFixed(2));
        updateData.total_amount = Number(totalAmount.toFixed(2));
      }
      
      const { data, error } = await supabase
        .from('bills')
        .update(updateData)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();
      
      if (error) throw error;
      
      return mapBillFromDBComplete(data);
    } catch (error) {
      console.error('[ERROR] Update bill:', error);
      throw error;
    }
  },

  async remove(id, hotelId) {
    try {
      const tenantId = getTenantId(hotelId);
      
      const bill = await this.getById(id);
      
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      
      return bill;
    } catch (error) {
      console.error('[ERROR] Delete bill:', error);
      throw error;
    }
  },

  async getStats(hotelId, startDate, endDate) {
    try {
      const tenantId = getTenantId(hotelId);
      
      let query = supabase
        .from('bills')
        .select('*')
        .eq('tenant_id', tenantId);
      
      if (startDate) query = query.gte('bill_date', startDate);
      if (endDate) query = query.lte('bill_date', endDate);
      
      const { data, error } = await query;
      if (error) throw error;
      
      const bills = (data || []).map(mapBillFromDBComplete);
      
      const totalRevenue = bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
      const paidBills = bills.filter(b => b.paymentStatus === 'PAID' || b.paymentStatus === 'Paid');
      const pendingBills = bills.filter(b => b.paymentStatus === 'PENDING' || b.paymentStatus === 'Pending');
      
      return {
        totalBills: bills.length,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        paidBills: paidBills.length,
        pendingBills: pendingBills.length,
        averageBillAmount: bills.length > 0 ? Number((totalRevenue / bills.length).toFixed(2)) : 0
      };
    } catch (error) {
      console.error('[ERROR] Get bill stats:', error);
      return {
        totalBills: 0,
        totalRevenue: 0,
        paidBills: 0,
        pendingBills: 0,
        averageBillAmount: 0
      };
    }
  },

  async dashboardStats() {
    try {
      // Return simple stats for dashboard (no tenant filtering needed)
      const { data, error } = await supabase
        .from('bills')
        .select('total_amount, payment_status');
      
      if (error) throw error;
      
      const bills = data || [];
      const totalRevenue = bills.reduce((sum, bill) => sum + (Number(bill.total_amount) || 0), 0);
      const paidBills = bills.filter(b => b.payment_status === 'PAID' || b.payment_status === 'Paid');
      
      return {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalBills: bills.length,
        paidBills: paidBills.length
      };
    } catch (error) {
      console.error('[ERROR] Dashboard stats:', error);
      return {
        totalRevenue: 0,
        totalBills: 0,
        paidBills: 0
      };
    }
  }
};
