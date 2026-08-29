import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../../services/api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'post' | 'comment' | 'message';
  targetId: string;
  targetAuthor?: string;
  postId?: string;
  activityId?: string;
}

const REPORT_REASONS = [
  'Spam',
  'Harassment',
  'Inappropriate content',
  'Misleading information',
  'Other',
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetAuthor,
  postId,
  activityId,
}) => {
  const [reason, setReason] = useState<string>('Inappropriate content');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await api.createCommunityReport({
        targetType,
        targetId,
        reason,
        details,
        postId,
        activityId,
      });
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setDetails('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          width: '100%',
          maxWidth: '460px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <CheckCircle2 size={44} color="#059669" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.2rem', color: '#064e3b', margin: '0 0 6px', fontWeight: 700 }}>
              Report Submitted
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0 }}>
              Thank you. Our moderation team will review this content.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ShieldAlert size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  Report Content
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                  Help keep the BNHS community safe and respectful
                </p>
              </div>
            </div>

            {targetAuthor && (
              <div style={{ fontSize: '0.8rem', color: '#475569', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                Reporting content by: <strong>{targetAuthor}</strong>
              </div>
            )}

            {error && (
              <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={14} />
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Reason for report:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.82rem',
                      color: '#1e293b',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      backgroundColor: reason === r ? '#ecfdf5' : '#f8fafc',
                      border: `1px solid ${reason === r ? '#10b981' : '#e2e8f0'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                    />
                    {r}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Additional Details (Optional):
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide context for our moderators..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
