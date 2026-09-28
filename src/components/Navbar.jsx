import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ selectedFY, setSelectedFY }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Navigation items for authenticated users
  const authNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/assistant', label: 'AI Assistant', icon: '🤖' },
    { path: '/news', label: 'Tax News', icon: '📰' },
    { path: '/calculator', label: 'Tax Calculator', icon: '🧮' },
    { path: '/compare', label: 'Compare Regimes', icon: '⚖️' },
    { path: '/capital-gains', label: 'Capital Gains', icon: '📈' },
    { path: '/planning', label: 'Simulator', icon: '🔮' },
    { path: '/sources', label: 'Sources', icon: '📜' },
    { path: '/history', label: 'Audit Trail', icon: '📜' },
    { path: '/evaluation', label: 'Evaluation', icon: '🧪' },
  ];

  // Navigation items for guest/logged-out visitors
  const publicNavItems = [
    { path: '/', label: 'Home', icon: '🏛️' },
    { path: '/news', label: 'Tax News', icon: '📰' },
  ];

  const displayedNavItems = user ? authNavItems : publicNavItems;

  return (
    <nav className="progress-nav" style={{ padding: '12px 24px' }}>
      <div style={{ maxWidth: '1450px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        
        {/* Brand Logo */}
        <Link to={user ? "/dashboard" : "/"} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--gradient-saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.2rem', color: '#1A0A00', boxShadow: 'var(--shadow-glow-saffron)' }}>
            🇮🇳
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '1.25rem', color: 'var(--text-primary)', lineHeight: '1.1' }}>
              Tax<span style={{ color: 'var(--saffron)' }}>Saathi</span> AI
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.05em' }}>
              INDIAN TAX REASONING SYSTEM
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', padding: '4px 0' }}>
          {displayedNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '7px 12px',
                  borderRadius: '30px',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  color: isActive ? 'var(--saffron)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--saffron-dim)' : 'transparent',
                  border: isActive ? '1px solid var(--border-accent)' : '1px solid transparent',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Section: Theme Toggle + FY Selector + User Auth Widget */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-sm"
            style={{ borderRadius: '20px', padding: '5px 12px', fontSize: '0.8rem' }}
            title="Toggle Light / Dark theme"
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>

          {/* FY Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              FY:
            </span>
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '5px 28px 5px 10px', fontSize: '0.8rem', borderRadius: '20px' }}
            >
              <option value="2024-25">2024-25</option>
              <option value="2023-24">2023-24</option>
              <option value="2025-26">2025-26</option>
            </select>
          </div>

          {/* Auth Widget */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: 'var(--bg-glass)', borderRadius: '30px', border: '1px solid var(--border-accent)' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--gradient-saffron)', color: '#1A0A00', fontWeight: '800', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {(user.username || 'U').slice(0, 2).toUpperCase()}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {user.full_name || user.username}
              </span>
              <button 
                onClick={logout} 
                className="btn btn-ghost btn-sm" 
                style={{ padding: '4px 10px', fontSize: '0.75rem' }} 
                title="Logout"
              >
                🚪 Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/login" className="btn btn-ghost btn-sm">
                🔑 Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                📝 Register
              </Link>
            </div>
          )}

        </div>

      </div>
    </nav>
  );
}
