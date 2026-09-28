import { useNavigate } from 'react-router-dom'
import './SlabInfo.css'

const NEW_SLABS = [
  { from: '0', to: '₹3,00,000', rate: '0%', note: 'Nil', highlight: true },
  { from: '₹3,00,001', to: '₹7,00,000', rate: '5%', note: '₹0 – ₹20,000' },
  { from: '₹7,00,001', to: '₹10,00,000', rate: '10%', note: '₹20,001 – ₹50,000' },
  { from: '₹10,00,001', to: '₹12,00,000', rate: '15%', note: '₹50,001 – ₹80,000' },
  { from: '₹12,00,001', to: '₹15,00,000', rate: '20%', note: '₹80,001 – ₹1,40,000' },
  { from: '₹15,00,001', to: 'And above', rate: '30%', note: '₹1,40,001 +' },
]

const OLD_GENERAL = [
  { from: '0', to: '₹2,50,000', rate: '0%', note: 'Nil', highlight: true },
  { from: '₹2,50,001', to: '₹5,00,000', rate: '5%', note: '₹0 – ₹12,500' },
  { from: '₹5,00,001', to: '₹10,00,000', rate: '20%', note: '₹12,501 – ₹1,12,500' },
  { from: '₹10,00,001', to: 'And above', rate: '30%', note: '₹1,12,501 +' },
]

const OLD_SENIOR = [
  { from: '0', to: '₹3,00,000', rate: '0%', note: 'Nil (Senior Citizen)', highlight: true },
  { from: '₹3,00,001', to: '₹5,00,000', rate: '5%', note: '₹0 – ₹10,000' },
  { from: '₹5,00,001', to: '₹10,00,000', rate: '20%', note: '₹10,001 – ₹1,10,000' },
  { from: '₹10,00,001', to: 'And above', rate: '30%', note: '₹1,10,001 +' },
]

const OLD_SUPER = [
  { from: '0', to: '₹5,00,000', rate: '0%', note: 'Nil (Super Senior)', highlight: true },
  { from: '₹5,00,001', to: '₹10,00,000', rate: '20%', note: '₹0 – ₹1,00,000' },
  { from: '₹10,00,001', to: 'And above', rate: '30%', note: '₹1,00,001 +' },
]

const SURCHARGE = [
  { income: '₹50L – ₹1Cr', old: '10%', new: '10%' },
  { income: '₹1Cr – ₹2Cr', old: '15%', new: '15%' },
  { income: '₹2Cr – ₹5Cr', old: '25%', new: '25%' },
  { income: 'Above ₹5Cr', old: '37% ⚠️', new: '25% (capped)' },
]

