import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Footprints, Users, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Activity } from '../types';
import { NatureImage } from './NatureImage';

interface ActivityCardProps {
  activity: Activity;
  onRegisterClick?: (activity: Activity) => void;
  /** Position of this card in the grid (0-indexed). Cards 0-3 load eagerly. */
  index?: number;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onRegisterClick, index = 0 }) => {
  const getBadgeClass = (type: string) => {
    switch (type.toLowerCase()) {
      case 'camp': return 'badge-camp';
      case 'course': return 'badge-course';
      case 'volunteer': return 'badge-volunteer';
      default: return 'badge-walk';
    }
  };

  const activityTitle = activity.title || activity.name;
  // First 4 cards are likely above the fold — load eagerly with high fetch priority
  const isPriority = index < 4;

  return (
    <div
      className="activity-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        backgroundColor: '#ffffff',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* Top Event Image */}
      <Link
        to={`/activities/${encodeURIComponent(activity.id || activity._id || '')}`}
        style={{ textDecoration: 'none', display: 'block' }}
      >
        <NatureImage
          image={activity.image}
          imageUrl={activity.imageUrl}
          alt={activityTitle}
          category={activity.category}
          type={activity.type}
          aspectRatio="16/9"
          borderRadius="0px"
          sizeHint="card"
          priority={isPriority}
        />
      </Link>

      {/* Card Content */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Header Badges */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <span className={`card-badge ${getBadgeClass(activity.type)}`}>
            {activity.type}
          </span>
          {activity.difficulty && (
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {activity.difficulty}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className="card-title"
          style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            lineHeight: 1.35,
            marginBottom: '8px',
          }}
        >
          <Link
            to={`/activities/${encodeURIComponent(activity.id || activity._id || '')}`}
            style={{ color: '#064e3b', textDecoration: 'none' }}
          >
            {activityTitle}
          </Link>
        </h3>

        {/* Metadata */}
        <div className="card-meta" style={{ marginBottom: '10px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <div className="card-meta-item">
            <MapPin size={13} style={{ color: '#059669' }} />
            <span>{activity.location}</span>
          </div>
          {activity.duration && (
            <div className="card-meta-item">
              <Clock size={13} style={{ color: '#059669' }} />
              <span>{activity.duration}</span>
            </div>
          )}
          {activity.distance && (
            <div className="card-meta-item">
              <Footprints size={13} style={{ color: '#059669' }} />
              <span>{activity.distance}</span>
            </div>
          )}
        </div>

        {/* Short Description (Truncated to ~2 lines) */}
        <p
          className="card-description"
          style={{
            fontSize: '0.82rem',
            lineHeight: 1.45,
            color: '#475569',
            marginBottom: '12px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flex: 1,
          }}
        >
          {activity.description}
        </p>

        {/* Tags */}
        <div className="card-tags" style={{ marginBottom: '14px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {(activity.tags?.length ? activity.tags : (activity.interests || [])).slice(0, 3).map((tag, idx) => (
            <span key={idx} className="tag" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
              #{tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', marginTop: 'auto' }}>
          <Link
            to={`/activities/${encodeURIComponent(activity.id || activity._id || '')}`}
            className="btn btn-secondary btn-sm"
            style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}
          >
            Details
            <ArrowUpRight size={14} />
          </Link>
          {onRegisterClick && (
            <button
              onClick={() => onRegisterClick(activity)}
              className="btn btn-primary btn-sm"
              style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}
            >
              Register
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
