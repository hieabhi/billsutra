import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatCurrency, formatDate, numberToWords } from '../utils';
import { Printer, X } from 'lucide-react';
import './InvoicePreview.css';

const InvoicePreview = ({ bill, onClose }) => {
  const [settings, setSettings] = useState(null);
  const defaultSettings = {
    hotelName: 'Hotel Name',
    address: '',
    phone: '',
    email: '',
    gstNumber: '',
    bankDetails: { bankName: '', accountNumber: '', ifscCode: '', branch: '' },
    terms: ''
  };

  useEffect(() => {
    fetchSettings();
    // Extra guard: if settings haven't arrived quickly, use defaults to avoid any loading hang
    const t = setTimeout(() => {
      setSettings((s) => s || defaultSettings);
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  const fetchSettings = async () => {
    try {
  // Fail fast if backend is slow/offline so we don't hang on Loading
  const response = await settingsAPI.get({ timeout: 1200 });
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Fallback to defaults so the invoice still renders offline/without DB
      setSettings(defaultSettings);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const el = document.querySelector('.print-area');
      if (!el) return;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let y = 0;
      // Add multi-page if long
      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        let remaining = imgHeight;
        const sliceHeight = pageHeight;
        while (remaining > 0) {
          pdf.addImage(imgData, 'PNG', 0, y, imgWidth, imgHeight);
          remaining -= sliceHeight;
          if (remaining > 0) pdf.addPage();
          y -= sliceHeight; // move up for next virtual slice
        }
      }
      const fileName = `${bill.billNumber || 'Invoice'}.pdf`;
      pdf.save(fileName);
    } catch (e) {
      console.error('PDF export failed', e);
      alert('Failed to generate PDF. Try printing to PDF instead.');
    }
  };

  if (!settings) return <div>Loading...</div>;

  return (
    <div className="invoice-container">
      <div className="invoice-actions no-print">
        <button onClick={handlePrint} className="btn btn-primary">
          <Printer size={16} /> Print Invoice
        </button>
        <button onClick={handleDownloadPDF} className="btn btn-secondary">
          Download PDF
        </button>
        <button onClick={onClose} className="btn btn-outline">
          <X size={16} /> Close
        </button>
      </div>

      <div className="invoice print-area">
        <div className="invoice-header">
          <div className="company-details">
            <h1>{settings.hotelName || 'Hotel Name'}</h1>
            <p>{settings.address}</p>
            <p>Phone: {settings.phone} | Email: {settings.email}</p>
            <p><strong>GST No:</strong> {settings.gstNumber}</p>
          </div>
          <div className="invoice-meta">
            <h2>TAX INVOICE</h2>
            <p><strong>Invoice No:</strong> {bill.billNumber}</p>
            <p><strong>Date:</strong> {formatDate(bill.date)}</p>
          </div>
        </div>

        <div className="invoice-divider"></div>

        <div className="invoice-customer">
          <h3>Bill To:</h3>
          <p><strong>{bill.customer.name}</strong></p>
          {bill.customer.address && <p>{bill.customer.address}</p>}
          {bill.customer.phone && <p>Phone: {bill.customer.phone}</p>}
          {bill.customer.email && <p>Email: {bill.customer.email}</p>}
          {bill.customer.idProof && <p>ID Proof: {bill.customer.idProof}</p>}
          {bill.customer.gstNumber && <p><strong>GST No:</strong> {bill.customer.gstNumber}</p>}
        </div>

        {/* INDUSTRY STANDARD: Show stay details for hotel bookings */}
        {bill.checkInDate && bill.checkOutDate && (
          <div className="invoice-stay-details" style={{marginTop: '10px', padding: '10px', background: '#f9f9f9', borderRadius: '4px'}}>
            <div style={{display: 'flex', gap: '20px', fontSize: '0.9rem'}}>
              <div><strong>Check-in:</strong> {formatDate(bill.checkInDate)}</div>
              <div><strong>Check-out:</strong> {formatDate(bill.checkOutDate)}</div>
              <div><strong>Nights:</strong> {bill.nights}</div>
            </div>
          </div>
        )}

        <table className="invoice-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Item Description</th>
              <th>HSN/SAC</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
              <th>CGST</th>
              <th>SGST</th>
              <th>IGST</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{item.name}</td>
                <td>{item.hsn || '-'}</td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.rate)}</td>
                <td>{formatCurrency(item.amount)}</td>
                <td>
                  {item.cgst > 0 ? (
                    <>
                      {item.cgst}%<br />
                      {formatCurrency((item.amount * item.cgst) / 100)}
                    </>
                  ) : '-'}
                </td>
                <td>
                  {item.sgst > 0 ? (
                    <>
                      {item.sgst}%<br />
                      {formatCurrency((item.amount * item.sgst) / 100)}
                    </>
                  ) : '-'}
                </td>
                <td>
                  {item.igst > 0 ? (
                    <>
                      {item.igst}%<br />
                      {formatCurrency((item.amount * item.igst) / 100)}
                    </>
                  ) : '-'}
                </td>
                <td><strong>{formatCurrency(item.totalAmount)}</strong></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="5" style={{ textAlign: 'right' }}><strong>Subtotal:</strong></td>
              <td><strong>{formatCurrency(bill.subtotal)}</strong></td>
              <td>{bill.cgstTotal > 0 ? formatCurrency(bill.cgstTotal) : '-'}</td>
              <td>{bill.sgstTotal > 0 ? formatCurrency(bill.sgstTotal) : '-'}</td>
              <td>{bill.igstTotal > 0 ? formatCurrency(bill.igstTotal) : '-'}</td>
              <td></td>
            </tr>
            <tr className="grand-total-row">
              <td colSpan="9" style={{ textAlign: 'right' }}><strong>Grand Total:</strong></td>
              <td><strong>{formatCurrency(bill.grandTotal)}</strong></td>
            </tr>
            {/* INDUSTRY STANDARD: Show advance payment if applicable (Opera PMS, Maestro, Mews) */}
            {bill.advancePayment > 0 && (
              <tr style={{background: '#e8f5e9'}}>
                <td colSpan="9" style={{ textAlign: 'right', color: '#2e7d32' }}><strong>Advance Paid:</strong></td>
                <td style={{color: '#2e7d32'}}><strong>- {formatCurrency(bill.advancePayment)}</strong></td>
              </tr>
            )}
            {bill.advancePayment > 0 && (
              <tr style={{background: '#fff3e0'}}>
                <td colSpan="9" style={{ textAlign: 'right', color: '#e65100' }}><strong>Balance Due:</strong></td>
                <td style={{color: '#e65100'}}><strong>{formatCurrency(bill.balanceDue || 0)}</strong></td>
              </tr>
            )}
          </tfoot>
        </table>

        <div className="invoice-amount-words">
          <strong>Amount in Words:</strong> {numberToWords(Math.round(bill.grandTotal))}
        </div>

        {bill.notes && (
          <div className="invoice-notes">
            <strong>Notes:</strong> {bill.notes}
          </div>
        )}

        <div className="invoice-payment">
          <p><strong>Payment Method:</strong> {bill.paymentMethod}</p>
          <p><strong>Payment Status:</strong> <span className="status-paid">{bill.status}</span></p>
        </div>

        {settings.bankDetails && settings.bankDetails.bankName && (
          <div className="invoice-bank">
            <h4>Bank Details:</h4>
            <p><strong>Bank Name:</strong> {settings.bankDetails.bankName}</p>
            <p><strong>Account No:</strong> {settings.bankDetails.accountNumber}</p>
            <p><strong>IFSC Code:</strong> {settings.bankDetails.ifscCode}</p>
            {settings.bankDetails.branch && <p><strong>Branch:</strong> {settings.bankDetails.branch}</p>}
          </div>
        )}

        {settings.terms && (
          <div className="invoice-terms">
            <h4>Terms & Conditions:</h4>
            <p>{settings.terms}</p>
          </div>
        )}

        <div className="invoice-footer">
          <div className="invoice-signature">
            <p>Customer Signature</p>
          </div>
          <div className="invoice-signature">
            <p>Authorized Signatory</p>
            <p><strong>{settings.hotelName}</strong></p>
          </div>
        </div>

        <div className="invoice-thank-you">
          <p>Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
