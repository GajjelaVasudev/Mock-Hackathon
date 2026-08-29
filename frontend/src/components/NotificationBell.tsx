import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Sparkles, Calendar, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { EventLeadInvitation } from '../types';
import api from '../services/api';

export const NotificationBell: React.FC = () => {
  const [invitations, setInvitations] = useState<EventLeadInvitation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchInvitations = async () => {
    try {
      const res = await api.getMyInvitations();
      setInvitations(res.invitations || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchInvitations();
    const interval = setInterval(fetchInvitations, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pendingCount = invitations.filter((i) => i.status === 'pending').length;

  const handleAccept = async (id: string) => {
    setLoading(true);
    try {
      await api.acceptLeadInvitation(id);
      setActionMsg('Invitation accepted! You are now assigned as the event leader.');
      await fetchInvitations();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      alert(`Error accepting invitation: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async (id: string) => {
    setLoading(true);
    try {
      await api.declineLeadInvitation(id);
      setActionMsg('Invitation declined.');
      await fetchInvitations();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      alert(`Error declining invitation: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: isOpen ? 'var(--color-sage-light)' : 'var(--color-bg-alt)',
          border: '1px solid var(--color-border)',
          cursor: 'pointer',
          color: 'var(--color-forest-dark)',
          transition: 'all 0.15s ease',
        }}
      >
        <Bell size={18} />
        {pendingCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: 'var(--color-danger)',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 800,
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.4)',
            }}
          >
            {pendingCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '120%',
            width: '340px',
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--color-border)',
            padding: '16px',
            zIndex: 1100,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-forest-dark)' }}>
              Notifications
            </span>
            {pendingCount > 0 && (
              <span style={{ fontSize: '0.72rem', background: 'var(--color-sage-light)', color: 'var(--color-forest-primary)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                {pendingCount} Pending Lead Request
              </span>
            )}
          </div>

          {actionMsg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'var(--color-sage-light)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--color-forest-dark)', marginBottom: '10px' }}>
              <CheckCircle2 size={14} color="var(--color-emerald)" />
              <span>{actionMsg}</span>
            </div>
          )}

          {invitations.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              No notifications at this time.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto' }}>
              {invitations.map((inv) => (
                <div
                  key={inv._id}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: inv.status === 'pending' ? 'var(--color-sage-light)' : 'var(--color-bg-alt)',
                    border: `1px solid ${inv.status === 'pending' ? 'var(--color-emerald-light)' : 'var(--color-border)'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Sparkles size={14} color="var(--color-forest-primary)" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-forest-primary)' }}>
                      Event Lead Invitation
                    </span>
                  </div>

                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-forest-dark)', marginBottom: '4px' }}>
                    {inv.eventTitle}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px', lineHeight: 1.4 }}>
                    {inv.message}
                  </div>

                  {inv.eventLocation && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                      <MapPin size={12} />
                      <span>{inv.eventLocation}</span>
                      {inv.eventDate && <span>• {inv.eventDate}</span>}
                    </div>
                  )}

                  {inv.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <button
                        onClick={() => handleAccept(inv._id)}
                        disabled={loading}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, padding: '6px 10px', fontSize: '0.78rem', justifyContent: 'center' }}
                      >
                        <Check size={13} />
                        Accept
                      </button>
                      <button
                        onClick={() => handleDecline(inv._id)}
                        disabled={loading}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, padding: '6px 10px', fontSize: '0.78rem', justifyContent: 'center' }}
                      >
                        <X size={13} />
                        Decline
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: inv.status === 'accepted' ? 'var(--color-forest-primary)' : 'var(--color-danger)', textTransform: 'uppercase' }}>
                      Status: {inv.status}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
