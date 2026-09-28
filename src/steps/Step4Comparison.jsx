import { useEffect, useState } from 'react'
import { useTax } from '../context/TaxContext.jsx'
import { formatINR, compute80CTotal, parseINR } from '../utils/formatters.js'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'

// ── Client-side tax engine (mirrors server logic) ────────────────────────────
const NEW_SLABS = [
  { upTo: 300000, rate: 0 }, { upTo: 700000, rate: 0.05 },
  { upTo: 1000000, rate: 0.10 }, { upTo: 1200000, rate: 0.15 },
  { upTo: 1500000, rate: 0.20 }, { upTo: Infinity, rate: 0.30 },
]
const OLD_SLABS = { general: [
  { upTo: 250000, rate: 0 }, { upTo: 500000, rate: 0.05 },
  { upTo: 1000000, rate: 0.20 }, { upTo: Infinity, rate: 0.30 },
], senior: [
  { upTo: 300000, rate: 0 }, { upTo: 500000, rate: 0.05 },
  { upTo: 1000000, rate: 0.20 }, { upTo: Infinity, rate: 0.30 },
], super_senior: [
  { upTo: 500000, rate: 0 }, { upTo: 1000000, rate: 0.20 }, { upTo: Infinity, rate: 0.30 },
]}

function slabTax(income, slabs) {
  let tax = 0, prev = 0
  for (const s of slabs) {
    if (income <= prev) break
    tax += (Math.min(income, s.upTo) - prev) * s.rate
    prev = s.upTo
    if (s.upTo === Infinity) break
  }
  return Math.round(tax)
}

function rebate(taxable, tax, isNew) {
  if (isNew && taxable <= 1200000) return Math.min(tax, 60000)
  if (!isNew && taxable <= 500000) return Math.min(tax, 12500)
  return 0
}

function computeRegime(income, deductions, profile, hraData, isNew) {
  const isSalaried = profile.employmentType === 'salaried'
  let ded = 0, dedBreakdown = {}

  if (isNew) {
    const sd = isSalaried ? 75000 : 0
    const pt = Math.min(parseINR(deductions.professionalTax), 2400)
    const nps2 = parseINR(deductions.sec80CCD2)
    ded = sd + pt + nps2
    dedBreakdown = { 'Standard Deduction': sd, 'Professional Tax': pt, 'Employer NPS 80CCD(2)': nps2 }
  } else {
    const sd = isSalaried ? 50000 : 0
    const pt = Math.min(parseINR(deductions.professionalTax), 2400)
    const lta = parseINR(deductions.lta)
    // HRA
    let hra = 0
    if (hraData && hraData.basicSalary && hraData.rentPaid > 0) {
      const metro = hraData.isMetro ? 0.5 : 0.4
      hra = Math.max(0, Math.min(hraData.hraReceived, metro * hraData.basicSalary, hraData.rentPaid - 0.1 * hraData.basicSalary))
    }
    const c80 = Math.min(compute80CTotal(deductions), 150000)
    const nps1b = Math.min(parseINR(deductions.sec80CCD1B), 50000)
    const nps2 = parseINR(deductions.sec80CCD2)
    const d_self = Math.min(parseINR(deductions.sec80D_self), 25000)
    const d_par = deductions.sec80D_parents_senior ? Math.min(parseINR(deductions.sec80D_parents), 50000) : Math.min(parseINR(deductions.sec80D_parents), 25000)
    const hl24 = Math.min(parseINR(deductions.homeLoanInterest24b), 200000)
    const hllet = parseINR(deductions.homeLoanInterestLetOut)
    const eea = Math.min(parseINR(deductions.sec80EEA), 150000)
    const eeb = Math.min(parseINR(deductions.sec80EEB), 150000)
    const e80 = parseINR(deductions.sec80E)
    const g80 = Math.round(parseINR(deductions.sec80G) * 0.5)
    const tta = Math.min(parseINR(deductions.sec80TTA), 10000)
    const ttb = Math.min(parseINR(deductions.sec80TTB), 50000)
    const dd = deductions.sec80DD > 0 ? (deductions.sec80DD_severe ? 125000 : 75000) : 0
    const u80 = deductions.sec80U > 0 ? (deductions.sec80U_severe ? 125000 : 75000) : 0
    ded = sd + pt + lta + hra + c80 + nps1b + nps2 + d_self + d_par + hl24 + hllet + eea + eeb + e80 + g80 + tta + ttb + dd + u80
    dedBreakdown = {
      'Standard Deduction (16)': sd,
      'Professional Tax': pt,
      'LTA': lta,
      'HRA Exemption': Math.round(hra),
      '80C (PPF/ELSS/EPF…)': c80,
      '80CCD(1B) NPS': nps1b,
      '80CCD(2) Employer NPS': nps2,
      '80D Self/Family': d_self,
      '80D Parents': d_par,
      '24(b) Home Loan Interest': hl24,
      '24(b) Let-Out Property': hllet,
      '80EEA Affordable Housing': eea,
      '80EEB EV Loan': eeb,
      '80E Education Loan': e80,
      '80G Donations': g80,
      '80TTA/TTB Interest': tta + ttb,
      '80DD Disabled Dependent': dd,
      '80U Self Disability': u80,
    }
  }

  const taxable = Math.max(0, income - ded)
  const slabs = isNew ? NEW_SLABS : (OLD_SLABS[profile.userType] || OLD_SLABS.general)
  const st = slabTax(taxable, slabs)
  const reb = rebate(taxable, st, isNew)
  const afterRebate = Math.max(0, st - reb)
  const cess = Math.round(afterRebate * 0.04)
  const total = afterRebate + cess
  return { taxable, totalDeductions: Math.round(ded), dedBreakdown, slabTax: st, rebate87A: reb, cess, totalTax: total, monthlyTax: Math.round(total / 12) }
}

