import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter your Username/Email and Password.');
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
      // Redirect to attempted URL or default to Dashboard
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: '60px 24px', maxWidth: '480px', margin: '0 auto' }}>
      <div className="glass-card animate-fade-up" style={{ padding: '36px', borderRadius: '24px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🔑</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            Welcome Back to <span style={{ color: 'var(--saffron)' }}>TaxSaathi AI</span>
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Sign in to access your tax dashboard, saved computations & AI assistant.
          </p>
        </div>

        {location.state?.from && (
          <div className="badge badge-gold" style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'center', marginBottom: '16px', borderRadius: '8px' }}>
            🔒 Please sign in to access {location.state.from.pathname}
          </div>
        )}

        {error && (
          <div className="badge badge-red" style={{ display: 'block', width: '100%', padding: '12px', textAlign: 'center', marginBottom: '20px', borderRadius: '10px' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="form-group">
            <label className="form-label">Username or Email</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. rahul_taxpayer or rahul@example.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
              <Link 
                to="/forgot-password" 
                style={{ 
                  fontSize: '0.82rem', 
                  color: 'var(--saffron)', 
                  fontWeight: '600', 
                  textDecoration: 'none' 
                }}
              >
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In to Dashboard 🚀'}
          </button>
        </form>

        <div className="divider" style={{ margin: '24px 0' }}></div>

        <div style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ color: 'var(--saffron)', fontWeight: '700', textDecoration: 'none' }}>
            Register Here
          </Link>
        </div>

      </div>
    </div>
  );
}
