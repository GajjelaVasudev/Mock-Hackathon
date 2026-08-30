import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, User, Compass, Menu, X, LogIn, LogOut } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { NotificationBell } from './NotificationBell';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, logoutUser } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Authenticated Navigation Links: Clean, properly spaced, ONE unified Dashboard
  const authenticatedNavLinks = [
    { name: 'Home', path: '/' },
    { name: 'Activities', path: '/activities' },
    { name: 'Community', path: '/community' },
    { name: 'Recommendations', path: '/recommendations' },
    { name: 'AI Nature Guide', path: '/assistant', highlight: true },
    { name: 'Volunteer', path: '/volunteer' },
    { name: 'Dashboard', path: '/dashboard' },
  ];

  // Logged-Out Navigation Links
  const publicNavLinks = [
    { name: 'Home', path: '/' },
  ];

  const currentNavLinks = isAuthenticated
    ? (currentUser?.role === 'admin'
        ? authenticatedNavLinks.filter((link) => link.path !== '/recommendations')
        : authenticatedNavLinks)
    : publicNavLinks;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logoutUser();
    setUserDropdownOpen(false);
    navigate('/login');
  };

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--color-border)',
        transition: 'all var(--transition-base)',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--color-forest-dark)', flexShrink: 0 }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#ffffff',
              border: '1.5px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(27, 67, 50, 0.08)',
              padding: '2px',
              overflow: 'hidden',
            }}
          >
            <img
              src="/bnhs-logo-bird.png"
              alt="BNHS Logo"
              style={{ width: '30px', height: '30px', objectFit: 'contain' }}
            />
          </div>
          <div>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--color-forest-dark)', display: 'block', lineHeight: 1.1 }}>
              BNHS
            </span>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--color-emerald)', textTransform: 'uppercase' }}>
              Nature Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {currentNavLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.88rem',
                  fontWeight: active ? 700 : 500,
                  color: active
                    ? 'var(--color-forest-primary)'
                    : (link as any).highlight
                    ? 'var(--color-forest-primary)'
                    : 'var(--color-text-main)',
                  background: active
                    ? 'var(--color-sage-light)'
                    : (link as any).highlight
                    ? 'rgba(82, 183, 136, 0.12)'
                    : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  border: (link as any).highlight ? '1px solid rgba(82, 183, 136, 0.3)' : '1px solid transparent',
                  whiteSpace: 'nowrap',
                }}
              >
                {(link as any).highlight && <Sparkles size={13} color="var(--color-emerald)" />}
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Right Section: Notification Bell + Auth / Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {isAuthenticated ? (
            /* Logged-In User Actions */
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Notification Bell */}
              <NotificationBell />

              {/* User Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 12px',
                    background: 'var(--color-bg-alt)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    color: 'var(--color-forest-dark)',
                    fontWeight: 600,
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--color-forest-primary)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                    }}
                  >
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="desktop-only" style={{ maxWidth: '110px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentUser.name}
                  </span>
                </button>

                {/* User Dropdown */}
                {userDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '115%',
                      width: '210px',
                      background: '#ffffff',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      border: '1px solid var(--color-border)',
                      padding: '8px',
                      zIndex: 1010,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)', marginBottom: '4px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-forest-dark)' }}>{currentUser.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                        Role: {currentUser.role || 'Member'}
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px',
                        fontSize: '0.85rem',
                        color: 'var(--color-forest-dark)',
                        textDecoration: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 500,
                      }}
                    >
                      <User size={15} color="var(--color-forest-primary)" />
                      Profile & Interests
                    </Link>

                    <Link
                      to="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px',
                        fontSize: '0.85rem',
                        color: 'var(--color-forest-dark)',
                        textDecoration: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 500,
                      }}
                    >
                      <Compass size={15} color="var(--color-forest-primary)" />
                      {currentUser.role === 'admin' || currentUser.role === 'staff' ? 'Organizer Dashboard' : 'Nature Passport'}
                    </Link>

                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px',
                        fontSize: '0.85rem',
                        color: 'var(--color-danger)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: 600,
                        borderRadius: 'var(--radius-sm)',
                        width: '100%',
                      }}
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Logged-Out Actions: Sign In & Sign Up */
            <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link
                to="/login"
                className="btn btn-secondary btn-sm"
                style={{ padding: '7px 14px', fontSize: '0.88rem' }}
              >
                <LogIn size={14} />
                Sign In
              </Link>
              <Link
                to="/signup"
                className="btn btn-primary btn-sm"
                style={{ padding: '7px 16px', fontSize: '0.88rem', fontWeight: 700 }}
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-only"
            aria-label="Toggle navigation menu"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              color: 'var(--color-forest-dark)',
            }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          className="mobile-only"
          style={{
            padding: '16px 24px 24px',
            background: '#ffffff',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {currentNavLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.95rem',
                fontWeight: isActive(link.path) ? 700 : 500,
                color: isActive(link.path) ? 'var(--color-forest-primary)' : 'var(--color-text-main)',
                background: isActive(link.path) ? 'var(--color-sage-light)' : 'transparent',
                textDecoration: 'none',
              }}
            >
              {link.name}
            </Link>
          ))}

          <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '8px', paddingTop: '12px', display: 'flex', gap: '8px' }}>
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="btn btn-primary"
                  style={{ flex: 1, textAlign: 'center', justifyContent: 'center', background: 'var(--color-danger)' }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-primary"
                  style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
