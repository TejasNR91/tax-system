import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const email = location.state?.email || '';
  const resetToken = location.state?.resetToken || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Password must contain both letters and numbers.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    if (!resetToken) {
      setError('Reset token is missing or has expired. Please restart the forgot password process.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, resetToken, newPassword, confirmPassword);
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to reset password. Session may have expired.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // If user navigates directly without completing OTP step
  if (!resetToken && !success) {
    return (
      <div className="page-container" style={{ padding: '60px 24px', maxWidth: '480px', margin: '0 auto' }}>
        <div className="glass-card animate-fade-up" style={{ padding: '36px', borderRadius: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            Session Expired or Invalid
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: '24px' }}>
            To set a new password, you must first verify your registered Gmail address with a 6-digit OTP code.
          </p>
          <Link to="/forgot-password" className="btn btn-primary" style={{ width: '100%' }}>
            Start Password Recovery 🔐
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: '60px 24px', maxWidth: '480px', margin: '0 auto' }}>
      <div className="glass-card animate-fade-up" style={{ padding: '36px', borderRadius: '24px' }}>
        
        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🎉</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              Password Reset Complete!
            </h2>
            <div className="badge badge-green" style={{ display: 'block', width: '100%', padding: '14px', margin: '20px 0', borderRadius: '12px', fontSize: '0.9rem' }}>
              ✓ Your password has been successfully updated.
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '28px' }}>
              You can now sign in to your TaxSaathi AI account using your new password.
            </p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
            >
              Return to Login 🔑
            </button>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🛡️</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                Set New Password
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Create a strong new password for <strong>{email}</strong>
              </p>
            </div>

            {error && (
              <div className="badge badge-red" style={{ display: 'block', width: '100%', padding: '12px', textAlign: 'center', marginBottom: '20px', borderRadius: '10px' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Minimum 8 characters (letters & numbers)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--red)', fontWeight: '600', marginTop: '4px' }}>
                    ❌ Passwords do not match!
                  </span>
                )}
                {newPassword && confirmPassword && newPassword === confirmPassword && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--green)', fontWeight: '600', marginTop: '4px' }}>
                    ✓ Passwords match!
                  </span>
                )}
              </div>

              <div style={{ background: 'var(--bg-glass)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                🔒 <strong>Password Requirements:</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  <li style={{ color: newPassword.length >= 8 ? 'var(--green)' : 'inherit' }}>
                    At least 8 characters in length
                  </li>
                  <li style={{ color: /[A-Za-z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 'var(--green)' : 'inherit' }}>
                    Combination of letters and numbers
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '6px' }}
                disabled={loading}
              >
                {loading ? 'Updating Password...' : 'Save New Password & Finish 🚀'}
              </button>
            </form>

            <div className="divider" style={{ margin: '24px 0' }}></div>

            <div style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <Link to="/login" style={{ color: 'var(--saffron)', fontWeight: '700', textDecoration: 'none' }}>
                Cancel and Return to Login
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
