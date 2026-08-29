import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Leaf, Lock, Mail, User, ArrowRight, CheckCircle2, AlertCircle, KeyRound, Eye, EyeOff, RotateCw } from 'lucide-react';
import { useUser } from '../context/UserContext';
import api from '../services/api';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginUser } = useUser();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'REGISTER' | 'VERIFY_OTP'>('REGISTER');

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Check URL parameters for prefilled email & verify step
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const stepParam = searchParams.get('step');
    if (emailParam) {
      setEmail(emailParam);
    }
    if (stepParam === 'verify') {
      setStep('VERIFY_OTP');
    }
  }, [searchParams]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('Please fill in all required registration fields.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await api.registerUser({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      setMessage(res.message || 'OTP verification code sent to your email.');
      setStep('VERIFY_OTP');
      setResendCooldown(30);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await api.verifyOTP({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      if (res.user) {
        loginUser({
          id: res.user._id || res.user.id || res.user.username,
          name: res.user.name || res.user.username,
          username: res.user.username,
          email: res.user.email,
          role: res.user.role || 'user',
        });
      }

      setMessage('Email verified successfully! You are now logged in. Redirecting to Home...');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setError('Please provide your email address to resend OTP.');
      return;
    }

    setResending(true);
    setError(null);

    try {
      const res = await api.resendOTP({ email: email.trim().toLowerCase() });
      setMessage(res.message || 'A fresh OTP code has been sent to your email.');
      setResendCooldown(30);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', background: 'var(--color-bg-alt)' }}>
      {/* Left Brand Panel */}
      <div
        style={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 48px',
          background: 'linear-gradient(135deg, rgba(20, 50, 36, 0.92) 0%, rgba(27, 67, 50, 0.88) 100%), url("https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80") center/cover no-repeat',
          color: '#ffffff',
          position: 'relative',
        }}
        className="auth-brand-panel"
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={22} color="#b7e4c7" />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.04em' }}>BNHS INDIA</span>
          </div>

          <h1 style={{ fontSize: '2.8rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '20px', color: '#ffffff' }}>
            Start Your Conservation Journey.
          </h1>
          <p style={{ fontSize: '1.15rem', color: '#d8f3dc', lineHeight: 1.6, maxWidth: '480px', marginBottom: '32px' }}>
            Create your account to unlock personalized nature trail recommendations, conversational AI naturalist guidance, and your official Nature Passport.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle2 size={20} color="#74c69d" />
              <span style={{ fontSize: '0.95rem', color: '#f0fdf4' }}>Track biodiversity field workshops & nature walks</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle2 size={20} color="#74c69d" />
              <span style={{ fontSize: '0.95rem', color: '#f0fdf4' }}>Earn certified naturalist badges & milestones</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle2 size={20} color="#74c69d" />
              <span style={{ fontSize: '0.95rem', color: '#f0fdf4' }}>Join citizen science & mangrove restoration drives</span>
            </div>
          </div>
        </div>

        <div style={{ paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: '0.85rem', color: '#b7e4c7' }}>
          Bombay Natural History Society • Founded 1883 • Hornbill House, Mumbai
        </div>
      </div>

      {/* Right Form Panel */}
      <div
        style={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '48px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-forest-dark)', marginBottom: '8px' }}>
              {step === 'REGISTER' ? 'Create Your Account' : 'Verify Email OTP'}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              {step === 'REGISTER'
                ? 'Join thousands of nature enthusiasts across India.'
                : `Enter the 6-digit verification code sent to ${email}`}
            </p>
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px 16px',
                background: 'var(--color-error-bg)',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-error)',
                fontSize: '0.88rem',
                marginBottom: '20px',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{error}</div>
            </div>
          )}

          {message && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                background: 'var(--color-sage-light)',
                border: '1px solid var(--color-emerald)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-forest-dark)',
                fontSize: '0.88rem',
                marginBottom: '20px',
              }}
            >
              <CheckCircle2 size={18} color="var(--color-emerald)" />
              <div>{message}</div>
            </div>
          )}

          {step === 'REGISTER' ? (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-forest-dark)', marginBottom: '6px' }}>
                  Full Name / Username
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. naturalist_ananya"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      background: '#ffffff',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-forest-dark)', marginBottom: '6px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="ananya@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      background: '#ffffff',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-forest-dark)', marginBottom: '6px' }}>
                  Create Password
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 44px 12px 42px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      background: '#ffffff',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontWeight: 700,
                  marginTop: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {loading ? 'Creating Account...' : 'Continue with OTP'}
                <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-forest-dark)', marginBottom: '6px' }}>
                  6-Digit Verification OTP
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                    <KeyRound size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      background: '#ffffff',
                      fontSize: '1.1rem',
                      letterSpacing: '0.2em',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontWeight: 700,
                  marginTop: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {loading ? 'Verifying OTP...' : 'Verify & Continue'}
                <CheckCircle2 size={18} />
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setStep('REGISTER')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  ← Edit Details
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending || resendCooldown > 0}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? 'var(--color-text-muted)' : 'var(--color-emerald)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <RotateCw size={13} className={resending ? 'animate-spin' : ''} />
                  {resending
                    ? 'Sending...'
                    : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-forest-primary)', fontWeight: 700, textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
