import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Sources() {
  const [rules, setRules] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await axios.get('/api/rag/rules');
      setRules(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredRules = rules.filter(r =>
    r.rule_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container" style={{ padding: '32px 24px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: '800' }}>
          📜 Authoritative Official <span style={{ color: 'var(--saffron)' }}>Sources</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Verified Income Tax Act 1961 provisions, CBDT circulars, and Finance Act updates with source metadata & URLs.
        </p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search tax sections (e.g. '80C', '115BAC', 'LTCG', 'HRA')..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}><div className="loader" style={{ margin: '0 auto' }}></div></div>
      ) : (
        <div className="grid-2">
          {filteredRules.map((rule) => (
            <div key={rule.id} className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span className="badge badge-gold">{rule.section}</span>
                <span className="badge badge-saffron">Effective: {rule.effective_from}</span>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>
                {rule.rule_name}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.6' }}>
                {rule.description}
              </p>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Authority: {rule.authority}</span>
                <a href={rule.source_url} target="_blank" rel="noreferrer" style={{ color: 'var(--saffron)', fontWeight: '700', textDecoration: 'none' }}>
                  View Source 🔗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
