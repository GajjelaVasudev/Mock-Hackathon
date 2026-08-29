import React from 'react';
import { Calendar, MapPin, CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-react';
import { PendingRegistrationData } from '../../types';

interface RegistrationConfirmationProps {
  pendingRegistration: PendingRegistrationData;
  onConfirm: (activityId: string) => void;
  onCancel: (activityId: string) => void;
  isLoading?: boolean;
}

export const RegistrationConfirmation: React.FC<RegistrationConfirmationProps> = ({
  pendingRegistration,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#f0fdf4',
        border: '1.5px solid #86efac',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(4, 120, 87, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginTop: '8px',
        color: '#1e293b',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#047857',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Sparkles size={15} />
        </div>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#065f46' }}>
          Registration Confirmation Required
        </div>
      </div>

      <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
        You are about to register for:
      </div>

      {/* Activity Summary Box */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '12px',
          border: '1px solid #bbf7d0',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
          {pendingRegistration.activityTitle}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.78rem', color: '#475569' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={13} color="#059669" />
            {pendingRegistration.date || 'Upcoming'}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={13} color="#059669" />
            {pendingRegistration.location || 'Mumbai'}
          </span>
        </div>
      </div>

      <div style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 500 }}>
        Would you like me to confirm this registration directly in your BNHS account?
      </div>

      {/* Confirmation Actions */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => onConfirm(pendingRegistration.activityId)}
          style={{
            backgroundColor: '#047857',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 4px rgba(4, 120, 87, 0.2)',
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Confirming Registration...
            </>
          ) : (
            <>
              <CheckCircle size={14} />
              Confirm Registration
            </>
          )}
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => onCancel(pendingRegistration.activityId)}
          style={{
            backgroundColor: '#ffffff',
            color: '#64748b',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '8px 14px',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <XCircle size={14} />
          Cancel
        </button>
      </div>
    </div>
  );
};
