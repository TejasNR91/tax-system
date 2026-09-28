import { useTax } from '../context/TaxContext.jsx'
import { formatINR, compute80CTotal, parseINR } from '../utils/formatters.js'

const PRIORITY_COLORS = { HIGH: 'red', MEDIUM: 'saffron', LOW: 'blue' }

function generateSuggestions(grossIncome, deductions, results) {
  const suggestions = []
  const c80 = compute80CTotal(deductions)
  const c80gap = Math.max(0, 150000 - c80)
  const marginalRate = grossIncome > 1000000 ? 0.30 : grossIncome > 500000 ? 0.20 : 0.05
  const taxMultiplier = marginalRate * 1.04

  if (c80gap > 0) suggestions.push({
    section: 'Section 80C', icon: '📦', priority: 'HIGH',
    title: `Invest ₹${c80gap.toLocaleString('en-IN')} more in 80C`,
    taxSaving: Math.round(c80gap * taxMultiplier),
    gap: c80gap,
    description: `You've utilized ₹${Math.min(c80, 150000).toLocaleString('en-IN')} of the ₹1,50,000 80C limit. Investing more will reduce taxable income.`,
    instruments: [
      { name: 'PPF (Public Provident Fund)', returns: '7.1% p.a. (tax-free)', lock: '15 years', risk: 'Zero' },
      { name: 'ELSS Mutual Funds', returns: '12–15% avg (market)', lock: '3 years', risk: 'Moderate' },
      { name: 'EPF Voluntary Top-up (VPF)', returns: '8.15% p.a. (tax-free)', lock: 'Till retirement', risk: 'Zero' },
      { name: 'NSC (National Savings Certificate)', returns: '7.7% p.a.', lock: '5 years', risk: 'Zero' },
      { name: '5-Year Tax-Saving FD', returns: '6.5–7.5% p.a.', lock: '5 years', risk: 'Zero' },
    ],
  })

  const nps = parseINR(deductions.sec80CCD1B)
  const npsgap = Math.max(0, 50000 - nps)
  if (npsgap > 0) suggestions.push({
    section: 'Section 80CCD(1B)', icon: '🏛️', priority: 'HIGH',
    title: `NPS — Claim extra ₹${npsgap.toLocaleString('en-IN')} deduction`,
    taxSaving: Math.round(npsgap * taxMultiplier),
    gap: npsgap,
    description: `NPS provides an additional ₹50,000 deduction over 80C. This is exclusive and cannot be claimed under 80C. Great for retirement savings.`,
    instruments: [
      { name: 'NPS Tier-I (eNPS)', returns: '9–12% avg (market-linked)', lock: 'Till 60 years', risk: 'Moderate' },
      { name: 'NPS via Employer', returns: 'Same as eNPS', lock: 'Till 60 years', risk: 'Moderate' },
    ],
  })

  const d80self = parseINR(deductions.sec80D_self)
  const d80gap = Math.max(0, 25000 - d80self)
  if (d80gap > 0) suggestions.push({
    section: 'Section 80D', icon: '🏥', priority: 'MEDIUM',
    title: `Health Insurance — Save up to ₹${Math.round(d80gap * 0.20).toLocaleString('en-IN')} more in tax`,
    taxSaving: Math.round(d80gap * 0.20 * 1.04),
    gap: d80gap,
    description: `You can claim up to ₹25,000 for health insurance for yourself, spouse, and children. Additionally, ₹25,000–₹50,000 for parents.`,
    instruments: [
      { name: 'Family Floater Health Policy', returns: 'Insurance protection', lock: 'Annual', risk: 'None' },
      { name: 'Individual Health Policy', returns: 'Insurance protection', lock: 'Annual', risk: 'None' },
      { name: 'Critical Illness Plan', returns: 'Lump-sum payout', lock: 'Annual', risk: 'None' },
      { name: 'Top-Up / Super Top-Up Plan', returns: 'High coverage, low premium', lock: 'Annual', risk: 'None' },
    ],
  })

  if (!parseINR(deductions.homeLoanInterest24b)) suggestions.push({
    section: 'Section 24(b)', icon: '🏠', priority: 'MEDIUM',
    title: 'Home Loan Interest — Deduct up to ₹2,00,000',
    taxSaving: Math.round(200000 * 0.30 * 1.04),
    gap: 200000,
    description: 'If you have a home loan on a self-occupied property, interest component is deductible up to ₹2,00,000 per year. This can save up to ₹62,400 in tax.',
    instruments: [
      { name: 'SBI Home Loan', returns: '8.5–9.5% p.a.', lock: 'Flexible', risk: 'Credit risk' },
      { name: 'Joint Home Loan', returns: 'Both co-borrowers can claim', lock: 'Flexible', risk: 'Credit risk' },
    ],
  })

  if (grossIncome > 500000) suggestions.push({
    section: 'Salary Structure', icon: '💼', priority: 'LOW',
    title: 'Restructure CTC to Include Tax-Free Allowances',
    taxSaving: null,
    gap: null,
    description: 'Many salary components are fully or partially tax-exempt. Ask your HR/employer to restructure your CTC.',
    instruments: [
      { name: 'Meal Coupons (Sodexo/Pluxee)', returns: '₹50/day × 22 days = ₹13,200 p.a. tax-free', lock: 'Monthly', risk: 'None' },
      { name: 'Mobile/Internet Reimbursement', returns: 'Actual expenses tax-free', lock: 'Monthly', risk: 'None' },
      { name: 'Leave Travel Allowance (LTA)', returns: 'Economy fare reimbursement', lock: 'Twice per 4 years', risk: 'None' },
      { name: 'Car Lease Policy', returns: 'Lower taxable perquisite vs ownership', lock: 'Lease period', risk: 'None' },
    ],
  })

  return suggestions
}

