import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessInfo(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your registered Gmail or email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(cleanEmail);
      setSuccessInfo(res);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to process request. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToOtp = () => {
    navigate('/verify-otp', { state: { email: email.trim().toLowerCase() } });
  };

  return (
    <div className="page-container" style={{ padding: '60px 24px', maxWidth: '480px', margin: '0 auto' }}>
      <div className="glass-card animate-fade-up" style={{ padding: '36px', borderRadius: '24px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🔐</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            Reset Your Password
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Enter your registered Gmail address. We will send you a secure 6-digit One-Time Password (OTP) valid for 5 minutes.
          </p>
        </div>

        {error && (
          <div className="badge badge-red" style={{ display: 'block', width: '100%', padding: '12px', textAlign: 'center', marginBottom: '20px', borderRadius: '10px' }}>
            ⚠️ {error}
          </div>
        )}

        {successInfo ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="badge badge-green" style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '12px', lineHeight: '1.5', fontSize: '0.9rem' }}>
              ✉️ {successInfo.message}
            </div>

            <div style={{ background: 'var(--bg-glass)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-accent)', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'left' }}>
              <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Next Step:
              </div>
              Check your Gmail inbox for the verification email. If you don't see it within 30 seconds, please check your Spam or Promotions folder.
            </div>

            <button
              onClick={handleProceedToOtp}
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
            >
              Enter 6-Digit OTP 🔢
            </button>

            <button
              onClick={() => { setSuccessInfo(null); setError(''); }}
              className="btn btn-ghost btn-sm"
              style={{ width: '100%' }}
            >
              Use a different email address
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="form-group">
              <label className="form-label">Registered Gmail Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. yourname@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={loading}
            >
              {loading ? 'Sending OTP...' : 'Send Verification OTP 📧'}
            </button>
          </form>
        )}

        <div className="divider" style={{ margin: '24px 0' }}></div>

        <div style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Remember your password?{' '}
          <Link to="/login" style={{ color: 'var(--saffron)', fontWeight: '700', textDecoration: 'none' }}>
            Return to Login
          </Link>
        </div>

      </div>
    </div>
  );
}
