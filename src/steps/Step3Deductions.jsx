import { useState } from 'react'
import { useTax } from '../context/TaxContext.jsx'
import { formatINR, compute80CTotal, parseINR } from '../utils/formatters.js'

function RupeeInput({ label, field, hint, value, onChange, max, limit }) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        {limit && <span className="limit-badge"> (Limit: {formatINR(limit)})</span>}
      </label>
      <div className="form-input-prefix">
        <span className="prefix">₹</span>
        <input
          type="number"
          className="form-input"
          placeholder="0"
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

function Collapsible({ title, icon, badge, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="collapsible-header" onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.2rem' }}>{icon}</span>
          <h3>{title}</h3>
          {badge && <span className={`badge badge-${badge.color}`}>{badge.text}</span>}
        </div>
        <span className={`collapsible-icon ${open ? 'open' : ''}`}>▼</span>
      </div>
      {open && (
        <div className="glass-card" style={{ padding: 24, marginTop: 8, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function Step3Deductions({ onNext, onBack }) {
  const { deductions, setDeductions, profile, income } = useTax()

  const update = (field, val) => setDeductions(d => ({ ...d, [field]: val }))
  const updateBool = (field, val) => setDeductions(d => ({ ...d, [field]: val }))

  const bucket80C = compute80CTotal(deductions)
  const bucket80C_gap = Math.max(0, 150000 - bucket80C)
  const isSalaried = profile.employmentType === 'salaried'

  return (
    <div className="step-wrapper">
      <div className="step-header">
        <div className="badge badge-saffron" style={{ marginBottom: 12, display: 'inline-flex' }}>Step 3 of 7</div>
        <h2>🧾 Deductions & Exemptions</h2>
        <p>Enter all applicable deductions for the <strong>Old Regime</strong>. New Regime deductions are auto-applied.</p>
      </div>

      {/* 80C Section */}
      <Collapsible
        title="Section 80C / 80CCC / 80CCD(1)"
        icon="📦"
        badge={{ text: `₹${bucket80C.toLocaleString('en-IN')} / ₹1,50,000`, color: bucket80C >= 150000 ? 'green' : 'saffron' }}
        defaultOpen
      >
        <div className="info-panel" style={{ marginBottom: 20 }}>
          <span>ℹ️</span>
          <span>Combined limit: <strong>₹1,50,000</strong>. Enter individual amounts — we'll auto-cap at ₹1.5L.</span>
        </div>
        {/* 80C Progress */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>80C Utilized</span>
            <span style={{ fontSize: '0.8rem', color: bucket80C >= 150000 ? 'var(--green)' : 'var(--saffron)', fontWeight: 600 }}>
              {formatINR(Math.min(bucket80C, 150000))} / ₹1,50,000
            </span>
          </div>
          <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min((bucket80C / 150000) * 100, 100)}%`,
              background: bucket80C >= 150000 ? 'var(--gradient-green)' : 'var(--gradient-saffron)',
              borderRadius: 4,
              transition: 'width 0.5s ease',
            }} />
          </div>
          {bucket80C_gap > 0 && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
              💡 Invest {formatINR(bucket80C_gap)} more in 80C instruments to save ~{formatINR(Math.round(bucket80C_gap * 0.30))} more tax
            </p>
          )}
        </div>
        <div className="grid-2">
          <RupeeInput label="PPF (Public Provident Fund)" field="ppf" value={deductions.ppf} onChange={update} hint="Lock-in: 15 years. Fully tax-free maturity." />
          <RupeeInput label="ELSS Mutual Funds" field="elss" value={deductions.elss} onChange={update} hint="Lock-in: 3 years. Market-linked returns." />
          <RupeeInput label="EPF (Employee Provident Fund)" field="epf" value={deductions.epf} onChange={update} hint="Employee's contribution to PF" />
          <RupeeInput label="LIC Premium" field="lic" value={deductions.lic} onChange={update} hint="Life insurance premiums paid" />
          <RupeeInput label="NSC (National Savings Certificate)" field="nsc" value={deductions.nsc} onChange={update} hint="Post office scheme, 5-year lock-in" />
          <RupeeInput label="Sukanya Samriddhi Yojana" field="sukanya" value={deductions.sukanya} onChange={update} hint="For girl child. Fully tax-free." />
          <RupeeInput label="5-Year Tax-Saving FD" field="taxSavingFD" value={deductions.taxSavingFD} onChange={update} hint="Bank FD with 5-year lock-in" />
          <RupeeInput label="Home Loan Principal Repayment" field="homeLoanPrincipal" value={deductions.homeLoanPrincipal} onChange={update} hint="Principal component of EMI" />
        </div>
      </Collapsible>

      {/* NPS */}
      <Collapsible title="NPS — Section 80CCD(1B) & 80CCD(2)" icon="🏛️"
        badge={{ text: 'Extra ₹50,000', color: 'gold' }}>
        <div className="grid-2">
          <RupeeInput label="Your NPS Contribution — 80CCD(1B)" field="sec80CCD1B" limit={50000}
            value={deductions.sec80CCD1B} onChange={update}
            hint="Over and above ₹1.5L 80C limit. Additional ₹50,000 deduction." />
          <RupeeInput label="Employer NPS Contribution — 80CCD(2)" field="sec80CCD2"
            value={deductions.sec80CCD2} onChange={update}
            hint="Employer's contribution to NPS — 10% of Basic+DA. Allowed in BOTH regimes." />
        </div>
      </Collapsible>

      {/* Health Insurance 80D */}
      <Collapsible title="Health Insurance — Section 80D" icon="🏥"
        badge={{ text: 'Up to ₹75,000', color: 'blue' }}>
        <div className="grid-2">
          <RupeeInput label="Health Insurance — Self, Spouse & Children" field="sec80D_self" limit={25000}
            value={deductions.sec80D_self} onChange={update}
            hint="Premium paid for yourself, spouse and dependent children. Limit: ₹25,000." />
          <div>
            <RupeeInput label="Health Insurance — Parents" field="sec80D_parents"
              limit={deductions.sec80D_parents_senior ? 50000 : 25000}
              value={deductions.sec80D_parents} onChange={update}
              hint={`Limit: ${deductions.sec80D_parents_senior ? '₹50,000 (senior citizen parents)' : '₹25,000'}`} />
            <label className="form-checkbox-group" style={{ marginTop: 10 }}>
              <input type="checkbox" className="form-checkbox"
                checked={deductions.sec80D_parents_senior}
                onChange={e => updateBool('sec80D_parents_senior', e.target.checked)} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Parents are senior citizens (60+)</span>
            </label>
          </div>
        </div>
        <div className="info-panel" style={{ marginTop: 16 }}>
          <span>💡</span>
          <span>Preventive health check-up: ₹5,000 is included within the ₹25,000 / ₹50,000 limit.</span>
        </div>
      </Collapsible>

      {/* Home Loan */}
      <Collapsible title="Home Loan Interest — Section 24(b)" icon="🏠"
        badge={{ text: 'Up to ₹2,00,000', color: 'purple' }}>
        <div className="grid-2">
          <RupeeInput label="Home Loan Interest — Self-Occupied" field="homeLoanInterest24b" limit={200000}
            value={deductions.homeLoanInterest24b} onChange={update}
            hint="Interest component of EMI for self-occupied property. Max: ₹2,00,000." />
          <RupeeInput label="Home Loan Interest — Let-Out Property" field="homeLoanInterestLetOut"
            value={deductions.homeLoanInterestLetOut} onChange={update}
            hint="No upper limit for interest on rented property. Can create loss from house property." />
        </div>
        <div style={{ marginTop: 16 }}>
          <RupeeInput label="Affordable Housing — Section 80EEA" field="sec80EEA" limit={150000}
            value={deductions.sec80EEA} onChange={update}
            hint="Extra ₹1.5L interest deduction for first-time buyers under PMAY. Stamp value ≤ ₹45L." />
        </div>
      </Collapsible>

      {/* Education Loan / EV / Donations */}
      <Collapsible title="Other Deductions" icon="📋">
        <div className="grid-2">
          <RupeeInput label="Education Loan Interest — 80E" field="sec80E"
            value={deductions.sec80E} onChange={update}
            hint="No limit! Interest on loan for higher education for 8 years." />
          <RupeeInput label="EV Loan Interest — 80EEB" field="sec80EEB" limit={150000}
            value={deductions.sec80EEB} onChange={update}
            hint="Interest on loan for electric vehicle purchase. Max: ₹1.5L." />
          <RupeeInput label="Donations — Section 80G" field="sec80G"
            value={deductions.sec80G} onChange={update}
            hint="Donations to approved institutions. 50–100% deductible as per fund type." />
          {profile.userType !== 'senior' && profile.userType !== 'super_senior' ? (
            <RupeeInput label="Savings Account Interest — 80TTA" field="sec80TTA" limit={10000}
              value={deductions.sec80TTA} onChange={update}
              hint="Interest earned on savings bank accounts. Max deduction: ₹10,000." />
          ) : (
            <RupeeInput label="Interest Income (FD/Savings) — 80TTB" field="sec80TTB" limit={50000}
              value={deductions.sec80TTB} onChange={update}
              hint="Senior citizens: all interest income deductible up to ₹50,000." />
          )}
        </div>
      </Collapsible>

      {/* Disability */}
      <Collapsible title="Disability Deductions — 80DD / 80U" icon="♿">
        <div className="grid-2">
          <div>
            <RupeeInput label="Disabled Dependent — 80DD" field="sec80DD"
              value={deductions.sec80DD} onChange={update}
              hint="Flat deduction: ₹75,000 (normal) or ₹1,25,000 (severe ≥80%)" />
            <label className="form-checkbox-group" style={{ marginTop: 10 }}>
              <input type="checkbox" className="form-checkbox"
                checked={deductions.sec80DD_severe}
                onChange={e => updateBool('sec80DD_severe', e.target.checked)} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Severe disability (≥80%) — ₹1,25,000</span>
            </label>
          </div>
          <div>
            <RupeeInput label="Self Disability — 80U" field="sec80U"
              value={deductions.sec80U} onChange={update}
              hint="If you are a person with disability. Flat ₹75,000 or ₹1,25,000." />
            <label className="form-checkbox-group" style={{ marginTop: 10 }}>
              <input type="checkbox" className="form-checkbox"
                checked={deductions.sec80U_severe}
                onChange={e => updateBool('sec80U_severe', e.target.checked)} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Severe disability (≥80%) — ₹1,25,000</span>
            </label>
          </div>
        </div>
      </Collapsible>

      {/* Salary Components */}
      {isSalaried && (
        <Collapsible title="Salary Components (Auto-applied)" icon="💼"
          badge={{ text: 'Pre-filled', color: 'green' }}>
          <div className="grid-2">
            <RupeeInput label="Standard Deduction (u/s 16)" field="standardDeduction"
              value={deductions.standardDeduction || (isSalaried ? 75000 : 0)} onChange={update}
              hint="₹75,000 for salaried (New Regime) / ₹50,000 (Old Regime). Auto-applied." />
            <RupeeInput label="Professional Tax (u/s 16)" field="professionalTax" limit={2400}
              value={deductions.professionalTax} onChange={update}
              hint="Max ₹2,400 per year. Deducted by employer." />
            <RupeeInput label="Leave Travel Allowance (LTA)" field="lta"
              value={deductions.lta} onChange={update}
              hint="Exempt for domestic travel (economy class). Claimed twice in 4 years." />
          </div>
        </Collapsible>
      )}

      <div className="step-nav">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button className="btn btn-primary btn-lg" onClick={onNext}>
          Calculate Tax →
        </button>
      </div>

      <style>{`
        .limit-badge { color: var(--text-muted); font-size: 0.72rem; font-weight: 400; margin-left: 6px; }
      `}</style>
    </div>
  )
}
