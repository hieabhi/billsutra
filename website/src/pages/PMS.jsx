import './ProductPage.css'

export default function PMS() {
  return (
    <div className="product-page">
      <section className="product-hero" style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}>
        <div className="container">
          <div className="product-hero-content">
            <div>
              <span className="product-badge">Pharmacy Management System</span>
              <h1>Simplify Your Pharmacy Operations</h1>
              <p>Complete pharmacy management with inventory control, prescription tracking, expiry alerts, and GST-compliant billing. Stay organized and compliant.</p>
              <div className="hero-cta">
                <a href="#" className="btn btn-white btn-large">Start Free Trial</a>
                <a href="#" className="btn btn-secondary btn-large" style={{borderColor: 'white', color: 'white'}}>Watch Demo</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="product-features">
        <div className="container">
          <div className="section-header">
            <h2>Complete Pharmacy Management Solution</h2>
            <p>Manage medicines, prescriptions, and compliance effortlessly</p>
          </div>

          <div className="feature-grid">
            <div className="feature-item">
              <div className="feature-icon">💊</div>
              <h3>Medicine Inventory</h3>
              <p>Track stock levels, batch numbers, expiry dates, and automatic reorder alerts.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">📋</div>
              <h3>Prescription Management</h3>
              <p>Digital prescription storage, doctor verification, and drug interaction alerts.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">⚠️</div>
              <h3>Expiry Date Alerts</h3>
              <p>Automated notifications for near-expiry medicines to minimize losses.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">💰</div>
              <h3>GST Billing</h3>
              <p>Fully GST-compliant invoicing with automatic tax calculations and returns.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <h3>Purchase Management</h3>
              <p>Supplier management, purchase orders, and inventory reconciliation.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🔍</div>
              <h3>Fast Search</h3>
              <p>Quick medicine lookup by name, composition, or manufacturer.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">👥</div>
              <h3>Customer Management</h3>
              <p>Patient profiles, purchase history, and loyalty programs.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">📱</div>
              <h3>Mobile App</h3>
              <p>Manage your pharmacy on the go with our mobile application.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Transform Your Pharmacy Today</h2>
            <p>Join 2,000+ pharmacies using BillSutra PMS. Start your 14-day free trial.</p>
            <a href="#" className="btn btn-white btn-large">Start Free Trial</a>
          </div>
        </div>
      </section>
    </div>
  )
}
