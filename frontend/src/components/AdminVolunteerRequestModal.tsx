import React, { useState } from 'react';
import { X, HeartHandshake, CheckCircle2, Send, AlertCircle, Sparkles } from 'lucide-react';
import { AdminEligibleVolunteer, VolunteerOpportunity } from '../types';
import api from '../services/api';

interface AdminVolunteerRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: AdminEligibleVolunteer | null;
  opportunities: VolunteerOpportunity[];
  onSuccess: () => void;
}

export const AdminVolunteerRequestModal: React.FC<AdminVolunteerRequestModalProps> = ({
  isOpen,
  onClose,
  candidate,
  opportunities,
  onSuccess,
}) => {
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>(
    opportunities[0]?.id || 'vol_bird_ringing'
  );
  const [message, setMessage] = useState(
    'You have demonstrated strong participation in BNHS activities. We would like to invite you to contribute as a volunteer / event leader.'
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !candidate) return null;

  const selectedOpp = opportunities.find((o) => o.id === selectedOpportunityId) || opportunities[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.adminSendVolunteerRequest({
        userId: candidate.userId || candidate.id,
        opportunityId: selectedOpp.id,
        opportunityTitle: selectedOpp.title,
        opportunityLocation: selectedOpp.location,
        message: message.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send volunteering request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(17, 30, 23, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '540px',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, var(--color-forest-dark) 0%, var(--color-forest-primary) 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <HeartHandshake size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                Request for Volunteering
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-mint-bright)' }}>
                Invite Qualified Member to Contribute
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: '#fee2e2',
                border: '1px solid #ef4444',
                borderRadius: 'var(--radius-md)',
                color: '#991b1b',
                fontSize: '0.85rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Candidate Card Summary */}
          <div
            style={{
              background: 'var(--color-bg-alt)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              marginBottom: '18px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-forest-dark)' }}>
                  {candidate.name}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  {candidate.email} • {candidate.location}
                </div>
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-sage-light)',
                  color: 'var(--color-forest-dark)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                <CheckCircle2 size={13} color="var(--color-emerald)" />
                Eligible ({candidate.attendedEvents} events)
              </span>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--color-forest-primary)', display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
              {candidate.interests?.map((tag, idx) => (
                <span key={idx} className="tag" style={{ background: '#ffffff', borderColor: 'var(--color-border)' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Opportunity Dropdown */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--color-forest-dark)',
                marginBottom: '6px',
              }}
            >
              Select Volunteering Opportunity:
            </label>
            <select
              value={selectedOpportunityId}
              onChange={(e) => setSelectedOpportunityId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontSize: '0.9rem',
                color: 'var(--color-text-main)',
                backgroundColor: '#ffffff',
                outline: 'none',
              }}
            >
              {opportunities.map((opp) => (
                <option key={opp.id} value={opp.id}>
                  {opp.title} — {opp.theme} ({opp.location})
                </option>
              ))}
            </select>
          </div>

          {/* Message Textarea */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--color-forest-dark)',
                marginBottom: '6px',
              }}
            >
              Custom Message to Candidate:
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Send size={16} />
              {submitting ? 'Sending Request...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
