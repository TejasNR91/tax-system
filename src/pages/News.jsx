import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['All', 'CBDT Notifications', 'ITR & Deadlines', 'Budget & Tax Slabs', 'Capital Gains', 'GST & Indirect Tax'];

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/tax/news');
      setNews(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNews = news.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || item.summary.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="page-container" style={{ padding: '32px 24px' }}>
      
      {/* Header Banner */}
      <div className="glass-card animate-fade-up" style={{ padding: '32px', borderRadius: '24px', background: 'var(--gradient-hero)', border: '1px solid var(--border-accent)', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="badge badge-saffron" style={{ marginBottom: '12px' }}>
              📡 Live Open-Source Tax News Feed
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: '900', color: 'var(--text-primary)' }}>
              Latest Indian Tax <span style={{ color: 'var(--saffron)' }}>News & Circulars</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '4px' }}>
              Real-time CBDT notifications, Finance Ministry updates, Supreme Court tax rulings, & ITR filing announcements.
            </p>
          </div>
          <button onClick={fetchNews} className="btn btn-primary" disabled={loading}>
            {loading ? 'Fetching...' : '🔄 Refresh Live Feed'}
          </button>
        </div>
      </div>

      {/* Ticker & Filters */}
      <div style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Search Bar */}
        <input
          type="text"
          className="form-input"
          placeholder="Search tax news keywords (e.g. '80C', '115BAC', 'LTCG', 'CBDT', 'Deadline')..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
              style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* News Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="loader" style={{ margin: '0 auto' }}></div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>Connecting to Open-Source News RSS Feed...</p>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No tax news articles found matching "{searchTerm}". Try clearing search filter.
        </div>
      ) : (
        <div className="grid-2">
          {filteredNews.map((item, idx) => (
            <div key={idx} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="badge badge-gold">{item.category}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {item.pub_date ? new Date(item.pub_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '10px', lineHeight: '1.4' }}>
                  {item.title}
                </h3>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
                  {item.summary}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--saffron)', fontWeight: '700' }}>
                  📰 Source: {item.source}
                </span>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ textDecoration: 'none', fontSize: '0.78rem' }}
                >
                  Read Full Article 🔗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