const COLORS = { old: '#FF4D6A', new: '#10E8A0', savings: '#F5C842' }

export default function Step4Comparison({ onNext, onBack }) {
  const { income, deductions, profile, setResults } = useTax()
  const [calc, setCalc] = useState(null)

  useEffect(() => {
    const grossIncome = parseINR(income.grossSalary) + parseINR(income.businessIncome) + parseINR(income.interestIncome) + parseINR(income.rentalIncome)
    if (grossIncome <= 0) return
    const hraData = {
      basicSalary: parseINR(income.basicSalary),
      hraReceived: parseINR(income.hraReceived),
      rentPaid: parseINR(income.rentPaid),
      isMetro: income.isMetro,
    }
    const oldR = computeRegime(grossIncome, deductions, profile, hraData, false)
    const newR = computeRegime(grossIncome, deductions, profile, hraData, true)
    const savings = oldR.totalTax - newR.totalTax
    const result = {
      grossIncome,
      oldRegime: oldR,
      newRegime: newR,
      recommendation: {
        betterRegime: savings > 0 ? 'new' : savings < 0 ? 'old' : 'either',
        savings: Math.abs(savings),
        reason: savings > 0 ? `New Regime saves you ${formatINR(Math.abs(savings))} annually`
          : savings < 0 ? `Old Regime saves you ${formatINR(Math.abs(savings))} due to deductions`
          : 'Both regimes result in same tax. New regime is simpler.',
      }
    }
    setCalc(result)
    setResults(result)
  }, [income, deductions, profile])

  if (!calc) return (
    <div className="step-wrapper" style={{ textAlign: 'center', paddingTop: 100 }}>
      <div className="loader" style={{ margin: '0 auto 20px' }} />
      <p style={{ color: 'var(--text-secondary)' }}>Calculating your tax…</p>
    </div>
  )

  const { oldRegime: old, newRegime: nw, recommendation: rec, grossIncome } = calc
  const barData = [
    { name: 'Old Regime', tax: old.totalTax },
    { name: 'New Regime', tax: nw.totalTax },
  ]

  const pieDataOld = Object.entries(old.dedBreakdown)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: k, value: v }))

  return (
    <div className="step-wrapper">
      <div className="step-header">
        <div className="badge badge-saffron" style={{ marginBottom: 12, display: 'inline-flex' }}>Step 4 of 7</div>
        <h2>⚖️ Old vs New Regime</h2>
        <p>Your personalized comparison for FY 2025-26</p>
      </div>

      {/* Recommendation Banner */}
      <div className={`rec-banner rec-banner--${rec.betterRegime}`} style={{ marginBottom: 28 }}>
        <div className="rec-icon">{rec.betterRegime === 'new' ? '🆕' : rec.betterRegime === 'old' ? '📋' : '⚖️'}</div>
        <div>
          <h3>
            {rec.betterRegime === 'new' ? 'New Regime is Better for You' :
              rec.betterRegime === 'old' ? 'Old Regime is Better for You' : 'Both Regimes Are Equal'}
          </h3>
          <p>{rec.reason}</p>
        </div>
        {rec.savings > 0 && (
          <div className="rec-savings">
            <span>You Save</span>
            <strong>{formatINR(rec.savings)}</strong>
            <span>per year</span>
          </div>
        )}
      </div>

      {/* Comparison Cards */}
      <div className="regime-compare-grid">
        <div className={`regime-card ${rec.betterRegime === 'old' ? 'regime-card--winner' : ''}`}>
          <div className="regime-card-header">
            <span className="regime-label">📋 Old Regime</span>
            {rec.betterRegime === 'old' && <span className="badge badge-green">✓ Better for you</span>}
          </div>
          <div className="regime-tax-amount" style={{ color: COLORS.old }}>{formatINR(old.totalTax)}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 16 }}>Annual tax payable</p>
          <div className="regime-breakdown">
            <div className="rb-row"><span>Gross Income</span><strong>{formatINR(grossIncome)}</strong></div>
            <div className="rb-row"><span>Total Deductions</span><strong style={{ color: 'var(--green)' }}>- {formatINR(old.totalDeductions)}</strong></div>
            <div className="rb-row"><span>Taxable Income</span><strong>{formatINR(old.taxable)}</strong></div>
            <div className="rb-row"><span>Slab Tax</span><strong>{formatINR(old.slabTax)}</strong></div>
            <div className="rb-row"><span>Rebate u/s 87A</span><strong style={{ color: 'var(--green)' }}>- {formatINR(old.rebate87A)}</strong></div>
            <div className="rb-row"><span>Health & Ed. Cess (4%)</span><strong>{formatINR(old.cess)}</strong></div>
            <div className="rb-row rb-row--total"><span>Net Tax Payable</span><strong style={{ color: COLORS.old }}>{formatINR(old.totalTax)}</strong></div>
            <div className="rb-row"><span>Monthly TDS</span><strong style={{ color: 'var(--text-secondary)' }}>{formatINR(old.monthlyTax)}/mo</strong></div>
            <div className="rb-row"><span>Effective Rate</span><strong>{((old.totalTax / grossIncome) * 100).toFixed(1)}%</strong></div>
          </div>
        </div>

        <div className={`regime-card ${rec.betterRegime === 'new' ? 'regime-card--winner' : ''}`}>
          <div className="regime-card-header">
            <span className="regime-label">🆕 New Regime</span>
            {rec.betterRegime === 'new' && <span className="badge badge-green">✓ Better for you</span>}
          </div>
          <div className="regime-tax-amount" style={{ color: COLORS.new }}>{formatINR(nw.totalTax)}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 16 }}>Annual tax payable</p>
          <div className="regime-breakdown">
            <div className="rb-row"><span>Gross Income</span><strong>{formatINR(grossIncome)}</strong></div>
            <div className="rb-row"><span>Total Deductions</span><strong style={{ color: 'var(--green)' }}>- {formatINR(nw.totalDeductions)}</strong></div>
            <div className="rb-row"><span>Taxable Income</span><strong>{formatINR(nw.taxable)}</strong></div>
            <div className="rb-row"><span>Slab Tax</span><strong>{formatINR(nw.slabTax)}</strong></div>
            <div className="rb-row"><span>Rebate u/s 87A</span><strong style={{ color: 'var(--green)' }}>- {formatINR(nw.rebate87A)}</strong></div>
            <div className="rb-row"><span>Health & Ed. Cess (4%)</span><strong>{formatINR(nw.cess)}</strong></div>
            <div className="rb-row rb-row--total"><span>Net Tax Payable</span><strong style={{ color: COLORS.new }}>{formatINR(nw.totalTax)}</strong></div>
            <div className="rb-row"><span>Monthly TDS</span><strong style={{ color: 'var(--text-secondary)' }}>{formatINR(nw.monthlyTax)}/mo</strong></div>
            <div className="rb-row"><span>Effective Rate</span><strong>{((nw.totalTax / grossIncome) * 100).toFixed(1)}%</strong></div>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="glass-card" style={{ padding: 28, marginTop: 24 }}>
        <h3 style={{ marginBottom: 20, fontFamily: 'var(--font-display)', fontWeight: 700 }}>📊 Tax Comparison Chart</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} barCategoryGap="40%">
            <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-secondary)', fontSize: 13 }} />
            <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
            <Tooltip
              contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)' }}
              formatter={(v) => [formatINR(v), 'Total Tax']}
            />
            <Bar dataKey="tax" radius={[8, 8, 0, 0]}>
              <Cell fill={COLORS.old} />
              <Cell fill={COLORS.new} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Old Regime Deduction Breakdown */}
      {pieDataOld.length > 0 && (
        <div className="glass-card" style={{ padding: 28, marginTop: 20 }}>
          <h3 style={{ marginBottom: 20, fontFamily: 'var(--font-display)', fontWeight: 700 }}>🧾 Old Regime — Deduction Breakdown</h3>
          <div className="ded-breakdown-list">
            {Object.entries(old.dedBreakdown).filter(([,v]) => v > 0).map(([k, v]) => (
              <div className="ded-row" key={k}>
                <span>{k}</span>
                <strong style={{ color: 'var(--green)' }}>{formatINR(v)}</strong>
              </div>
            ))}
            <div className="ded-row ded-row--total">
              <span>Total Deductions</span>
              <strong style={{ color: 'var(--saffron)' }}>{formatINR(old.totalDeductions)}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="step-nav">
        <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button className="btn btn-primary btn-lg" onClick={onNext}>Next: Suggestions →</button>
      </div>

      <style>{`
        .rec-banner {
          display: flex; align-items: center; gap: 20px;
          padding: 24px 28px; border-radius: var(--radius-lg);
          border: 1px solid; animation: fadeInUp 0.4s ease both;
        }
        .rec-banner--new { background: var(--green-dim); border-color: rgba(16,232,160,0.3); }
        .rec-banner--old { background: var(--saffron-dim); border-color: var(--border-accent); }
        .rec-banner--either { background: var(--blue-dim); border-color: rgba(79,142,247,0.3); }
        .rec-icon { font-size: 2.5rem; flex-shrink: 0; }
        .rec-banner h3 { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; margin-bottom: 4px; }
        .rec-banner p { font-size: 0.88rem; color: var(--text-secondary); }
        .rec-savings { margin-left: auto; text-align: center; flex-shrink: 0;
          display: flex; flex-direction: column; gap: 2px; }
        .rec-savings span { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; }
        .rec-savings strong { font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; color: var(--gold); }
        .regime-compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .regime-card { background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 28px; transition: all 0.3s ease; }
        .regime-card--winner { border-color: var(--green); box-shadow: 0 0 30px rgba(16,232,160,0.15); }
        .regime-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .regime-label { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; }
        .regime-tax-amount { font-family: var(--font-display); font-size: 2.4rem; font-weight: 900; }
        .regime-breakdown { display: flex; flex-direction: column; gap: 8px; }
        .rb-row { display: flex; justify-content: space-between; align-items: center;
          padding: 8px 12px; background: var(--bg-glass); border-radius: 8px; font-size: 0.85rem; }
        .rb-row span { color: var(--text-secondary); }
        .rb-row--total { background: var(--saffron-dim); border: 1px solid var(--border-accent); font-weight: 600; }
        .ded-breakdown-list { display: flex; flex-direction: column; gap: 8px; }
        .ded-row { display: flex; justify-content: space-between; align-items: center;
          padding: 8px 12px; background: var(--bg-glass); border-radius: 8px; font-size: 0.85rem; }
        .ded-row span { color: var(--text-secondary); }
        .ded-row--total { background: var(--gold-dim); border: 1px solid var(--border-gold); font-weight: 700; }
        @media (max-width: 700px) { .regime-compare-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}
