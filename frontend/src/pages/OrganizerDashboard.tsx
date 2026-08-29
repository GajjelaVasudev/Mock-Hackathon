import React, { useEffect, useState } from 'react';
import {
  Shield,
  Users,
  CalendarCheck,
  Award,
  BarChart3,
  TrendingUp,
  Compass,
  CheckCircle2,
  Sparkles,
  Activity as ActivityIcon,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Send,
  MapPin,
  Clock,
  UserCheck,
  AlertCircle,
  HeartHandshake,
} from 'lucide-react';
import {
  AdminOverview,
  EligibleLeader,
  AdminEventItem,
  AdminUserItem,
  StaffUser,
  VolunteerOpportunity,
  AdminEligibleVolunteer,
} from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { CreateEventModal } from '../components/CreateEventModal';
import { InviteLeaderModal } from '../components/InviteLeaderModal';
import { EventParticipantsModal } from '../components/EventParticipantsModal';
import { AdminVolunteerRequestModal } from '../components/AdminVolunteerRequestModal';
import { AdminAchievementsPanel } from '../components/admin/AdminAchievementsPanel';
import api from '../services/api';

export const OrganizerDashboard: React.FC = () => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [eligibleLeaders, setEligibleLeaders] = useState<EligibleLeader[]>([]);
  const [events, setEvents] = useState<AdminEventItem[]>([]);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [volOpportunities, setVolOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Tabs
  const [eventTab, setEventTab] = useState<'all' | 'upcoming' | 'draft' | 'completed'>('all');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<AdminEventItem | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<EligibleLeader | null>(null);
  const [selectedVolCandidate, setSelectedVolCandidate] = useState<AdminEligibleVolunteer | null>(null);
  const [volModalOpen, setVolModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedEventForRoster, setSelectedEventForRoster] = useState<AdminEventItem | null>(null);
  const [rosterModalOpen, setRosterModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, leadersRes, eventsRes, usersRes, staffRes, oppRes] = await Promise.allSettled([
        api.getAdminOverview(),
        api.getEligibleLeaders(),
        api.getAdminEvents(),
        api.getAdminUsers(),
        api.getAdminStaff(),
        api.getVolunteerOpportunities(),
      ]);

      if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value);
      if (leadersRes.status === 'fulfilled') setEligibleLeaders(leadersRes.value.eligibleLeaders || []);
      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.events || []);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.users || []);
      if (staffRes.status === 'fulfilled') setStaff(staffRes.value.staff || []);
      if (oppRes.status === 'fulfilled') setVolOpportunities(oppRes.value.opportunities || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load organizer dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCancelEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to mark this event as cancelled?')) return;
    try {
      await api.deleteAdminEvent(eventId);
      setSuccessBanner('Event marked as cancelled successfully.');
      setTimeout(() => setSuccessBanner(null), 3000);
      fetchDashboardData();
    } catch (err: any) {
      alert(`Error cancelling event: ${err.message}`);
    }
  };

  const filteredEvents = events.filter((ev) => {
    if (eventTab === 'upcoming') return ev.status === 'upcoming' || ev.status === 'open';
    if (eventTab === 'draft') return ev.status === 'draft';
    if (eventTab === 'completed') return ev.status === 'completed';
    return true;
  });

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="container" style={{ padding: '36px 20px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-emerald)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Staff & Organizer Console
            </span>
            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--color-sage-light)', color: 'var(--color-forest-primary)', fontWeight: 700 }}>
              Live Data
            </span>
          </div>
          <h1 style={{ fontSize: '2.4rem', color: 'var(--color-forest-dark)', margin: 0 }}>
            BNHS Organizer Dashboard
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', marginTop: '6px' }}>
            Platform metrics, event lifecycle, naturalist promotions, and member rosters.
          </p>
        </div>

        <button
          onClick={() => {
            setEventToEdit(null);
            setCreateModalOpen(true);
          }}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontWeight: 700 }}
        >
          <Plus size={18} />
          Create New Event
        </button>
      </div>

      {successBanner && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'var(--color-sage-light)', color: 'var(--color-forest-dark)', borderRadius: 'var(--radius-md)', marginBottom: '24px', fontWeight: 600 }}>
          <CheckCircle2 size={18} color="var(--color-emerald)" />
          <span>{successBanner}</span>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Loading dashboard data..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchDashboardData} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Top Platform KPI Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="card stat-card" style={{ background: '#ffffff', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Total Members</span>
                <Users size={18} color="var(--color-emerald)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-forest-dark)' }}>
                {overview?.totalUsers || users.length}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-forest-primary)', fontWeight: 600 }}>
                {overview?.activeUsers || 16} active accounts
              </span>
            </div>

            <div className="card stat-card" style={{ background: '#ffffff', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Events Hosted</span>
                <CalendarCheck size={18} color="var(--color-emerald)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-forest-dark)' }}>
                {overview?.totalEvents || events.length}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Walks, camps, courses & SEVA
              </span>
            </div>

            <div className="card stat-card" style={{ background: '#ffffff', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Eligible Leaders</span>
                <Award size={18} color="var(--color-emerald)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-forest-dark)' }}>
                {eligibleLeaders.length}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-forest-primary)', fontWeight: 600 }}>
                &gt;5 attended field events
              </span>
            </div>

            <div className="card stat-card" style={{ background: '#ffffff', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Total Registrations</span>
                <TrendingUp size={18} color="var(--color-emerald)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-forest-dark)' }}>
                {overview?.totalRegistrations || 28}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Bookings recorded
              </span>
            </div>

            <div className="card stat-card" style={{ background: '#ffffff', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Staff Members</span>
                <Shield size={18} color="var(--color-emerald)" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-forest-dark)' }}>
                {overview?.staffCount || staff.length}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Staff & Admins active
              </span>
            </div>
          </div>

          {/* SECTION 1: EVENT MANAGEMENT */}
          <div className="card" style={{ padding: '28px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Compass size={22} color="var(--color-forest-primary)" />
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-forest-dark)', margin: 0 }}>
                  Event Management
                </h2>
                <span style={{ fontSize: '0.8rem', background: 'var(--color-bg-alt)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  {filteredEvents.length} Events
                </span>
              </div>

              {/* Event Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {/* Event Tabs */}
                <div style={{ display: 'flex', gap: '4px', background: 'var(--color-bg-alt)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
                  {(['all', 'upcoming', 'draft', 'completed'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setEventTab(tab)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: eventTab === tab ? '#ffffff' : 'transparent',
                        color: eventTab === tab ? 'var(--color-forest-dark)' : 'var(--color-text-muted)',
                        boxShadow: eventTab === tab ? 'var(--shadow-sm)' : 'none',
                        textTransform: 'capitalize',
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setEventToEdit(null);
                    setCreateModalOpen(true);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontWeight: 700 }}
                >
                  <Plus size={15} />
                  + Create New Activity
                </button>
              </div>
            </div>

            {/* Events Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 14px' }}>Event</th>
                    <th style={{ padding: '12px 14px' }}>Type</th>
                    <th style={{ padding: '12px 14px' }}>Date</th>
                    <th style={{ padding: '12px 14px' }}>Location</th>
                    <th style={{ padding: '12px 14px' }}>Capacity / Reg</th>
                    <th style={{ padding: '12px 14px' }}>Assigned Leader</th>
                    <th style={{ padding: '12px 14px' }}>Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((ev) => (
                    <tr key={ev.id || ev._id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.15s' }}>
                      <td style={{ padding: '14px', fontWeight: 700, color: 'var(--color-forest-dark)', maxWidth: '240px' }}>
                        <div>{ev.title || ev.name}</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ev.description}
                        </div>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--color-sage-light)', color: 'var(--color-forest-primary)' }}>
                          {ev.type}
                        </span>
                      </td>
                      <td style={{ padding: '14px', color: 'var(--color-text-main)', fontSize: '0.85rem' }}>
                        {ev.date ? new Date(ev.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Flexible'}
                      </td>
                      <td style={{ padding: '14px', color: 'var(--color-text-muted)' }}>
                        {ev.location}
                      </td>
                      <td style={{ padding: '14px', fontWeight: 600 }}>
                        <span style={{ color: 'var(--color-forest-dark)' }}>{ev.registeredCount || 0}</span>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}> / {ev.capacity}</span>
                      </td>
                      <td style={{ padding: '14px' }}>
                        {ev.leader ? (
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-forest-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <UserCheck size={14} /> {ev.leader}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-full)',
                            background:
                              ev.status === 'upcoming' || ev.status === 'open'
                                ? 'var(--color-sage-light)'
                                : ev.status === 'completed'
                                ? '#dbeafe'
                                : ev.status === 'draft'
                                ? 'var(--color-warning-bg)'
                                : '#fee2e2',
                            color:
                              ev.status === 'upcoming' || ev.status === 'open'
                                ? 'var(--color-forest-primary)'
                                : ev.status === 'completed'
                                ? '#1e40af'
                                : ev.status === 'draft'
                                ? '#92400e'
                                : '#b91c1c',
                          }}
                        >
                          {ev.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => {
                              setSelectedEventForRoster(ev);
                              setRosterModalOpen(true);
                            }}
                            title="View Registered Participants"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '5px 8px' }}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setEventToEdit(ev);
                              setCreateModalOpen(true);
                            }}
                            title="Edit Event"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '5px 8px' }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleCancelEvent(ev.id || ev._id)}
                            title="Cancel Event"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '5px 8px', color: 'var(--color-danger)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2: EVENT LEAD CANDIDATES (>5 ATTENDED EVENTS) */}
          <div className="card" style={{ padding: '28px', background: '#ffffff', border: '1.5px solid var(--color-emerald-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Award size={22} color="var(--color-forest-primary)" />
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-forest-dark)', margin: 0 }}>
                    Event Leader / Naturalist Candidates
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                    Users who have attended <strong>more than 5 events</strong> (actual attended records) are eligible for promotion.
                  </p>
                </div>
              </div>
              <span style={{ fontSize: '0.78rem', background: 'var(--color-sage-light)', color: 'var(--color-forest-primary)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                {eligibleLeaders.length} Qualified Naturalists
              </span>
            </div>

            {eligibleLeaders.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                No users currently meet the &gt;5 event attendance requirement.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 14px' }}>Naturalist</th>
                      <th style={{ padding: '10px 14px' }}>Events Attended</th>
                      <th style={{ padding: '10px 14px' }}>Interests & Experience</th>
                      <th style={{ padding: '10px 14px' }}>Past Activities</th>
                      <th style={{ padding: '10px 14px' }}>Current Role</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Promotion Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligibleLeaders.map((cand) => (
                      <tr key={cand.userId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '14px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-forest-dark)' }}>{cand.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{cand.email}</div>
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-forest-primary)', background: 'var(--color-sage-light)', padding: '3px 10px', borderRadius: 'var(--radius-full)' }}>
                            ✓ {cand.attendedEvents} Attended
                          </span>
                        </td>
                        <td style={{ padding: '14px', fontSize: '0.82rem', color: 'var(--color-text-main)', maxWidth: '200px' }}>
                          <div>{cand.interests?.join(', ') || 'Birds, Wetlands'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                            Level: {cand.experienceLevel || 'Intermediate'}
                          </div>
                        </td>
                        <td style={{ padding: '14px', fontSize: '0.78rem', color: 'var(--color-text-muted)', maxWidth: '220px' }}>
                          {cand.previous_activities?.slice(0, 2).join(', ') || 'Various BNHS walks'}
                          {cand.previous_activities?.length > 2 && ` +${cand.previous_activities.length - 2} more`}
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                            {cand.role}
                          </span>
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              setSelectedCandidate(cand);
                              setInviteModalOpen(true);
                            }}
                            className="btn btn-primary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '6px 14px' }}
                          >
                            <Send size={13} />
                            Invite to Lead Event
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION: ACHIEVEMENTS & RECOGNITION MANAGEMENT */}
          <AdminAchievementsPanel />

          {/* SECTION 3: MEMBER MANAGEMENT */}
          <div className="card" style={{ padding: '28px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={22} color="var(--color-forest-primary)" />
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-forest-dark)', margin: 0 }}>
                  Member Management
                </h2>
                <span style={{ fontSize: '0.8rem', background: 'var(--color-bg-alt)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  {filteredUsers.length} Users
                </span>
              </div>

              {/* Search & Filters */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', minWidth: '220px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    style={{
                      padding: '7px 12px 7px 32px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      width: '100%',
                    }}
                  />
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="filter-select"
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  <option value="all">All Roles</option>
                  <option value="user">Members (User)</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 14px' }}>Member</th>
                    <th style={{ padding: '10px 14px' }}>Role</th>
                    <th style={{ padding: '10px 14px' }}>Attended</th>
                    <th style={{ padding: '10px 14px' }}>Eligibility</th>
                    <th style={{ padding: '10px 14px' }}>Engagement Score</th>
                    <th style={{ padding: '10px 14px' }}>Status</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.slice(0, 15).map((u) => {
                    const isEligibleVol = u.attendedEvents > 5;
                    return (
                      <tr key={u.id || u._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-forest-dark)' }}>{u.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{u.email}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-sm)',
                              background: u.role === 'admin' ? '#fef3c7' : u.role === 'staff' ? '#dbeafe' : 'var(--color-bg-alt)',
                              color: u.role === 'admin' ? '#92400e' : u.role === 'staff' ? '#1e40af' : 'var(--color-text-main)',
                            }}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                          {u.attendedEvents} events
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {isEligibleVol ? (
                            <span style={{ fontSize: '0.78rem', color: 'var(--color-emerald)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={13} /> Eligible
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                              Not eligible ({u.attendedEvents}/6)
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--color-forest-dark)' }}>{u.engagementScore}</span>
                            <div style={{ width: '60px', height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${u.engagementScore}%`, height: '100%', background: 'var(--color-emerald)' }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: u.isActive ? 'var(--color-forest-primary)' : 'var(--color-danger)' }}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          {isEligibleVol && u.role === 'user' ? (
                            <button
                              onClick={() => {
                                setSelectedVolCandidate({
                                  id: u.id || u._id,
                                  userId: u.id || u._id,
                                  name: u.name,
                                  username: u.username,
                                  email: u.email,
                                  role: u.role,
                                  location: u.location || 'Mumbai',
                                  interests: u.interests || [],
                                  attendedEvents: u.attendedEvents,
                                  eligible: true,
                                });
                                setVolModalOpen(true);
                              }}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '4px 10px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                            >
                              Request for Volunteering
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 4: STAFF MEMBERS & VOLUNTEER OPPORTUNITIES */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
            {/* Staff List */}
            <div className="card" style={{ padding: '24px', background: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Shield size={20} color="var(--color-forest-primary)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-forest-dark)', margin: 0 }}>
                  Staff Team & Assignments
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {staff.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-forest-dark)' }}>{s.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.email}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: '#dbeafe', color: '#1e40af' }}>
                        {s.role}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        {s.eventsManaged} Managed • {s.eventsLed} Led
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Volunteer Opportunities Summary */}
            <div className="card" style={{ padding: '24px', background: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <HeartHandshake size={20} color="var(--color-forest-primary)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-forest-dark)', margin: 0 }}>
                  Volunteer Opportunities
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {volOpportunities.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', padding: '12px 0' }}>
                    No volunteer opportunities configured yet.
                  </div>
                ) : (
                  volOpportunities.slice(0, 4).map((opp) => (
                    <div
                      key={opp.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-forest-dark)' }}>
                        {opp.title}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={11} /> {opp.location}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={11} /> {opp.commitment}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--color-sage-light)', color: 'var(--color-forest-primary)', fontWeight: 600, width: 'fit-content' }}>
                        {opp.theme}
                      </div>
                    </div>
                  ))
                )}
                {volOpportunities.length > 4 && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-forest-primary)', fontWeight: 600, paddingTop: '4px' }}>
                    +{volOpportunities.length - 4} more opportunities available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateEventModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setSuccessBanner(eventToEdit ? 'Event updated successfully.' : 'New event created successfully.');
          setTimeout(() => setSuccessBanner(null), 3000);
          fetchDashboardData();
        }}
        eventToEdit={eventToEdit}
      />

      <InviteLeaderModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onSuccess={() => {
          setSuccessBanner(`Invitation sent to ${selectedCandidate?.name}!`);
          setTimeout(() => setSuccessBanner(null), 3000);
          fetchDashboardData();
        }}
        candidate={selectedCandidate}
        events={events}
      />

      <EventParticipantsModal
        isOpen={rosterModalOpen}
        onClose={() => setRosterModalOpen(false)}
        event={selectedEventForRoster}
      />

      <AdminVolunteerRequestModal
        isOpen={volModalOpen}
        onClose={() => setVolModalOpen(false)}
        candidate={selectedVolCandidate}
        opportunities={volOpportunities}
        onSuccess={() => {
          setSuccessBanner(`Volunteering request sent to ${selectedVolCandidate?.name}!`);
          setTimeout(() => setSuccessBanner(null), 3000);
          fetchDashboardData();
        }}
      />
    </div>
  );
};
