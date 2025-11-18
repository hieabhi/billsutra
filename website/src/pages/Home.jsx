import './Home.css'

export default function Home() {
  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg-gradient"></div>
        <div className="container">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            Powering 10,000+ businesses across 50+ countries
          </div>
          
          <h1 className="hero-title">
            Run Smarter.<br/>
            Grow Faster.<br/>
            <span className="gradient-text">Scale Unlimited.</span>
          </h1>
          
          <p className="hero-subtitle">
            The intelligent platform that unifies billing, operations, and growth for hotels, restaurants, and pharmacies worldwide.
          </p>

          <div className="hero-cta">
            <a href="#signup" className="btn btn-hero-primary">
              <span>Start Free Trial</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10h12m0 0l-6-6m6 6l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </a>
            <a href="#demo" className="btn btn-hero-secondary">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
              </svg>
              <span>Watch Demo</span>
            </a>
          </div>

          <div className="hero-trust">
            <p className="trust-text">Trusted by industry leaders</p>
            <div className="trust-logos">
              <div className="trust-logo">Marriott</div>
              <div className="trust-logo">Hilton</div>
              <div className="trust-logo">IHG</div>
              <div className="trust-logo">Accor</div>
              <div className="trust-logo">Hyatt</div>
            </div>
          </div>

          <div className="hero-stats-modern">
            <div className="stat-card">
              <div className="stat-icon">⚡</div>
              <div className="stat-value counter" data-target="10000">10,000+</div>
              <div className="stat-label">Active Businesses</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-value counter" data-target="50000000">₹50M+</div>
              <div className="stat-label">Processed Daily</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🌍</div>
              <div className="stat-value counter" data-target="50">50+</div>
              <div className="stat-label">Countries</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-value">99.9%</div>
              <div className="stat-label">Uptime SLA</div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="floating-card card-1">
            <div className="card-header">
              <div className="card-icon">📊</div>
              <span>Revenue Analytics</span>
            </div>
            <div className="card-chart">
              <div className="mini-bar" style={{height: '40%'}}></div>
              <div className="mini-bar" style={{height: '65%'}}></div>
              <div className="mini-bar" style={{height: '85%'}}></div>
              <div className="mini-bar" style={{height: '95%'}}></div>
              <div className="mini-bar" style={{height: '75%'}}></div>
            </div>
            <div className="card-value">+32% This Month</div>
          </div>

          <div className="floating-card card-2">
            <div className="card-notification">
              <div className="notification-dot"></div>
              <span>New Booking</span>
            </div>
            <div className="notification-content">
              <strong>Suite 501</strong>
              <p>Check-in: Today, 2:00 PM</p>
            </div>
          </div>

          <div className="floating-card card-3">
            <div className="card-metric">
              <div className="metric-label">Occupancy Rate</div>
              <div className="metric-value">94%</div>
              <div className="metric-trend">↑ 12% vs last week</div>
            </div>
          </div>

          <div className="floating-card card-4 subtle">
            <div className="card-header">
              <div className="card-icon">💳</div>
              <span>Payment</span>
            </div>
            <div className="card-value">₹1,24,500</div>
            <div className="card-label">Today's Revenue</div>
          </div>

          <div className="floating-card card-5 subtle">
            <div className="card-header">
              <div className="card-icon">👥</div>
              <span>Guests</span>
            </div>
            <div className="card-value">142</div>
            <div className="card-label">Active Check-ins</div>
          </div>

          <div className="floating-card card-6 subtle">
            <div className="card-header">
              <div className="card-icon">🔔</div>
              <span>Alert</span>
            </div>
            <div className="notification-content">
              <p>3 Rooms Ready</p>
            </div>
          </div>

          <div className="floating-card card-7">
            <div className="card-header">
              <div className="card-icon">🧹</div>
              <span>Housekeeping</span>
            </div>
            <div className="card-value">Room 203</div>
            <div className="card-label">Cleaning Complete</div>
          </div>

          <div className="floating-card card-8">
            <div className="card-header">
              <div className="card-icon">🍽️</div>
              <span>Room Service</span>
            </div>
            <div className="card-value">Order #456</div>
            <div className="card-label">Suite 308 - Delivered</div>
          </div>

          <div className="floating-card card-9">
            <div className="card-header">
              <div className="card-icon">📞</div>
              <span>Front Desk</span>
            </div>
            <div className="card-value">5 Calls</div>
            <div className="card-label">Waiting in Queue</div>
          </div>

          <div className="floating-card card-10">
            <div className="card-header">
              <div className="card-icon">🗓️</div>
              <span>Reservations</span>
            </div>
            <div className="card-value">28 New</div>
            <div className="card-label">This Week</div>
          </div>

          <div className="floating-card card-11">
            <div className="card-header">
              <div className="card-icon">⭐</div>
              <span>Reviews</span>
            </div>
            <div className="card-value">4.8/5.0</div>
            <div className="card-label">142 Reviews Today</div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="products-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Powerful Solutions for Every Industry</h2>
            <p className="section-subtitle">
              Industry-specific features designed to solve your unique business challenges
            </p>
          </div>
          <div className="grid grid-3">
            <div className="product-card">
              <div className="product-icon">🏨</div>
              <h3>Hotel Management System</h3>
              <p>Complete property management with reservations, housekeeping, billing, and guest management.</p>
              <ul className="product-features">
                <li>✓ Online Booking Engine</li>
                <li>✓ Front Desk Operations</li>
                <li>✓ Housekeeping Management</li>
                <li>✓ Multi-property Support</li>
              </ul>
              <a href="/hms" className="btn btn-secondary">Learn More →</a>
            </div>

            <div className="product-card featured">
              <div className="popular-badge">Most Popular</div>
              <div className="product-icon">🍽️</div>
              <h3>Restaurant Management</h3>
              <p>Full-featured POS system with inventory, table management, and kitchen display.</p>
              <ul className="product-features">
                <li>✓ Point of Sale (POS)</li>
                <li>✓ Table Management</li>
                <li>✓ Kitchen Display System</li>
                <li>✓ Online Orders Integration</li>
              </ul>
              <a href="/rms" className="btn btn-primary">Learn More →</a>
            </div>

            <div className="product-card">
              <div className="product-icon">💊</div>
              <h3>Pharmacy Management</h3>
              <p>Streamline pharmacy operations with inventory, billing, and prescription management.</p>
              <ul className="product-features">
                <li>✓ Inventory Management</li>
                <li>✓ Prescription Tracking</li>
                <li>✓ Expiry Date Alerts</li>
                <li>✓ GST Compliance</li>
              </ul>
              <a href="/pms" className="btn btn-secondary">Learn More →</a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" style={{background: 'var(--bg-light)'}}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose BillSutra?</h2>
            <p className="section-subtitle">
              Enterprise-grade features at startup-friendly prices
            </p>
          </div>
          <div className="grid grid-4">
            <div className="feature-card">
              <div className="feature-icon">☁️</div>
              <h4>100% Cloud-Based</h4>
              <p>Access from anywhere, anytime. No installations required.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h4>Bank-Level Security</h4>
              <p>256-bit encryption and daily backups keep your data safe.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h4>Mobile Friendly</h4>
              <p>Fully responsive design works on all devices.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h4>Lightning Fast</h4>
              <p>Built for performance with real-time updates.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h4>Affordable Pricing</h4>
              <p>Plans starting at just ₹999/month with no hidden fees.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛠️</div>
              <h4>24/7 Support</h4>
              <p>Expert support team available round the clock.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h4>Powerful Analytics</h4>
              <p>Real-time insights and detailed reports.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔗</div>
              <h4>Easy Integration</h4>
              <p>Connect with payment gateways, accounting tools, and more.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Loved by Business Owners</h2>
            <p className="section-subtitle">
              See what our customers have to say
            </p>
          </div>
          <div className="grid grid-3">
            <div className="testimonial-card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "BillSutra transformed how we manage our hotel. Check-ins are faster, housekeeping is organized, and our revenue has increased by 30%."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">RK</div>
                <div>
                  <div className="author-name">Rajesh Kumar</div>
                  <div className="author-title">Hotel Paradise, Mumbai</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "The restaurant POS is incredibly intuitive. Our staff learned it in 30 minutes. Kitchen orders are error-free now."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">PS</div>
                <div>
                  <div className="author-name">Priya Sharma</div>
                  <div className="author-title">Spice Garden Restaurant, Delhi</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "Inventory management became so simple. Expiry alerts saved us thousands. Customer support is outstanding."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">AM</div>
                <div>
                  <div className="author-name">Amit Mehta</div>
                  <div className="author-title">MediCare Pharmacy, Bangalore</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Transform Your Business?</h2>
            <p>Join thousands of businesses already using BillSutra. Start your 14-day free trial today.</p>
            <div className="cta-buttons">
              <a href="#signup" className="btn btn-white btn-large">
                Start Free Trial
              </a>
              <a href="/contact" className="btn btn-secondary btn-large" style={{borderColor: 'white', color: 'white'}}>
                Contact Sales
              </a>
            </div>
            <p className="cta-note">No credit card required • Cancel anytime • Free migration assistance</p>
          </div>
        </div>
      </section>
    </div>
  )
}
