import React, { useEffect, useState } from 'react';
import { Shield, Users, CalendarCheck, Award, BarChart3, TrendingUp, Compass, CheckCircle2, Server, Database, Sparkles, Activity as ActivityIcon, AlertCircle } from 'lucide-react';
import { PlatformEngagementResponse, HealthStatus } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import api from '../services/api';

export const AdminPage: React.FC = () => {
  const [platformData, setPlatformData] = useState<PlatformEngagementResponse | null>(null);
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, healthRes] = await Promise.allSettled([
        api.getPlatformEngagement(),
        api.checkHealth(),
      ]);

      if (analyticsRes.status === 'fulfilled') {
        setPlatformData(analyticsRes.value);
      } else {
        throw analyticsRes.reason;
      }

      if (healthRes.status === 'fulfilled') {
        setHealthData(healthRes.value);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch platform organizer analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container" style={{ padding: '40px 24px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-emerald)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Organizer & Admin Panel
          </span>
          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--color-sage-light)', color: 'var(--color-forest-primary)', fontWeight: 600 }}>
            MERN Gateway Connected
          </span>
        </div>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--color-forest-dark)', marginBottom: '10px' }}>
          BNHS Admin Dashboard
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', maxWidth: '680px' }}>
          Platform engagement and conservation activity overview.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner message="Aggregating real-time platform statistics..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchData} />
      ) : platformData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Top KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="card stat-card" style={{ background: '#ffffff', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Total Users</span>
                <Users size={20} color="var(--color-emerald)" />
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-forest-dark)' }}>
                {platformData.total_users}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-forest-primary)', fontWeight: 600 }}>
                Active conservation members
              </span>
            </div>

            <div className="card stat-card" style={{ background: '#ffffff', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Total Registrations</span>
                <CalendarCheck size={20} color="var(--color-emerald)" />
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-forest-dark)' }}>
                {platformData.total_registrations}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                Walks & camps reserved
              </span>
            </div>

            <div className="card stat-card" style={{ background: '#ffffff', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Completed Participations</span>
                <Award size={20} color="var(--color-emerald)" />
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-forest-dark)' }}>
                {platformData.total_participations}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                Field attendances recorded
              </span>
            </div>

            <div className="card stat-card" style={{ background: '#ffffff', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Completion Rate</span>
                <TrendingUp size={20} color="var(--color-emerald)" />
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-forest-dark)' }}>
                {platformData.completion_rate}%
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-forest-primary)', fontWeight: 600 }}>
                Attendance to booking ratio
              </span>
            </div>
          </div>

          {/* SECTION 1 & 2: Engagement Overview & Popular Categories */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
            {/* SECTION 1 — Engagement Overview */}
            <div className="card" style={{ padding: '24px', background: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <BarChart3 size={22} color="var(--color-forest-primary)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-forest-dark)' }}>
                  SECTION 1 — Member Engagement Tiers
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {Object.entries(platformData.engagement_distribution || {}).map(([level, count]) => {
                  const levelColor =
                    level === 'VERY_HIGH'
                      ? 'var(--color-forest-dark)'
                      : level === 'HIGH'
                      ? 'var(--color-forest-primary)'
                      : level === 'MODERATE'
                      ? '#b45309'
                      : 'var(--color-text-muted)';
                  const bg =
                    level === 'VERY_HIGH' || level === 'HIGH'
                      ? 'var(--color-sage-light)'
                      : level === 'MODERATE'
                      ? 'var(--color-warning-bg)'
                      : 'var(--color-bg-alt)';

                  return (
                    <div key={level} style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: bg, border: '1px solid var(--color-border)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: levelColor }}>
                        {level.replace('_', ' ')}
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: levelColor, marginTop: '4px' }}>
                        {count} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>members</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                <CheckCircle2 size={16} color="var(--color-emerald)" />
                <span>Deterministic composite scoring: activity frequency + diversity + completion.</span>
              </div>
            </div>

            {/* SECTION 2 — Popular Activities */}
            <div className="card" style={{ padding: '24px', background: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Compass size={22} color="var(--color-forest-primary)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-forest-dark)' }}>
                  SECTION 2 — Popular Activity Domains
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {platformData.most_popular_categories.map((cat, idx) => {
                  const maxCount = platformData.most_popular_categories[0]?.participations || 1;
                  const pct = Math.round((cat.participations / maxCount) * 100);
                  return (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-forest-dark)' }}>
                          #{idx + 1} {cat.category}
                        </span>
                        <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{cat.participations} attendees</span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-emerald), var(--color-forest-primary))', borderRadius: '4px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 3 — Activity Format Breakdown */}
          {platformData.most_popular_activity_types && (
            <div className="card" style={{ padding: '24px', background: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <ActivityIcon size={22} color="var(--color-forest-primary)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-forest-dark)' }}>
                  SECTION 3 — Activity Format Distribution
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {platformData.most_popular_activity_types.map((typeObj, i) => (
                  <div key={i} style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                      Format: {typeObj.type}
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-forest-dark)', marginTop: '4px' }}>
                      {typeObj.participations} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>participations</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4 — Platform Health Status */}
          <div className="card" style={{ padding: '24px', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Server size={22} color="var(--color-forest-primary)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-forest-dark)' }}>
                SECTION 4 — Full-Stack Platform Service Health
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--color-sage-light)', border: '1px solid var(--color-emerald)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Server size={18} color="var(--color-forest-primary)" />
                  <span style={{ fontWeight: 700, color: 'var(--color-forest-dark)' }}>MERN Express Gateway</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-forest-primary)', fontWeight: 600 }}>
                  Operational (Port 3000)
                </div>
              </div>

              <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--color-sage-light)', border: '1px solid var(--color-emerald)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Server size={18} color="var(--color-forest-primary)" />
                  <span style={{ fontWeight: 700, color: 'var(--color-forest-dark)' }}>Python FastAPI Microservice</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-forest-primary)', fontWeight: 600 }}>
                  Operational (Port 8000)
                </div>
              </div>

              <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: healthData?.services?.mongodb === 'available' ? 'var(--color-sage-light)' : 'var(--color-warning-bg)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Database size={18} color="var(--color-forest-primary)" />
                  <span style={{ fontWeight: 700, color: 'var(--color-forest-dark)' }}>MongoDB Database</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-forest-dark)', fontWeight: 600 }}>
                  {healthData?.services?.mongodb === 'available' ? 'Operational (Connected)' : 'Unavailable'}
                </div>
              </div>

              <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: healthData?.services?.rag === 'available' ? 'var(--color-sage-light)' : 'var(--color-warning-bg)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Sparkles size={18} color="var(--color-forest-primary)" />
                  <span style={{ fontWeight: 700, color: 'var(--color-forest-dark)' }}>RAG & Recommendation</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-forest-dark)', fontWeight: 600 }}>
                  {healthData?.services?.rag === 'available' ? 'Operational (ChromaDB + LLM)' : 'Unavailable'}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
