import { Link } from 'react-router-dom'
import { useState } from 'react'
import './Navbar.css'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-content">
          <Link to="/" className="logo">
            <span className="logo-icon">📊</span>
            <span className="logo-text">BillSutra</span>
          </Link>

          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <div className="nav-products">
              <button className="nav-link dropdown-trigger">
                Products <span className="arrow">▼</span>
              </button>
              <div className="dropdown">
                <Link to="/hms" className="dropdown-item">
                  <span className="dropdown-icon">🏨</span>
                  <div>
                    <div className="dropdown-title">Hotel Management</div>
                    <div className="dropdown-desc">Complete hotel operations platform</div>
                  </div>
                </Link>
                <Link to="/rms" className="dropdown-item">
                  <span className="dropdown-icon">🍽️</span>
                  <div>
                    <div className="dropdown-title">Restaurant Management</div>
                    <div className="dropdown-desc">POS, inventory & table management</div>
                  </div>
                </Link>
                <Link to="/pms" className="dropdown-item">
                  <span className="dropdown-icon">💊</span>
                  <div>
                    <div className="dropdown-title">Pharmacy Management</div>
                    <div className="dropdown-desc">Billing, inventory & prescriptions</div>
                  </div>
                </Link>
              </div>
            </div>
            <Link to="/pricing" className="nav-link">Pricing</Link>
            <Link to="/contact" className="nav-link">Contact</Link>
          </div>

          <div className="nav-actions">
            <a href="#login" className="btn-login">Log In</a>
            <a href="#signup" className="btn btn-primary">Start Free Trial</a>
          </div>
        </div>
      </div>
    </nav>
  )
}
