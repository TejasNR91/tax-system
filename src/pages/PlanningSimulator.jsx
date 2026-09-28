import React, { useState } from 'react';
import axios from 'axios';

export default function PlanningSimulator({ selectedFY }) {
  const [salary, setSalary] = useState(1500000);
  const [sec80C, setSec80C] = useState(150000);
  const [nps, setNps] = useState(50000);
  const [health, setHealth] = useState(25000);
  const [result, setResult] = useState(null);

  const handleSimulate = async () => {
    try {
      const res = await axios.post('/api/tax/simulate', {
        salary: Number(salary),
        sec_80c: Number(sec80C),
        sec_nps: Number(nps),
        sec_80d: Number(health),
        financial_year: selectedFY
      });
      setResult(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="page-container" style={{ padding: '32px 24px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '800' }}>
          🔮 Tax Planning <span style={{ color: 'var(--saffron)' }}>Simulator</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          "What-If" scenario analyzer to simulate ROI on PPF, ELSS, NPS, and Health Insurance investments.
        </p>
      </div>

      <div className="grid-2">
        <div className="glass-card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '16px' }}>Proposed Investment Strategy</h3>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Annual Salary (₹)</label>
            <input type="number" className="form-input" value={salary} onChange={(e) => setSalary(e.target.value)} />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Proposed 80C Investment (Max 1.5L)</label>
            <input type="number" className="form-input" value={sec80C} onChange={(e) => setSec80C(e.target.value)} />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Proposed NPS Sec 80CCD(1B) (Max 50k)</label>
            <input type="number" className="form-input" value={nps} onChange={(e) => setNps(e.target.value)} />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Proposed Health Insurance 80D</label>
            <input type="number" className="form-input" value={health} onChange={(e) => setHealth(e.target.value)} />
          </div>

          <button onClick={handleSimulate} className="btn btn-primary" style={{ width: '100%' }}>
            Simulate Tax Savings 🔮
          </button>
        </div>

        {/* Results */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', color: 'var(--gold)' }}>
            Simulation Strategy Impact
          </h3>

          {!result ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Adjust investment sliders and click Simulate to analyze tax savings ROI.
            </div>
          ) : (
            <div>
              <div className="stat-card" style={{ marginBottom: '16px' }}>
                <div className="stat-label">Total Proposed Investment</div>
                <div className="stat-value" style={{ color: 'var(--blue)' }}>
                  ₹{result.total_new_investments.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="stat-card" style={{ marginBottom: '16px' }}>
                <div className="stat-label">Direct Tax Saved Under Old Regime</div>
                <div className="stat-value" style={{ color: 'var(--green)' }}>
                  ₹{result.tax_saved_under_old_regime.toLocaleString('en-IN')}
                </div>
                <div className="stat-sub">
                  Tax Savings ROI: {result.roi_tax_savings_percent.toFixed(1)}% immediate return!
                </div>
              </div>

              <div style={{ background: 'var(--saffron-dim)', padding: '16px', borderRadius: '12px', color: 'var(--saffron-light)', fontWeight: '700' }}>
                💡 {result.recommended_action}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
