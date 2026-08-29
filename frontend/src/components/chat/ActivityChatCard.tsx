import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Tag,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Users,
  Clock,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { ChatActivityCardData } from '../../types';

interface ActivityChatCardProps {
  activity: ChatActivityCardData;
  onRegister?: (activity: ChatActivityCardData) => void;
  onVolunteer?: (activity: ChatActivityCardData) => void;
  isRegistering?: boolean;
  isVolunteering?: boolean;
}

export const ActivityChatCard: React.FC<ActivityChatCardProps> = ({
  activity,
  onRegister,
  onVolunteer,
  isRegistering = false,
  isVolunteering = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const title = activity.title || activity.name || 'BNHS Nature Event';
  const matchPct = activity.matchPercentage || 92;
  const matchReasons = activity.matchReasons || [
    'Matches your interest in birds and ecology',
    'Beginner friendly nature exploration',
    'Open for instant registration',
  ];

  const isFull = activity.isFull || (activity.capacity && activity.registeredCount && activity.registeredCount >= activity.capacity);
  const isRegistered = activity.isRegistered;

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--color-border-subtle, #e2e8f0)',
        borderRadius: '12px',
        padding: '14px 16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '100%',
        color: '#1a202c',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Top Match Badge & Type */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '6px',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '9999px',
            backgroundColor: '#ecfdf5',
            color: '#047857',
            border: '1px solid #a7f3d0',
          }}
        >
          <Sparkles size={12} />
          AI MATCH — {matchPct}%
        </span>

        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#64748b',
          }}
        >
          {activity.type || 'Walk'}
        </span>
      </div>

      {/* Title */}
      <h4
        style={{
          margin: 0,
          fontSize: '1rem',
          fontWeight: 700,
          color: '#1e293b',
          lineHeight: 1.3,
        }}
      >
        {title}
      </h4>

      {/* Metadata Badges (Date, Location, Difficulty) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          fontSize: '0.8rem',
          color: '#475569',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={13} color="#059669" />
          {activity.date || 'Upcoming'}
        </span>

        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <MapPin size={13} color="#059669" />
          {activity.location}
        </span>

        {activity.difficulty && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              padding: '1px 6px',
              borderRadius: '4px',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              fontWeight: 500,
            }}
          >
            <Compass size={11} />
            {activity.difficulty}
          </span>
        )}
      </div>

      {/* Tags */}
      {activity.tags && activity.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {activity.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '0.7rem',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#64748b',
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Why I Recommend This */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          padding: '8px 10px',
          borderLeft: '3px solid #10b981',
        }}
      >
        <div
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: '#334155',
            marginBottom: '4px',
          }}
        >
          Why I recommend this:
        </div>
        <ul
          style={{
            margin: 0,
            paddingLeft: '14px',
            fontSize: '0.75rem',
            color: '#475569',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {matchReasons.map((reason, rIdx) => (
            <li key={rIdx}>{reason}</li>
          ))}
        </ul>
      </div>

      {/* Expandable Details Section (NO Page Redirect) */}
      {isExpanded && (
        <div
          style={{
            fontSize: '0.78rem',
            color: '#475569',
            lineHeight: 1.4,
            paddingTop: '6px',
            borderTop: '1px dashed #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <p style={{ margin: 0 }}>{activity.description}</p>
          <div style={{ display: 'flex', gap: '12px', color: '#64748b', fontSize: '0.73rem' }}>
            {activity.duration && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <Clock size={12} /> {activity.duration}
              </span>
            )}
            {activity.capacity && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <Users size={12} /> Capacity: {activity.capacity} spots
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          marginTop: '4px',
        }}
      >
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'none',
            border: 'none',
            color: '#059669',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {isExpanded ? (
            <>
              Less Details <ChevronUp size={13} />
            </>
          ) : (
            <>
              View Details <ChevronDown size={13} />
            </>
          )}
        </button>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {isRegistered ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#f1f5f9',
                color: '#059669',
                border: '1px solid #cbd5e1',
              }}
            >
              <CheckCircle2 size={14} />
              Registered
            </span>
          ) : isFull ? (
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
              }}
            >
              Event Full
            </span>
          ) : (
            <>
              {/* Register button — only shown when onRegister is provided */}
              {onRegister && (
                <button
                  type="button"
                  disabled={isRegistering || isVolunteering}
                  onClick={() => onRegister(activity)}
                  style={{
                    backgroundColor: '#047857',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: isRegistering || isVolunteering ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    transition: 'background-color 0.15s ease',
                    opacity: isRegistering || isVolunteering ? 0.6 : 1,
                  }}
                >
                  {isRegistering ? 'Processing...' : <><ArrowRight size={13} /> Register</>}
                </button>
              )}

              {/* Volunteer button — only shown when onVolunteer is provided */}
              {onVolunteer && (
                <button
                  type="button"
                  disabled={isRegistering || isVolunteering}
                  onClick={() => onVolunteer(activity)}
                  style={{
                    backgroundColor: '#0369a1',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: isRegistering || isVolunteering ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    transition: 'background-color 0.15s ease',
                    opacity: isRegistering || isVolunteering ? 0.6 : 1,
                  }}
                >
                  {isVolunteering ? 'Processing...' : <><ArrowRight size={13} /> Volunteer</>}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
