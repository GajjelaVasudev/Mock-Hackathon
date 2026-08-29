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
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { RegistrationItem, ParticipationItem, Activity } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import api from '../services/api';

export const MyActivitiesPage: React.FC = () => {
  const { currentUser, refreshUserData } = useUser();
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
      <div style={{ marginBottom: '36px' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--color-forest-dark)', marginBottom: '8px' }}>
          My Activities & History
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>
          Track your registered nature walks, completed events, and record new participation to optimize your recommendation feed.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
        {/* Left Column: Registered Activities & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Section 1: Upcoming Registrations */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Calendar size={20} style={{ color: 'var(--color-emerald)' }} />
              <h3 style={{ fontSize: '1.3rem', color: 'var(--color-forest-dark)', margin: 0 }}>
                Upcoming Registrations ({registrations.length})
              </h3>
            </div>

            {loading ? (
              <LoadingSpinner message="Loading registrations..." />
            ) : registrations.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                No active activity registrations found.
                <div style={{ marginTop: '12px' }}>
                  <Link to="/activities" className="btn btn-primary btn-sm">Explore Activities</Link>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {registrations.map((reg) => (
                  <div key={reg.id} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-forest-dark)', fontSize: '1rem', marginBottom: '4px' }}>
                      {reg.activity_name || reg.activity_id}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      <span>Status: <strong style={{ color: 'var(--color-success)' }}>{reg.status}</strong></span>
                      {reg.created_at && <span>Booked: {reg.created_at.slice(0, 10)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Completed Participation History */}
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <CheckCircle2 size={20} style={{ color: 'var(--color-success)' }} />
              <h3 style={{ fontSize: '1.3rem', color: 'var(--color-forest-dark)', margin: 0 }}>
                Completed Participation History ({participation.length + (currentUser.previous_activities?.length || 0)})
              </h3>
            </div>

            {participation.length === 0 && (!currentUser.previous_activities || currentUser.previous_activities.length === 0) ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                You haven't recorded any completed activities yet. Use the form on the right to log your attendance!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Dynamically recorded participation */}
                {participation.map((p, idx) => (
                  <div key={p.id || idx} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-forest-dark)' }}>{p.activity_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Completed on: {p.date || 'Recorded'} • ID: {p.activity_id}
                    </div>
                  </div>
                ))}

                {/* Persona baseline attended activities */}
                {currentUser.previous_activities?.map((name, idx) => (
                  <div key={`prev_${idx}`} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-forest-dark)' }}>{name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Prior Attended Activity (Profile Baseline)
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Record New Participation Form */}
        <div>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <PlusCircle size={20} style={{ color: 'var(--color-mint-bright)' }} />
              <h3 style={{ fontSize: '1.25rem', color: 'var(--color-forest-dark)', margin: 0 }}>
                Record Completed Activity
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
              Logging past activities enables the recommendation engine's <strong>anti-repeat / novelty scoring</strong> to highlight fresh, unexplored walks and camps for you.
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
                <label className="filter-label">Field Notes / Experience</label>
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
                <div style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '16px' }}>
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