export default function Step5Suggestions({ onNext, onBack }) {
  const { income, deductions, results } = useTax()
  const grossIncome = parseINR(income.grossSalary) + parseINR(income.businessIncome)
  const suggestions = generateSuggestions(grossIncome, deductions, results)
  const totalPotentialSaving = suggestions.reduce((s, sg) => s + (sg.taxSaving || 0), 0)

  return (
    <div className="step-wrapper">
      <div className="step-header">
        <div className="badge badge-saffron" style={{ marginBottom: 12, display: 'inline-flex' }}>Step 5 of 7</div>
        <h2>💡 Tax Saving Suggestions</h2>
        <p>Personalized recommendations to minimize your tax liability</p>
      </div>

      {totalPotentialSaving > 0 && (
        <div className="savings-banner animate-fade">
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Potential Additional Tax Savings
            </span>
            <span className="tax-amount large amount-savings">
              {formatINR(totalPotentialSaving)}
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: 300 }}>
            By implementing all suggestions below in Old Regime. Actual savings may vary.
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 28 }}>
        {suggestions.map((sg, i) => (
          <div className={`suggestion-card animate-fade-up delay-${i + 1}`} key={i}>
            <div className="sg-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '2rem' }}>{sg.icon}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className={`badge badge-${PRIORITY_COLORS[sg.priority]}`}>{sg.priority} PRIORITY</span>
                    <span className="badge badge-saffron">{sg.section}</span>
                  </div>
                  <h3 className="sg-title">{sg.title}</h3>
                </div>
              </div>
              {sg.taxSaving && (
                <div className="sg-saving">
                  <span>Tax Saving</span>
                  <strong>{formatINR(sg.taxSaving)}</strong>
                  <span>per year</span>
                </div>
              )}
            </div>
            <p className="sg-desc">{sg.description}</p>
            <div className="sg-instruments">
              <span className="form-label" style={{ marginBottom: 10, display: 'block' }}>
                Recommended Instruments
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sg.instruments.map((ins, j) => (
                  <div className="sg-instrument" key={j}>
                    <span className="sg-ins-name">📌 {ins.name}</span>
                    <div className="sg-ins-meta">
                      <span>{ins.returns}</span>
                      <span>Lock-in: {ins.lock}</span>
                      <span>Risk: {ins.risk}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="step-nav">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button className="btn btn-primary btn-lg" onClick={onNext}>Next: Optimizer →</button>
      </div>

      <style>{`
        .savings-banner {
          background: var(--gold-dim); border: 1px solid var(--border-gold);
          border-radius: var(--radius-lg); padding: 24px 32px;
          display: flex; align-items: center; justify-content: space-between; gap: 20px;
        }
        .suggestion-card {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 28px; transition: all 0.3s ease;
        }
        .suggestion-card:hover { border-color: var(--border-accent); }
        .sg-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; gap: 16px; }
        .sg-title { font-family: var(--font-display); font-size: 1.05rem; font-weight: 700; }
        .sg-saving { text-align: center; flex-shrink: 0;
          display: flex; flex-direction: column; gap: 2px; }
        .sg-saving span { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; }
        .sg-saving strong { font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; color: var(--green); }
        .sg-desc { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 20px; }
        .sg-instruments { background: var(--bg-glass); border-radius: var(--radius-md); padding: 18px; }
        .sg-instrument { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;
          gap: 8px; padding: 10px 14px; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border); }
        .sg-ins-name { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); }
        .sg-ins-meta { display: flex; gap: 16px; font-size: 0.75rem; color: var(--text-muted); }
      `}</style>
    </div>
  )
}
