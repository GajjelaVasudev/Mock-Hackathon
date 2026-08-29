import React, { useState } from 'react';
import { X, HeartHandshake, CheckCircle2, Send, ShieldCheck, AlertCircle } from 'lucide-react';
import { VolunteerOpportunity, VolunteerEligibility } from '../types';
import api from '../services/api';

interface ApplyVolunteerModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: VolunteerOpportunity | null;
  eligibility: VolunteerEligibility | null;
  isStaff: boolean;
  onSuccess: () => void;
}

export const ApplyVolunteerModal: React.FC<ApplyVolunteerModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  eligibility,
  isStaff,
  onSuccess,
}) => {
  const [message, setMessage] = useState('I would like to contribute as a volunteer for this opportunity.');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !opportunity) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.applyForVolunteer({
        opportunityId: opportunity.id,
        opportunityTitle: opportunity.title,
        opportunityLocation: opportunity.location,
        opportunityTheme: opportunity.theme,
        message: message.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit volunteer application.');
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
          maxWidth: '520px',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
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
                Apply to Volunteer
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-mint-bright)' }}>
                BNHS-SEVA Volunteer Application
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

        {/* Form Body */}
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

          {/* Opportunity Details Box */}
          <div
            style={{
              background: 'var(--color-bg-alt)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              marginBottom: '18px',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-emerald)', textTransform: 'uppercase', marginBottom: '4px' }}>
              {opportunity.theme}
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-forest-dark)', marginBottom: '6px' }}>
              {opportunity.title}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
              <strong>Location:</strong> {opportunity.location} • <strong>Commitment:</strong> {opportunity.commitment}
            </div>

            {/* Why Eligible Badge */}
            <div
              style={{
                marginTop: '10px',
                paddingTop: '10px',
                borderTop: '1px dashed var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem',
                color: 'var(--color-forest-dark)',
              }}
            >
              <CheckCircle2 size={16} color="var(--color-emerald)" />
              {isStaff ? (
                <span><strong>Staff Access:</strong> Authorized to apply directly</span>
              ) : (
                <span>
                  <strong>Eligibility Verified:</strong> {eligibility?.attendedEvents || 6} BNHS activities attended (Eligible member)
                </span>
              )}
            </div>
          </div>

          {/* Message Input */}
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
              Message to BNHS Admin:
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your motivation or relevant skills..."
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
