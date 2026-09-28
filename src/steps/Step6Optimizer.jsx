import { useState } from 'react'
import { useTax } from '../context/TaxContext.jsx'
import { formatINR, parseINR } from '../utils/formatters.js'

const ALLOWANCES = [
  { key: 'hra', label: 'HRA (House Rent Allowance)', taxable: false, note: 'Exempt based on rent paid & basic salary' },
  { key: 'lta', label: 'LTA (Leave Travel Allowance)', taxable: false, note: 'Fully exempt for domestic travel' },
  { key: 'meal', label: 'Meal Coupons', taxable: false, note: '₹50/day × 22 working days = ₹13,200 p.a.' },
  { key: 'mobile', label: 'Mobile/Internet Reimbursement', taxable: false, note: 'Actual expenses, fully exempt' },
  { key: 'fuel', label: 'Fuel & Transport Allowance', taxable: false, note: 'Car lease perquisite is lower-taxed' },
  { key: 'books', label: 'Books & Periodicals Allowance', taxable: false, note: 'Actual expenses' },
  { key: 'uniform', label: 'Uniform Allowance', taxable: false, note: 'Actual uniform costs' },
  { key: 'nps_employer', label: 'Employer NPS (80CCD(2))', taxable: false, note: 'Up to 10% of Basic. Tax-free in both regimes.' },
  { key: 'gratuity', label: 'Gratuity', taxable: false, note: '₹20L exempt on retirement' },
  { key: 'special', label: 'Special Allowance (Taxable)', taxable: true, note: 'Fully taxable' },
  { key: 'bonus', label: 'Bonus / Incentives (Taxable)', taxable: true, note: 'Fully taxable' },
]

export default function Step6Optimizer({ onNext, onBack }) {
  const { income } = useTax()
  const ctc = parseINR(income.grossSalary) || 1200000

  const [breakdown, setBreakdown] = useState({
    basic: Math.round(ctc * 0.40),
    hra: Math.round(ctc * 0.20),
    lta: 15000,
    meal: 13200,
    mobile: 36000,
    fuel: 24000,
    books: 15000,
    uniform: 0,
    nps_employer: Math.round(ctc * 0.40 * 0.10),
    special: 0,
    bonus: 0,
  })

  const updateField = (key, val) => setBreakdown(b => ({ ...b, [key]: Number(val) || 0 }))

  const taxFreeTotal = ALLOWANCES.filter(a => !a.taxable).reduce((s, a) => s + (breakdown[a.key] || 0), 0)
  const taxableTotal = ALLOWANCES.filter(a => a.taxable).reduce((s, a) => s + (breakdown[a.key] || 0), 0)
  const basicSalary = breakdown.basic || 0
  const totalStructured = basicSalary + taxFreeTotal + taxableTotal
  const diff = totalStructured - ctc
  const taxableIncome = basicSalary + taxableTotal
  const approxTaxSaving = Math.round(taxFreeTotal * 0.30 * 1.04)

  return (
    <div className="step-wrapper">
      <div className="step-header">
        <div className="badge badge-saffron" style={{ marginBottom: 12, display: 'inline-flex' }}>Step 6 of 7</div>
        <h2>🔧 Salary Structure Optimizer</h2>
        <p>Restructure your CTC to include tax-free allowances and minimize taxable income.</p>
      </div>

      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <label className="form-label">Your CTC (Annual)</label>
            <div className="tax-amount medium amount-neutral" style={{ marginTop: 4 }}>
              {formatINR(ctc)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <p className="form-label">Tax-Free Components</p>
              <p className="tax-amount small" style={{ color: 'var(--green)' }}>{formatINR(taxFreeTotal)}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p className="form-label">Taxable Components</p>
              <p className="tax-amount small" style={{ color: 'var(--red)' }}>{formatINR(taxableTotal + basicSalary)}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p className="form-label">Estimated Tax Saving</p>
              <p className="tax-amount small" style={{ color: 'var(--gold)' }}>{formatINR(approxTaxSaving)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Structure inputs */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>
          💼 Optimize Your Salary Structure
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="opt-row opt-row--head">
            <span>Component</span>
            <span>Annual Amount (₹)</span>
            <span>Status</span>
          </div>

          <div className="opt-row">
            <span><strong>Basic Salary</strong><br /><small style={{ color: 'var(--text-muted)' }}>Basis for HRA, PF, Gratuity</small></span>
            <div className="form-input-prefix" style={{ maxWidth: 180 }}>
              <span className="prefix">₹</span>
              <input type="number" className="form-input" value={breakdown.basic} onChange={e => updateField('basic', e.target.value)} />
            </div>
            <span className="badge badge-red">Taxable</span>
          </div>

          {ALLOWANCES.map(a => (
            <div className="opt-row" key={a.key}>
              <span>
                <strong>{a.label}</strong><br />
                <small style={{ color: 'var(--text-muted)' }}>{a.note}</small>
              </span>
              <div className="form-input-prefix" style={{ maxWidth: 180 }}>
                <span className="prefix">₹</span>
                <input type="number" className="form-input" value={breakdown[a.key] || ''} onChange={e => updateField(a.key, e.target.value)} />
              </div>
              <span className={`badge badge-${a.taxable ? 'red' : 'green'}`}>{a.taxable ? 'Taxable' : 'Tax-Free'}</span>
            </div>
          ))}

          <div className="opt-row opt-row--total">
            <span><strong>Total Structured CTC</strong></span>
            <strong style={{ color: diff === 0 ? 'var(--green)' : diff > 0 ? 'var(--saffron)' : 'var(--red)' }}>
              ₹{totalStructured.toLocaleString('en-IN')}
              {diff !== 0 && <small style={{ fontSize: '0.72rem', marginLeft: 8 }}>
                ({diff > 0 ? '+' : ''}{diff.toLocaleString('en-IN')} vs CTC)
              </small>}
            </strong>
            <span className="badge badge-saffron">Review</span>
          </div>
        </div>
      </div>

      <div className="info-panel">
        <span>⚠️</span>
        <span>
          Salary restructuring requires your employer's cooperation. Present this breakdown to your HR/payroll team. 
          Tax-free components must be supported by actual bills/receipts where applicable.
        </span>
      </div>

      <div className="step-nav">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button className="btn btn-primary btn-lg" onClick={onNext}>Next: Summary →</button>
      </div>

      <style>{`
        .opt-row {
          display: grid; grid-template-columns: 1fr 200px 120px;
          align-items: center; gap: 16px;
          padding: 14px 16px; background: var(--bg-glass);
          border: 1px solid var(--border); border-radius: 10px;
        }
        .opt-row--head { background: var(--bg-secondary); font-size: 0.78rem; color: var(--text-muted);
          font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
        .opt-row--total { background: var(--saffron-dim); border-color: var(--border-accent); }
        .opt-row small { font-size: 0.72rem; }
        @media (max-width: 700px) {
          .opt-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
