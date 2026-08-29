import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Sparkles,
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
  X,
  MapPin,
  Clock,
  Shield,
  HeartHandshake,
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import {
  Recommendation,
  RegistrationItem,
  ParticipationItem,
  UserEngagementResponse,
  EventLeadInvitation,
  VolunteerEligibility,
  VolunteerRequest,
} from '../types';
import { RecommendationCard } from '../components/RecommendationCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { NatureAchievementsSection } from '../components/achievements/NatureAchievementsSection';
import api from '../services/api';

export const MemberDashboard: React.FC = () => {
  const { currentUser } = useUser();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [participation, setParticipation] = useState<ParticipationItem[]>([]);
  const [engagement, setEngagement] = useState<UserEngagementResponse | null>(null);
  const [invitations, setInvitations] = useState<EventLeadInvitation[]>([]);
  const [volEligibility, setVolEligibility] = useState<VolunteerEligibility | null>(null);
  const [volRequests, setVolRequests] = useState<VolunteerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchMemberData = async () => {
    setLoading(true);
    try {
      const [recRes, regRes, partRes, engRes, invRes, volEligRes, volReqsRes] = await Promise.allSettled([
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
        api.getMyInvitations(),
        api.getVolunteerEligibility(),
        api.getMyVolunteerRequests(),
      ]);

      if (recRes.status === 'fulfilled') setRecommendations(recRes.value.recommendations);
      if (regRes.status === 'fulfilled') setRegistrations(regRes.value);
      if (partRes.status === 'fulfilled') setParticipation(partRes.value.history || []);
      if (engRes.status === 'fulfilled') setEngagement(engRes.value);
      if (invRes.status === 'fulfilled') setInvitations(invRes.value.invitations || []);
      if (volEligRes.status === 'fulfilled') setVolEligibility(volEligRes.value);
      if (volReqsRes.status === 'fulfilled') setVolRequests(volReqsRes.value.requests || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberData();
  }, [currentUser.id]);

  const handleAccept = async (id: string) => {
    try {
      await api.acceptLeadInvitation(id);
      setActionMsg('Invitation accepted! You have been assigned as the event leader.');
      await fetchMemberData();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      alert(`Error accepting invitation: ${err.message}`);
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await api.declineLeadInvitation(id);
      setActionMsg('Invitation declined.');
      await fetchMemberData();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      alert(`Error declining invitation: ${err.message}`);
    }
  };

  const handleAcceptVolunteerReq = async (id: string) => {
    try {
      await api.userAcceptVolunteerRequest(id);
      setActionMsg('Volunteering invitation accepted! You are now an approved BNHS volunteer.');
      await fetchMemberData();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      alert(`Error accepting volunteering request: ${err.message}`);
    }
  };

  const handleDeclineVolunteerReq = async (id: string) => {
    try {
      await api.userDeclineVolunteerRequest(id);
      setActionMsg('Volunteering invitation declined.');
      await fetchMemberData();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      alert(`Error declining volunteering request: ${err.message}`);
    }
  };

  const pendingInvitations = invitations.filter((i) => i.status === 'pending');
  const acceptedInvitations = invitations.filter((i) => i.status === 'accepted');

  const pendingVolRequests = volRequests.filter((r) => r.type === 'admin_request' && r.status === 'pending');
  const userVolApplications = volRequests.filter((r) => r.type === 'user_application');
  const latestAcceptedVol = volRequests.find((r) => r.status === 'accepted');
  const latestPendingVol = userVolApplications.find((r) => r.status === 'pending');

  const summary = engagement?.summary;
  const score = summary?.engagement_score ?? 45;
  const level = summary?.engagement_level ?? 'MODERATE';

  const attendedEventsCount = volEligibility?.attendedEvents ?? participation.length;
  const isVolUnlocked = volEligibility?.eligible ?? attendedEventsCount > 5;
  const remainingToUnlock = Math.max(0, 6 - attendedEventsCount);
  const volProgressPercent = Math.min(100, Math.round((attendedEventsCount / 6) * 100));

  return (
    <div className="container" style={{ padding: '36px 20px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-emerald)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Nature Passport & Citizen Science
          </span>
        </div>
        <h1 style={{ fontSize: '2.4rem', color: 'var(--color-forest-dark)', margin: 0 }}>
          Welcome, {currentUser.name}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginTop: '6px' }}>
          Track your conservation score, field attendances, earned milestones, and event invitations.
        </p>
      </div>

      {actionMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'var(--color-sage-light)', color: 'var(--color-forest-dark)', borderRadius: 'var(--radius-md)', marginBottom: '24px', fontWeight: 600 }}>
          <CheckCircle2 size={18} color="var(--color-emerald)" />
          <span>{actionMsg}</span>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading your Nature Passport and engagement milestones..." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* SECTION: NATURE ACHIEVEMENTS & RECOGNITION */}
          <NatureAchievementsSection userName={currentUser.name} onRefreshParent={fetchMemberData} />

          {/* SECTION: PENDING EVENT LEAD INVITATIONS (IF ANY) */}
          {pendingInvitations.length > 0 && (
            <div
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, rgba(45, 106, 79, 0.08) 0%, rgba(82, 183, 136, 0.15) 100%)',
                border: '1.5px solid var(--color-emerald)',
                boxShadow: '0 4px 16px rgba(45, 106, 79, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-forest-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-forest-dark)', margin: 0 }}>
                    You're Invited to Lead a BNHS Event!
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-forest-primary)', margin: '2px 0 0', fontWeight: 600 }}>
                    Recognized for your active field participation and dedication to Indian biodiversity.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingInvitations.map((inv) => (
                  <div
                    key={inv._id}
                    style={{
                      background: '#ffffff',
                      borderRadius: 'var(--radius-lg)',
                      padding: '18px 20px',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-forest-dark)' }}>
                        {inv.eventTitle}
                      </div>
                      <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: '4px 0 8px', maxWidth: '560px' }}>
                        {inv.message}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {inv.eventLocation && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={13} /> {inv.eventLocation}
                          </span>
                        )}
                        {inv.eventDate && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={13} /> {inv.eventDate}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleAccept(inv._id)}
                        className="btn btn-primary"
                        style={{ padding: '8px 20px', fontSize: '0.88rem', fontWeight: 700 }}
                      >
                        <Check size={16} /> Accept Invitation
                      </button>
                      <button
                        onClick={() => handleDecline(inv._id)}
                        className="btn btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                      >
                        <X size={16} /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION: PENDING ADMIN VOLUNTEER REQUESTS */}
          {pendingVolRequests.length > 0 && (
            <div
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, rgba(82, 183, 136, 0.12) 0%, rgba(45, 106, 79, 0.06) 100%)',
                border: '1.5px solid var(--color-emerald)',
                boxShadow: '0 4px 16px rgba(45, 106, 79, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-emerald)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HeartHandshake size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-forest-dark)', margin: 0 }}>
                    New Volunteering Request from BNHS Admin!
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-forest-primary)', margin: '2px 0 0', fontWeight: 600 }}>
                    You have been specially selected to contribute as a BNHS-SEVA volunteer.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingVolRequests.map((req) => (
                  <div
                    key={req._id}
                    style={{
                      background: '#ffffff',
                      borderRadius: 'var(--radius-lg)',
                      padding: '18px 20px',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-forest-dark)' }}>
                        {req.opportunityTitle}
                      </div>
                      <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: '4px 0 8px', maxWidth: '560px' }}>
                        "{req.message}"
                      </p>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        Location: {req.opportunityLocation || 'BNHS Mumbai'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleAcceptVolunteerReq(req._id)}
                        className="btn btn-primary"
                        style={{ padding: '8px 20px', fontSize: '0.88rem', fontWeight: 700 }}
                      >
                        <Check size={16} /> Accept
                      </button>
                      <button
                        onClick={() => handleDeclineVolunteerReq(req._id)}
                        className="btn btn-secondary"
                        style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                      >
                        <X size={16} /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Leadership Badges if accepted */}
          {acceptedInvitations.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 18px', background: 'var(--color-sage-light)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-emerald)' }}>
              <Sparkles size={18} color="var(--color-forest-primary)" />
              <span style={{ fontSize: '0.9rem', color: 'var(--color-forest-dark)', fontWeight: 600 }}>
                Official BNHS Event Leader for: <strong>{acceptedInvitations.map((i) => i.eventTitle).join(', ')}</strong>
              </span>
            </div>
          )}

          {/* SECTION: VOLUNTEER STATUS CARD (Requirement 14) */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border)',
              padding: '24px 28px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-emerald)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  Volunteer Status
                </div>
                {latestAcceptedVol ? (
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-forest-dark)', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={20} color="var(--color-emerald)" />
                      Approved BNHS Volunteer
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: 0 }}>
                      Opportunity: <strong>{latestAcceptedVol.opportunityTitle}</strong>
                    </p>
                  </div>
                ) : latestPendingVol ? (
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-forest-dark)', margin: '0 0 4px' }}>
                      Volunteer Application Submitted
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: 0 }}>
                      <strong>{latestPendingVol.opportunityTitle}</strong> — Status: <span style={{ color: '#b45309', fontWeight: 700 }}>Pending Admin Review</span>
                    </p>
                  </div>
                ) : isVolUnlocked ? (
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-forest-dark)', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={20} color="var(--color-emerald)" />
                      Volunteering Unlocked
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: 0 }}>
                      You have participated in <strong>{attendedEventsCount} BNHS activities</strong>. You can now apply for volunteer opportunities.
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-forest-dark)', margin: '0 0 4px' }}>
                      Not Unlocked Yet ({attendedEventsCount} / 6 Activities Completed)
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: 0 }}>
                      Attend <strong>{remainingToUnlock} more {remainingToUnlock === 1 ? 'activity' : 'activities'}</strong> to unlock BNHS volunteering opportunities.
                    </p>
                  </div>
                )}
              </div>

              <div>
                {isVolUnlocked ? (
                  <Link to="/volunteer" className="btn btn-primary btn-sm">
                    Explore Opportunities &rarr;
                  </Link>
                ) : (
                  <Link to="/activities" className="btn btn-secondary btn-sm">
                    Explore Activities &rarr;
                  </Link>
                )}
              </div>
            </div>

            {/* Progress bar for locked status */}
            {!isVolUnlocked && !latestAcceptedVol && (
              <div style={{ marginTop: '16px', maxWidth: '420px' }}>
                <div style={{ height: '8px', background: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${volProgressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-emerald), var(--color-mint-bright))' }} />
                </div>
              </div>
            )}
          </div>

          {/* Top Score & Metric Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {/* Engagement Score */}
            <div className="card stat-card" style={{ background: '#ffffff', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Engagement Score</span>
                <Sparkles size={18} color="var(--color-emerald)" />
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--color-forest-dark)' }}>
                {score} <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>/ 100</span>
              </div>
              <div style={{ marginTop: '8px', width: '100%', height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${score}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-emerald), var(--color-forest-primary))' }} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-forest-primary)', display: 'block', marginTop: '6px', textTransform: 'uppercase' }}>
                Tier: {level}
              </span>
            </div>

            {/* Activities Attended */}
            <div className="card stat-card" style={{ background: '#ffffff', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Activities Attended</span>
                <Award size={18} color="var(--color-emerald)" />
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--color-forest-dark)' }}>
                {participation.length}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-forest-primary)', fontWeight: 600 }}>
                {participation.length >= 5 ? '✓ Eligible for Event Leadership' : `${5 - participation.length} more to unlock Leadership`}
              </span>
            </div>

            {/* Total Registrations */}
            <div className="card stat-card" style={{ background: '#ffffff', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Total Registrations</span>
                <Calendar size={18} color="var(--color-emerald)" />
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--color-forest-dark)' }}>
                {registrations.length}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Walks, camps & workshops booked
              </span>
            </div>

            {/* Completion Rate */}
            <div className="card stat-card" style={{ background: '#ffffff', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Completion Rate</span>
                <TrendingUp size={18} color="var(--color-emerald)" />
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--color-forest-dark)' }}>
                {summary?.completion_rate ?? 100}%
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-forest-primary)', fontWeight: 600 }}>
                Field attendance consistency
              </span>
            </div>
          </div>

          {/* Milestones & Badges */}
          <div className="card" style={{ padding: '24px', background: '#ffffff' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-forest-dark)', marginBottom: '16px' }}>
              Nature Milestones & Badges
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--color-sage-light)', border: '1px solid var(--color-emerald-light)' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>🦅</div>
                <div style={{ fontWeight: 700, color: 'var(--color-forest-dark)', fontSize: '0.9rem' }}>Field Naturalist</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Completed 3+ nature walks</div>
              </div>

              <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--color-sage-light)', border: '1px solid var(--color-emerald-light)' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>🌊</div>
                <div style={{ fontWeight: 700, color: 'var(--color-forest-dark)', fontSize: '0.9rem' }}>Wetland Explorer</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Attended flamingo & coastal trails</div>
              </div>

              <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--color-sage-light)', border: '1px solid var(--color-emerald-light)' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>🌳</div>
                <div style={{ fontWeight: 700, color: 'var(--color-forest-dark)', fontSize: '0.9rem' }}>Tree Scout</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Botanical tree walk completed</div>
              </div>

              <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: participation.length >= 5 ? 'var(--color-sage-light)' : 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>⭐</div>
                <div style={{ fontWeight: 700, color: 'var(--color-forest-dark)', fontSize: '0.9rem' }}>Event Leader Qualified</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {participation.length >= 5 ? 'Unlocked! Ready to lead events' : 'Attend 5+ events to unlock'}
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations Preview */}
          {recommendations.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--color-emerald)" />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-forest-dark)', margin: 0 }}>
                    Recommended for Your Nature Profile
                  </h3>
                </div>
                <Link to="/recommendations" style={{ fontSize: '0.85rem', color: 'var(--color-forest-primary)', fontWeight: 700, textDecoration: 'none' }}>
                  View All &rarr;
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                {recommendations.map((rec, idx) => (
                  <RecommendationCard
                    key={idx}
                    recommendation={rec}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
