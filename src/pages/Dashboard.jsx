import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import HelpTooltip from '../components/HelpTooltip';

export default function Dashboard({ selectedFY }) {
  const { user } = useAuth();
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

  const featureCards = [
    {
      title: 'Full Tax Calculator',
      description: 'Comprehensive tax computation with HRA, 80D, NPS 80CCD(1B), home loan 24(b) and other deductions.',
      path: '/calculator',
      icon: '🧮',
      badge: 'Interactive'
    },
    {
      title: 'Old vs New Regime Comparator',
      description: 'Side-by-side break-even analysis to find the exact regime that saves you maximum tax.',
      path: '/compare',
      icon: '⚖️',
      badge: 'Optimized'
    },
    {
      title: 'AI Tax Assistant',
      description: 'Reasoning agent powered by Income Tax Act sections, CBDT circulars, and vector RAG citations.',
      path: '/assistant',
      icon: '🤖',
      badge: 'RAG Agent'
    },
    {
      title: 'Capital Gains Suite',
      description: 'Compute STCG & LTCG taxes under Union Budget 2024 rules (12.5% LTCG, 20% STCG).',
      path: '/capital-gains',
      icon: '📈',
      badge: 'Budget 2024'
    },
    {
      title: 'Tax Planning Simulator',
      description: 'Simulate incremental investments in NPS, health insurance, and home loans to lower your bracket.',
      path: '/planning',
      icon: '🔮',
      badge: 'What-If'
    },
    {
      title: 'Audit Trail & History',
      description: 'Review your logged calculations, audit explanations, and deterministic calculation histories.',
      path: '/history',
      icon: '📜',
      badge: 'Verified'
    }
  ];

  return (
    <div className="page-container" style={{ padding: '32px 24px' }}>
      
      {/* Welcome Banner */}
      <div className="glass-card animate-fade-up" style={{ padding: '36px', borderRadius: '24px', background: 'var(--gradient-hero)', border: '1px solid var(--border-accent)', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div className="badge badge-saffron" style={{ marginBottom: '12px' }}>
              🇮🇳 Authenticated Tax Workspace
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: '900', lineHeight: '1.2', marginBottom: '10px' }}>
              Welcome back, <span style={{ color: 'var(--saffron)' }}>{user?.full_name || user?.username}</span>!
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '650px', lineHeight: '1.5' }}>
              Your personalized tax cockpit for Financial Year <strong>{selectedFY}</strong>. Access deterministic calculators, AI reasoning, and portfolio optimization below.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px', background: 'var(--bg-glass)', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
              Taxpayer Profile
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              {user?.username}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {user?.email}
            </div>
            {user?.pan_number && (
              <div style={{ fontSize: '0.78rem', color: 'var(--saffron)', fontWeight: '700', letterSpacing: '1px' }}>
                PAN: {user.pan_number}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Quick Calculator + Fast Access Modules */}
      <div className="grid-2" style={{ marginBottom: '36px' }}>
        
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
                  text="Total earnings from salary including Basic, HRA, bonuses, allowances before deductions."
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
                Section 80C Deductions (₹)
                <HelpTooltip
                  title="Section 80C Deductions"
                  section="Section 80C"
                  text="Deductions up to ₹1,50,000 for EPF, PPF, ELSS, Life Insurance, Tuition Fees under Old Regime."
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
            {loading ? 'Computing Savings...' : 'Run Quick Comparison 🚀'}
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

        {/* Quick Launchpad to Tools */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>
              🚀 Jump Into Applications
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Choose a module to begin detailed tax planning or consult the vector RAG tax knowledge base.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/calculator" className="btn btn-primary btn-sm">
                🧮 Full Tax Calculator
              </Link>
              <Link to="/compare" className="btn btn-secondary btn-sm">
                ⚖️ Compare Regimes
              </Link>
              <Link to="/assistant" className="btn btn-ghost btn-sm">
                🤖 AI Assistant
              </Link>
              <Link to="/news" className="btn btn-ghost btn-sm">
                📰 Latest Circulars
              </Link>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px', background: 'var(--gradient-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.8rem' }}>🛡️</span>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                Deterministic Calculation Engine
              </h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Unlike generic generative LLMs that fabricate math, TaxSaathi computes every slab, rebate under 87A, surcharge, and cess strictly using deterministic Python logic.
            </p>
          </div>
        </div>

      </div>

      {/* Feature Navigation Cards Grid */}
      <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '20px' }}>
        Explore All Features
      </h3>

      <div className="grid-3" style={{ gap: '20px' }}>
        {featureCards.map((card) => (
          <Link
            key={card.path}
            to={card.path}
            className="glass-card"
            style={{
              padding: '24px',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '2rem' }}>{card.icon}</span>
                <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>{card.badge}</span>
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
                {card.title}
              </h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {card.description}
              </p>
            </div>
            <div style={{ marginTop: '16px', fontSize: '0.82rem', fontWeight: '700', color: 'var(--saffron)' }}>
              Open Module →
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
