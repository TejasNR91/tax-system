import { useTax } from '../context/TaxContext.jsx'
import { formatINR } from '../utils/formatters.js'

function RupeeInput({ label, field, hint, value, onChange, max, placeholder = '0' }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="form-input-prefix">
        <span className="prefix">₹</span>
        <input
          type="number"
          className="form-input"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(field, e.target.value)}
          min={0}
          max={max}
        />
      </div>
      {hint && <span className="form-hint">{hint}</span>}
    </div>
  )
}

export default function Step2Income({ onNext, onBack }) {
  const { income, setIncome, profile } = useTax()
  const isSalaried = profile.employmentType === 'salaried'

  const update = (field, val) => setIncome(i => ({ ...i, [field]: val }))

  const totalIncome = (
    (Number(income.grossSalary) || 0) +
    (Number(income.interestIncome) || 0) +
    (Number(income.rentalIncome) || 0) +
    (Number(income.capitalGainsSTCG) || 0) +
    (Number(income.capitalGainsLTCG) || 0) +
    (Number(income.businessIncome) || 0)
  )

  const canProceed = totalIncome > 0

  return (
    <div className="step-wrapper">
      <div className="step-header">
        <div className="badge badge-saffron" style={{ marginBottom: 12, display: 'inline-flex' }}>Step 2 of 7</div>
        <h2>💰 Income Details</h2>
        <p>Enter your annual income from all sources for FY 2025-26.</p>
      </div>

      {/* Primary Income */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
        <h3 className="section-sub-head">Primary Income</h3>
        <div className="grid-2" style={{ marginTop: 20 }}>
          {isSalaried ? (
            <>
              <RupeeInput
                label="Annual Gross Salary (CTC)"
                field="grossSalary"
                hint="Total Cost to Company before any deductions"
                value={income.grossSalary}
                onChange={update}
              />
              <RupeeInput
                label="Basic Salary (Annual)"
                field="basicSalary"
                hint="Usually 40–50% of gross salary. Needed for HRA calculation"
                value={income.basicSalary}
                onChange={update}
              />
            </>
          ) : (
            <RupeeInput
              label="Annual Business / Professional Income"
              field="businessIncome"
              hint="Net profit from business or professional practice"
              value={income.businessIncome}
              onChange={update}
            />
          )}
        </div>
      </div>

      {/* HRA (Salaried only) */}
      {isSalaried && (
        <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
          <h3 className="section-sub-head">🏠 HRA & Rent Details</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20, marginTop: 4 }}>
            Relevant only for Old Regime. HRA exemption = minimum of (HRA received, 50%/40% of basic, Rent paid – 10% of basic)
          </p>
          <div className="grid-2">
            <RupeeInput
              label="HRA Received (Annual)"
              field="hraReceived"
              hint="From your salary slip"
              value={income.hraReceived}
              onChange={update}
            />
            <RupeeInput
              label="Rent Paid (Annual)"
              field="rentPaid"
              hint="Total rent paid in FY 2025-26"
              value={income.rentPaid}
              onChange={update}
            />
          </div>
          <div style={{ marginTop: 16 }}>
            <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>City Type</label>
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { val: true, label: '🏙️ Metro City', sub: 'Delhi, Mumbai, Kolkata, Chennai — 50% exemption' },
                { val: false, label: '🏘️ Non-Metro City', sub: 'All other cities — 40% exemption' },
              ].map(opt => (
                <button
                  key={String(opt.val)}
                  className={`profile-card ${income.isMetro === opt.val ? 'profile-card--active' : ''}`}
                  style={{ flex: 1 }}
                  onClick={() => update('isMetro', opt.val)}
                >
                  <div style={{ fontSize: '1.4rem' }}>{opt.label.split(' ')[0]}</div>
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>{opt.label.split(' ').slice(1).join(' ')}</strong>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{opt.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Other Income */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
        <h3 className="section-sub-head">📊 Other Income Sources</h3>
        <div className="grid-2" style={{ marginTop: 20, gap: 16 }}>
          <RupeeInput
            label="Savings / FD Interest Income"
            field="interestIncome"
            hint="Interest from savings accounts, FDs, post office deposits"
            value={income.interestIncome}
            onChange={update}
          />
          <RupeeInput
            label="Rental Income"
            field="rentalIncome"
            hint="Annual rent received from property (30% deduction allowed)"
            value={income.rentalIncome}
            onChange={update}
          />
          <RupeeInput
            label="Short-Term Capital Gains (Equity)"
            field="capitalGainsSTCG"
            hint="STCG on equity/mutual funds held < 1 year — taxed @15% (Sec 111A)"
            value={income.capitalGainsSTCG}
            onChange={update}
          />
          <RupeeInput
            label="Long-Term Capital Gains (Equity)"
            field="capitalGainsLTCG"
            hint="LTCG on equity > ₹1L exemption — taxed @10% (Sec 112A)"
            value={income.capitalGainsLTCG}
            onChange={update}
          />
        </div>
      </div>

      {/* Live Total */}
      {totalIncome > 0 && (
        <div className="income-total-card animate-fade">
          <span className="form-label">Estimated Total Gross Income</span>
          <span className="tax-amount medium amount-neutral">{formatINR(totalIncome)}</span>
          <span className="form-hint">
            {totalIncome <= 1200000 ? '🎉 Zero tax possible under New Regime (with 87A rebate)!'
              : totalIncome <= 500000 ? '✅ Low income bracket — minimal tax'
              : ''}
          </span>
        </div>
      )}

      <div className="step-nav">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button className="btn btn-primary btn-lg" onClick={onNext} disabled={!canProceed}>
          Next: Deductions →
        </button>
      </div>

      <style>{`
        .section-sub-head {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .income-total-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          background: var(--saffron-dim);
          border: 1px solid var(--border-accent);
          border-radius: var(--radius-md);
          padding: 20px 24px;
          margin-bottom: 8px;
        }
        .profile-card {
          display: flex; gap: 10px; align-items: flex-start;
          background: var(--bg-glass); border: 1px solid var(--border);
          border-radius: var(--radius-md); padding: 14px; cursor: pointer;
          transition: all 0.2s ease; text-align: left; color: var(--text-primary);
          font-family: var(--font-body);
        }
        .profile-card:hover { border-color: var(--border-accent); }
        .profile-card--active {
          border-color: var(--saffron); background: var(--saffron-dim);
          box-shadow: 0 0 0 2px var(--saffron);
        }
      `}</style>
    </div>
  )
}
