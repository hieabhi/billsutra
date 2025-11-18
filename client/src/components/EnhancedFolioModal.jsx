import React, { useEffect, useState } from 'react';
import api, { bookingsAPI, itemsAPI } from '../api';
import './Modal.css';

// Add print-specific styles
const printStyles = `
  @media print {
    /* Hide everything except the summary content */
    body * {
      visibility: hidden;
    }
    
    /* Show only the invoice content */
    .folio-summary-print, .folio-summary-print * {
      visibility: visible;
    }
    
    .folio-summary-print {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    
    /* Hide modal overlay, tabs, close button */
    .modal-overlay,
    .modal-header,
    .folio-tabs,
    .close-btn,
    button {
      display: none !important;
    }
    
    /* Full width for print */
    .modal-content {
      max-width: 100% !important;
      margin: 0 !important;
      padding: 20px !important;
      box-shadow: none !important;
      border: none !important;
    }
  }
`;

// Inject print styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = printStyles;
  document.head.appendChild(styleSheet);
}

const CHARGE_CATEGORIES = [
  { value: 'ROOM', label: '🛏️ Room Charges', icon: '🛏️' },
  { value: 'FOOD_BEVERAGE', label: '🍽️ Food & Beverage', icon: '🍽️' },
  { value: 'LAUNDRY', label: '🧺 Laundry', icon: '🧺' },
  { value: 'TRANSPORT', label: '🚗 Transport', icon: '🚗' },
  { value: 'MINIBAR', label: '🍺 Minibar', icon: '🍺' },
  { value: 'SPA', label: '💆 Spa & Wellness', icon: '💆' },
  { value: 'MISC', label: '📋 Miscellaneous', icon: '📋' }
];

const PAYMENT_METHODS = [
  { value: 'Cash', label: '💵 Cash', icon: '💵' },
  { value: 'Card', label: '💳 Card', icon: '💳' },
  { value: 'UPI', label: '📱 UPI', icon: '📱' },
  { value: 'BankTransfer', label: '🏦 Bank Transfer', icon: '🏦' },
  { value: 'Cheque', label: '📝 Cheque', icon: '📝' }
];

