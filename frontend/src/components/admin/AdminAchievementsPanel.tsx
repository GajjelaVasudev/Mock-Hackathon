import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, Clock, Filter, Loader2, Sparkles, User, FileText, ChevronRight } from 'lucide-react';
import { AdminAchievementItem } from '../../types';
import api from '../../services/api';

export const AdminAchievementsPanel: React.FC = () => {
  const [achievements, setAchievements] = useState<AdminAchievementItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminAchievements();
  }, [page, tierFilter, statusFilter]);

  const fetchAdminAchievements = async () => {
    try {
      setIsLoading(true);
      const res = await api.getAdminAchievements({
        page,
        limit: 20,
        tier: tierFilter !== 'all' ? tierFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setAchievements(res.achievements || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Failed to load admin achievements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (achievementId: string, newStatus: string) => {
    try {
      setUpdatingId(achievementId);
      await api.updateAchievementFulfillment(achievementId, {
        fulfillmentStatus: newStatus,
      });
      // Update local state
      setAchievements((prev) =>
        prev.map((ach) =>
          ach._id === achievementId ? { ...ach, fulfillmentStatus: newStatus as any } : ach
        )
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update fulfillment status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Filter Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          backgroundColor: '#ffffff',
          padding: '18px 24px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
            Achievements & Recognition Management
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
            Manage verified explorer awards, certificates, and habitat tour opportunities. ({total} total awarded)
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={tierFilter}
            onChange={(e) => {
              setTierFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              fontWeight: 600,
              backgroundColor: '#ffffff',
              color: '#334155',
            }}
          >
            <option value="all">All Tiers</option>
            <option value="SILVER">Silver (5 Events)</option>
            <option value="GOLD">Gold (10 Events)</option>
            <option value="PLATINUM">Platinum (15 Events)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              fontWeight: 600,
              backgroundColor: '#ffffff',
              color: '#334155',
            }}
          >
            <option value="all">All Fulfillment Statuses</option>
            <option value="unlocked">Unlocked</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Achievements Table */}
      {isLoading ? (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '48px',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
            color: '#047857',
          }}
        >
          <Loader2 size={32} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ margin: '12px 0 0', fontSize: '0.88rem', color: '#64748b' }}>
            Loading unlocked member achievements...
          </p>
        </div>
      ) : achievements.length === 0 ? (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '48px 24px',
            border: '1px dashed #cbd5e1',
            textAlign: 'center',
          }}
        >
          <Award size={40} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
            No Achievements Found
          </h4>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
            Members will automatically appear here as they complete 5, 10, or 15 verified BNHS events.
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '14px 20px' }}>Naturalist / Member</th>
                  <th style={{ padding: '14px 16px' }}>Achievement Tier</th>
                  <th style={{ padding: '14px 16px' }}>Verified Events</th>
                  <th style={{ padding: '14px 16px' }}>Awarded On</th>
                  <th style={{ padding: '14px 16px' }}>Fulfillment Status</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {achievements.map((ach) => {
                  const isUpdating = updatingId === ach._id;
                  const tierColors = {
                    SILVER: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
                    GOLD: { bg: '#fef3c7', color: '#b45309', border: '#fcd34d' },
                    PLATINUM: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
                  };
                  const colorConfig = tierColors[ach.tier] || tierColors.SILVER;

                  return (
                    <tr key={ach._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              backgroundColor: '#ecfdf5',
                              color: '#047857',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                            }}
                          >
                            {ach.user?.name ? ach.user.name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>
                              {ach.user?.name || ach.user?.username || 'Member'}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              {ach.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            backgroundColor: colorConfig.bg,
                            color: colorConfig.color,
                            border: `1px solid ${colorConfig.border}`,
                            fontSize: '0.75rem',
                            fontWeight: 800,
                          }}
                        >
                          <Award size={12} />
                          {ach.title}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#064e3b' }}>
                        {ach.verifiedCountAtUnlock || ach.requiredEvents} events
                      </td>

                      <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.82rem' }}>
                        {new Date(ach.unlockedAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <select
                          value={ach.fulfillmentStatus}
                          disabled={isUpdating}
                          onChange={(e) => handleUpdateStatus(ach._id, e.target.value)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            backgroundColor:
                              ach.fulfillmentStatus === 'completed'
                                ? '#ecfdf5'
                                : ach.fulfillmentStatus === 'approved'
                                ? '#e0f2fe'
                                : '#fef3c7',
                            color:
                              ach.fulfillmentStatus === 'completed'
                                ? '#047857'
                                : ach.fulfillmentStatus === 'approved'
                                ? '#0284c7'
                                : '#d97706',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="unlocked">Unlocked</option>
                          <option value="pending_approval">Pending Approval</option>
                          <option value="approved">Approved</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        {ach.certificateId ? (
                          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#047857', fontWeight: 700 }}>
                            {ach.certificateId}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
