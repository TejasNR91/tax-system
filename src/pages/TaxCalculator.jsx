import React, { useState } from 'react';
import axios from 'axios';
import HelpTooltip from '../components/HelpTooltip';

export default function TaxCalculator({ selectedFY }) {
  const [formData, setFormData] = useState({
    age: 30,
    is_salaried: true,
    salary: 1500000,
    house_property: 0,
    business_income: 0,
    capital_gains_stcg: 0,
    capital_gains_ltcg: 0,
    interest_income: 50000,
    other_income: 0,
    sec_80c: 150000,
    sec_80d_self: 25000,
    sec_80d_parents: 25000,
    sec_80ccd_1b: 50000,
    sec_24b: 150000,
    hra_exemption: 0,
    tds_paid: 100000
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: Number(value) }));
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const payload = {
        financial_year: selectedFY,
        age: formData.age,
        is_salaried: formData.is_salaried,
        incomes: {
          salary: formData.salary,
          house_property: formData.house_property,
          business_income: formData.business_income,
          capital_gains_stcg: formData.capital_gains_stcg,
          capital_gains_ltcg: formData.capital_gains_ltcg,
          interest_income: formData.interest_income,
          other_income: formData.other_income
        },
        deductions: {
          sec_80c: formData.sec_80c,
          sec_80d_self: formData.sec_80d_self,
          sec_80d_parents: formData.sec_80d_parents,
          sec_80ccd_1b: formData.sec_80ccd_1b,
          sec_24b: formData.sec_24b,
          hra_exemption: formData.hra_exemption
        },
        tds_paid: formData.tds_paid
      };

      const res = await axios.post('/api/tax/compare', payload);
      setResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: '32px 24px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '800' }}>
          🧮 Comprehensive Income Tax <span style={{ color: 'var(--saffron)' }}>Calculator</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Deterministic computation for Old vs New Regime under FY {selectedFY}.
        </p>
      </div>

      <div className="grid-2">
        {/* Form Input Section */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', color: 'var(--saffron)' }}>
            1. Financial Profile ({selectedFY})
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
                Age of Taxpayer
                <HelpTooltip
                  title="Taxpayer Age Brackets"
                  section="Senior Citizen Rules"
                  text="Below 60: Standard slabs. 60 to 80 (Senior Citizen): Basic exemption ₹3 Lakh in Old Regime. 80+ (Super Senior): Basic exemption ₹5 Lakh in Old Regime."
                />
              </label>
              <input
                type="number"
                className="form-input"
                value={formData.age}
                onChange={(e) => handleChange('age', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
                Employment Type
                <HelpTooltip
                  title="Employment Category"
                  section="Section 16"
                  text="Salaried employees qualify for Standard Deduction (₹50,000 in Old Regime; ₹75,000 in New Regime for FY 24-25)."
                />
              </label>
              <select
                className="form-select"
                value={formData.is_salaried ? 'salaried' : 'non-salaried'}
                onChange={(e) => setFormData(prev => ({ ...prev, is_salaried: e.target.value === 'salaried' }))}
              >
                <option value="salaried">Salaried Employee</option>
                <option value="non-salaried">Self-Employed / Business</option>
              </select>
            </div>
          </div>

          <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: '20px 0 12px 0', color: 'var(--text-primary)' }}>
            💰 Income Details (Annual)
          </h4>

          <div className="grid-2" style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
                Gross Salary (₹)
                <HelpTooltip
                  title="Gross Salary"
                  section="Section 15"
                  text="Total annual remuneration received from your employer including Basic, Allowances, and Perks."
                />
              </label>
              <input type="number" className="form-input" value={formData.salary} onChange={(e) => handleChange('salary', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
                Interest Income (₹)
                <HelpTooltip
                  title="Interest Income"
                  section="Section 56"
                  text="Interest earned from Savings Accounts, Fixed Deposits (FDs), Recurring Deposits (RDs), or Bonds. Sec 80TTA exempts up to ₹10k for non-seniors; Sec 80TTB exempts up to ₹50k for seniors."
                />
              </label>
              <input type="number" className="form-input" value={formData.interest_income} onChange={(e) => handleChange('interest_income', e.target.value)} />
            </div>
          </div>

          <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: '20px 0 12px 0', color: 'var(--text-primary)' }}>
            🛡️ Old Regime Deductions
          </h4>

          <div className="grid-2" style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
                Sec 80C Investments (₹)
                <HelpTooltip
                  title="Section 80C Deduction"
                  section="Section 80C"
                  text="Maximum deduction cap ₹1,50,000 for investments in EPF, PPF, ELSS Tax Saver Mutual Funds, Life Insurance Premiums, and Home Loan Principal."
                />
              </label>
              <input type="number" className="form-input" value={formData.sec_80c} onChange={(e) => handleChange('sec_80c', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
                Sec 80D Health Insurance (₹)
                <HelpTooltip
                  title="Section 80D Health Insurance"
                  section="Section 80D"
                  text="Deduction up to ₹25,000 (₹50,000 for seniors) for self & family health insurance, plus up to ₹25,000 / ₹50,000 for parents."
                />
              </label>
              <input type="number" className="form-input" value={formData.sec_80d_self} onChange={(e) => handleChange('sec_80d_self', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
                Sec 80CCD(1B) NPS (₹)
                <HelpTooltip
                  title="Section 80CCD(1B) NPS"
                  section="Section 80CCD(1B)"
                  text="Additional tax deduction up to ₹50,000 for voluntary contributions to National Pension System (NPS Tier-I account) over and above 80C."
                />
              </label>
              <input type="number" className="form-input" value={formData.sec_80ccd_1b} onChange={(e) => handleChange('sec_80ccd_1b', e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
                Sec 24(b) Home Loan Int (₹)
                <HelpTooltip
                  title="Home Loan Interest"
                  section="Section 24(b)"
                  text="Deduction up to ₹2,00,000 per year on home loan interest paid for a self-occupied residential property under Old Regime."
                />
              </label>
              <input type="number" className="form-input" value={formData.sec_24b} onChange={(e) => handleChange('sec_24b', e.target.value)} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
              TDS / Advance Tax Paid (₹)
              <HelpTooltip
                title="TDS / Advance Tax Adjustment"
                section="Section 192 / 208"
                text="TDS deducted by your employer or advance tax installments paid. Subtracted from total tax liability to determine net payable or refund amount."
              />
            </label>
            <input type="number" className="form-input" value={formData.tds_paid} onChange={(e) => handleChange('tds_paid', e.target.value)} />
          </div>

          <button onClick={handleCalculate} className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Calculating...' : 'Compute Tax Liability 🧮'}
          </button>
        </div>

        {/* Results Output Section */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', color: 'var(--gold)' }}>
            2. Tax Computation Results
          </h3>

          {!result ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📊</div>
              <p>Enter your financial figures and click Calculate to view detailed slab calculations.</p>
            </div>
          ) : (
            <div>
              <div className="badge badge-saffron" style={{ marginBottom: '16px' }}>
                💡 {result.summary}
              </div>

              <div className="grid-2" style={{ marginBottom: '20px' }}>
                
                {/* Old Regime Card */}
                <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-glass)', border: result.recommended_regime === 'old' ? '2px solid var(--green)' : '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    OLD REGIME
                    <HelpTooltip
                      title="Old Tax Regime Breakdown"
                      text="Applies standard tax slabs with full deduction benefits under 80C, 80D, 24(b), and HRA."
                    />
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--red)' }}>
                    ₹{result.old_regime.total_tax_liability.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    Taxable: ₹{result.old_regime.taxable_income.toLocaleString('en-IN')}<br/>
                    Deductions: ₹{result.old_regime.total_deductions.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* New Regime Card */}
                <div style={{ padding: '16px', borderRadius: '14px', background: 'var(--bg-glass)', border: result.recommended_regime === 'new' ? '2px solid var(--green)' : '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    NEW REGIME
                    <HelpTooltip
                      title="New Tax Regime Breakdown"
                      section="Section 115BAC"
                      text="Concessional tax slabs with ₹75,000 standard deduction and 87A rebate up to ₹7 Lakh taxable income."
                    />
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--green)' }}>
                    ₹{result.new_regime.total_tax_liability.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    Taxable: ₹{result.new_regime.taxable_income.toLocaleString('en-IN')}<br/>
                    Standard Ded: ₹{result.new_regime.total_deductions.toLocaleString('en-IN')}
                  </div>
                </div>

              </div>

              {/* Detailed Breakdown */}
              <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px' }}>📜 Step-by-Step Calculation Audit</h4>
              <div style={{ maxHeight: '250px', overflowY: 'auto', background: 'var(--bg-input)', padding: '12px', borderRadius: '10px', fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                {result.new_regime.audit_steps.map((step, i) => (
                  <div key={i} style={{ marginBottom: '4px' }}>• {step}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