const DEDUCTIONS = [
  { section: '80C', limit: '₹1,50,000', desc: 'PPF, ELSS, EPF, LIC, NSC, Home Loan Principal, Sukanya Samriddhi', regime: 'Old Only' },
  { section: '80CCC', limit: '₹1,50,000 (within 80C)', desc: 'Pension plan premium', regime: 'Old Only' },
  { section: '80CCD(1)', limit: 'Within ₹1,50,000 limit', desc: 'Employee NPS contribution', regime: 'Old Only' },
  { section: '80CCD(1B)', limit: '₹50,000 (over 80C)', desc: 'NPS — additional exclusive deduction', regime: 'Old Only' },
  { section: '80CCD(2)', limit: '10% of Basic+DA (no ₹ cap)', desc: 'Employer NPS contribution', regime: 'Both Regimes ✅' },
  { section: '80D', limit: '₹25,000 (self) + ₹25/50K (parents)', desc: 'Health insurance premium. ₹50K for senior parents.', regime: 'Old Only' },
  { section: '80DD', limit: '₹75,000 / ₹1,25,000 (severe)', desc: 'Medical expenditure for disabled dependent', regime: 'Old Only' },
  { section: '80DDB', limit: '₹40,000 / ₹1,00,000 (senior)', desc: 'Treatment of specified diseases', regime: 'Old Only' },
  { section: '80E', limit: 'No limit (8 years)', desc: 'Interest on education loan for higher studies', regime: 'Old Only' },
  { section: '80EEA', limit: '₹1,50,000', desc: 'Additional interest deduction — affordable housing (stamp ≤ ₹45L)', regime: 'Old Only' },
  { section: '80EEB', limit: '₹1,50,000', desc: 'Interest on EV loan', regime: 'Old Only' },
  { section: '80G', limit: 'Up to 100%/50% of donation', desc: 'Donations to approved charitable institutions', regime: 'Old Only' },
  { section: '80GGC', limit: 'Full amount', desc: 'Political party donations', regime: 'Old Only' },
  { section: '80TTA', limit: '₹10,000', desc: 'Savings account interest (non-senior citizens)', regime: 'Old Only' },
  { section: '80TTB', limit: '₹50,000', desc: 'All interest income (senior citizens)', regime: 'Old Only' },
  { section: '80U', limit: '₹75,000 / ₹1,25,000 (severe)', desc: 'Self disability deduction', regime: 'Old Only' },
  { section: '24(b)', limit: '₹2,00,000 (self-occ.) / No limit (let-out)', desc: 'Home loan interest deduction', regime: 'Old Only' },
  { section: 'HRA Exemption', limit: 'Min of 3 conditions', desc: '50%/40% of Basic, HRA received, Rent – 10% Basic', regime: 'Old Only' },
  { section: 'Standard Deduction', limit: '₹75,000 (New) / ₹50,000 (Old)', desc: 'For salaried/pensioners', regime: 'Both Regimes ✅' },
  { section: 'LTA', limit: 'Actual fare (economy)', desc: 'Leave Travel Allowance for domestic travel', regime: 'Old Only' },
  { section: 'Professional Tax', limit: '₹2,400 p.a.', desc: 'State-levied professional tax deducted by employer', regime: 'Both Regimes ✅' },
]

const CAPITAL_GAINS = [
  { type: 'STCG — Equity/Equity MF', hold: '< 1 year', rate: '20% (From FY 2024-25)', section: 'Sec 111A', note: 'Previously 15%' },
  { type: 'LTCG — Equity/Equity MF', hold: '≥ 1 year', rate: '12.5% above ₹1.25L', section: 'Sec 112A', note: 'Exemption ₹1.25L (from FY 2024-25)' },
  { type: 'STCG — Debt MF / Other', hold: 'Any', rate: 'Slab Rate', section: 'Sec 115', note: 'Added to income' },
  { type: 'LTCG — Debt MF / Other', hold: '≥ 24 months', rate: '12.5% (no indexation)', section: 'Sec 112', note: 'From FY 2024-25 budget' },
  { type: 'LTCG — Property', hold: '≥ 24 months', rate: '12.5% (no indexation)', section: 'Sec 112', note: 'Indexation removed from Budget 2024' },
  { type: 'STCG — Property', hold: '< 24 months', rate: 'Slab Rate', section: 'Sec 115', note: 'Added to income' },
]

