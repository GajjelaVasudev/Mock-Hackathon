import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Footprints, Users, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Activity } from '../types';

interface ActivityCardProps {
  activity: Activity;
  onRegisterClick?: (activity: Activity) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onRegisterClick }) => {
  const getBadgeClass = (type: string) => {
    switch (type.toLowerCase()) {
      case 'camp': return 'badge-camp';
      case 'course': return 'badge-course';
      case 'volunteer': return 'badge-volunteer';
      default: return 'badge-walk';
    }
  };

  return (
    <div className="activity-card">
      <div>
        {/* Header */}
        <div className="card-header">
          <span className={`card-badge ${getBadgeClass(activity.type)}`}>
            {activity.type}
          </span>
          {activity.difficulty && (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
              {activity.difficulty}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="card-title">
          <Link to={`/activities/${activity.id}`}>
            {activity.name}
          </Link>
        </h3>

        {/* Metadata */}
        <div className="card-meta">
          <div className="card-meta-item">
            <MapPin size={14} style={{ color: 'var(--color-emerald)' }} />
            <span>{activity.location}</span>
          </div>
          {activity.duration && (
            <div className="card-meta-item">
              <Clock size={14} style={{ color: 'var(--color-emerald)' }} />
              <span>{activity.duration}</span>
            </div>
          )}
          {activity.distance && (
            <div className="card-meta-item">
              <Footprints size={14} style={{ color: 'var(--color-emerald)' }} />
              <span>{activity.distance}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="card-description">
          {activity.description}
        </p>

        {/* Tags */}
        <div className="card-tags">
          {activity.interests?.slice(0, 4).map((tag, idx) => (
            <span key={idx} className="tag">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
        <Link
          to={`/activities/${activity.id}`}
          className="btn btn-secondary btn-sm"
          style={{ flex: 1 }}
        >
          Details
          <ArrowUpRight size={14} />
        </Link>
        {onRegisterClick && (
          <button
            onClick={() => onRegisterClick(activity)}
            className="btn btn-primary btn-sm"
            style={{ flex: 1 }}
          >
            Register
          </button>
        )}
      </div>
    </div>
  );
};
