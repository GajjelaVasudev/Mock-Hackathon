import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  TreeDeciduous,
  Bird,
  BookOpen,
  Sparkles,
  Lock,
  Compass,
} from 'lucide-react';
import { useUser } from '../context/UserContext';

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useUser();

  return (
    <div style={{ background: 'var(--color-bg)' }}>
      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          padding: '100px 0 90px',
          background: 'linear-gradient(135deg, rgba(11, 31, 23, 0.94) 0%, rgba(20, 54, 39, 0.9) 100%), url("https://images.unsplash.com/photo-1544860707-c352cc5a92e3?auto=format&fit=crop&w=1600&q=80") center/cover no-repeat',
          color: '#ffffff',
          overflow: 'hidden',
        }}
      >
        <div className="container" style={{ maxWidth: '960px', textAlign: 'center', margin: '0 auto' }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: '#b7e4c7',
              textTransform: 'uppercase',
              marginBottom: '24px',
            }}
          >
            <Shield size={15} />
            Bombay Natural History Society • Founded 1883
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: '3.6rem',
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: '24px',
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            Start Your Conservation Journey.
          </h1>

          {/* Supporting Text */}
          <p
            style={{
              fontSize: '1.25rem',
              lineHeight: 1.6,
              color: '#d8f3dc',
              maxWidth: '720px',
              margin: '0 auto 36px',
            }}
          >
            Join Asia's premier wildlife conservation organisation. Discover biodiversity experiences, learn from expert naturalists, and actively participate in Indian wildlife research and habitat preservation.
          </p>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              marginBottom: '32px',
            }}
          >
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn btn-primary btn-lg" style={{ padding: '14px 32px', fontSize: '1.05rem', fontWeight: 700 }}>
                  <Compass size={18} />
                  Open Your Nature Passport
                </Link>
                <Link to="/activities" className="btn btn-secondary btn-lg" style={{ padding: '14px 28px', fontSize: '1.05rem', background: '#ffffff', color: 'var(--color-forest-dark)' }}>
                  Explore Activities <ArrowRight size={16} />
                </Link>
              </>
            ) : (
              <>
                <Link to="/signup" className="btn btn-primary btn-lg" style={{ padding: '14px 36px', fontSize: '1.05rem', fontWeight: 700, background: 'var(--color-mint-bright)', color: 'var(--color-forest-dark)', border: 'none' }}>
                  Join Now
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/login"
                  className="btn btn-secondary btn-lg"
                  style={{
                    padding: '14px 32px',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Trust Statement */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '0.85rem',
              color: '#95d5b2',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            <span>Secure</span>
            <span>•</span>
            <span>Trusted Since 1883</span>
            <span>•</span>
            <span>Nature-first</span>
          </div>
        </div>
      </section>

      {/* Informational Section: Discover India's Natural Heritage */}
      <section style={{ padding: '80px 0', background: 'var(--color-surface)' }}>
        <div className="container" style={{ maxWidth: '1080px' }}>
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 48px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-emerald)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Conservation & Research
            </span>
            <h2 style={{ fontSize: '2.4rem', marginTop: '8px', color: 'var(--color-forest-dark)' }}>
              Discover India's Natural Heritage
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', marginTop: '12px', lineHeight: 1.6 }}>
              For more than 140 years, the Bombay Natural History Society has led groundbreaking research, bird migration studies, and community conservation across the Indian subcontinent.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px' }}>
            <div style={{ padding: '32px', borderRadius: 'var(--radius-xl)', background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--color-sage-light)', color: 'var(--color-forest-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Bird size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: 'var(--color-forest-dark)' }}>
                Field Research & Ornithology
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Pioneering avian ringing studies, vulture conservation programmes, and long-term wetland monitoring across biodiversity hotspots.
              </p>
            </div>

            <div style={{ padding: '32px', borderRadius: 'var(--radius-xl)', background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: '#ffe3db', color: '#c94a29', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <TreeDeciduous size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: 'var(--color-forest-dark)' }}>
                Habitat & Species Protection
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Protecting critical ecological corridors in the Western Ghats, central Indian tiger landscapes, and urban coastal mangroves.
              </p>
            </div>

            <div style={{ padding: '32px', borderRadius: 'var(--radius-xl)', background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: '#fef3c7', color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <BookOpen size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: 'var(--color-forest-dark)' }}>
                Education & Publications
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Publishing the historic Journal of the BNHS since 1886 and conducting naturalist certification courses for students and citizens.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Callout */}
      {!isAuthenticated && (
        <section style={{ padding: '60px 0', background: 'var(--color-forest-dark)', color: '#ffffff' }}>
          <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.2rem', color: '#ffffff', marginBottom: '14px' }}>
              Ready to Join India's Conservation Community?
            </h2>
            <p style={{ color: '#d8f3dc', fontSize: '1.05rem', marginBottom: '28px', lineHeight: 1.6 }}>
              Create your account to unlock personalized trail recommendations, guided nature walks, and our AI Nature Guide.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <Link to="/signup" className="btn btn-primary btn-lg" style={{ background: 'var(--color-mint-bright)', color: 'var(--color-forest-dark)', border: 'none', fontWeight: 700 }}>
                Create Free Account
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }}>
                Sign In
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
