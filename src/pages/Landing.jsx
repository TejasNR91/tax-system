import { useNavigate } from 'react-router-dom'
import './Landing.css'

const features = [
  { icon: '⚖️', title: 'Old vs New Regime', desc: 'Instant comparison with exact tax savings under both regimes for FY 2025-26', color: 'saffron' },
  { icon: '🧾', title: 'All Deductions', desc: '80C, 80D, HRA, NPS, 80E, 80G, 24(b) — every section covered', color: 'gold' },
  { icon: '💡', title: 'Smart Suggestions', desc: 'Personalized tips to minimize your tax liability with ranked investments', color: 'green' },
  { icon: '📊', title: 'Visual Breakdown', desc: 'Beautiful charts showing exactly where your tax goes', color: 'blue' },
  { icon: '🏠', title: 'HRA Calculator', desc: 'Auto-compute HRA exemption for metro & non-metro cities', color: 'purple' },
  { icon: '📄', title: 'Tax Summary', desc: 'Download a complete PDF of your personalized tax plan', color: 'red' },
]

const slabPreview = [
  { regime: 'New', income: '0 – ₹3L', rate: '0%', highlight: true },
  { regime: 'New', income: '₹3L – ₹7L', rate: '5%', highlight: false },
  { regime: 'New', income: '₹7L – ₹10L', rate: '10%', highlight: false },
  { regime: 'New', income: '₹10L – ₹12L', rate: '15%', highlight: false },
  { regime: 'New', income: '₹12L – ₹15L', rate: '20%', highlight: false },
  { regime: 'New', income: 'Above ₹15L', rate: '30%', highlight: false },
]

const stats = [
  { value: '₹0', label: 'Tax up to ₹12L (New Regime)', sub: 'With 87A rebate' },
  { value: '4.25L+', label: 'Max deductions in Old Regime', sub: '80C + NPS + 80D + HRA' },
  { value: '4%', label: 'Health & Education Cess', sub: 'On (tax + surcharge)' },
  { value: '37%', label: 'Max surcharge (Old Regime)', sub: 'Above ₹5 Crore income' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="landing">
      {/* Animated background */}
      <div className="landing-bg">
        <div className="bg-orb orb-1" />
        <div className="bg-orb orb-2" />
        <div className="bg-orb orb-3" />
        <div className="bg-grid" />
      </div>

      {/* Nav */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <span className="nav-logo-icon">🇮🇳</span>
          <span className="nav-logo-text">Tax<span>Saathi</span></span>
        </div>
        <div className="nav-links">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/slabs')}>Tax Slabs</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/calculate')}>Calculate Now</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-badge animate-fade">
          <span>🆕</span> FY 2025-26 · AY 2026-27 · Union Budget Updated
        </div>
        <h1 className="hero-title animate-fade-up delay-1">
          India's Smartest<br />
          <span className="gradient-text">Tax Optimizer</span>
        </h1>
        <p className="hero-subtitle animate-fade-up delay-2">
          Compare Old vs New tax regime, claim all deductions, and discover<br />
          exactly how much tax you can save — in under 3 minutes.
        </p>
        <div className="hero-actions animate-fade-up delay-3">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/calculate')}>
            🚀 Start Saving Tax
          </button>
          <button className="btn btn-ghost btn-lg" onClick={() => navigate('/slabs')}>
            📋 View Tax Slabs
          </button>
        </div>

        {/* Quick stats */}
        <div className="hero-stats animate-fade-up delay-4">
          {stats.map((s, i) => (
            <div className="hero-stat" key={i}>
              <span className="hero-stat-value">{s.value}</span>
              <span className="hero-stat-label">{s.label}</span>
              <span className="hero-stat-sub">{s.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="page-container">
          <h2 className="features-title">Everything You Need to <span className="accent">Save Tax</span></h2>
          <div className="features-grid">
            {features.map((f, i) => (
              <div className={`feature-card animate-fade-up delay-${i + 1}`} key={i}>
                <div className={`feature-icon feature-icon--${f.color}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Slab Preview */}
      <section className="slabs-preview-section">
        <div className="page-container">
          <div className="slabs-preview-inner">
            <div className="slabs-preview-left">
              <div className="badge badge-green" style={{ marginBottom: '16px' }}>New Regime FY 2025-26</div>
              <h2 className="section-title" style={{ fontSize: '1.8rem', marginBottom: '12px' }}>
                Zero Tax<br /><span className="accent">Up to ₹12 Lakh</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.7' }}>
                Under the new tax regime with Section 87A rebate of ₹60,000, 
                your effective tax is <strong style={{ color: 'var(--green)' }}>₹0</strong> if your 
                taxable income is up to ₹12 Lakh.
              </p>
              <button className="btn btn-primary" onClick={() => navigate('/calculate')}>
                Calculate My Tax →
              </button>
            </div>
            <div className="slabs-preview-right">
              {slabPreview.map((s, i) => (
                <div className={`slab-row ${s.highlight ? 'slab-row--zero' : ''}`} key={i}>
                  <span className="slab-income">{s.income}</span>
                  <span className={`slab-rate ${s.rate === '0%' ? 'rate-zero' : ''}`}>{s.rate}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-glow" />
        <h2>Ready to Maximize Your Savings?</h2>
        <p>Fill in your details in 3 minutes and get a personalized tax plan</p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/calculate')}>
          🧮 Start Tax Calculator
        </button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="page-container">
          <div className="footer-content">
            <div className="footer-brand">
              <span className="nav-logo-icon">🇮🇳</span>
              <span className="nav-logo-text">Tax<span>Saathi</span></span>
            </div>
            <p className="footer-disclaimer">
              📌 This tool is for <strong>educational purposes only</strong>. Tax calculations are based on publicly available Income Tax Act provisions for FY 2025-26. 
              Please consult a Chartered Accountant for personalized tax advice. Data entered is not stored or transmitted anywhere.
            </p>
            <p className="footer-copy">© 2026 TaxSaathi · Made for Indian Taxpayers 🇮🇳</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
