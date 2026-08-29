import React, { useState, useEffect } from 'react';
import { X, Users, Mail, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { AdminEventItem, EventParticipant } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import api from '../services/api';

interface EventParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: AdminEventItem | null;
}

export const EventParticipantsModal: React.FC<EventParticipantsModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  if (!isOpen || !event) return null;

  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParticipants = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getAdminEventParticipants(event.id || event._id);
        setParticipants(res.participants || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load participants.');
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [event]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(11, 31, 23, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '85vh',
          background: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--color-bg-alt)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-emerald)', letterSpacing: '0.05em' }}>
              Registered Participants
            </div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-forest-dark)', margin: 0 }}>
              {event.title || event.name}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Capacity: {participants.length} / {event.capacity} registered
            </span>
            {event.leader && (
              <span style={{ fontSize: '0.78rem', background: 'var(--color-sage-light)', color: 'var(--color-forest-primary)', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                Naturalist Leader: {event.leader}
              </span>
            )}
          </div>

          {loading ? (
            <LoadingSpinner message="Fetching participant roster..." />
          ) : error ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-error)' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          ) : participants.length === 0 ? (
            <div style={{ padding: '36px 12px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              No members have registered for this event yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {participants.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--color-forest-primary)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                      }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-forest-dark)' }}>{p.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{p.email}</div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: p.registrationStatus === 'attended' ? 'var(--color-sage-light)' : 'var(--color-bg-alt)',
                      color: p.registrationStatus === 'attended' ? 'var(--color-forest-primary)' : 'var(--color-text-muted)',
                    }}
                  >
                    {p.registrationStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--color-bg-alt)' }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
