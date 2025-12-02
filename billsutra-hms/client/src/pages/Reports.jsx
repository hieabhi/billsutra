import React, { useState, useEffect } from 'react';
import { billsAPI } from '../api';
import { formatCurrency, formatDate } from '../utils';
import { Download, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import './Reports.css';

const Reports = () => {
  const [bills, setBills] = useState([]);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of month
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBills: 0,
    totalTax: 0,
    avgBillValue: 0
  });

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const fetchReportData = async () => {
    try {
      const response = await billsAPI.getAll(filters);
      const billsData = response.data;
      setBills(billsData);

      // Calculate stats
      const totalRevenue = billsData.reduce((sum, bill) => sum + bill.grandTotal, 0);
      const totalTax = billsData.reduce((sum, bill) => sum + bill.totalTax, 0);
      const totalBills = billsData.length;
      const avgBillValue = totalBills > 0 ? totalRevenue / totalBills : 0;

      setStats({ totalRevenue, totalBills, totalTax, avgBillValue });
    } catch (error) {
      console.error('Error fetching report data:', error);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Bill No', 'Date', 'Customer', 'Subtotal', 'CGST', 'SGST', 'IGST', 'Total Tax', 'Grand Total', 'Payment Method'];
    const rows = bills.map(bill => [
      bill.billNumber,
      formatDate(bill.date),
      bill.customer.name,
      bill.subtotal,
      bill.cgstTotal,
      bill.sgstTotal,
      bill.igstTotal,
      bill.totalTax,
      bill.grandTotal,
      bill.paymentMethod
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${filters.startDate}-to-${filters.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: '#10b981'
    },
    {
      title: 'Total Bills',
      value: stats.totalBills,
      icon: Calendar,
      color: '#4f46e5'
    },
    {
      title: 'Total Tax Collected',
      value: formatCurrency(stats.totalTax),
      icon: TrendingUp,
      color: '#f59e0b'
    },
    {
      title: 'Average Bill Value',
      value: formatCurrency(stats.avgBillValue),
      icon: DollarSign,
      color: '#8b5cf6'
    }
  ];

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p>Sales reports and GST summaries</p>
        </div>
        <button onClick={handleExportCSV} className="btn btn-secondary" disabled={bills.length === 0}>
          <Download size={16} /> Export CSV
        </button>
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
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="stat-card">
              <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                <Icon size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-title">{stat.title}</p>
                <h2 className="stat-value">{stat.value}</h2>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h2 className="section-title">Sales Summary</h2>
        {bills.length === 0 ? (
          <div className="no-data">No data available for the selected period</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Bill No</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Subtotal</th>
                  <th>CGST</th>
                  <th>SGST</th>
                  <th>IGST</th>
                  <th>Total Tax</th>
                  <th>Grand Total</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill._id}>
                    <td><strong>{bill.billNumber}</strong></td>
                    <td>{formatDate(bill.date)}</td>
                    <td>{bill.customer.name}</td>
                    <td>{formatCurrency(bill.subtotal)}</td>
                    <td>{formatCurrency(bill.cgstTotal)}</td>
                    <td>{formatCurrency(bill.sgstTotal)}</td>
                    <td>{formatCurrency(bill.igstTotal)}</td>
                    <td>{formatCurrency(bill.totalTax)}</td>
                    <td><strong>{formatCurrency(bill.grandTotal)}</strong></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td colSpan="3"><strong>Total:</strong></td>
                  <td><strong>{formatCurrency(bills.reduce((sum, b) => sum + b.subtotal, 0))}</strong></td>
                  <td><strong>{formatCurrency(bills.reduce((sum, b) => sum + b.cgstTotal, 0))}</strong></td>
                  <td><strong>{formatCurrency(bills.reduce((sum, b) => sum + b.sgstTotal, 0))}</strong></td>
                  <td><strong>{formatCurrency(bills.reduce((sum, b) => sum + b.igstTotal, 0))}</strong></td>
                  <td><strong>{formatCurrency(bills.reduce((sum, b) => sum + b.totalTax, 0))}</strong></td>
                  <td><strong>{formatCurrency(bills.reduce((sum, b) => sum + b.grandTotal, 0))}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
