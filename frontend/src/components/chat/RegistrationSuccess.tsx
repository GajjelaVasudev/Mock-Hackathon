import React from 'react';
import { CheckCircle2, Calendar, MapPin, Ticket, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RegistrationResultData } from '../../types';

interface RegistrationSuccessProps {
  result: RegistrationResultData;
}

export const RegistrationSuccess: React.FC<RegistrationSuccessProps> = ({ result }) => {
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
            ✓ Registration Confirmed!
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Added to your BNHS Nature Passport
          </div>
        </div>
      </div>

      {/* Activity Details Card */}
      <div
        style={{
          backgroundColor: '#f0fdf4',
          borderRadius: '8px',
          padding: '12px',
          border: '1px solid #bbf7d0',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
          {result.activityTitle || 'BNHS Activity'}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.78rem', color: '#475569' }}>
          {result.date && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} color="#059669" />
              {result.date}
            </span>
          )}
          {result.location && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={13} color="#059669" />
              {result.location}
            </span>
          )}
        </div>

        {result.bookingId && (
          <div
            style={{
              marginTop: '4px',
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
            <Ticket size={13} />
            Booking ID: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{result.bookingId}</span>
          </div>
        )}
      </div>

      {/* Optional action to view without forced redirection */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          paddingTop: '4px',
        }}
      >
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          You remain in the chat. You can ask further questions or explore more walks!
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
          View My Activities <ArrowUpRight size={13} />
        </Link>
      </div>
    </div>
  );
};
