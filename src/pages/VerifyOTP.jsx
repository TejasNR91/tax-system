import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, forgotPassword } = useAuth();

  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  
  // 5 minute OTP validity timer (300 seconds)
  const [timeLeft, setTimeLeft] = useState(300);
  // 60-second resend cooldown timer
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cooldownTimer;
    if (cooldown > 0) {
      cooldownTimer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(cooldownTimer);
  }, [cooldown]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleOtpChange = (e) => {
    // Only allow numeric digits up to 6 characters
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(val);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!email.trim()) {
      setError('Please provide your registered email address.');
      return;
    }

    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp(email.trim().toLowerCase(), otp);
      // Navigate to Reset Password page with reset token in router state
      navigate('/reset-password', {
        state: {
          email: email.trim().toLowerCase(),
          resetToken: res.reset_token
        },
        replace: true
      });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to verify OTP. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email.trim()) return;
    setError('');
    setResending(true);
    try {
      const res = await forgotPassword(email.trim().toLowerCase());
      setInfoMessage('A new 6-digit OTP has been dispatched to your email.');
      setCooldown(60);
      setTimeLeft(300);
      setOtp('');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to resend OTP. Please wait a moment.';
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="page-container" style={{ padding: '60px 24px', maxWidth: '480px', margin: '0 auto' }}>
      <div className="glass-card animate-fade-up" style={{ padding: '36px', borderRadius: '24px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🔢</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            Enter Verification OTP
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            We've sent a 6-digit verification code to:
          </p>
          <div style={{ fontWeight: '700', color: 'var(--saffron)', fontSize: '0.95rem', marginTop: '2px' }}>
            {email || 'your registered email'}
          </div>
        </div>

        {error && (
          <div className="badge badge-red" style={{ display: 'block', width: '100%', padding: '12px', textAlign: 'center', marginBottom: '20px', borderRadius: '10px' }}>
            ⚠️ {error}
          </div>
        )}

        {infoMessage && (
          <div className="badge badge-green" style={{ display: 'block', width: '100%', padding: '12px', textAlign: 'center', marginBottom: '20px', borderRadius: '10px' }}>
            ✓ {infoMessage}
          </div>
        )}

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {!location.state?.email && (
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>6-Digit OTP Code</label>
              <span style={{ fontSize: '0.8rem', color: timeLeft > 60 ? 'var(--text-muted)' : 'var(--red)', fontWeight: '600' }}>
                ⏱️ Expires in: {formatTimer(timeLeft)}
              </span>
            </div>
            
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              className="form-input"
              placeholder="••••••"
              value={otp}
              onChange={handleOtpChange}
              style={{
                fontSize: '1.8rem',
                textAlign: 'center',
                letterSpacing: '8px',
                fontWeight: '800',
                fontFamily: 'monospace',
                padding: '12px'
              }}
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '4px' }}
            disabled={loading || otp.length !== 6 || timeLeft === 0}
          >
            {loading ? 'Verifying OTP...' : 'Verify Code & Proceed 🚀'}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Didn't receive the email?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="btn btn-ghost btn-sm"
            style={{ color: cooldown > 0 ? 'var(--text-muted)' : 'var(--saffron)', fontWeight: '700' }}
          >
            {resending ? 'Sending...' : cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
          </button>
        </div>

        <div className="divider" style={{ margin: '24px 0' }}></div>

        <div style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          <Link to="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
}
