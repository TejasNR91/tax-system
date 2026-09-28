import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Evaluation() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  const runEvaluation = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/eval/run');
      setMetrics(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runEvaluation();
  }, []);

  return (
    <div className="page-container" style={{ padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '800' }}>
            🧪 Backtesting & AI <span style={{ color: 'var(--saffron)' }}>Evaluation Dashboard</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Automated benchmark test suite evaluating deterministic calculation accuracy, RAG precision, and citation validity.
          </p>
        </div>
        <button onClick={runEvaluation} className="btn btn-primary" disabled={loading}>
          {loading ? 'Executing Suite...' : '🔄 Run Evaluation Suite'}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><div className="loader" style={{ margin: '0 auto' }}></div></div>
      ) : metrics ? (
        <div>
          {/* Metrics Grid */}
          <div className="grid-4" style={{ marginBottom: '32px' }}>
            <div className="stat-card">
              <div className="stat-label">Calculation Accuracy</div>
              <div className="stat-value" style={{ color: 'var(--green)' }}>
                {metrics.calculation_accuracy_percent}%
              </div>
              <div className="stat-sub">Deterministic Python Engine</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">RAG Retrieval Precision</div>
              <div className="stat-value" style={{ color: 'var(--saffron)' }}>
                {metrics.retrieval_accuracy_percent}%
              </div>
              <div className="stat-sub">Income Tax Act Section Matching</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Citation Coverage</div>
              <div className="stat-value" style={{ color: 'var(--gold)' }}>
                {metrics.citation_accuracy_percent}%
              </div>
              <div className="stat-sub">Official Source URLs attached</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Hallucination Rate</div>
              <div className="stat-value" style={{ color: 'var(--blue)' }}>
                {metrics.hallucination_rate_percent}%
              </div>
              <div className="stat-sub">Zero non-existent sections</div>
            </div>
          </div>

          {/* Benchmark Test Case Detail */}
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)' }}>
            📋 Ground-Truth Scenario Results ({metrics.total_scenarios_tested} Scenarios Tested)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {metrics.scenarios_detail.map((sc) => (
              <div key={sc.id} className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                    <span className="badge badge-gold">{sc.id}</span>
                    <span className="badge badge-saffron">FY {sc.financial_year}</span>
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {sc.description}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className={`badge ${sc.calc_passed ? 'badge-green' : 'badge-red'}`}>
                    Calc: {sc.calc_passed ? 'PASS ✓' : 'FAIL ✗'}
                  </span>
                  <span className={`badge ${sc.retrieval_passed ? 'badge-green' : 'badge-red'}`}>
                    RAG: {sc.retrieval_passed ? 'PASS ✓' : 'FAIL ✗'}
                  </span>
                  <span className={`badge ${sc.citation_valid ? 'badge-gold' : 'badge-red'}`}>
                    Citation: {sc.citation_valid ? 'VALID 🔗' : 'INVALID'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
