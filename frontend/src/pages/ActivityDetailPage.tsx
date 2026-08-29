import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Footprints,
  Users,
  CheckCircle2,
  Tag,
  Share2,
  Calendar,
  AlertCircle,
  Compass,
  UserCheck,
  Award,
  Sparkles,
  MessageSquare,
  Camera,
  Shield,
} from 'lucide-react';
import { Activity, ExperiencePost } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { RegistrationModal } from '../components/RegistrationModal';
import { ActivityCard } from '../components/ActivityCard';
import { NatureImage } from '../components/NatureImage';
import { useUser } from '../context/UserContext';
import api from '../services/api';

export const ActivityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const isAdmin = currentUser?.role === 'admin';

  const [activity, setActivity] = useState<Activity | null>(null);
  const [relatedActivities, setRelatedActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const loadDetail = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const data = await api.getActivityById(id);
        setActivity(data);

        // Fetch related activities based on category or type
        const relatedRes = await api.getActivities({
          type: data.type,
        });
        const cleanList = (relatedRes.activities || []).filter(
          (a: Activity) => (a.id || a._id) !== (data.id || data._id)
        );
        setRelatedActivities(cleanList.slice(0, 3));
      } catch (err: any) {
        if (err.status === 404 || err.message?.includes('404')) {
          setNotFound(true);
        } else {
          setError(err.message || 'Failed to load activity details.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 24px' }}>
        <LoadingSpinner message="Loading activity details & photos..." />
      </div>
    );
  }

  if (notFound || !activity) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '460px', margin: '0 auto' }}>
          <AlertCircle size={48} color="var(--color-rust)" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.8rem', color: 'var(--color-forest-dark)', marginBottom: '8px' }}>
            Activity Not Found
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
            The activity you are looking for does not exist or may have been removed.
          </p>
          <Link to="/activities" className="btn btn-primary">
            <ArrowLeft size={16} /> Back to Activities
          </Link>
        </div>
      </div>
    );
  }

  const activityTitle = activity.title || activity.name;
  const isFull = activity.status === 'full';
  const isCompleted = activity.status === 'completed';
  const isRegistrationAllowed = activity.status === 'upcoming' || !activity.status;

  return (
    <div className="container" style={{ padding: '32px 24px 80px' }}>
      {/* Back Button */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(300px, 1fr)',
          gap: '40px',
          alignItems: 'start',
          marginBottom: '60px',
        }}
      >
        {/* Left Column: Details */}
        <div
          style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-border)',
            padding: '36px',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* Hero Nature Image Banner */}
          <div style={{ marginBottom: '24px' }}>
            <NatureImage
              image={activity.image}
              imageUrl={activity.imageUrl}
              alt={activityTitle}
              category={activity.category}
              type={activity.type}
              aspectRatio="21/9"
              borderRadius="14px"
              showAttribution={true}
              sizeHint="detail"
              priority={true}
            />
          </div>

          {/* Top Badges */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
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
              {activity.type || 'Walk'}
            </span>

            {activity.category && (
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
            )}

            {/* Status Badge */}
            <span
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: isRegistrationAllowed ? '#d1fae5' : isCompleted ? '#dbeafe' : '#fee2e2',
                color: isRegistrationAllowed ? '#065f46' : isCompleted ? '#1e40af' : '#991b1b',
              }}
            >
              {activity.status || 'Upcoming'}
            </span>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: '2.3rem', color: 'var(--color-forest-dark)', marginBottom: '16px', lineHeight: 1.2 }}>
            {activityTitle}
          </h1>

          {/* Assigned Event Leader */}
          {activity.leader && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-sage-light)',
                border: '1px solid var(--color-emerald-light)',
                marginBottom: '20px',
              }}
            >
              <UserCheck size={18} color="var(--color-forest-primary)" />
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                  Assigned Naturalist Leader
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-forest-dark)' }}>
                  {activity.leader}
                </span>
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              padding: '20px',
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MapPin size={20} color="var(--color-emerald)" />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Location</span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--color-text-dark)' }}>{activity.location}</strong>
              </div>
            </div>

            {activity.duration && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={20} color="var(--color-emerald)" />
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Duration</span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--color-text-dark)' }}>{activity.duration}</strong>
                </div>
              </div>
            )}

            {activity.difficulty && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Compass size={20} color="var(--color-emerald)" />
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Difficulty</span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--color-text-dark)', textTransform: 'capitalize' }}>{activity.difficulty}</strong>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={20} color="var(--color-emerald)" />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Capacity</span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--color-text-dark)' }}>{activity.capacity || 30} max spots</strong>
              </div>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', color: 'var(--color-forest-dark)' }}>
              About This Field Program
            </h3>
            <p style={{ lineHeight: 1.7, color: 'var(--color-text-dark)', fontSize: '0.98rem' }}>
              {activity.description}
            </p>
          </div>

          {/* Species Observed / Focus */}
          {activity.species && activity.species.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', color: 'var(--color-forest-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--color-emerald)" />
                Target Species & Key Focus
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {activity.species.map((sp: string, idx: number) => (
                  <span
                    key={idx}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-sage-light)',
                      color: 'var(--color-forest-dark)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    🌿 {sp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Itinerary & What to Expect */}
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', color: 'var(--color-forest-dark)' }}>
              What to Expect & Timeline
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 700, color: 'var(--color-forest-primary)', fontSize: '0.85rem' }}>07:00 AM</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-dark)' }}>Assembly at designated base point & Naturalist briefing.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 700, color: 'var(--color-forest-primary)', fontSize: '0.85rem' }}>07:30 AM</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-dark)' }}>Guided trail walk, biodiversity spotting & field documentation.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 700, color: 'var(--color-forest-primary)', fontSize: '0.85rem' }}>10:30 AM</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-dark)' }}>Checklist compilation, Q&A with BNHS scientists, and wrap up.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sticky Registration Card */}
        <div>
          <div
            style={{
              position: 'sticky',
              top: '90px',
              background: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border)',
              padding: '32px',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <CheckCircle2 size={18} color={isRegistrationAllowed ? 'var(--color-emerald)' : 'var(--color-text-muted)'} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isRegistrationAllowed ? 'var(--color-forest-primary)' : 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                {isRegistrationAllowed ? 'Registration Open' : activity.status}
              </span>
            </div>

            <h3 style={{ fontSize: '1.4rem', color: 'var(--color-forest-dark)', marginBottom: '8px' }}>
              {isAdmin ? 'Event Overview' : isRegistrationAllowed ? 'Reserve Your Spot' : 'Activity Status'}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
              {isAdmin
                ? 'Administrator mode. View event information and track participants from Organizer Dashboard.'
                : isRegistrationAllowed
                ? 'Naturalist-guided field group limited to ensure maximum observation quality.'
                : isFull
                ? 'This activity has reached maximum capacity.'
                : isCompleted
                ? 'This activity has concluded. Browse upcoming events in the catalog.'
                : 'This activity is currently not open for registration.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              <div><strong>Format:</strong> {(activity.type || 'Walk').toUpperCase()}</div>
              <div><strong>Location:</strong> {activity.location || 'Mumbai'}</div>
              <div><strong>Max Capacity:</strong> {activity.capacity || 30} participants</div>
              {activity.leader && <div><strong>Event Leader:</strong> {activity.leader}</div>}
              <div><strong>Certificates:</strong> Provided by BNHS on completion</div>
            </div>

            {isAdmin ? (
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  textAlign: 'center',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Shield size={18} color="#64748b" />
                <span>Admin View • Event Management</span>
              </div>
            ) : isRegistrationAllowed ? (
              <button
                onClick={() => setModalOpen(true)}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Register for Activity
              </button>
            ) : (
              <button
                disabled
                className="btn btn-secondary btn-lg"
                style={{ width: '100%', justifyContent: 'center', opacity: 0.6, cursor: 'not-allowed' }}
              >
                {isFull ? 'Capacity Full' : isCompleted ? 'Activity Completed' : 'Registration Closed'}
              </button>
            )}

            {/* Community Discussion Box */}
            <div
              style={{
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-forest-dark)' }}>
                <MessageSquare size={16} color="var(--color-emerald)" />
                Activity Community Chat
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>
                Join fellow registered participants to discuss sightings, ask questions, and share photos.
              </p>
              <Link
                to={`/community/activity/${encodeURIComponent(activity.id || activity._id || '')}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '9px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  textAlign: 'center',
                }}
              >
                <MessageSquare size={14} /> Join Activity Discussion
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Related Activities Section */}
      {relatedActivities.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--color-forest-dark)', marginBottom: '20px' }}>
            Related Activities You May Like
          </h2>
          <div className="cards-grid" style={{ marginTop: 0 }}>
            {relatedActivities.map((act) => (
              <ActivityCard
                key={act.id}
                activity={act}
                onRegisterClick={
                  isAdmin
                    ? undefined
                    : (a) => {
                        setActivity(a);
                        setModalOpen(true);
                      }
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Registration Modal (Members and Users only) */}
      {!isAdmin && (
        <RegistrationModal
          activity={activity}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};
