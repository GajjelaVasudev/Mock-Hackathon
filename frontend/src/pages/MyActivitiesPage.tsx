import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Clock,
  PlusCircle,
  MapPin,
  FileCheck,
  Sparkles,
  Compass,
  MessageSquare,
  Camera,
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { RegistrationItem, ParticipationItem, Activity } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import api from '../services/api';

export const MyActivitiesPage: React.FC = () => {
  const { currentUser, refreshUserData } = useUser();
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'COMPLETED' | 'ALL'>('UPCOMING');
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [participation, setParticipation] = useState<ParticipationItem[]>([]);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // New Participation Form State
  const [selectedActId, setSelectedActId] = useState('');
  const [partDate, setPartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [regRes, partRes, actsRes] = await Promise.allSettled([
        api.getUserRegistrations(currentUser.id),
        api.getUserParticipation(currentUser.id),
        api.getActivities(),
      ]);

      if (regRes.status === 'fulfilled') setRegistrations(regRes.value);
      if (partRes.status === 'fulfilled') setParticipation(partRes.value.history);
      if (actsRes.status === 'fulfilled') setAllActivities(actsRes.value.activities);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleRecordParticipation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActId) return;

    setIsRecording(true);
    setSuccessMsg(null);
    try {
      const actObj = allActivities.find((a) => a.id === selectedActId);
      await api.recordParticipation(currentUser.id, {
        activity_id: selectedActId,
        activity_name: actObj ? actObj.name : selectedActId,
        date: partDate,
        notes: notes,
      });

      setSuccessMsg(`Recorded participation in "${actObj ? actObj.name : selectedActId}". Anti-repeat scoring updated!`);
      setSelectedActId('');
      setNotes('');
      await loadData();
      await refreshUserData();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(`Failed to record participation: ${err.message}`);
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 24px 80px' }}>
      <div style={{ marginBottom: '32px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-emerald)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Personal Itinerary
        </span>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--color-forest-dark)', marginBottom: '8px' }}>
          My Activities & History
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>
          Track registered nature walks, completed events, and record new attendance to refine your recommendation feed.
        </p>
      </div>

      {/* Tabs Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('UPCOMING')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            background: activeTab === 'UPCOMING' ? 'var(--color-forest-primary)' : 'transparent',
            color: activeTab === 'UPCOMING' ? '#ffffff' : 'var(--color-text-main)',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
          }}
        >
          Upcoming ({registrations.length})
        </button>
        <button
          onClick={() => setActiveTab('COMPLETED')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            background: activeTab === 'COMPLETED' ? 'var(--color-forest-primary)' : 'transparent',
            color: activeTab === 'COMPLETED' ? '#ffffff' : 'var(--color-text-main)',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
          }}
        >
          Completed ({participation.length + (currentUser.previous_activities?.length || 0)})
        </button>
        <button
          onClick={() => setActiveTab('ALL')}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            background: activeTab === 'ALL' ? 'var(--color-forest-primary)' : 'transparent',
            color: activeTab === 'ALL' ? '#ffffff' : 'var(--color-text-main)',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
          }}
        >
          All Activity Log
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
        {/* Left Column: List Based on Active Tab */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {loading ? (
            <LoadingSpinner message="Loading activity history..." />
          ) : (
            <>
              {/* Upcoming View */}
              {(activeTab === 'UPCOMING' || activeTab === 'ALL') && (
                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <Calendar size={20} style={{ color: 'var(--color-emerald)' }} />
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--color-forest-dark)', margin: 0 }}>
                      Upcoming Registrations ({registrations.length})
                    </h3>
                  </div>

                  {registrations.length === 0 ? (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>
                      <p style={{ marginBottom: '12px' }}>You haven't joined an activity yet.</p>
                      <Link to="/activities" className="btn btn-primary btn-sm">
                        <Compass size={14} /> Explore Activities
                      </Link>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {registrations.map((reg) => (
                        <div key={reg.id} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-forest-dark)', fontSize: '1rem', marginBottom: '4px' }}>
                            {reg.activity_name || reg.activity_id}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)', flexWrap: 'wrap', gap: '8px' }}>
                            <span>Status: <strong style={{ color: 'var(--color-forest-primary)' }}>{reg.status}</strong> {reg.created_at ? `• Booked ${reg.created_at.slice(0, 10)}` : ''}</span>
                            <Link
                              to={`/community/activity/${encodeURIComponent(reg.activity_id)}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                color: '#047857',
                                backgroundColor: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                textDecoration: 'none',
                              }}
                            >
                              <MessageSquare size={12} /> Group Chat
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Completed View */}
              {(activeTab === 'COMPLETED' || activeTab === 'ALL') && (
                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <CheckCircle2 size={20} style={{ color: 'var(--color-success)' }} />
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--color-forest-dark)', margin: 0 }}>
                      Completed Participation History ({participation.length + (currentUser.previous_activities?.length || 0)})
                    </h3>
                  </div>

                  {participation.length === 0 && (!currentUser.previous_activities || currentUser.previous_activities.length === 0) ? (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>
                      No completed activities recorded yet. Use the form on the right to log your past attendance!
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {participation.map((p, idx) => (
                        <div key={p.id || idx} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ fontWeight: 700, color: 'var(--color-forest-dark)' }}>{p.activity_name}</div>
                            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-sage-light)', color: 'var(--color-forest-primary)', fontWeight: 700 }}>
                              Attended
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <span>Completed on: {p.date || 'Recorded'} • ID: {p.activity_id}</span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <Link
                                to="/community"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  color: '#065f46',
                                  backgroundColor: '#f0fdf4',
                                  border: '1px solid #bbf7d0',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  textDecoration: 'none',
                                }}
                              >
                                <Camera size={12} /> Share Experience
                              </Link>
                              <Link
                                to={`/community/activity/${encodeURIComponent(p.activity_id)}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  color: '#047857',
                                  backgroundColor: '#ecfdf5',
                                  border: '1px solid #a7f3d0',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  textDecoration: 'none',
                                }}
                              >
                                <MessageSquare size={12} /> Group Chat
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}

                      {currentUser.previous_activities?.map((name, idx) => (
                        <div key={`prev_${idx}`} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ fontWeight: 700, color: 'var(--color-forest-dark)' }}>{name}</div>
                            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-sage-light)', color: 'var(--color-forest-primary)', fontWeight: 700 }}>
                              Profile Baseline
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            Prior Attended Activity (Profile Baseline)
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column: Record New Participation Form */}
        <div>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <PlusCircle size={20} style={{ color: 'var(--color-emerald)' }} />
              <h3 style={{ fontSize: '1.25rem', color: 'var(--color-forest-dark)', margin: 0 }}>
                Record Completed Activity
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
              Logging completed activities feeds your <strong>Nature Passport milestone score</strong> and updates recommendation novelty.
            </p>

            <form onSubmit={handleRecordParticipation}>
              <div style={{ marginBottom: '16px' }}>
                <label className="filter-label">Select Completed Activity</label>
                <select
                  required
                  value={selectedActId}
                  onChange={(e) => setSelectedActId(e.target.value)}
                  className="filter-select"
                >
                  <option value="">-- Choose BNHS Activity --</option>
                  {allActivities.map((act) => (
                    <option key={act.id} value={act.id}>
                      {act.name} ({act.location})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="filter-label">Date Completed</label>
                <input
                  type="date"
                  value={partDate}
                  onChange={(e) => setPartDate(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="filter-label">Field Notes / Observations</label>
                <textarea
                  rows={3}
                  placeholder="Optional observation notes or species spotted..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="filter-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {successMsg && (
                <div style={{ background: 'var(--color-sage-light)', color: 'var(--color-forest-dark)', border: '1px solid var(--color-emerald)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '16px' }}>
                  ✓ {successMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isRecording || !selectedActId}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {isRecording ? 'Recording in MongoDB...' : 'Log Activity in History'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
