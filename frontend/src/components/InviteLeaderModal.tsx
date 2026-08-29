import React, { useState } from 'react';
import { X, Sparkles, Award, Send, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { EligibleLeader, AdminEventItem } from '../types';
import api from '../services/api';

interface InviteLeaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  candidate: EligibleLeader | null;
  events: AdminEventItem[];
}

export const InviteLeaderModal: React.FC<InviteLeaderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  candidate,
  events,
}) => {
  if (!isOpen || !candidate) return null;

  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || events[0]?._id || '');
  const [message, setMessage] = useState(
    `Dear ${candidate.name},\n\nBased on your active participation (${candidate.attendedEvents} events attended) and field expertise with BNHS, we would like to invite you to lead this upcoming event. Please confirm your availability.`
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) {
      setError('Please select an event to assign.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.sendEventLeadInvitation({
        userId: candidate.userId || candidate.id,
        eventId: selectedEventId,
        message,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send event lead invitation.');
    } finally {
      setLoading(false);
    }
  };

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
          maxWidth: '560px',
          background: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-border)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={20} color="var(--color-forest-primary)" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-emerald)', letterSpacing: '0.05em' }}>
                Naturalist Promotion
              </div>
              <h2 style={{ fontSize: '1.3rem', color: 'var(--color-forest-dark)', margin: 0 }}>
                Invite User to Lead Event
              </h2>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSend} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--color-error-bg)', color: 'var(--color-error)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Candidate Card Summary */}
          <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--color-sage-light)', border: '1px solid var(--color-emerald-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <div>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-forest-dark)' }}>{candidate.name}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>({candidate.email})</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'var(--color-forest-primary)', color: '#ffffff', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                ✓ {candidate.attendedEvents} Events Attended
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-forest-dark)' }}>
              <strong>Interests:</strong> {candidate.interests?.join(', ') || 'Nature & Ornithology'}
            </div>
          </div>

          {/* Select Event */}
          <div>
            <label className="filter-label">Select Event to Lead *</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="filter-select"
              required
            >
              {events.map((ev) => (
                <option key={ev.id || ev._id} value={ev.id || ev._id}>
                  {ev.title || ev.name} ({ev.location} • {ev.date ? new Date(ev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Upcoming'})
                </option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="filter-label">Invitation Message</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '0.88rem',
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '14px', borderTop: '1px solid var(--color-border)' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '10px 22px' }}>
              <Send size={15} />
              {loading ? 'Sending Invitation...' : 'Send Lead Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
