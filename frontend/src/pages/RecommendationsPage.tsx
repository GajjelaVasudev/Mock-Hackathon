import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, SlidersHorizontal, RefreshCw, UserCheck, ArrowRight } from 'lucide-react';
import { Activity, Recommendation } from '../types';
import { RecommendationCard } from '../components/RecommendationCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { RegistrationModal } from '../components/RegistrationModal';
import { useUser, DEMO_PERSONAS } from '../context/UserContext';
import api from '../services/api';

export const RecommendationsPage: React.FC = () => {
  const { currentUser, activePersonaId, switchPersona } = useUser();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      // Send user_id or profile payload to POST /api/v1/recommend
      const res = await api.getRecommendations({
        user_id: currentUser.id,
        name: currentUser.name,
        location: currentUser.location,
        interests: currentUser.interests,
        experience_level: currentUser.experience_level,
        preferred_activity_type: currentUser.preferred_activity_type,
        previous_activities: currentUser.previous_activities,
      }, 5);

      setRecommendations(res.recommendations);
    } catch (err: any) {
      setError(err.message || 'Failed to generate recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [currentUser]);

  const handleRegisterFromRec = (rec: Recommendation) => {
    // Construct minimal Activity object for registration modal
    const act: Activity = {
      id: rec.activity_id || 'custom_rec',
      name: rec.activity,
      category: rec.category || 'Recommended Activity',
      location: rec.location || 'Maharashtra',
      interests: [],
      audience: [],
      description: rec.description || '',
      species: [],
      type: (rec.type as any) || 'walk',
      duration: rec.duration,
    };
    setSelectedActivity(act);
    setModalOpen(true);
  };

  return (
    <div className="container" style={{ padding: '40px 24px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: 'var(--color-sage-light)', color: 'var(--color-forest-primary)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
            <Sparkles size={14} />
            Content & Rule-Based Match
          </div>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--color-forest-dark)', marginBottom: '8px' }}>
            Recommended For You
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', maxWidth: '640px' }}>
            Tailored activities based on <strong>{currentUser.name}</strong>'s interests, location in {currentUser.location}, and {currentUser.experience_level} experience level.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchRecommendations} className="btn btn-secondary">
            <RefreshCw size={15} />
            Re-Score
          </button>
          <Link to="/profile" className="btn btn-primary">
            <SlidersHorizontal size={15} />
            Edit Profile
          </Link>
        </div>
      </div>

      {/* User Interests Pill Bar */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Active Profile Factors:
          </span>
          <span className="tag" style={{ background: 'var(--color-sage-light)', color: 'var(--color-forest-primary)', fontWeight: 600 }}>
            📍 {currentUser.location}
          </span>
          <span className="tag" style={{ background: 'var(--color-sage-light)', color: 'var(--color-forest-primary)', fontWeight: 600 }}>
            ⚡ {currentUser.experience_level}
          </span>
          {currentUser.interests.map((int, i) => (
            <span key={i} className="tag">
              #{int}
            </span>
          ))}
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Scoring weights: Interest (40%), Location (20%), Format (15%), Level (10%), Audience (10%), Novelty (5%)
        </div>
      </div>

      {/* Recommendations Content */}
      {loading ? (
        <LoadingSpinner message="Calculating multi-factor recommendation scores..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchRecommendations} />
      ) : recommendations.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={32} />}
          title="No Recommendations Available"
          description="We couldn't compute matches for your current profile. Update your interests or location to see matches."
          actionText="Edit Profile Interests"
          actionLink="/profile"
        />
      ) : (
        <div className="cards-grid" style={{ marginTop: 0 }}>
          {recommendations.map((rec, idx) => (
            <RecommendationCard
              key={idx}
              recommendation={rec}
              onRegisterClick={handleRegisterFromRec}
            />
          ))}
        </div>
      )}

      {/* Registration Modal */}
      <RegistrationModal
        activity={selectedActivity}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};
