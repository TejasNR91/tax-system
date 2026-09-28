import { useRef } from 'react'
import { useTax } from '../context/TaxContext.jsx'
import { formatINR, parseINR, compute80CTotal } from '../utils/formatters.js'
import { useNavigate } from 'react-router-dom'

export default function Step7Summary({ onBack }) {
  const { income, deductions, profile, results } = useTax()
  const navigate = useNavigate()
  const printRef = useRef()

  const grossIncome = parseINR(income.grossSalary) + parseINR(income.businessIncome) + parseINR(income.interestIncome) + parseINR(income.rentalIncome)
  const rec = results?.recommendation
  const old = results?.oldRegime
  const nw = results?.newRegime
  const bucket80C = compute80CTotal(deductions)

  const handlePrint = () => window.print()

  const userTypeLabel = {
    general: 'General (Below 60)',
    senior: 'Senior Citizen (60–79)',
    super_senior: 'Super Senior (80+)',
    nri: 'NRI'
  }[profile.userType]

  const empLabel = {
    salaried: 'Salaried',
    self_employed: 'Self-Employed',
    business: 'Business Owner',
  }[profile.employmentType]

  return (
    <div className="step-wrapper" ref={printRef}>
      <div className="step-header">
        <div className="badge badge-green" style={{ marginBottom: 12, display: 'inline-flex' }}>✓ Complete</div>
        <h2>📄 Your Tax Summary</h2>
        <p>FY 2025-26 · AY 2026-27</p>
      </div>

      {/* Summary Card */}
      <div className="summary-hero">
        <div className="summary-hero-left">
          <div className="sh-label">Best Regime for You</div>
          <div className="sh-regime">
            {rec?.betterRegime === 'new' ? '🆕 New Regime' : rec?.betterRegime === 'old' ? '📋 Old Regime' : '⚖️ Either'}
          </div>
          {rec && <p className="sh-reason">{rec.reason}</p>}
        </div>
        {rec?.savings > 0 && (
          <div className="summary-hero-right">
            <span>Annual Savings</span>
            <strong className="tax-amount large amount-savings">{formatINR(rec.savings)}</strong>
            <span>by choosing the right regime</span>
          </div>
        )}
      </div>

      {/* Profile Summary */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 className="summary-section-head">👤 Profile</h3>
        <div className="grid-2" style={{ marginTop: 14, gap: 10 }}>
          <div className="sum-row"><span>Taxpayer Type</span><strong>{userTypeLabel}</strong></div>
          <div className="sum-row"><span>Employment</span><strong>{empLabel}</strong></div>
          <div className="sum-row"><span>Financial Year</span><strong>FY 2025-26</strong></div>
          <div className="sum-row"><span>Assessment Year</span><strong>AY 2026-27</strong></div>
        </div>
      </div>

      {/* Income Summary */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 className="summary-section-head">💰 Income Summary</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          {parseINR(income.grossSalary) > 0 && <div className="sum-row"><span>Gross Salary</span><strong>{formatINR(income.grossSalary)}</strong></div>}
          {parseINR(income.businessIncome) > 0 && <div className="sum-row"><span>Business Income</span><strong>{formatINR(income.businessIncome)}</strong></div>}
          {parseINR(income.interestIncome) > 0 && <div className="sum-row"><span>Interest Income</span><strong>{formatINR(income.interestIncome)}</strong></div>}
          {parseINR(income.rentalIncome) > 0 && <div className="sum-row"><span>Rental Income</span><strong>{formatINR(income.rentalIncome)}</strong></div>}
          {parseINR(income.capitalGainsSTCG) > 0 && <div className="sum-row"><span>STCG (15%)</span><strong>{formatINR(income.capitalGainsSTCG)}</strong></div>}
          {parseINR(income.capitalGainsLTCG) > 0 && <div className="sum-row"><span>LTCG (10% above ₹1L)</span><strong>{formatINR(income.capitalGainsLTCG)}</strong></div>}
          <div className="sum-row sum-row--total"><span>Total Gross Income</span><strong style={{ color: 'var(--saffron)' }}>{formatINR(grossIncome)}</strong></div>
        </div>
      </div>

      {/* Deductions Summary */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 className="summary-section-head">🧾 Key Deductions (Old Regime)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          {bucket80C > 0 && <div className="sum-row"><span>Section 80C (PPF/ELSS/EPF…)</span><strong style={{ color: 'var(--green)' }}>- {formatINR(Math.min(bucket80C, 150000))}</strong></div>}
          {parseINR(deductions.sec80CCD1B) > 0 && <div className="sum-row"><span>Section 80CCD(1B) — NPS</span><strong style={{ color: 'var(--green)' }}>- {formatINR(Math.min(parseINR(deductions.sec80CCD1B), 50000))}</strong></div>}
          {parseINR(deductions.sec80D_self) > 0 && <div className="sum-row"><span>Section 80D — Health Insurance</span><strong style={{ color: 'var(--green)' }}>- {formatINR(Math.min(parseINR(deductions.sec80D_self), 25000))}</strong></div>}
          {parseINR(deductions.homeLoanInterest24b) > 0 && <div className="sum-row"><span>Section 24(b) — Home Loan Interest</span><strong style={{ color: 'var(--green)' }}>- {formatINR(Math.min(parseINR(deductions.homeLoanInterest24b), 200000))}</strong></div>}
          {old && <div className="sum-row sum-row--total"><span>Total Deductions</span><strong style={{ color: 'var(--green)' }}>- {formatINR(old.totalDeductions)}</strong></div>}
        </div>
      </div>

      {/* Tax Comparison Summary */}
      {old && nw && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
          <h3 className="summary-section-head">⚖️ Tax Comparison</h3>
          <div className="grid-2" style={{ marginTop: 14, gap: 14 }}>
            <div className="regime-summary-box">
              <div className="rsb-label">📋 Old Regime</div>
              <div className="rsb-amount" style={{ color: 'var(--red)' }}>{formatINR(old.totalTax)}</div>
              <div className="rsb-detail">Taxable: {formatINR(old.taxable)}</div>
              <div className="rsb-detail">Monthly TDS: {formatINR(old.monthlyTax)}</div>
              <div className="rsb-detail">Effective rate: {((old.totalTax / grossIncome) * 100).toFixed(1)}%</div>
            </div>
            <div className="regime-summary-box" style={{ borderColor: 'rgba(16,232,160,0.3)', background: 'var(--green-dim)' }}>
              <div className="rsb-label">🆕 New Regime</div>
              <div className="rsb-amount" style={{ color: 'var(--green)' }}>{formatINR(nw.totalTax)}</div>
              <div className="rsb-detail">Taxable: {formatINR(nw.taxable)}</div>
              <div className="rsb-detail">Monthly TDS: {formatINR(nw.monthlyTax)}</div>
              <div className="rsb-detail">Effective rate: {((nw.totalTax / grossIncome) * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Legal Notes */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 28 }}>
        <h3 className="summary-section-head">📌 Important Notes</h3>
        <ul style={{ marginTop: 14, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            'Health & Education Cess @ 4% is applicable on (tax + surcharge) in both regimes.',
            'Section 87A rebate: ₹60,000 (New Regime, income ≤ ₹12L) | ₹12,500 (Old Regime, income ≤ ₹5L).',
            'Surcharge applies if income > ₹50L. Max surcharge in New Regime is 25% (capped).',
            'LTCG on equity > ₹1L is taxed @10% (Sec 112A). STCG on equity @15% (Sec 111A).',
            'HRA exemption is available only in Old Regime. Standard deduction is ₹75K (New) / ₹50K (Old).',
            'New Regime is the default from FY 2024-25. You must opt out to choose Old Regime.',
            'This is an estimate. Actual tax may differ. Consult a CA for filing ITR.',
          ].map((note, i) => (
            <li key={i} style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {note}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginBottom: 32 }}>
        <button className="btn btn-success btn-lg" onClick={handlePrint}>🖨️ Print / Save as PDF</button>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>🏠 Back to Home</button>
        <button className="btn btn-ghost" onClick={() => navigate('/slabs')}>📋 View Tax Slabs</button>
        <button className="btn btn-ghost" onClick={() => navigate('/calculate')}>🔄 Recalculate</button>
      </div>

      <div className="step-nav">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
      </div>

      <style>{`
        .summary-hero {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;
          background: linear-gradient(135deg, rgba(16,24,48,0.9), rgba(10,16,35,0.95));
          border: 1px solid var(--border-accent); border-radius: var(--radius-xl);
          padding: 36px 40px; margin-bottom: 24px; gap: 24px;
        }
        .sh-label { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 8px; }
        .sh-regime { font-family: var(--font-display); font-size: 2rem; font-weight: 900; color: var(--saffron); margin-bottom: 8px; }
        .sh-reason { font-size: 0.9rem; color: var(--text-secondary); max-width: 360px; line-height: 1.6; }
        .summary-hero-right { text-align: center; display: flex; flex-direction: column; gap: 4px; }
        .summary-hero-right span { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; }
        .summary-section-head { font-family: var(--font-display); font-size: 1.05rem; font-weight: 700; }
        .sum-row { display: flex; justify-content: space-between; align-items: center;
          padding: 10px 14px; background: var(--bg-glass); border-radius: 8px; font-size: 0.88rem; }
        .sum-row span { color: var(--text-secondary); }
        .sum-row--total { background: var(--saffron-dim); border: 1px solid var(--border-accent); font-weight: 700; }
        .regime-summary-box {
          background: var(--saffron-dim); border: 1px solid var(--border-accent);
          border-radius: var(--radius-md); padding: 22px; display: flex; flex-direction: column; gap: 6px;
        }
        .rsb-label { font-family: var(--font-display); font-size: 0.95rem; font-weight: 700; }
        .rsb-amount { font-family: var(--font-display); font-size: 2rem; font-weight: 900; }
        .rsb-detail { font-size: 0.8rem; color: var(--text-muted); }
        @media print {
          .step-nav, .btn { display: none !important; }
          .calc-topbar, .progress-nav { display: none !important; }
          body { background: white !important; color: black !important; }
        }
      `}</style>
    </div>
  )
}
