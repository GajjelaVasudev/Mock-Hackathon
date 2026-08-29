import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartHandshake,
  BookOpen,
  Binary,
  TreeDeciduous,
  Shield,
  MessageSquareText,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  Briefcase,
  AlertCircle,
  Lock,
  UserCheck,
  Send,
  XCircle,
  Check,
  RefreshCw,
  Users,
  Compass,
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import {
  VolunteerOpportunity,
  VolunteerEligibility,
  VolunteerRequest,
  AdminEligibleVolunteer,
} from '../types';
import api from '../services/api';
import { ApplyVolunteerModal } from '../components/ApplyVolunteerModal';
import { AdminVolunteerRequestModal } from '../components/AdminVolunteerRequestModal';

export const VolunteerPage: React.FC = () => {
  const { currentUser } = useUser();
  const role = currentUser?.role || 'user';
  const isAdmin = role === 'admin';
  const isStaff = role === 'staff';
  const isRegularUser = !isAdmin && !isStaff;

  // Data states
  const [eligibility, setEligibility] = useState<VolunteerEligibility | null>(null);
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [myRequests, setMyRequests] = useState<VolunteerRequest[]>([]);
  const [adminEligibleUsers, setAdminEligibleUsers] = useState<AdminEligibleVolunteer[]>([]);
  const [adminRequests, setAdminRequests] = useState<VolunteerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal states
  const [selectedOpportunity, setSelectedOpportunity] = useState<VolunteerOpportunity | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<AdminEligibleVolunteer | null>(null);
  const [isAdminRequestModalOpen, setIsAdminRequestModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Opportunities
      const oppRes = await api.getVolunteerOpportunities();
      setOpportunities(oppRes.opportunities || []);

      // 2. Role-specific fetches
      if (isAdmin) {
        const [eligibleRes, reqsRes] = await Promise.all([
          api.getAdminEligibleVolunteers(),
          api.getAdminVolunteerRequests(),
        ]);
        setAdminEligibleUsers(eligibleRes.eligibleUsers || []);
        setAdminRequests(reqsRes.requests || []);
      } else {
        const [eligRes, myReqsRes] = await Promise.all([
          api.getVolunteerEligibility(),
          api.getMyVolunteerRequests(),
        ]);
        setEligibility(eligRes);
        setMyRequests(myReqsRes.requests || []);
      }
    } catch (err: any) {
      console.error('Failed to load volunteer data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser?.id, role]);

  const handleApplyClick = (opp: VolunteerOpportunity) => {
    setSelectedOpportunity(opp);
    setIsApplyModalOpen(true);
  };

  const handleAdminRequestClick = (candidate: AdminEligibleVolunteer) => {
    setSelectedCandidate(candidate);
    setIsAdminRequestModalOpen(true);
  };

  const handleUserAcceptRequest = async (requestId: string) => {
    try {
      await api.userAcceptVolunteerRequest(requestId);
      setActionSuccess('Volunteering invitation accepted! Welcome to the team.');
      fetchData();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to accept invitation.');
    }
  };

  const handleUserDeclineRequest = async (requestId: string) => {
    try {
      await api.userDeclineVolunteerRequest(requestId);
      setActionSuccess('Volunteering invitation declined.');
      fetchData();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to decline invitation.');
    }
  };

  const handleAdminAccept = async (requestId: string) => {
    try {
      await api.adminAcceptVolunteerRequest(requestId);
      setActionSuccess('Volunteer application approved.');
      fetchData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to approve application.');
    }
  };

  const handleAdminDecline = async (requestId: string) => {
    try {
      await api.adminDeclineVolunteerRequest(requestId);
      setActionSuccess('Volunteer application declined.');
      fetchData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to decline application.');
    }
  };

  // Compute user eligibility flags
  const attendedCount = eligibility?.attendedEvents ?? 0;
  const isUserEligible = isStaff || (eligibility?.eligible ?? attendedCount > 5);
  const remainingCount = Math.max(0, 6 - attendedCount);
  const progressPercent = Math.min(100, Math.round((attendedCount / 6) * 100));

  // Find incoming admin invitations for the user
  const pendingAdminInvites = myRequests.filter(
    (r) => r.type === 'admin_request' && r.status === 'pending'
  );
  const activeApplications = myRequests.filter((r) => r.type === 'user_application');

  return (
    <div className="container" style={{ padding: '36px 24px 80px', maxWidth: '1120px' }}>
      {/* Top Banner Message */}
      {actionSuccess && (
        <div
          style={{
            padding: '14px 20px',
            background: 'var(--color-sage-light)',
            border: '1px solid var(--color-emerald)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-forest-dark)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '28px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <CheckCircle2 size={20} color="var(--color-emerald)" />
          <span style={{ fontWeight: 600 }}>{actionSuccess}</span>
        </div>
      )}

      {/* Hero Header */}
      <div style={{ maxWidth: '840px', margin: '0 auto 40px', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            background: '#fef3c7',
            color: '#92400e',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            marginBottom: '14px',
          }}
        >
          <HeartHandshake size={15} />
          BNHS-SEVA Volunteer Programme
        </div>
        <h1 style={{ fontSize: '2.6rem', color: 'var(--color-forest-dark)', marginBottom: '14px', fontWeight: 800 }}>
          {isAdmin
            ? 'Volunteer & Member Candidate Management'
            : isStaff
            ? 'Staff Volunteering Portal'
            : 'Make an Impact Beyond the Experience'}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', lineHeight: 1.6, margin: 0 }}>
          {isAdmin
            ? 'Review volunteer applications and invite qualified members (>5 attended activities) to contribute as BNHS-SEVA volunteers.'
            : isStaff
            ? 'Authorized BNHS personnel can apply directly to coordinate and volunteer for active conservation programs.'
            : 'BNHS-SEVA matches member passion with field research, bird-ringing digitisation, and biodiversity habitat restoration.'}
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 1. ADMIN ROLE VIEW                                                        */}
      {/* ========================================================================= */}
      {isAdmin && (
        <div>
          {/* Section A: Eligible Members for Volunteering */}
          <div style={{ marginBottom: '44px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.45rem', color: 'var(--color-forest-dark)', margin: 0, fontWeight: 700 }}>
                  Volunteer Eligible Members
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                  Members with strictly <strong>&gt; 5 attended activities</strong> in MongoDB participation records ({adminEligibleUsers.length} qualified).
                </p>
              </div>
              <button
                onClick={fetchData}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Loading eligible volunteer candidates from database...
              </div>
            ) : adminEligibleUsers.length === 0 ? (
              <div
                style={{
                  padding: '36px',
                  background: '#ffffff',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px dashed var(--color-border)',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                }}
              >
                No users currently meet the &gt;5 attended activities threshold.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {adminEligibleUsers.map((candidate) => (
                  <div
                    key={candidate.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-xl)',
                      padding: '24px',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <h3 style={{ fontSize: '1.2rem', color: 'var(--color-forest-dark)', margin: 0, fontWeight: 700 }}>
                            {candidate.name}
                          </h3>
                          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                            {candidate.email}
                          </div>
                        </div>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--color-sage-light)',
                            color: 'var(--color-forest-dark)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle2 size={13} color="var(--color-emerald)" />
                          {candidate.attendedEvents} events attended
                        </span>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Interests & Focus:
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {candidate.interests?.map((tag, i) => (
                            <span key={i} className="tag" style={{ fontSize: '0.75rem' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAdminRequestClick(candidate)}
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      Request for Volunteering
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section B: Admin Review of Incoming Applications & Requests */}
          <div style={{ marginTop: '48px' }}>
            <h2 style={{ fontSize: '1.45rem', color: 'var(--color-forest-dark)', marginBottom: '8px', fontWeight: 700 }}>
              Volunteer Requests & Applications
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '20px' }}>
              Review member applications and outgoing volunteer invitations.
            </p>

            {adminRequests.length === 0 ? (
              <div
                style={{
                  padding: '36px',
                  background: '#ffffff',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px dashed var(--color-border)',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                }}
              >
                No volunteer applications or requests recorded yet.
              </div>
            ) : (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--color-border)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)' }}>
                        <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--color-forest-dark)' }}>Candidate</th>
                        <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--color-forest-dark)' }}>Opportunity</th>
                        <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--color-forest-dark)' }}>Type</th>
                        <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--color-forest-dark)' }}>Attended</th>
                        <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--color-forest-dark)' }}>Status</th>
                        <th style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--color-forest-dark)', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminRequests.map((req) => (
                        <tr key={req._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--color-forest-dark)' }}>{req.userName || req.userId}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{req.userEmail}</div>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 600 }}>{req.opportunityTitle}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{req.opportunityLocation}</div>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-full)',
                                background: req.type === 'user_application' ? '#e0f2fe' : '#fef3c7',
                                color: req.type === 'user_application' ? '#0369a1' : '#92400e',
                                fontWeight: 600,
                              }}
                            >
                              {req.type === 'user_application' ? 'User Application' : 'Admin Request'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-emerald)' }}>
                              {req.attendedEvents || 6} events
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-full)',
                                background:
                                  req.status === 'accepted'
                                    ? 'var(--color-sage-light)'
                                    : req.status === 'declined'
                                    ? '#fee2e2'
                                    : '#fef3c7',
                                color:
                                  req.status === 'accepted'
                                    ? 'var(--color-forest-dark)'
                                    : req.status === 'declined'
                                    ? '#991b1b'
                                    : '#92400e',
                                fontWeight: 700,
                                textTransform: 'capitalize',
                              }}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            {req.status === 'pending' && req.type === 'user_application' ? (
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => handleAdminAccept(req._id)}
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleAdminDecline(req._id)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                >
                                  Decline
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. USER (NOT ELIGIBLE: <= 5 ATTENDED EVENTS)                               */}
      {/* ========================================================================= */}
      {isRegularUser && !isUserEligible && !loading && (
        <div>
          {/* Progress & Lock Card */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '40px 32px',
              maxWidth: '680px',
              margin: '0 auto 48px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-sage-light)',
                color: 'var(--color-forest-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <Lock size={26} />
            </div>

            <h2 style={{ fontSize: '1.75rem', color: 'var(--color-forest-dark)', marginBottom: '10px', fontWeight: 800 }}>
              Become a BNHS Volunteer
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.98rem', lineHeight: 1.6, marginBottom: '24px' }}>
              You can unlock volunteering opportunities by participating in more BNHS activities.
            </p>

            {/* Progress Bar Display */}
            <div style={{ background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-forest-dark)' }}>
                  Your Progress:
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-forest-primary)' }}>
                  {attendedCount} / 6 events
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div
                style={{
                  height: '12px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-border)',
                  overflow: 'hidden',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    background: 'linear-gradient(90deg, var(--color-emerald) 0%, var(--color-mint-bright) 100%)',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>

              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-forest-dark)' }}>
                Attend {remainingCount} more {remainingCount === 1 ? 'activity' : 'activities'} to unlock volunteering opportunities.
              </div>
            </div>

            {/* CTA Button */}
            <Link to="/activities" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={18} />
              Explore Activities
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. USER (ELIGIBLE: > 5 EVENTS) OR STAFF                                   */}
      {/* ========================================================================= */}
      {(isStaff || (isRegularUser && isUserEligible)) && !loading && (
        <div>
          {/* User / Staff Eligibility Status Banner */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px 28px',
              marginBottom: '36px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-sage-light)',
                  color: 'var(--color-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--color-forest-dark)', margin: 0, fontWeight: 700 }}>
                  {isStaff ? 'Staff Volunteering Authorized' : 'You Are Eligible to Volunteer!'}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                  {isStaff
                    ? 'As a BNHS staff member, you can apply directly for all active conservation & volunteer initiatives.'
                    : `You have participated in ${attendedCount} BNHS activities. You can now apply for all volunteer opportunities.`}
                </p>
              </div>
            </div>

            <div
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-sage-light)',
                color: 'var(--color-forest-dark)',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Shield size={14} color="var(--color-emerald)" />
              {isStaff ? 'Staff Access' : `${attendedCount} Events Attended`}
            </div>
          </div>

          {/* Pending Admin Invitations for User */}
          {pendingAdminInvites.length > 0 && (
            <div style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.35rem', color: 'var(--color-forest-dark)', marginBottom: '14px', fontWeight: 700 }}>
                Pending Volunteering Invitations from BNHS Admin
              </h2>
              {pendingAdminInvites.map((invite) => (
                <div
                  key={invite._id}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid var(--color-emerald)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '24px',
                    marginBottom: '14px',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-emerald)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Admin Invitation Received
                    </div>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--color-forest-dark)', margin: '0 0 6px' }}>
                      {invite.opportunityTitle}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: 0 }}>
                      "{invite.message}"
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleUserAcceptRequest(invite._id)}
                      className="btn btn-primary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Check size={15} /> Accept Invitation
                    </button>
                    <button
                      onClick={() => handleUserDeclineRequest(invite._id)}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <XCircle size={15} /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Applications Status */}
          {activeApplications.length > 0 && (
            <div style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '1.35rem', color: 'var(--color-forest-dark)', marginBottom: '14px', fontWeight: 700 }}>
                My Volunteer Applications
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {activeApplications.map((app) => (
                  <div
                    key={app._id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '18px 20px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-forest-dark)', fontSize: '1.05rem' }}>
                        {app.opportunityTitle}
                      </div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background:
                            app.status === 'accepted'
                              ? 'var(--color-sage-light)'
                              : app.status === 'declined'
                              ? '#fee2e2'
                              : '#fef3c7',
                          color:
                            app.status === 'accepted'
                              ? 'var(--color-forest-dark)'
                              : app.status === 'declined'
                              ? '#991b1b'
                              : '#92400e',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                        }}
                      >
                        {app.status === 'accepted' ? '✓ Approved Volunteer' : app.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      Location: {app.opportunityLocation || 'BNHS Mumbai'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Volunteer Opportunities Grid */}
          <div style={{ marginBottom: '44px' }}>
            <h2 style={{ fontSize: '1.45rem', color: 'var(--color-forest-dark)', marginBottom: '20px', fontWeight: 700 }}>
              Available Volunteer Opportunities
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-emerald)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {opp.theme}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--color-sage-light)',
                          color: 'var(--color-forest-primary)',
                        }}
                      >
                        Active Opportunity
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: 'var(--color-forest-dark)', fontWeight: 700 }}>
                      {opp.title}
                    </h3>

                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                      {opp.description}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Briefcase size={14} color="var(--color-forest-primary)" />
                        <span><strong>Role:</strong> {opp.role}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} color="var(--color-forest-primary)" />
                        <span><strong>Location:</strong> {opp.location}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} color="var(--color-forest-primary)" />
                        <span><strong>Commitment:</strong> {opp.commitment}</span>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Desired Skills:
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {opp.skills.map((s, i) => (
                          <span key={i} className="tag" style={{ fontSize: '0.75rem' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                    <button
                      onClick={() => handleApplyClick(opp)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      Apply to Volunteer
                    </button>
                    {opp.activityId && (
                      <Link to={`/activities/${opp.activityId}`} className="btn btn-secondary btn-sm">
                        Details
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Assistant Info Banner */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          marginTop: '40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Shield size={16} style={{ color: 'var(--color-emerald)' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-forest-primary)', textTransform: 'uppercase' }}>
              BNHS-SEVA Archival Documentation (Page 13)
            </span>
          </div>
          <h3 style={{ fontSize: '1.35rem', color: 'var(--color-forest-dark)', marginBottom: '6px', fontWeight: 700 }}>
            Curious about specific volunteer departments?
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Ask our AI Assistant about the 90+ volunteers matched in BNHS-SEVA and how to contribute your specialized skills.
          </p>
        </div>

        <Link to="/assistant" className="btn btn-primary">
          <MessageSquareText size={16} />
          Ask Assistant About BNHS-SEVA
        </Link>
      </div>

      {/* Modals */}
      <ApplyVolunteerModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        opportunity={selectedOpportunity}
        eligibility={eligibility}
        isStaff={isStaff}
        onSuccess={() => {
          setActionSuccess('Volunteer application submitted successfully for Admin review.');
          fetchData();
          setTimeout(() => setActionSuccess(null), 5000);
        }}
      />

      <AdminVolunteerRequestModal
        isOpen={isAdminRequestModalOpen}
        onClose={() => setIsAdminRequestModalOpen(false)}
        candidate={selectedCandidate}
        opportunities={opportunities}
        onSuccess={() => {
          setActionSuccess(`Volunteering request sent to ${selectedCandidate?.name}.`);
          fetchData();
          setTimeout(() => setActionSuccess(null), 5000);
        }}
      />
    </div>
  );
};

export default VolunteerPage;
