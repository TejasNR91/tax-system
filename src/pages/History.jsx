import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/eval/history');
      setHistory(res.data);
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
          📜 Calculation <span style={{ color: 'var(--saffron)' }}>Audit Trail & History</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Detailed audit logs of past tax computations stored in SQLite database.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}><div className="loader" style={{ margin: '0 auto' }}></div></div>
      ) : history.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No previous calculation history logged. Run a tax calculation in the Calculator or Assistant to log history.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {history.map((h) => (
            <div key={h.id} className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="badge badge-saffron">FY {h.financial_year}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{h.timestamp}</span>
              </div>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div>Regime: <strong>{h.regime.toUpperCase()}</strong></div>
                <div>Gross Income: <strong>₹{h.gross_income.toLocaleString('en-IN')}</strong></div>
                <div>Taxable Income: <strong>₹{h.taxable_income.toLocaleString('en-IN')}</strong></div>
                <div>Total Tax: <strong style={{ color: 'var(--green)' }}>₹{h.total_tax.toLocaleString('en-IN')}</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
