import './ProductPage.css'

export default function HMS() {
  return (
    <div className="product-page">
      <section className="product-hero" style={{background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)'}}>
        <div className="container">
          <div className="product-hero-content">
            <div>
              <span className="product-badge">Hotel Management System</span>
              <h1>Run Your Entire Hotel Operations from One Platform</h1>
              <p>Complete property management solution with booking engine, front desk, housekeeping, billing, and guest management. Everything you need to deliver exceptional guest experiences.</p>
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
            <h2>Everything You Need to Manage Your Property</h2>
            <p>Powerful features designed specifically for hotels and resorts</p>
          </div>

          <div className="feature-grid">
            <div className="feature-item">
              <div className="feature-icon">📅</div>
              <h3>Reservation Management</h3>
              <p>Online booking engine, channel manager integration, and real-time availability updates.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🏪</div>
              <h3>Front Desk Operations</h3>
              <p>Fast check-in/check-out, room assignments, guest history, and payment processing.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🧹</div>
              <h3>Housekeeping Module</h3>
              <p>Task assignment, room status tracking, cleaning schedules, and maintenance alerts.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">💰</div>
              <h3>Billing & Invoicing</h3>
              <p>Automated billing, multiple payment methods, split bills, and GST compliance.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">👥</div>
              <h3>Guest Management</h3>
              <p>Guest profiles, preferences, loyalty programs, and communication tools.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <h3>Reports & Analytics</h3>
              <p>Revenue reports, occupancy analytics, forecasting, and performance metrics.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🏢</div>
              <h3>Multi-Property</h3>
              <p>Manage multiple hotels from one dashboard with centralized reporting.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🔗</div>
              <h3>Integrations</h3>
              <p>Connect with OTAs, payment gateways, accounting software, and more.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pricing-preview" style={{background: 'var(--bg-light)'}}>
        <div className="container">
          <div className="section-header">
            <h2>Simple, Transparent Pricing</h2>
            <p>Choose the plan that fits your property size</p>
          </div>
          <div className="pricing-cards">
            <div className="pricing-card">
              <h3>Basic</h3>
              <div className="price">₹999<span>/month</span></div>
              <ul>
                <li>✓ Up to 20 rooms</li>
                <li>✓ Front desk management</li>
                <li>✓ Housekeeping module</li>
                <li>✓ Basic reports</li>
                <li>✓ Email support</li>
              </ul>
              <a href="#" className="btn btn-secondary">Get Started</a>
            </div>

            <div className="pricing-card featured">
              <div className="popular-badge">Most Popular</div>
              <h3>Professional</h3>
              <div className="price">₹2,499<span>/month</span></div>
              <ul>
                <li>✓ Unlimited rooms</li>
                <li>✓ All Basic features</li>
                <li>✓ Online booking engine</li>
                <li>✓ Advanced analytics</li>
                <li>✓ Priority support</li>
              </ul>
              <a href="#" className="btn btn-primary">Get Started</a>
            </div>

            <div className="pricing-card">
              <h3>Enterprise</h3>
              <div className="price">₹9,999<span>/month</span></div>
              <ul>
                <li>✓ Multiple properties</li>
                <li>✓ All Pro features</li>
                <li>✓ Custom integrations</li>
                <li>✓ Dedicated account manager</li>
                <li>✓ 24/7 phone support</li>
              </ul>
              <a href="#" className="btn btn-secondary">Contact Sales</a>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Modernize Your Hotel?</h2>
            <p>Join 5,000+ hotels already using BillSutra HMS. Start your 14-day free trial today.</p>
            <a href="#" className="btn btn-white btn-large">Start Free Trial</a>
            <p className="cta-note">No credit card required • Free data migration • Cancel anytime</p>
          </div>
        </div>
      </section>
    </div>
  )
}
