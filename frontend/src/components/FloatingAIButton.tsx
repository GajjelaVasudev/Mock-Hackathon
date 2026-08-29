import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Sparkles } from 'lucide-react';
import { useUser } from '../context/UserContext';

export const FloatingAIButton: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useUser();

  // Only show floating button to authenticated users and not on assistant/auth pages
  if (!isAuthenticated || location.pathname === '/assistant' || location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  return (
    <Link
      to="/assistant"
      id="floating-ai-guide-btn"
      aria-label="Open AI Nature Guide"
      style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        zIndex: 990,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'linear-gradient(135deg, var(--color-forest-primary) 0%, #1b4332 100%)',
        color: '#ffffff',
        padding: '12px 20px',
        borderRadius: '50px',
        boxShadow: '0 8px 24px rgba(27, 67, 50, 0.35)',
        textDecoration: 'none',
        fontWeight: 600,
        fontSize: '0.92rem',
        letterSpacing: '0.01em',
        transition: 'all var(--transition-base)',
        border: '1.5px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(8px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)';
        e.currentTarget.style.boxShadow = '0 12px 28px rgba(27, 67, 50, 0.45)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(27, 67, 50, 0.35)';
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.2)',
        }}
      >
        <Sparkles size={16} color="#b7e4c7" />
      </div>
      <span>Ask AI Nature Guide</span>
    </Link>
  );
};