export default function SlabInfo() {
  const navigate = useNavigate()

  return (
    <div className="slab-page">
      {/* Nav */}
      <nav className="slab-nav">
        <div className="nav-logo">
          <span>🇮🇳</span>
          <span className="nav-logo-text">Tax<span>Saathi</span></span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>← Home</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/calculate')}>🧮 Calculate Tax</button>
        </div>
      </nav>

      <div className="page-container" style={{ padding: '48px 24px' }}>
        <div className="slab-header">
          <div className="badge badge-saffron" style={{ marginBottom: 16 }}>FY 2025-26 · AY 2026-27</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900, marginBottom: 12 }}>
            Complete Indian <span style={{ color: 'var(--saffron)' }}>Tax Guide</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: 600 }}>
            All tax slabs, surcharge rates, deductions, and capital gains tax for FY 2025-26 in one place.
          </p>
        </div>

        {/* New Regime */}
        <section className="slab-section">
          <div className="slab-section-head">
            <h2>🆕 New Tax Regime Slabs</h2>
            <span className="badge badge-green">Default from FY 2024-25</span>
          </div>
          <div className="info-panel" style={{ marginBottom: 20 }}>
            <span>💡</span>
            <span>Standard Deduction: <strong>₹75,000</strong> &nbsp;|&nbsp; Section 87A Rebate: <strong>₹60,000</strong> (income ≤ ₹12L = ZERO tax) &nbsp;|&nbsp; Cess: <strong>4%</strong></span>
          </div>
          <div className="slab-table">
            <div className="slab-table-head">
              <span>Income Range</span>
              <span>Tax Rate</span>
              <span>Tax on This Slab</span>
            </div>
            {NEW_SLABS.map((s, i) => (
              <div className={`slab-table-row ${s.highlight ? 'slab-zero' : ''}`} key={i}>
                <span>{s.from} – {s.to}</span>
                <strong style={{ color: s.rate === '0%' ? 'var(--green)' : s.rate === '30%' ? 'var(--red)' : 'var(--saffron)' }}>{s.rate}</strong>
                <span style={{ color: 'var(--text-secondary)' }}>{s.note}</span>
              </div>
            ))}
          </div>
          <div className="slab-note">
            ⭐ <strong>Zero Tax for income up to ₹12 Lakh</strong> after Section 87A rebate of ₹60,000 under new regime.
          </div>
        </section>

        {/* Old Regime */}
        <section className="slab-section">
          <div className="slab-section-head">
            <h2>📋 Old Tax Regime Slabs</h2>
            <span className="badge badge-saffron">Must opt-in explicitly</span>
          </div>
          <div className="info-panel" style={{ marginBottom: 20 }}>
            <span>ℹ️</span>
            <span>Standard Deduction: <strong>₹50,000</strong> &nbsp;|&nbsp; Section 87A Rebate: <strong>₹12,500</strong> (income ≤ ₹5L = ZERO tax) &nbsp;|&nbsp; All Chapter VI-A deductions available</span>
          </div>

          <h4 style={{ marginBottom: 12, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>General Taxpayers (Below 60 years)</h4>
          <div className="slab-table">
            <div className="slab-table-head"><span>Income Range</span><span>Tax Rate</span><span>Tax on This Slab</span></div>
            {OLD_GENERAL.map((s, i) => (
              <div className={`slab-table-row ${s.highlight ? 'slab-zero' : ''}`} key={i}>
                <span>{s.from} – {s.to}</span>
                <strong style={{ color: s.rate === '0%' ? 'var(--green)' : s.rate === '30%' ? 'var(--red)' : 'var(--saffron)' }}>{s.rate}</strong>
                <span style={{ color: 'var(--text-secondary)' }}>{s.note}</span>
              </div>
            ))}
          </div>

          <h4 style={{ margin: '24px 0 12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Senior Citizens (60–79 years)</h4>
          <div className="slab-table">
            <div className="slab-table-head"><span>Income Range</span><span>Tax Rate</span><span>Tax on This Slab</span></div>
            {OLD_SENIOR.map((s, i) => (
              <div className={`slab-table-row ${s.highlight ? 'slab-zero' : ''}`} key={i}>
                <span>{s.from} – {s.to}</span>
                <strong style={{ color: s.rate === '0%' ? 'var(--green)' : s.rate === '30%' ? 'var(--red)' : 'var(--saffron)' }}>{s.rate}</strong>
                <span style={{ color: 'var(--text-secondary)' }}>{s.note}</span>
              </div>
            ))}
          </div>

          <h4 style={{ margin: '24px 0 12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Super Senior Citizens (80+ years)</h4>
          <div className="slab-table">
            <div className="slab-table-head"><span>Income Range</span><span>Tax Rate</span><span>Tax on This Slab</span></div>
            {OLD_SUPER.map((s, i) => (
              <div className={`slab-table-row ${s.highlight ? 'slab-zero' : ''}`} key={i}>
                <span>{s.from} – {s.to}</span>
                <strong style={{ color: s.rate === '0%' ? 'var(--green)' : s.rate === '30%' ? 'var(--red)' : 'var(--saffron)' }}>{s.rate}</strong>
                <span style={{ color: 'var(--text-secondary)' }}>{s.note}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Surcharge */}
        <section className="slab-section">
          <div className="slab-section-head">
            <h2>📈 Surcharge Rates</h2>
            <span className="badge badge-red">High Income</span>
          </div>
          <div className="info-panel" style={{ marginBottom: 20 }}>
            <span>⚠️</span>
            <span>Surcharge is levied on the <strong>income tax amount</strong> (not income). Cess of 4% is then applied on (tax + surcharge).</span>
          </div>
          <div className="slab-table">
            <div className="slab-table-head"><span>Income Bracket</span><span>Old Regime Surcharge</span><span>New Regime Surcharge</span></div>
            {SURCHARGE.map((s, i) => (
              <div className="slab-table-row" key={i}>
                <span>{s.income}</span>
                <strong style={{ color: 'var(--red)' }}>{s.old}</strong>
                <strong style={{ color: 'var(--saffron)' }}>{s.new}</strong>
              </div>
            ))}
          </div>
          <div className="slab-note">
            ⭐ <strong>Good news:</strong> In the new regime, surcharge is capped at 25% even for incomes above ₹5 Crore. 
            Old regime still has 37% surcharge above ₹5Cr.
          </div>
        </section>

        {/* Capital Gains */}
        <section className="slab-section">
          <div className="slab-section-head">
            <h2>📊 Capital Gains Tax — FY 2025-26</h2>
            <span className="badge badge-purple">Budget 2024 Updated</span>
          </div>
          <div className="info-panel" style={{ marginBottom: 20 }}>
            <span>⚠️</span>
            <span>Budget 2024 changed STCG rate from 15% → 20% and LTCG exemption from ₹1L → ₹1.25L. Indexation removed from debt/property LTCG.</span>
          </div>
          <div className="slab-table">
            <div className="slab-table-head"><span>Asset Type</span><span>Holding Period</span><span>Tax Rate</span><span>Section</span></div>
            {CAPITAL_GAINS.map((s, i) => (
              <div className="slab-table-row" key={i}>
                <div>
                  <span>{s.type}</span>
                  {s.note && <div style={{ fontSize: '0.72rem', color: 'var(--gold)', marginTop: 2 }}>⚡ {s.note}</div>}
                </div>
                <span style={{ color: 'var(--text-secondary)' }}>{s.hold}</span>
                <strong style={{ color: 'var(--saffron)' }}>{s.rate}</strong>
                <span className="badge badge-blue">{s.section}</span>
              </div>
            ))}
          </div>
        </section>

        {/* All Deductions */}
        <section className="slab-section">
          <div className="slab-section-head">
            <h2>🧾 All Deductions & Exemptions</h2>
            <span className="badge badge-saffron">Old Regime (mostly)</span>
          </div>
          <div className="ded-table">
            <div className="ded-table-head">
              <span>Section</span>
              <span>Limit</span>
              <span>Description</span>
              <span>Regime</span>
            </div>
            {DEDUCTIONS.map((d, i) => (
              <div className="ded-table-row" key={i}>
                <strong style={{ color: 'var(--saffron)', fontFamily: 'var(--font-display)' }}>{d.section}</strong>
                <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.85rem' }}>{d.limit}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{d.desc}</span>
                <span className={`badge badge-${d.regime.includes('Both') ? 'green' : 'saffron'}`} style={{ fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                  {d.regime}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, marginBottom: 16 }}>
            Ready to Calculate Your Tax?
          </h3>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/calculate')}>
            🧮 Start Tax Calculator
          </button>
        </div>
      </div>
    </div>
  )
}
