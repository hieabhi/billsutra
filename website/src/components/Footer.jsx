import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-logo">
              <span className="logo-icon">📊</span>
              <span className="logo-text">BillSutra</span>
            </div>
            <p className="footer-desc">
              Complete billing and management solutions for businesses worldwide. 
              Trusted by thousands of hotels, restaurants, and pharmacies.
            </p>
            <div className="social-links">
              <a href="#" aria-label="LinkedIn">🔗</a>
              <a href="#" aria-label="Twitter">🐦</a>
              <a href="#" aria-label="Facebook">📘</a>
              <a href="#" aria-label="Instagram">📷</a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Products</h4>
            <Link to="/hms">Hotel Management</Link>
            <Link to="/rms">Restaurant Management</Link>
            <Link to="/pms">Pharmacy Management</Link>
            <a href="#">Retail Management</a>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Careers</a>
            <Link to="/contact">Contact</Link>
            <a href="#">Blog</a>
          </div>

          <div className="footer-col">
            <h4>Support</h4>
            <a href="#">Help Center</a>
            <a href="#">Documentation</a>
            <Link to="/pricing">Pricing</Link>
            <a href="#">API Reference</a>
          </div>

          <div className="footer-col">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
            <a href="#">GDPR</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 BillSutra. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
