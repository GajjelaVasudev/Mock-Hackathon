import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Clock, Check, ArrowRight } from 'lucide-react';
import { Recommendation } from '../types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onRegisterClick?: (recommendation: Recommendation) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onRegisterClick,
}) => {
  return (
    <div className="recommendation-card">
      <div>
        {/* Top bar with match score */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div className="match-score-badge">
            <Sparkles size={16} style={{ color: 'var(--color-mint-bright)' }} />
            <span>{Math.round(recommendation.score)}% Match</span>
          </div>
          {recommendation.type && (
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.04em' }}>
              {recommendation.type}
            </span>
          )}
        </div>

        {/* Activity Name */}
        <h3 style={{ fontSize: '1.3rem', marginBottom: '8px', color: 'var(--color-forest-dark)' }}>
          {recommendation.activity}
        </h3>

        {/* Location & Metadata */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
          {recommendation.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} style={{ color: 'var(--color-emerald)' }} />
              <span>{recommendation.location}</span>
            </div>
          )}
          {recommendation.duration && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} style={{ color: 'var(--color-emerald)' }} />
              <span>{recommendation.duration}</span>
            </div>
          )}
        </div>

        {/* Description if present */}
        {recommendation.description && (
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
            {recommendation.description}
          </p>
        )}

        {/* Reasons for recommendation */}
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '10px' }}>
          Why this matches you
        </div>
        <ul className="reasons-list">
          {recommendation.reasons?.map((reason, idx) => (
            <li key={idx}>
              <Check size={14} />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action CTA */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--color-border)' }}>
        {recommendation.activity_id ? (
          <Link
            to={`/activities/${recommendation.activity_id}`}
            className="btn btn-secondary btn-sm"
            style={{ flex: 1 }}
          >
            View Details
          </Link>
        ) : (
          <Link
            to="/activities"
            className="btn btn-secondary btn-sm"
            style={{ flex: 1 }}
          >
            Explore
          </Link>
        )}
        {onRegisterClick && (
          <button
            onClick={() => onRegisterClick(recommendation)}
            className="btn btn-primary btn-sm"
            style={{ flex: 1 }}
          >
            Register
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
