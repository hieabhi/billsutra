import './Pricing.css'

export default function Pricing() {
  return (
    <div className="pricing-page">
      <section className="pricing-hero">
        <div className="container">
          <div className="section-header">
            <h1>Simple, Transparent Pricing</h1>
            <p>Choose the perfect plan for your business. All plans include a 14-day free trial.</p>
          </div>
        </div>
      </section>

      <section className="pricing-section">
        <div className="container">
          <div className="pricing-toggle">
            <button className="toggle-btn active">Monthly</button>
            <button className="toggle-btn">Yearly <span className="save-badge">Save 20%</span></button>
          </div>

          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Starter</h3>
              <div className="price">₹999<span>/month</span></div>
              <p className="plan-desc">Perfect for small businesses getting started</p>
              <ul>
                <li>✓ 1 Location</li>
                <li>✓ Up to 20 rooms/tables</li>
                <li>✓ Basic reporting</li>
                <li>✓ Email support</li>
                <li>✓ Mobile app access</li>
                <li>✓ Cloud backup</li>
              </ul>
              <a href="#" className="btn btn-secondary btn-large">Start Free Trial</a>
            </div>

            <div className="pricing-card featured">
              <div className="popular-badge">Most Popular</div>
              <h3>Professional</h3>
              <div className="price">₹2,499<span>/month</span></div>
              <p className="plan-desc">For growing businesses with advanced needs</p>
              <ul>
                <li>✓ 1 Location</li>
                <li>✓ Unlimited rooms/tables</li>
                <li>✓ Advanced analytics</li>
                <li>✓ Priority support</li>
                <li>✓ Custom integrations</li>
                <li>✓ API access</li>
                <li>✓ Multi-user access</li>
                <li>✓ Dedicated onboarding</li>
              </ul>
              <a href="#" className="btn btn-primary btn-large">Start Free Trial</a>
            </div>

            <div className="pricing-card">
              <h3>Enterprise</h3>
              <div className="price">₹9,999<span>/month</span></div>
              <p className="plan-desc">For large businesses and chains</p>
              <ul>
                <li>✓ Unlimited locations</li>
                <li>✓ Everything in Pro</li>
                <li>✓ White-label option</li>
                <li>✓ 24/7 phone support</li>
                <li>✓ Dedicated account manager</li>
                <li>✓ Custom development</li>
                <li>✓ SLA guarantee</li>
                <li>✓ Training sessions</li>
              </ul>
              <a href="#" className="btn btn-secondary btn-large">Contact Sales</a>
            </div>
          </div>

          <div className="pricing-note">
            <p>All plans include free data migration and cancel anytime. No credit card required for trial.</p>
          </div>
        </div>
      </section>

      <section className="faq-section">
        <div className="container">
          <div className="section-header">
            <h2>Frequently Asked Questions</h2>
          </div>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>Can I switch plans anytime?</h4>
              <p>Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div className="faq-item">
              <h4>What payment methods do you accept?</h4>
              <p>We accept all major credit/debit cards, UPI, net banking, and wallets through Razorpay.</p>
            </div>
            <div className="faq-item">
              <h4>Is there a setup fee?</h4>
              <p>No setup fees. We also provide free data migration from your existing system.</p>
            </div>
            <div className="faq-item">
              <h4>What happens after the trial?</h4>
              <p>You can choose a plan or continue with the free version with limited features.</p>
            </div>
            <div className="faq-item">
              <h4>Do you offer refunds?</h4>
              <p>Yes, we offer a 30-day money-back guarantee if you're not satisfied.</p>
            </div>
            <div className="faq-item">
              <h4>Is my data secure?</h4>
              <p>Absolutely! We use 256-bit encryption and perform daily backups to ensure data security.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Get Started?</h2>
            <p>Start your 14-day free trial today. No credit card required.</p>
            <a href="#" className="btn btn-white btn-large">Start Free Trial</a>
          </div>
        </div>
      </section>
    </div>
  )
}
