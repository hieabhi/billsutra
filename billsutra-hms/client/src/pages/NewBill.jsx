import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { billsAPI, itemsAPI, customersAPI } from '../api';
import { calculateItemGST, calculateBillTotals, formatCurrency } from '../utils';
import { Plus, Trash2, Save, Printer } from 'lucide-react';
import InvoicePreview from '../components/InvoicePreview';
import './NewBill.css';

const NewBill = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showInvoice, setShowInvoice] = useState(false);
  const [savedBill, setSavedBill] = useState(null);

  const [formData, setFormData] = useState({
    customer: {
      name: '',
      phone: '',
      email: '',
      address: '',
      gstNumber: ''
    },
    items: [
      { name: '', hsn: '', quantity: 1, rate: 0, cgst: 2.5, sgst: 2.5, igst: 0 }
    ],
    paymentMethod: 'Cash',
    notes: ''
  });

  useEffect(() => {
    fetchItems();
    fetchCustomers();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await itemsAPI.getAll({ isActive: true });
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customersAPI.getAll();
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleCustomerChange = (field, value) => {
    setFormData({
      ...formData,
      customer: { ...formData.customer, [field]: value }
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    // Auto-fill item details if selecting from catalog
    if (field === 'name') {
      const selectedItem = items.find(item => item.name === value);
      if (selectedItem) {
        newItems[index] = {
          ...newItems[index],
          hsn: selectedItem.hsn || '',
          rate: selectedItem.rate,
          cgst: selectedItem.cgst,
          sgst: selectedItem.sgst,
          igst: selectedItem.igst
        };
      }
    }

    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', hsn: '', quantity: 1, rate: 0, cgst: 2.5, sgst: 2.5, igst: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Calculate totals for each item
    const itemsWithCalculations = formData.items.map(item => {
      const calc = calculateItemGST(item.quantity, item.rate, item.cgst, item.sgst, item.igst);
      return {
        ...item,
        amount: calc.amount,
        taxAmount: calc.taxAmount,
        totalAmount: calc.totalAmount
      };
    });

    // Calculate bill totals
    const totals = calculateBillTotals(formData.items);

    const billData = {
      customer: formData.customer,
      items: itemsWithCalculations,
      ...totals,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes,
      status: 'Paid'
    };

    try {
      const response = await billsAPI.create(billData);
      setSavedBill(response.data);
      setShowInvoice(true);
    } catch (error) {
      console.error('Error creating bill:', error);
      const msg = error?.response?.data?.message || error?.message || 'Unknown error';
      alert(`Error creating bill: ${msg}`);
    }
  };

  const totals = calculateBillTotals(formData.items);

  return (
    <div className="new-bill">
      {showInvoice && savedBill ? (
        <InvoicePreview 
          bill={savedBill} 
          onClose={() => {
            setShowInvoice(false);
            navigate('/bills');
          }}
        />
      ) : (
        <>
          <div className="page-header">
            <h1>Create New Bill</h1>
            <p>Generate GST compliant invoice for your customers</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="card">
              <h2 className="section-title">Customer Details</h2>
              <div className="form-grid">
                <div className="input-group">
                  <label>Customer Name *</label>
                  <input
                    type="text"
                    value={formData.customer.name}
                    onChange={(e) => handleCustomerChange('name', e.target.value)}
                    list="customers-list"
                    required
                  />
                  <datalist id="customers-list">
                    {customers.map(c => (
                      <option key={c._id} value={c.name} />
                    ))}
                  </datalist>
                </div>

                <div className="input-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.customer.phone}
                    onChange={(e) => handleCustomerChange('phone', e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.customer.email}
                    onChange={(e) => handleCustomerChange('email', e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label>GST Number</label>
                  <input
                    type="text"
                    value={formData.customer.gstNumber}
                    onChange={(e) => handleCustomerChange('gstNumber', e.target.value)}
                  />
                </div>

                <div className="input-group full-width">
                  <label>Address</label>
                  <textarea
                    value={formData.customer.address}
                    onChange={(e) => handleCustomerChange('address', e.target.value)}
                    rows="2"
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="section-header">
                <h2 className="section-title">Items</h2>
                <button type="button" onClick={addItem} className="btn btn-secondary">
                  <Plus size={16} /> Add Item
                </button>
              </div>

              <div className="items-table-container">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>HSN</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>CGST %</th>
                      <th>SGST %</th>
                      <th>IGST %</th>
                      <th>Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => {
                      const calc = calculateItemGST(item.quantity, item.rate, item.cgst, item.sgst, item.igst);
                      return (
                        <tr key={index}>
                          <td>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                              list="items-list"
                              required
                              placeholder="Select or type"
                            />
                            <datalist id="items-list">
                              {items.map(i => (
                                <option key={i._id} value={i.name} />
                              ))}
                            </datalist>
                          </td>
                          <td>
                            <input
                              type="text"
                              value={item.hsn}
                              onChange={(e) => handleItemChange(index, 'hsn', e.target.value)}
                              placeholder="HSN"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                              min="0.01"
                              step="0.01"
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={item.rate}
                              onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={item.cgst}
                              onChange={(e) => handleItemChange(index, 'cgst', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={item.sgst}
                              onChange={(e) => handleItemChange(index, 'sgst', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={item.igst}
                              onChange={(e) => handleItemChange(index, 'igst', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td><strong>{formatCurrency(calc.totalAmount)}</strong></td>
                          <td>
                            {formData.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="btn-icon btn-danger"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="totals-section">
                <div className="totals-row">
                  <span>Subtotal:</span>
                  <strong>{formatCurrency(totals.subtotal)}</strong>
                </div>
                {totals.cgstTotal > 0 && (
                  <div className="totals-row">
                    <span>CGST:</span>
                    <strong>{formatCurrency(totals.cgstTotal)}</strong>
                  </div>
                )}
                {totals.sgstTotal > 0 && (
                  <div className="totals-row">
                    <span>SGST:</span>
                    <strong>{formatCurrency(totals.sgstTotal)}</strong>
                  </div>
                )}
                {totals.igstTotal > 0 && (
                  <div className="totals-row">
                    <span>IGST:</span>
                    <strong>{formatCurrency(totals.igstTotal)}</strong>
                  </div>
                )}
                <div className="totals-row grand-total">
                  <span>Grand Total:</span>
                  <strong>{formatCurrency(totals.grandTotal)}</strong>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="section-title">Additional Details</h2>
              <div className="form-grid">
                <div className="input-group">
                  <label>Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="input-group full-width">
                  <label>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => navigate('/bills')} className="btn btn-outline">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={16} /> Save & Generate Invoice
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default NewBill;
