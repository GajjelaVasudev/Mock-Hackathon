import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  MessageSquareText,
  Calendar,
  CheckCircle2,
  ArrowRight,
  User,
  Activity as ActivityIcon,
  TrendingUp,
  Award,
  BarChart3,
  Lightbulb,
  Check,
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import {
  Recommendation,
  RegistrationItem,
  ParticipationItem,
  UserEngagementResponse,
} from '../types';
import { RecommendationCard } from '../components/RecommendationCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import api from '../services/api';

export const DashboardPage: React.FC = () => {
  const { currentUser } = useUser();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [participation, setParticipation] = useState<ParticipationItem[]>([]);
  const [engagement, setEngagement] = useState<UserEngagementResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [recRes, regRes, partRes, engRes] = await Promise.allSettled([
          api.getRecommendations(
            {
              user_id: currentUser.id,
              name: currentUser.name,
              location: currentUser.location,
              interests: currentUser.interests,
              experience_level: currentUser.experience_level,
              preferred_activity_type: currentUser.preferred_activity_type,
              previous_activities: currentUser.previous_activities,
            },
            3
          ),
          api.getUserRegistrations(currentUser.id),
          api.getUserParticipation(currentUser.id),
          api.getUserEngagement(currentUser.id),
        ]);

        if (recRes.status === 'fulfilled') setRecommendations(recRes.value.recommendations);
        if (regRes.status === 'fulfilled') setRegistrations(regRes.value);
        if (partRes.status === 'fulfilled') setParticipation(partRes.value.history);
        if (engRes.status === 'fulfilled') setEngagement(engRes.value);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [currentUser]);

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'VERY_HIGH':
        return { bg: '#ecfdf5', text: '#065f46', border: '#10b981' };
      case 'HIGH':
        return { bg: '#eff6ff', text: '#1e40af', border: '#3b82f6' };
      case 'MODERATE':
        return { bg: '#fffbeb', text: '#92400e', border: '#f59e0b' };
      default:
        return { bg: '#f3f4f6', text: '#4b5563', border: '#9ca3af' };
    }
  };

  const levelStyles = engagement
    ? getLevelBadgeColor(engagement.summary.engagement_level)
    : { bg: '#ecfdf5', text: '#065f46', border: '#10b981' };

  return (
    <div className="container" style={{ padding: '40px 24px 80px' }}>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--color-forest-primary), var(--color-emerald))',
          borderRadius: 'var(--radius-xl)',
          padding: '36px 40px',
          color: '#fff',
          marginBottom: '36px',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              padding: '4px 12px',
              background: 'rgba(255,255,255,0.12)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--color-sage-light)',
              marginBottom: '10px',
            }}
          >
            Active Member Profile: {currentUser.age_group} • {currentUser.experience_level}
          </div>
          <h1 style={{ fontSize: '2.4rem', color: '#fff', marginBottom: '8px' }}>
            Welcome, {currentUser.name}!
          </h1>
          <p style={{ color: 'var(--color-text-light)', fontSize: '1rem', maxWidth: '520px' }}>
            Explore personalized nature walks, herpetology field camps, and track your ongoing BNHS participation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/assistant" className="btn btn-accent">
            <MessageSquareText size={18} />
            Ask Assistant
          </Link>
          <Link to="/profile" className="btn btn-secondary" style={{ background: '#fff', color: 'var(--color-forest-dark)' }}>
            <User size={18} />
            Edit Interests
          </Link>
        </div>
      </div>

      {/* Engagement Analytics & Nature Journey Module */}
      {engagement && (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '32px',
            marginBottom: '40px',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <ActivityIcon size={20} style={{ color: 'var(--color-emerald)' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-forest-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Nature Engagement Analysis
                </span>
              </div>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--color-forest-dark)', margin: 0 }}>
                Your Conservation & Activity Passport
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  backgroundColor: levelStyles.bg,
                  color: levelStyles.text,
                  border: `1.5px solid ${levelStyles.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Award size={15} />
                Level: {engagement.summary.engagement_level.replace('_', ' ')}
              </div>
              <div
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--color-sage-light)',
                  color: 'var(--color-forest-primary)',
                }}
              >
                🌱 {engagement.journey.current_stage}
              </div>
            </div>
          </div>

          {/* Metric Highlights Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {/* Score */}
            <div style={{ background: 'var(--color-bg)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                Engagement Score
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-forest-dark)', lineHeight: 1 }}>
                {engagement.summary.engagement_score} <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>/ 100</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
                <div style={{ width: `${engagement.summary.engagement_score}%`, height: '100%', backgroundColor: 'var(--color-emerald)', borderRadius: '3px' }} />
              </div>
            </div>

            {/* Participations */}
            <div style={{ background: 'var(--color-bg)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                Activities Completed
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-forest-dark)', lineHeight: 1 }}>
                {engagement.summary.total_participations}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                {engagement.summary.total_registrations} upcoming registrations
              </div>
            </div>

            {/* Completion Rate */}
            <div style={{ background: 'var(--color-bg)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                Completion Rate
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-forest-dark)', lineHeight: 1 }}>
                {engagement.summary.completion_rate}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-emerald)', marginTop: '8px', fontWeight: 600 }}>
                Registration to attendance
              </div>
            </div>

            {/* Trend */}
            <div style={{ background: 'var(--color-bg)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                Participation Trend
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-forest-dark)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                {engagement.summary.engagement_trend === 'INCREASING' && '📈 Increasing'}
                {engagement.summary.engagement_trend === 'STABLE' && '📊 Stable'}
                {engagement.summary.engagement_trend === 'DECREASING' && '📉 Decreasing'}
                {engagement.summary.engagement_trend === 'INSUFFICIENT_DATA' && '⏳ Insufficient Data'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                Activity frequency trend
              </div>
            </div>
          </div>

          {/* Breakdown & Insights */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Category Distribution Breakdown */}
            <div style={{ background: 'var(--color-bg)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
              <h4 style={{ fontSize: '1.1rem', color: 'var(--color-forest-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={18} style={{ color: 'var(--color-forest-primary)' }} />
                Activity Category Distribution
              </h4>

              {engagement.category_distribution.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  No category history yet. Complete a walk or camp to see your distribution breakdown!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {engagement.category_distribution.map((cat, idx) => (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-forest-dark)' }}>{cat.category}</span>
                        <span style={{ color: 'var(--color-text-muted)' }}>{cat.count} acts ({cat.percentage}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${cat.percentage}%`, height: '100%', backgroundColor: idx === 0 ? 'var(--color-emerald)' : 'var(--color-mint)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Explainable Insights */}
            <div style={{ background: 'var(--color-bg)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
              <h4 style={{ fontSize: '1.1rem', color: 'var(--color-forest-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lightbulb size={18} style={{ color: '#d97706' }} />
                Explainable Engagement Insights
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {engagement.insights.map((insight, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--color-text-dark)' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'var(--color-sage-light)', color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Check size={12} />
                    </div>
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Preview Grid */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--color-forest-dark)' }}>
              Top Recommendations for You
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              Based on your location in {currentUser.location} and interest tags.
            </p>
          </div>
          <Link to="/recommendations" className="btn btn-secondary btn-sm">
            View All Recommendations <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading recommendations..." />
        ) : (
          <div className="cards-grid" style={{ marginTop: 0 }}>
            {recommendations.slice(0, 3).map((rec, idx) => (
              <RecommendationCard key={idx} recommendation={rec} />
            ))}
          </div>
        )}
      </div>

      {/* Registrations & Participation Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
        {/* Registrations */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-forest-dark)' }}>Upcoming Registrations</h3>
            <Link to="/my-activities" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Manage</Link>
          </div>

          {registrations.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              No upcoming activity registrations yet. Explore our walks and camps to book your spot!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {registrations.map((reg) => (
                <div key={reg.id} style={{ background: 'var(--color-bg)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-forest-dark)', fontSize: '0.95rem' }}>
                    {reg.activity_name || reg.activity_id}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-emerald)', fontWeight: 600, marginTop: '2px' }}>
                    Status: {reg.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Assistant Prompts */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '28px' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--color-forest-dark)', marginBottom: '14px' }}>
            AI Assistant Quick Inquiries
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '18px' }}>
            Ask questions backed by the BNHS archival knowledge base:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link to="/assistant" className="quick-prompt-btn" style={{ textAlign: 'left', display: 'block' }}>
              💬 What is BNHS-SEVA and how can I volunteer?
            </Link>
            <Link to="/assistant" className="quick-prompt-btn" style={{ textAlign: 'left', display: 'block' }}>
              💬 What is the Matheran Herpetofauna Camp?
            </Link>
            <Link to="/assistant" className="quick-prompt-btn" style={{ textAlign: 'left', display: 'block' }}>
              💬 What conservation work does BNHS do for vultures?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
