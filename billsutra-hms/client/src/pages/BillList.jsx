import React, { useState, useEffect } from 'react';
import { billsAPI } from '../api';
import { formatCurrency, formatDate } from '../utils';
import { Eye, Trash2, Calendar } from 'lucide-react';
import InvoicePreview from '../components/InvoicePreview';
import './BillList.css';

const BillList = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: ''
  });

  useEffect(() => {
    fetchBills();
  }, [filters]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.status) params.status = filters.status;

      const response = await billsAPI.getAll(params);
      setBills(response.data);
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;

    try {
      await billsAPI.delete(id);
      fetchBills();
    } catch (error) {
      console.error('Error deleting bill:', error);
      alert('Error deleting bill');
    }
  };

  const handleView = async (id) => {
    try {
      const response = await billsAPI.getById(id);
      setSelectedBill(response.data);
    } catch (error) {
      console.error('Error fetching bill:', error);
    }
  };

  if (selectedBill) {
    return (
      <InvoicePreview
        bill={selectedBill}
        onClose={() => setSelectedBill(null)}
      />
    );
  }

  return (
    <div className="bill-list">
      <div className="page-header">
        <h1>Bills</h1>
        <p>View and manage all invoices</p>
      </div>

      <div className="card">
        <div className="filters">
          <div className="input-group">
            <label>Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label>End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading bills...</div>
        ) : bills.length === 0 ? (
          <div className="no-data">No bills found</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Bill No.</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill._id}>
                    <td><strong>{bill.billNumber}</strong></td>
                    <td>{formatDate(bill.date)}</td>
                    <td>
                      <div className="customer-cell">
                        <div>{bill.customer.name}</div>
                        {bill.customer.phone && (
                          <small>{bill.customer.phone}</small>
                        )}
                      </div>
                    </td>
                    <td>{bill.items.length}</td>
                    <td><strong>{formatCurrency(bill.grandTotal)}</strong></td>
                    <td>{bill.paymentMethod}</td>
                    <td>
                      <span className={`badge badge-${
                        bill.status === 'Paid' ? 'success' :
                        bill.status === 'Unpaid' ? 'warning' : 'danger'
                      }`}>
                        {bill.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleView(bill._id)}
                          className="btn-icon btn-primary"
                          title="View Invoice"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(bill._id)}
                          className="btn-icon btn-danger"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillList;
