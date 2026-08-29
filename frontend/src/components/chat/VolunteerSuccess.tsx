import React from 'react';
import { CheckCircle2, MapPin, Clock, HeartHandshake, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VolunteerResultData } from '../../types';

interface VolunteerSuccessProps {
  result: VolunteerResultData;
}

export const VolunteerSuccess: React.FC<VolunteerSuccessProps> = ({ result }) => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1.5px solid #10b981',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.12)',
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
            backgroundColor: '#10b981',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <CheckCircle2 size={16} />
        </div>
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#047857' }}>
            ✓ Volunteer Request Sent
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Awaiting BNHS admin approval
          </div>
        </div>
      </div>

      {/* Opportunity Details */}
      <div
        style={{
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          padding: '12px',
          border: '1px solid #bbf7d0',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
          {result.opportunityTitle || 'BNHS Volunteer Opportunity'}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.78rem', color: '#475569' }}>
          {result.opportunityLocation && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={13} color="#059669" />
              {result.opportunityLocation}
            </span>
          )}
        </div>

        {/* Status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
          <HeartHandshake size={13} color="#059669" />
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#fef9c3',
              color: '#854d0e',
              border: '1px solid #fde68a',
            }}
          >
            {result.status === 'pending' ? 'Pending Admin Approval' : result.status}
          </span>
        </div>

        {result.applicationId && (
          <div
            style={{
              marginTop: '2px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffffff',
              border: '1px dashed #86efac',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#065f46',
              width: 'fit-content',
            }}
          >
            <Clock size={12} />
            Request ID: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{result.applicationId.slice(-8)}</span>
          </div>
        )}
      </div>

      <div style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.45 }}>
        {result.message || 'Your request has been sent to the BNHS admin. You will be notified once it is reviewed.'}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingTop: '4px' }}>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          You remain in the chat. Ask more questions or explore other activities!
        </span>

        <Link
          to="/my-activities"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: '#047857',
            textDecoration: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
          }}
        >
          View My Requests <ArrowUpRight size={13} />
        </Link>
      </div>
    </div>
  );
};
