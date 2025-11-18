import { useState } from 'react'
import './Contact.css'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    business: 'hotel',
    message: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    alert('Form submitted! We\'ll contact you within 24 hours.')
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="container">
          <div className="section-header">
            <h1>Get in Touch</h1>
            <p>Have questions? We'd love to hear from you. Our team is here to help.</p>
          </div>
        </div>
      </section>

      <section className="contact-section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <h3>Contact Information</h3>
              <p>Fill out the form and our team will get back to you within 24 hours.</p>

              <div className="contact-details">
                <div className="contact-item">
                  <div className="contact-icon">📧</div>
                  <div>
                    <h4>Email</h4>
                    <p>support@billsutra.com</p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">📞</div>
                  <div>
                    <h4>Phone</h4>
                    <p>+91 98765 43210</p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">📍</div>
                  <div>
                    <h4>Office</h4>
                    <p>Mumbai, Maharashtra, India</p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">⏰</div>
                  <div>
                    <h4>Working Hours</h4>
                    <p>Mon-Sat: 9:00 AM - 6:00 PM IST</p>
                  </div>
                </div>
              </div>

              <div className="social-links">
                <h4>Follow Us</h4>
                <div className="social-icons">
                  <a href="#">🔗 LinkedIn</a>
                  <a href="#">🐦 Twitter</a>
                  <a href="#">📘 Facebook</a>
                  <a href="#">📷 Instagram</a>
                </div>
              </div>
            </div>

            <div className="contact-form-wrapper">
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your@email.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="business">Business Type *</label>
                  <select
                    id="business"
                    name="business"
                    value={formData.business}
                    onChange={handleChange}
                    required
                  >
                    <option value="hotel">Hotel/Resort</option>
                    <option value="restaurant">Restaurant/Cafe</option>
                    <option value="pharmacy">Pharmacy</option>
                    <option value="retail">Retail Store</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    placeholder="Tell us about your requirements..."
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary btn-large" style={{width: '100%'}}>
                  Send Message
                </button>

                <p className="form-note">
                  By submitting this form, you agree to our Privacy Policy.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
