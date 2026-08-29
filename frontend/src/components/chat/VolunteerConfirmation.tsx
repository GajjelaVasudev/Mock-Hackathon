import React from 'react';
import { MapPin, Clock, HeartHandshake, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { PendingVolunteerData } from '../../types';

interface VolunteerConfirmationProps {
  pendingVolunteer: PendingVolunteerData;
  onConfirm: (opportunityId: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const VolunteerConfirmation: React.FC<VolunteerConfirmationProps> = ({
  pendingVolunteer,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#f0fdf4',
        border: '1.5px solid #6ee7b7',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginTop: '8px',
        color: '#1e293b',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#059669',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <HeartHandshake size={15} />
        </div>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#065f46' }}>
          Volunteer Request Confirmation
        </div>
      </div>

      <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
        You are about to submit a volunteer request for:
      </div>

      {/* Opportunity Summary */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '12px',
          border: '1px solid #a7f3d0',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
          {pendingVolunteer.opportunityTitle}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.78rem', color: '#475569' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={13} color="#059669" />
            {pendingVolunteer.opportunityLocation}
          </span>
          {pendingVolunteer.commitment && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} color="#059669" />
              {pendingVolunteer.commitment}
            </span>
          )}
        </div>
        {pendingVolunteer.theme && (
          <div
            style={{
              marginTop: '2px',
              fontSize: '0.72rem',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#ecfdf5',
              color: '#047857',
              fontWeight: 600,
              width: 'fit-content',
              border: '1px solid #a7f3d0',
            }}
          >
            {pendingVolunteer.theme}
          </div>
        )}
      </div>

      <div style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 500 }}>
        Your request will be sent to the BNHS admin for review. Would you like to continue?
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => onConfirm(pendingVolunteer.opportunityId)}
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
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle size={14} />
              Confirm Volunteering
            </>
          )}
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={onCancel}
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
