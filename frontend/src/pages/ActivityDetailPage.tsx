import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Footprints,
  Users,
  CheckCircle2,
  TreeDeciduous,
  Tag,
  Share2,
} from 'lucide-react';
import { Activity } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { RegistrationModal } from '../components/RegistrationModal';
import api from '../services/api';

export const ActivityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const loadDetail = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const found = await api.getActivityById(id);
        if (!found) {
          setError(`Activity with ID "${id}" was not found.`);
        } else {
          setActivity(found);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load activity details.');
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading activity details..." />;
  if (error || !activity) return <ErrorMessage message={error || 'Activity not found'} />;

  return (
    <div className="container-narrow" style={{ padding: '40px 24px 80px' }}>
      {/* Back Link */}
      <Link
        to="/activities"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.9rem',
          fontWeight: 600,
          color: 'var(--color-text-muted)',
          marginBottom: '24px',
        }}
      >
        <ArrowLeft size={16} />
        Back to Activities Catalog
      </Link>

      {/* Main Card */}
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          padding: '36px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {/* Top Badges */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-sage-light)',
              color: 'var(--color-forest-primary)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {activity.type}
          </span>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            {activity.category}
          </span>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '2.4rem', color: 'var(--color-forest-dark)', marginBottom: '16px' }}>
          {activity.name}
        </h1>

        {/* Key Info Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px',
            background: 'var(--color-bg)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '28px',
            border: '1px solid var(--color-border)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Location
            </span>
            <div style={{ fontWeight: 600, color: 'var(--color-forest-dark)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <MapPin size={15} style={{ color: 'var(--color-emerald)' }} />
              {activity.location}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Difficulty
            </span>
            <div style={{ fontWeight: 600, color: 'var(--color-forest-dark)', textTransform: 'capitalize', marginTop: '2px' }}>
              {activity.difficulty || 'All Levels'}
            </div>
          </div>

          {activity.duration && (
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Duration
              </span>
              <div style={{ fontWeight: 600, color: 'var(--color-forest-dark)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <Clock size={15} style={{ color: 'var(--color-emerald)' }} />
                {activity.duration}
              </div>
            </div>
          )}

          {activity.distance && (
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Distance
              </span>
              <div style={{ fontWeight: 600, color: 'var(--color-forest-dark)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <Footprints size={15} style={{ color: 'var(--color-emerald)' }} />
                {activity.distance}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '10px' }}>Overview</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: 1.7 }}>
            {activity.description}
          </p>
        </div>

        {/* Target Audience */}
        {activity.audience && activity.audience.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '10px' }}>Target Audience</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {activity.audience.map((aud, i) => (
                <span key={i} className="tag" style={{ background: 'var(--color-sage-light)', color: 'var(--color-forest-primary)', fontWeight: 600 }}>
                  <Users size={13} style={{ marginRight: '4px' }} />
                  {aud}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Focal Species */}
        {activity.species && activity.species.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '10px' }}>Focal Wildlife & Species</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {activity.species.map((sp, i) => (
                <span key={i} className="tag" style={{ background: 'var(--color-surface-hover)', borderColor: 'var(--color-mint-bright)', color: 'var(--color-forest-dark)' }}>
                  🌿 {sp}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div style={{ display: 'flex', gap: '16px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={() => setModalOpen(true)}
            className="btn btn-primary btn-lg"
            style={{ flex: 1 }}
          >
            Register for this Activity
          </button>
        </div>
      </div>

      {/* Registration Modal */}
      <RegistrationModal
        activity={activity}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};