const EnhancedFolioModal = ({ bookingId, onClose, onChanged }) => {
  const [booking, setBooking] = useState(null);
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('charges'); // 'charges' | 'payments' | 'summary'
  
  // Charge form
  const [chargeForm, setChargeForm] = useState({
    category: 'FOOD_BEVERAGE',
    description: '',
    quantity: 1,
    rate: 0,
    taxRate: 5,
    itemId: '',
    remarks: ''
  });
  
  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    method: 'Cash',
    amount: 0,
    reference: '',
    remarks: ''
  });

  const load = async () => {
    try {
      const [bookingRes, itemsRes] = await Promise.all([
        bookingsAPI.getById(bookingId),
        itemsAPI.getAll()
      ]);
      setBooking(bookingRes.data);
      setItems(itemsRes.data || []);
    } catch (error) {
      console.error('Error loading folio:', error);
    }
  };

  useEffect(() => {
    if (bookingId) load();
  }, [bookingId]);

  const handleItemSelect = (e) => {
    const itemId = e.target.value;
    if (!itemId) {
      setChargeForm({ ...chargeForm, itemId: '', description: '', rate: 0, taxRate: 5 });
      return;
    }
    
    const item = items.find(i => i._id === itemId);
    if (item) {
      setChargeForm({
        ...chargeForm,
        itemId: item._id,
        description: item.name,
        rate: item.price,
        taxRate: item.taxRate || 5,
        category: item.category?.toUpperCase().replace(' ', '_') || 'MISC'
      });
    }
  };

  const addCharge = async () => {
    if (!chargeForm.description || !chargeForm.rate) {
      alert('Please enter description and rate');
      return;
    }

    try {
      await bookingsAPI.addFolioLine(bookingId, chargeForm);
      setChargeForm({
        category: 'FOOD_BEVERAGE',
        description: '',
        quantity: 1,
        rate: 0,
        taxRate: 5,
        itemId: '',
        remarks: ''
      });
      await load();
      onChanged && onChanged();
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding charge');
    }
  };

  const addPayment = async () => {
    if (!paymentForm.amount || paymentForm.amount <= 0) {
      alert('Please enter payment amount');
      return;
    }

    try {
      await bookingsAPI.addPayment(bookingId, paymentForm);
      setPaymentForm({
        method: 'Cash',
        amount: 0,
        reference: '',
        remarks: ''
      });
      await load();
      onChanged && onChanged();
    } catch (error) {
      alert(error.response?.data?.message || 'Error recording payment');
    }
  };

  if (!booking) return <div>Loading...</div>;

  const folio = booking.folio || { lines: [], payments: [], total: booking.amount, balance: booking.amount };
  const totalPaid = (folio.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const advancePayment = Number(booking.advancePayment || 0);
  
  // Group charges by category
  const chargesByCategory = {};
  (folio.lines || []).forEach(line => {
    const cat = line.category || 'MISC';
    if (!chargesByCategory[cat]) {
      chargesByCategory[cat] = [];
    }
    chargesByCategory[cat].push(line);
  });

  const categoryIcon = (cat) => CHARGE_CATEGORIES.find(c => c.value === cat)?.icon || '📋';
  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  const formatDate = (date) => new Date(date).toLocaleString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  // Calculate tax summary
  const taxSummary = {
    totalCGST: 0,
    totalSGST: 0,
    totalIGST: 0
  };
  
  (folio.lines || []).forEach(line => {
    taxSummary.totalCGST += Number(line.cgst || 0);
    taxSummary.totalSGST += Number(line.sgst || 0);
    taxSummary.totalIGST += Number(line.igst || 0);
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1200px', maxHeight: '90vh' }}>
        <div className="modal-header">
          <div>
            <h3>📊 Guest Folio - {booking.reservationNumber}</h3>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
              Room {booking.roomNumber} | {booking.guest?.name} | 
              {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
            </div>
          </div>
          <button className="btn" onClick={onClose}>✕ Close</button>
        </div>

        {/* Advance Payment Alert */}
        {advancePayment > 0 && (
          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
            borderRadius: '8px',
            margin: '0 20px 16px 20px',
            border: '2px solid #4caf50',
            boxShadow: '0 2px 8px rgba(76, 175, 80, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#2e7d32', fontWeight: '600', marginBottom: '4px' }}>
                  💰 Advance Payment Received
                </div>
                <div style={{ fontSize: '12px', color: '#558b2f' }}>
                  Method: {booking.advancePaymentMethod || 'Cash'} | 
                  Date: {new Date(booking.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1b5e20' }}>
                {formatCurrency(advancePayment)}
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '0 20px',
          borderBottom: '2px solid #e0e0e0',
          marginBottom: '16px'
        }}>
          <button
            className={activeTab === 'charges' ? 'tab-active' : 'tab'}
            onClick={() => setActiveTab('charges')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'charges' ? '#2196F3' : 'transparent',
              color: activeTab === 'charges' ? 'white' : '#666',
              border: 'none',
              borderBottom: activeTab === 'charges' ? '3px solid #2196F3' : 'none',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s'
            }}
          >
            📝 Post Charges
          </button>
          <button
            className={activeTab === 'payments' ? 'tab-active' : 'tab'}
            onClick={() => setActiveTab('payments')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'payments' ? '#4CAF50' : 'transparent',
              color: activeTab === 'payments' ? 'white' : '#666',
              border: 'none',
              borderBottom: activeTab === 'payments' ? '3px solid #4CAF50' : 'none',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s'
            }}
          >
            💳 Record Payment
          </button>
          <button
            className={activeTab === 'summary' ? 'tab-active' : 'tab'}
            onClick={() => setActiveTab('summary')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'summary' ? '#FF9800' : 'transparent',
              color: activeTab === 'summary' ? 'white' : '#666',
              border: 'none',
              borderBottom: activeTab === 'summary' ? '3px solid #FF9800' : 'none',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s'
            }}
          >
            📊 Summary
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px', overflow: 'auto', maxHeight: 'calc(90vh - 250px)' }}>
          {/* POST CHARGES TAB */}
          {activeTab === 'charges' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Charge Form */}
              <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
                <h4 style={{ marginTop: 0, marginBottom: '16px', color: '#333' }}>➕ Add New Charge</h4>
                
                {/* Quick Item Selection */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '600' }}>
                    Quick Select Item
                  </label>
                  <select
                    value={chargeForm.itemId}
                    onChange={handleItemSelect}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="">-- Select from Item Master --</option>
                    {items.map(item => (
                      <option key={item._id} value={item._id}>
                        {item.name} - ₹{item.price} ({item.category})
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                    Or enter custom charge below
                  </div>
                </div>

                {/* Category */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '600' }}>
                    Category
                  </label>
                  <select
                    value={chargeForm.category}
                    onChange={e => setChargeForm({ ...chargeForm, category: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    {CHARGE_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '600' }}>
                    Description *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Lunch - Veg Thali, Laundry - 3 shirts"
                    value={chargeForm.description}
                    onChange={e => setChargeForm({ ...chargeForm, description: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>

                {/* Quantity & Rate */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '600' }}>
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={chargeForm.quantity}
                      onChange={e => setChargeForm({ ...chargeForm, quantity: parseFloat(e.target.value) || 1 })}
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '600' }}>
                      Rate (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={chargeForm.rate === 0 ? '' : chargeForm.rate}
                      onChange={e => setChargeForm({ ...chargeForm, rate: parseFloat(e.target.value) || 0 })}
                      onFocus={e => e.target.select()}
                      style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                </div>

                {/* Tax Rate */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '600' }}>
                    GST Rate (%)
                  </label>
                  <select
                    value={chargeForm.taxRate}
                    onChange={e => setChargeForm({ ...chargeForm, taxRate: parseFloat(e.target.value) })}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="0">0% (No GST)</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST</option>
                    <option value="28">28% GST</option>
                  </select>
                </div>

                {/* Amount Preview */}
                <div style={{
                  background: 'white',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  border: '1px solid #ddd'
                }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Charge Preview:</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span>Base Amount:</span>
                    <span>₹ {(chargeForm.quantity * chargeForm.rate).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span>CGST ({chargeForm.taxRate / 2}%):</span>
                    <span>₹ {((chargeForm.quantity * chargeForm.rate * chargeForm.taxRate) / 200).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                    <span>SGST ({chargeForm.taxRate / 2}%):</span>
                    <span>₹ {((chargeForm.quantity * chargeForm.rate * chargeForm.taxRate) / 200).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 'bold' }}>
                    <span>Total Amount:</span>
                    <span style={{ color: '#2196F3' }}>
                      ₹ {(chargeForm.quantity * chargeForm.rate * (1 + chargeForm.taxRate / 100)).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Remarks */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '600' }}>
                    Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Table 5, Room Service, Extra towels"
                    value={chargeForm.remarks}
                    onChange={e => setChargeForm({ ...chargeForm, remarks: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>

                <button
                  className="btn btn-primary"
                  onClick={addCharge}
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    background: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  ➕ Add Charge
                </button>
              </div>

              {/* Posted Charges List */}
              <div>
                <h4 style={{ marginTop: 0, marginBottom: '16px', color: '#333' }}>📋 Posted Charges</h4>
                
                {Object.keys(chargesByCategory).length === 0 ? (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#999',
                    background: '#f9f9f9',
                    borderRadius: '8px'
                  }}>
                    No charges posted yet
                  </div>
                ) : (
                  <div>
                    {Object.entries(chargesByCategory).map(([category, lines]) => (
                      <div key={category} style={{ marginBottom: '20px' }}>
                        <div style={{
                          background: '#2196F3',
                          color: 'white',
                          padding: '8px 12px',
                          borderRadius: '4px 4px 0 0',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>
                          {categoryIcon(category)} {CHARGE_CATEGORIES.find(c => c.value === category)?.label.replace(/.*\s/, '') || category}
                        </div>
                        <div style={{ border: '1px solid #ddd', borderTop: 'none', borderRadius: '0 0 4px 4px' }}>
                          {lines.map((line, idx) => (
                            <div
                              key={line._id}
                              style={{
                                padding: '12px',
                                borderBottom: idx < lines.length - 1 ? '1px solid #eee' : 'none',
                                background: idx % 2 === 0 ? 'white' : '#f9f9f9'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontWeight: '600', fontSize: '14px' }}>{line.description}</span>
                                <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#2196F3' }}>
                                  {formatCurrency(line.totalAmount)}
                                </span>
                              </div>
                              <div style={{ fontSize: '11px', color: '#666' }}>
                                {line.quantity} × ₹{line.rate} + GST ({line.taxRate}%) | {formatDate(line.date)}
                              </div>
                              {line.remarks && (
                                <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', fontStyle: 'italic' }}>
                                  💬 {line.remarks}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RECORD PAYMENT TAB */}
          {activeTab === 'payments' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Payment Form */}
              <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
                <h4 style={{ marginTop: 0, marginBottom: '16px', color: '#333' }}>💰 Record Payment</h4>

                {/* Payment Method */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '600' }}>
                    Payment Method *
                  </label>
                  <select
                    value={paymentForm.method}
                    onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    {PAYMENT_METHODS.map(method => (
                      <option key={method.value} value={method.value}>{method.label}</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '600' }}>
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={paymentForm.amount === 0 ? '' : paymentForm.amount}
                    onChange={e => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                    onFocus={e => e.target.select()}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '16px' }}
                  />
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setPaymentForm({ ...paymentForm, amount: folio.balance })}
                      style={{
                        padding: '6px 12px',
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Full Balance (₹{folio.balance.toFixed(2)})
                    </button>
                    <button
                      onClick={() => setPaymentForm({ ...paymentForm, amount: Math.round(folio.balance / 2) })}
                      style={{
                        padding: '6px 12px',
                        background: '#FF9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Half (₹{Math.round(folio.balance / 2)})
                    </button>
                  </div>
                </div>

                {/* Reference Number */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '600' }}>
                    Reference/Transaction ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., TXN123456, Cheque #789, Card Auth 456"
                    value={paymentForm.reference}
                    onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>

                {/* Remarks */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '600' }}>
                    Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Partial payment, Final settlement"
                    value={paymentForm.remarks}
                    onChange={e => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>

                <button
                  className="btn btn-primary"
                  onClick={addPayment}
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  💰 Record Payment
                </button>
              </div>

              {/* Payment History */}
              <div>
                <h4 style={{ marginTop: 0, marginBottom: '16px', color: '#333' }}>💳 Payment History</h4>

                {advancePayment > 0 && (
                  <div style={{
                    padding: '12px',
                    background: '#e8f5e9',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    border: '1px solid #4caf50'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', fontSize: '14px', color: '#2e7d32' }}>
                        💰 Advance Payment
                      </span>
                      <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#1b5e20' }}>
                        {formatCurrency(advancePayment)}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#558b2f' }}>
                      {booking.advancePaymentMethod || 'Cash'} | {formatDate(booking.createdAt)}
                    </div>
                  </div>
                )}

                {folio.payments.length === 0 ? (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#999',
                    background: '#f9f9f9',
                    borderRadius: '8px'
                  }}>
                    No payments recorded yet
                  </div>
                ) : (
                  <div>
                    {folio.payments.map((payment, idx) => (
                      <div
                        key={payment._id}
                        style={{
                          padding: '12px',
                          background: idx % 2 === 0 ? 'white' : '#f9f9f9',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          marginBottom: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '600', fontSize: '14px' }}>
                            {PAYMENT_METHODS.find(m => m.value === payment.method)?.icon || '💵'} {payment.method}
                          </span>
                          <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#4CAF50' }}>
                            {formatCurrency(payment.amount)}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#666' }}>
                          {formatDate(payment.date)}
                          {payment.reference && ` | Ref: ${payment.reference}`}
                        </div>
                        {payment.remarks && (
                          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', fontStyle: 'italic' }}>
                            💬 {payment.remarks}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Total Paid Summary */}
                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                  color: 'white',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>Total Received</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                    {formatCurrency(totalPaid + advancePayment)}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
                    Advance: {formatCurrency(advancePayment)} + Payments: {formatCurrency(totalPaid)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUMMARY TAB */}
          {activeTab === 'summary' && (
            <div className="folio-summary-print">
              <div style={{
                background: 'white',
                border: '2px solid #ddd',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '800px',
                margin: '0 auto'
              }}>
                {/* Print Invoice Button */}
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <button
                    onClick={() => window.print()}
                    style={{
                      background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '12px 32px',
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 4px 8px rgba(33, 150, 243, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    🖨️ Print Invoice
                  </button>
                </div>
                
                <h3 style={{ textAlign: 'center', marginTop: 0, marginBottom: '24px', color: '#333' }}>
                  📊 Guest Folio Invoice
                </h3>

                {/* Room Charges */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    background: '#f5f5f5',
                    padding: '12px',
                    borderRadius: '6px',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    🛏️ Room Charges
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px' }}>
                    <span>Room {booking.roomNumber} × {booking.nights} night(s) @ ₹{booking.rate}/night</span>
                    <span style={{ fontWeight: 'bold' }}>{formatCurrency(booking.amount)}</span>
                  </div>
                </div>

                {/* Additional Charges by Category */}
                {Object.entries(chargesByCategory).map(([category, lines]) => (
                  <div key={category} style={{ marginBottom: '20px' }}>
                    <div style={{
                      background: '#f5f5f5',
                      padding: '12px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      marginBottom: '8px'
                    }}>
                      {categoryIcon(category)} {CHARGE_CATEGORIES.find(c => c.value === category)?.label.replace(/.*\s/, '') || category}
                    </div>
                    {lines.map(line => (
                      <div key={line._id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 16px',
                        fontSize: '14px'
                      }}>
                        <span>{line.description} ({line.quantity} × ₹{line.rate})</span>
                        <span style={{ fontWeight: 'bold' }}>{formatCurrency(line.totalAmount)}</span>
                      </div>
                    ))}
                  </div>
                ))}

                {/* Subtotal */}
                <div style={{
                  borderTop: '2px solid #ddd',
                  paddingTop: '16px',
                  marginTop: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '16px' }}>
                    <span style={{ fontWeight: '600' }}>Subtotal (before tax)</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {formatCurrency(
                        booking.amount + (folio.lines || []).reduce((sum, l) => sum + Number(l.amount || 0), 0)
                      )}
                    </span>
                  </div>
                </div>

                {/* Tax Breakdown */}
                <div style={{ background: '#fff3e0', padding: '16px', borderRadius: '6px', margin: '16px 0' }}>
                  <div style={{ fontWeight: '600', marginBottom: '12px', color: '#e65100' }}>📊 GST Breakdown</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                    <span>CGST</span>
                    <span style={{ fontWeight: 'bold' }}>{formatCurrency(taxSummary.totalCGST)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                    <span>SGST</span>
                    <span style={{ fontWeight: 'bold' }}>{formatCurrency(taxSummary.totalSGST)}</span>
                  </div>
                  {taxSummary.totalIGST > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span>IGST</span>
                      <span style={{ fontWeight: 'bold' }}>{formatCurrency(taxSummary.totalIGST)}</span>
                    </div>
                  )}
                </div>

                {/* Grand Total */}
                <div style={{
                  background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                  color: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>GRAND TOTAL</div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
                    {formatCurrency(folio.total)}
                  </div>
                </div>

                {/* Payments */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    background: '#f5f5f5',
                    padding: '12px',
                    borderRadius: '6px',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    💰 Payments Received
                  </div>
                  
                  {advancePayment > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', fontSize: '14px', color: '#2e7d32' }}>
                      <span>Advance Payment ({booking.advancePaymentMethod || 'Cash'})</span>
                      <span style={{ fontWeight: 'bold' }}>{formatCurrency(advancePayment)}</span>
                    </div>
                  )}
                  
                  {folio.payments.map(payment => (
                    <div key={payment._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', fontSize: '14px' }}>
                      <span>{payment.method} - {formatDate(payment.date)}</span>
                      <span style={{ fontWeight: 'bold' }}>{formatCurrency(payment.amount)}</span>
                    </div>
                  ))}
                  
                  <div style={{
                    borderTop: '1px solid #ddd',
                    marginTop: '8px',
                    paddingTop: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 16px',
                    fontSize: '16px',
                    color: '#4CAF50'
                  }}>
                    <span style={{ fontWeight: '600' }}>Total Paid</span>
                    <span style={{ fontWeight: 'bold' }}>{formatCurrency(totalPaid + advancePayment)}</span>
                  </div>
                </div>

                {/* Balance Due */}
                <div style={{
                  background: folio.balance > 0 ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)' : 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                  color: 'white',
                  padding: '24px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                    {folio.balance > 0 ? 'BALANCE DUE' : 'PAID IN FULL'}
                  </div>
                  <div style={{ fontSize: '48px', fontWeight: 'bold' }}>
                    {formatCurrency(folio.balance)}
                  </div>
                  {folio.balance > 0 && (
                    <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '8px' }}>
                      Please collect payment before checkout
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedFolioModal;
