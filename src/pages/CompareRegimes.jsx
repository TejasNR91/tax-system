import React, { useState } from 'react';
import axios from 'axios';
import HelpTooltip from '../components/HelpTooltip';

export default function CompareRegimes({ selectedFY }) {
  const [salary, setSalary] = useState(1500000);
  const [deductions, setDeductions] = useState(250000);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/tax/compare', {
        financial_year: selectedFY,
        incomes: { salary: Number(salary) },
        deductions: { sec_80c: Number(deductions) }
      });
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: '32px 24px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '800' }}>
          ⚖️ Compare Tax Regimes <span style={{ color: 'var(--saffron)' }}>({selectedFY})</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Side-by-side comparison matrix and break-even deduction requirement analysis.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
              Gross Salary (₹)
              <HelpTooltip
                title="Gross Salary"
                text="Annual earnings before standard deduction or exemptions."
              />
            </label>
            <input type="number" className="form-input" value={salary} onChange={(e) => setSalary(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
              Eligible Deductions under Old Regime (₹)
              <HelpTooltip
                title="Total Old Regime Deductions"
                text="Sum of 80C, 80D, NPS 80CCD(1B), 24(b) Home Loan Interest, and HRA exemptions you can claim under Old Regime."
              />
            </label>
            <input type="number" className="form-input" value={deductions} onChange={(e) => setDeductions(e.target.value)} />
          </div>
        </div>
        <button onClick={handleCompare} className="btn btn-primary" style={{ marginTop: '16px', width: '100%' }}>
          Run Comparison Matrix ⚖️
        </button>
      </div>

      {data && (
        <div className="grid-2">
          <div className="glass-card" style={{ padding: '24px', border: data.recommended_regime === 'old' ? '2px solid var(--green)' : '1px solid var(--border)' }}>
            <div className="badge badge-saffron" style={{ marginBottom: '12px' }}>OLD TAX REGIME</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--red)' }}>
              ₹{data.old_regime.total_tax_liability.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Base Tax: ₹{data.old_regime.base_tax.toLocaleString('en-IN')}<br/>
              Rebate 87A: ₹{data.old_regime.rebate_87a.toLocaleString('en-IN')}<br/>
              Cess (4%): ₹{data.old_regime.cess.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px', border: data.recommended_regime === 'new' ? '2px solid var(--green)' : '1px solid var(--border)' }}>
            <div className="badge badge-green" style={{ marginBottom: '12px' }}>NEW TAX REGIME</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--green)' }}>
              ₹{data.new_regime.total_tax_liability.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Base Tax: ₹{data.new_regime.base_tax.toLocaleString('en-IN')}<br/>
              Rebate 87A: ₹{data.new_regime.rebate_87a.toLocaleString('en-IN')}<br/>
              Cess (4%): ₹{data.new_regime.cess.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
