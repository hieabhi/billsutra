import './ProductPage.css'

export default function RMS() {
  return (
    <div className="product-page">
      <section className="product-hero" style={{background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}}>
        <div className="container">
          <div className="product-hero-content">
            <div>
              <span className="product-badge">Restaurant Management System</span>
              <h1>Streamline Your Restaurant Operations</h1>
              <p>Complete POS system with table management, kitchen display, inventory tracking, and online ordering integration. Serve more customers, faster.</p>
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
            <h2>Everything You Need to Run Your Restaurant</h2>
            <p>From order taking to kitchen management, we've got you covered</p>
          </div>

          <div className="feature-grid">
            <div className="feature-item">
              <div className="feature-icon">🖥️</div>
              <h3>Point of Sale (POS)</h3>
              <p>Lightning-fast order taking, split bills, discounts, and multiple payment methods.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🪑</div>
              <h3>Table Management</h3>
              <p>Visual table layout, reservation system, waitlist management, and table status tracking.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🍳</div>
              <h3>Kitchen Display System</h3>
              <p>Digital KOT system, order routing, preparation time tracking, and real-time updates.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">📦</div>
              <h3>Inventory Management</h3>
              <p>Stock tracking, low stock alerts, recipe costing, and supplier management.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">📱</div>
              <h3>Online Ordering</h3>
              <p>Integrated with Zomato, Swiggy, and your own website for seamless online orders.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">👨‍🍳</div>
              <h3>Staff Management</h3>
              <p>Shift scheduling, performance tracking, and role-based access control.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">💳</div>
              <h3>Payment Integration</h3>
              <p>Accept cash, cards, UPI, wallets with automatic reconciliation.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">📈</div>
              <h3>Sales Analytics</h3>
              <p>Real-time dashboards, best-selling items, revenue trends, and profit margins.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Serve Better, Earn More</h2>
            <p>Join 3,000+ restaurants using BillSutra RMS. Start your 14-day free trial.</p>
            <a href="#" className="btn btn-white btn-large">Start Free Trial</a>
          </div>
        </div>
      </section>
    </div>
  )
}
