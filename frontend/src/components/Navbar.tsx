import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  MessageSquareText,
  User,
  HeartHandshake,
  Menu,
  X,
  Layers,
  Activity as ActivityIcon,
} from 'lucide-react';
import { useUser, DEMO_PERSONAS } from '../context/UserContext';
import api from '../services/api';

export const Navbar: React.FC = () => {
  const { currentUser, switchPersona, activePersonaId } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    const checkApi = async () => {
      try {
        const res = await api.checkHealth();
        setIsHealthy(res.status === 'healthy');
      } catch {
        setIsHealthy(false);
      }
    };
    checkApi();
    const interval = setInterval(checkApi, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Brand */}
        <Link to="/" className="nav-brand" onClick={() => setMobileOpen(false)}>
          <div className="nav-logo-badge">
            <Compass size={22} />
          </div>
          <div>
            <span>BNHS</span>
            <span style={{ fontSize: '0.8rem', display: 'block', fontWeight: 500, color: 'var(--color-text-muted)', lineHeight: 1 }}>
              Nature Engagement
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <ul className={`nav-links ${mobileOpen ? 'mobile-open' : ''}`}>
          <li>
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/activities" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
              <Compass size={17} />
              Explore
            </NavLink>
          </li>
          <li>
            <NavLink to="/recommendations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
              <Sparkles size={17} />
              Recommendations
            </NavLink>
          </li>
          <li>
            <NavLink to="/assistant" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
              <MessageSquareText size={17} />
              AI Assistant
            </NavLink>
          </li>
          <li>
            <NavLink to="/volunteer" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
              <HeartHandshake size={17} />
              Volunteer
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
              <Layers size={17} />
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
              <User size={17} />
              Profile
            </NavLink>
          </li>
        </ul>

        {/* User Session & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Persona Switcher Selector */}
          <div style={{ position: 'relative' }}>
            <select
              value={activePersonaId}
              onChange={(e) => switchPersona(e.target.value)}
              className="filter-select"
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-sage-light)',
                borderColor: 'var(--color-sage)',
                color: 'var(--color-forest-primary)',
                cursor: 'pointer',
              }}
              title="Switch demo persona to test personalized recommendations"
            >
              {DEMO_PERSONAS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.avatar} {p.name} ({p.role.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>

          {/* Health indicator */}
          <div
            title={`API Backend: ${isHealthy ? 'Live on Port 8000' : 'Disconnected / Connecting...'}`}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isHealthy ? '#2d6a4f' : '#e63946',
              boxShadow: isHealthy ? '0 0 8px #52b788' : 'none',
            }}
          />

          {/* Mobile hamburger */}
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle Navigation">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
};
