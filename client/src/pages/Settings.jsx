import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../api';
import { Save } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const [formData, setFormData] = useState({
    hotelName: '',
    address: '',
    phone: '',
    email: '',
    gstNumber: '',
    invoicePrefix: 'INV',
    bankDetails: {
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branch: ''
    },
    terms: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.get();
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await settingsAPI.update(formData);
      alert('Settings saved successfully!');
      
      // Refresh user data to update hotel name in sidebar
      const token = localStorage.getItem('authToken');
      if (token) {
        const response = await fetch('http://localhost:5051/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('user', JSON.stringify(data.user));
          // Reload page to update sidebar
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBankDetailChange = (field, value) => {
    setFormData({
      ...formData,
      bankDetails: {
        ...formData.bankDetails,
        [field]: value
      }
    });
  };

  if (loading) {
    return <div className="loading">Loading settings...</div>;
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>⚙️ General Settings</h1>
        <p>Manage hotel information and system configuration</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h2 className="section-title">Hotel Information</h2>
          <div className="form-grid">
            <div className="input-group">
              <label>Hotel Name *</label>
              <input
                type="text"
                value={formData.hotelName}
                onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label>Phone *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label>GST Number *</label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label>Invoice Prefix</label>
              <input
                type="text"
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
              />
            </div>

            <div className="input-group full-width">
              <label>Address *</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows="3"
                required
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Bank Details</h2>
          <div className="form-grid">
            <div className="input-group">
              <label>Bank Name</label>
              <input
                type="text"
                value={formData.bankDetails?.bankName || ''}
                onChange={(e) => handleBankDetailChange('bankName', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Account Number</label>
              <input
                type="text"
                value={formData.bankDetails?.accountNumber || ''}
                onChange={(e) => handleBankDetailChange('accountNumber', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>IFSC Code</label>
              <input
                type="text"
                value={formData.bankDetails?.ifscCode || ''}
                onChange={(e) => handleBankDetailChange('ifscCode', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Branch</label>
              <input
                type="text"
                value={formData.bankDetails?.branch || ''}
                onChange={(e) => handleBankDetailChange('branch', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Terms & Conditions</h2>
          <div className="input-group">
            <label>Invoice Terms & Conditions</label>
            <textarea
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              rows="5"
              placeholder="Enter terms and conditions to be displayed on invoices..."
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
