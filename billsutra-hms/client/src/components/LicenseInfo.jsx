import React, { useState, useEffect } from 'react';
import { Key, Calendar, Building2, Mail, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const LicenseInfo = () => {
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeactivate, setShowDeactivate] = useState(false);

  useEffect(() => {
    loadLicenseInfo();
  }, []);

  const loadLicenseInfo = async () => {
    if (window.electronAPI && window.electronAPI.getLicenseInfo) {
      try {
        const info = await window.electronAPI.getLicenseInfo();
        setLicenseInfo(info);
      } catch (error) {
        console.error('Failed to load license info:', error);
      }
    }
    setLoading(false);
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Are you sure you want to deactivate this license? The application will close.')) {
      return;
    }

    try {
      await window.electronAPI.deactivateLicense();
      alert('License deactivated successfully. The application will now restart.');
      await window.electronAPI.restartApp();
    } catch (error) {
      alert('Failed to deactivate license: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="license-info-card">
        <div className="loading">Loading license information...</div>
      </div>
    );
  }

  if (!licenseInfo || !licenseInfo.activated) {
    return (
      <div className="license-info-card">
        <div className="license-status error">
          <XCircle size={24} />
          <div>
            <h3>Not Activated</h3>
            <p>BillSutra is not activated. Please restart the application to activate.</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = () => {
    if (!licenseInfo.valid) return 'error';
    if (licenseInfo.expiringSoon) return 'warning';
    return 'success';
  };

  const getStatusIcon = () => {
    if (!licenseInfo.valid) return <XCircle size={24} />;
    if (licenseInfo.expiringSoon) return <AlertTriangle size={24} />;
    return <CheckCircle size={24} />;
  };

  const getStatusText = () => {
    if (!licenseInfo.valid) return 'Invalid / Expired';
    if (licenseInfo.expiringSoon) return `Expiring Soon (${licenseInfo.daysRemaining} days)`;
    return `Active (${licenseInfo.daysRemaining} days remaining)`;
  };

  return (
    <div className="license-info-card">
      <div className="license-header">
        <h2>
          <Key size={24} />
          License Information
        </h2>
      </div>

      <div className={`license-status ${getStatusColor()}`}>
        {getStatusIcon()}
        <div>
          <h3>{getStatusText()}</h3>
          <p>License Type: {licenseInfo.type}</p>
        </div>
      </div>

      <div className="license-details">
        <div className="license-detail-item">
          <Building2 size={20} />
          <div>
            <label>Hotel Name</label>
            <p>{licenseInfo.hotelName}</p>
          </div>
        </div>

        <div className="license-detail-item">
          <Mail size={20} />
          <div>
            <label>Email</label>
            <p>{licenseInfo.email}</p>
          </div>
        </div>

        <div className="license-detail-item">
          <Calendar size={20} />
          <div>
            <label>Issued Date</label>
            <p>{formatDate(licenseInfo.issuedDate)}</p>
          </div>
        </div>

        <div className="license-detail-item">
          <Calendar size={20} />
          <div>
            <label>Expiry Date</label>
            <p>{formatDate(licenseInfo.expiryDate)}</p>
          </div>
        </div>

        <div className="license-detail-item">
          <Key size={20} />
          <div>
            <label>Maximum Rooms</label>
            <p>{licenseInfo.maxRooms === 999 ? 'Unlimited' : licenseInfo.maxRooms} rooms</p>
          </div>
        </div>

        <div className="license-detail-item features">
          <div style={{ width: '100%' }}>
            <label>Features Included</label>
            <div className="feature-tags">
              {licenseInfo.features && licenseInfo.features.map(feature => (
                <span key={feature} className="feature-tag">
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {licenseInfo.expiringSoon && (
        <div className="license-warning">
          <AlertTriangle size={20} />
          <div>
            <strong>Renewal Required</strong>
            <p>Your license will expire in {licenseInfo.daysRemaining} days. Please contact support to renew your license.</p>
          </div>
        </div>
      )}

      <div className="license-actions">
        <button 
          className="deactivate-btn"
          onClick={() => setShowDeactivate(!showDeactivate)}
        >
          {showDeactivate ? 'Cancel' : 'Deactivate License'}
        </button>
        
        {showDeactivate && (
          <button 
            className="confirm-deactivate-btn"
            onClick={handleDeactivate}
          >
            Confirm Deactivation
          </button>
        )}
      </div>

      <style jsx>{`
        .license-info-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 24px;
        }

        .license-header {
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f0f0f0;
        }

        .license-header h2 {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 20px;
          font-weight: 600;
          color: #1e1e2e;
          margin: 0;
        }

        .license-status {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .license-status.success {
          background: #f0fdf4;
          border: 1px solid #86efac;
          color: #166534;
        }

        .license-status.warning {
          background: #fef3c7;
          border: 1px solid #fcd34d;
          color: #92400e;
        }

        .license-status.error {
          background: #fef2f2;
          border: 1px solid #fca5a5;
          color: #991b1b;
        }

        .license-status h3 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .license-status p {
          margin: 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .license-details {
          display: grid;
          gap: 16px;
        }

        .license-detail-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .license-detail-item svg {
          color: #667eea;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .license-detail-item label {
          display: block;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
          font-weight: 500;
        }

        .license-detail-item p {
          margin: 0;
          font-size: 14px;
          color: #1e1e2e;
          font-weight: 500;
        }

        .feature-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .feature-tag {
          background: #667eea;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .license-warning {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 8px;
          margin-top: 24px;
          color: #92400e;
        }

        .license-warning svg {
          flex-shrink: 0;
        }

        .license-warning strong {
          display: block;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .license-warning p {
          margin: 0;
          font-size: 13px;
          opacity: 0.9;
        }

        .license-actions {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 2px solid #f0f0f0;
          display: flex;
          gap: 12px;
        }

        .deactivate-btn {
          padding: 10px 20px;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .deactivate-btn:hover {
          background: #4b5563;
        }

        .confirm-deactivate-btn {
          padding: 10px 20px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .confirm-deactivate-btn:hover {
          background: #b91c1c;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default LicenseInfo;
