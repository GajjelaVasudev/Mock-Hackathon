import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, User, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useUser } from '../context/UserContext';
import api from '../services/api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useUser();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Return destination after login if redirected from a protected route; default is HomePage ('/')
  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please enter your email/username and password.');
      return;
    }

    setLoading(true);
    setError(null);
    setUnverifiedEmail(null);

    try {
      const res = await api.login({
        email: identifier.includes('@') ? identifier.trim().toLowerCase() : undefined,
        username: !identifier.includes('@') ? identifier.trim() : undefined,
        password,
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

      const isAdmin = res.user?.role === 'admin';
      const targetDestination = (isAdmin && from === '/recommendations') ? '/dashboard' : from;

      setSuccessMsg('Logged in successfully! Redirecting...');
      setTimeout(() => {
        navigate(targetDestination, { replace: true });
      }, 500);
    } catch (err: any) {
      const errMsg = err.message || 'Invalid email/username or password. Please try again.';
      setError(errMsg);
      if (err.isUnverified || errMsg.toLowerCase().includes('verify your email')) {
        setUnverifiedEmail(err.email || (identifier.includes('@') ? identifier.trim() : null));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', background: 'var(--color-bg-alt)' }}>
      {/* Left Brand Panel (Desktop) */}
      <div
        style={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 48px',
          background: 'linear-gradient(135deg, rgba(20, 50, 36, 0.92) 0%, rgba(27, 67, 50, 0.88) 100%), url("https://images.unsplash.com/photo-1544860707-c352cc5a92e3?auto=format&fit=crop&w=1200&q=80") center/cover no-repeat',
          color: '#ffffff',
          position: 'relative',
        }}
        className="auth-brand-panel"
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <img src="/bnhs-logo-bird.png" alt="BNHS Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.04em' }}>BNHS INDIA</span>
          </div>

          <h1 style={{ fontSize: '2.8rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '20px', color: '#ffffff' }}>
            Start Your Conservation Journey.
          </h1>
          <p style={{ fontSize: '1.15rem', color: '#d8f3dc', lineHeight: 1.6, maxWidth: '480px', marginBottom: '32px' }}>
            Sign in to access your personalized Nature Passport, explore naturalist-led trail recommendations, and connect with our AI Nature Guide.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle2 size={20} color="#74c69d" />
              <span style={{ fontSize: '0.95rem', color: '#f0fdf4' }}>Conversational AI Nature Guide with verified citations</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle2 size={20} color="#74c69d" />
              <span style={{ fontSize: '0.95rem', color: '#f0fdf4' }}>Personalized activity recommendations</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle2 size={20} color="#74c69d" />
              <span style={{ fontSize: '0.95rem', color: '#f0fdf4' }}>Official BNHS Nature Passport & verified milestones</span>
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
              Sign In to BNHS
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              Enter your credentials to access your account.
            </p>
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '12px 16px',
                background: 'var(--color-error-bg)',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-error)',
                fontSize: '0.88rem',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>{error}</div>
              </div>
              {unverifiedEmail && (
                <div style={{ marginTop: '4px', paddingLeft: '28px' }}>
                  <Link
                    to={`/signup?email=${encodeURIComponent(unverifiedEmail)}&step=verify`}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <KeyRound size={13} /> Complete Email OTP Verification &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}

          {successMsg && (
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
              <div>{successMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-forest-dark)', marginBottom: '6px' }}>
                Email or Username
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                  <Mail size={18} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="name@example.com or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-forest-dark)' }}>
                  Password
                </label>
                <Link to="/signup" style={{ fontSize: '0.8rem', color: 'var(--color-emerald)', textDecoration: 'none', fontWeight: 500 }}>
                  Need help?
                </Link>
              </div>
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
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--color-forest-primary)', fontWeight: 700, textDecoration: 'none' }}>
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
