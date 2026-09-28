import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !email.trim() || !password) {
      setError('Please fill out all required fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must contain both letters and numbers.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    setLoading(true);
    try {
      await register(
        username.trim(),
        email.trim(),
        password,
        confirmPassword,
        fullName.trim(),
        panNumber.trim().toUpperCase()
      );
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Username or email may already be registered.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: '40px 24px', maxWidth: '520px', margin: '0 auto' }}>
      <div className="glass-card animate-fade-up" style={{ padding: '36px', borderRadius: '24px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>📝</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            Create Your <span style={{ color: 'var(--saffron)' }}>TaxSaathi</span> Account
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Register to save your tax computations and track AI audit history.
          </p>
        </div>

        {error && (
          <div className="badge badge-red" style={{ display: 'block', width: '100%', padding: '12px', textAlign: 'center', marginBottom: '20px', borderRadius: '10px' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Rahul Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Choose username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">PAN Number (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. ABCDE1234F"
              value={panNumber}
              maxLength={10}
              onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Create Password *</label>
            <input
              type="password"
              className="form-input"
              placeholder="Minimum 8 characters (letters & numbers)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Re-enter Password *</label>
            <input
              type="password"
              className="form-input"
              placeholder="Re-enter password to confirm"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            {password && confirmPassword && password !== confirmPassword && (
              <span style={{ fontSize: '0.75rem', color: 'var(--red)', fontWeight: '600', marginTop: '4px' }}>
                ❌ Passwords do not match!
              </span>
            )}
            {password && confirmPassword && password === confirmPassword && (
              <span style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: '600', marginTop: '4px' }}>
                ✓ Passwords match!
              </span>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Register & Enter Dashboard 🚀'}
          </button>
        </form>

        <div className="divider" style={{ margin: '24px 0' }}></div>

        <div style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--saffron)', fontWeight: '700', textDecoration: 'none' }}>
            Login Here
          </Link>
        </div>

      </div>
    </div>
  );
}
