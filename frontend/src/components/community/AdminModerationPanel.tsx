import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  EyeOff,
  Trash2,
  AlertTriangle,
  Loader2,
  Clock,
  Filter,
} from 'lucide-react';
import { CommunityReport } from '../../types';
import api from '../../services/api';

export const AdminModerationPanel: React.FC = () => {
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'reviewed' | 'all'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getAdminCommunityReports(statusFilter);
      setReports(data.reports || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load community moderation reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (reportId: string, action: 'dismiss' | 'remove_post' | 'hide_post') => {
    setActionLoadingId(reportId);
    try {
      await api.resolveAdminCommunityReport(reportId, { action });
      setReports((prev) => prev.filter((r) => r._id !== reportId));
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1.5px solid #fecaca',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldAlert size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#991b1b', margin: 0 }}>
              Community Content Moderation
            </h3>
            <p style={{ fontSize: '0.76rem', color: '#64748b', margin: 0 }}>
              Review community reports and enforce BNHS community guidelines
            </p>
          </div>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['pending', 'reviewed', 'all'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: statusFilter === st ? '#dc2626' : '#e2e8f0',
                backgroundColor: statusFilter === st ? '#fee2e2' : '#ffffff',
                color: statusFilter === st ? '#991b1b' : '#64748b',
                fontSize: '0.76rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                cursor: 'pointer',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.82rem' }}>
          {error}
        </div>
      )}

      {/* Reports Stream */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '30px 0' }}>
          <Loader2 size={24} className="animate-spin" color="#dc2626" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Loading reported content...</div>
        </div>
      ) : reports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#f8fafc', borderRadius: '12px', color: '#64748b', fontSize: '0.85rem' }}>
          ✓ No {statusFilter} reports found. Community feed is healthy.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {reports.map((report) => (
            <div
              key={report._id}
              style={{
                backgroundColor: '#fff5f5',
                borderRadius: '10px',
                border: '1px solid #fecaca',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {report.reason}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Reported by: <strong>{report.reporterName || report.reporter?.name || 'Member'}</strong>
                  </span>
                </div>

                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  {new Date(report.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {report.details && (
                <div style={{ fontSize: '0.8rem', color: '#7f1d1d', fontStyle: 'italic' }}>
                  &ldquo;{report.details}&rdquo;
                </div>
              )}

              {/* Target Post Preview */}
              {report.post && (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.82rem',
                    color: '#334155',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '3px' }}>
                    Post by {report.post.userName} on <em>{report.post.activityName}</em>:
                  </div>
                  <div style={{ color: '#475569' }}>{report.post.content}</div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  disabled={actionLoadingId === report._id}
                  onClick={() => handleResolve(report._id, 'dismiss')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Dismiss Report
                </button>

                <button
                  type="button"
                  disabled={actionLoadingId === report._id}
                  onClick={() => handleResolve(report._id, 'hide_post')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #f59e0b',
                    backgroundColor: '#fffbeb',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    color: '#b45309',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <EyeOff size={13} /> Hide Content
                </button>

                <button
                  type="button"
                  disabled={actionLoadingId === report._id}
                  onClick={() => handleResolve(report._id, 'remove_post')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#dc2626',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Trash2 size={13} /> Remove Post
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
