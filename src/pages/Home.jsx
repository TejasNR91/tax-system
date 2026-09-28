import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import HelpTooltip from '../components/HelpTooltip';

export default function Home({ selectedFY }) {
  const [quickSalary, setQuickSalary] = useState(1200000);
  const [quick80C, setQuick80C] = useState(150000);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleQuickCalculate = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/tax/compare', {
        financial_year: selectedFY,
        incomes: { salary: Number(quickSalary) },
        deductions: { sec_80c: Number(quick80C) }
      });
      setResult(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: '32px 24px' }}>
      
      {/* Hero Banner */}
      <div className="glass-card animate-fade-up" style={{ padding: '40px', borderRadius: '24px', background: 'var(--gradient-hero)', border: '1px solid var(--border-accent)', marginBottom: '32px' }}>
        <div style={{ maxWidth: '800px' }}>
          <div className="badge badge-saffron" style={{ marginBottom: '16px' }}>
            🏛️ Authoritative Indian Tax Reasoning Engine
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: '900', lineHeight: '1.2', marginBottom: '16px' }}>
            Understand & Optimize Your Indian Taxes with <span style={{ color: 'var(--saffron)' }}>Deterministic Precision</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: '1.6' }}>
            Powered by Python deterministic tax calculations, vector RAG knowledge retrieval from Income Tax Act & CBDT circulars, AI agent reasoning, and audit trails.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/assistant" className="btn btn-primary btn-lg">
              🤖 Launch AI Tax Assistant
            </Link>
            <Link to="/calculator" className="btn btn-secondary btn-lg">
              🧮 Full Tax Calculator
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Calculator Widget & Key Highlights */}
      <div className="grid-2" style={{ marginBottom: '32px' }}>
        
        {/* Quick Estimator Card */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              ⚡ Quick Regime Estimator ({selectedFY})
            </h3>
            <span className="badge badge-gold">Deterministic</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
                Gross Annual Salary (₹)
                <HelpTooltip
                  title="Gross Annual Salary"
                  section="Section 15/17"
                  text="Your total annual earnings from employment before any deductions, including Basic Salary, HRA, Special Allowances, Bonuses, and Perks."
                />
              </label>
              <div className="form-input-prefix">
                <span className="prefix">₹</span>
                <input
                  type="number"
                  className="form-input"
                  value={quickSalary}
                  onChange={(e) => setQuickSalary(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
                80C Investments (₹)
                <HelpTooltip
                  title="Section 80C Investments"
                  section="Section 80C"
                  text="Tax deduction up to ₹1,50,000 per year for investments in EPF, PPF, ELSS Tax Saver Funds, Life Insurance, Tuition Fees, and Home Loan Principal. Available under Old Regime."
                />
              </label>
              <div className="form-input-prefix">
                <span className="prefix">₹</span>
                <input
                  type="number"
                  className="form-input"
                  value={quick80C}
                  onChange={(e) => setQuick80C(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button onClick={handleQuickCalculate} className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Computing...' : 'Calculate Tax Savings'}
          </button>

          {result && (
            <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-glass)', borderRadius: '14px', border: '1px solid var(--border-accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Old Regime Tax:</span>
                <span style={{ fontWeight: '700', color: 'var(--red)' }}>₹{result.old_regime.total_tax_liability.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>New Regime Tax:</span>
                <span style={{ fontWeight: '700', color: 'var(--green)' }}>₹{result.new_regime.total_tax_liability.toLocaleString('en-IN')}</span>
              </div>
              <div className="divider" style={{ margin: '10px 0' }}></div>
              <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--saffron)' }}>
                💡 Recommendation: {result.recommended_regime.toUpperCase()} REGIME saves ₹{result.tax_savings.toLocaleString('en-IN')}!
              </div>
            </div>
          )}
        </div>

        {/* Feature Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="glass-card" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '2rem' }}>⚖️</div>
            <div>
              <h4 style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
                Old vs New Tax Regime Comparator
                <HelpTooltip
                  title="Tax Regime Choice"
                  section="Section 115BAC"
                  text="Under New Regime (default), tax rates are lower but 80C, 80D, HRA deductions are disallowed. Under Old Regime, higher slab rates apply but all deductions are allowed."
                />
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Calculate exact break-even point deductions under Sec 80C, 80D, 24(b) home loan interest, and HRA.
              </p>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '2rem' }}>📈</div>
            <div>
              <h4 style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
                Union Budget 2024 Capital Gains Rules
                <HelpTooltip
                  title="Capital Gains Amendments"
                  section="Section 112A / 111A"
                  text="Updated post-July 2024 rules: LTCG on equity taxed at 12.5% above ₹1.25L exemption. STCG on equity taxed at flat 20%."
                />
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Updated LTCG 12.5% rate (above ₹1.25L exemption), STCG 20% on equities, indexation adjustments, and Sec 54 exemptions.
              </p>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '2rem' }}>🧪</div>
            <div>
              <h4 style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
                Automated Backtesting Suite
                <HelpTooltip
                  title="System Verification"
                  text="Automated evaluation runner measuring mathematical accuracy, RAG section retrieval, citation coverage, and hallucination rate against benchmark ground-truth cases."
                />
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Verify system mathematical accuracy (100%), RAG retrieval precision, and source citation coverage against 15+ benchmark cases.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
