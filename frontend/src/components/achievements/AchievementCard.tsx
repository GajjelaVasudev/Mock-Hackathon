import React from 'react';
import { Award, CheckCircle2, Lock, FileText, Sparkles, Compass, Shield } from 'lucide-react';
import { NatureAchievement, CertificateDetails } from '../../types';

interface AchievementCardProps {
  achievement: NatureAchievement;
  verifiedCount: number;
  onViewCertificate?: (cert: CertificateDetails) => void;
  recipientName?: string;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  verifiedCount,
  onViewCertificate,
  recipientName = 'Nature Enthusiast',
}) => {
  const {
    tier,
    title,
    reward,
    requiredEvents,
    description,
    isUnlocked,
    unlockedAt,
    certificateId,
    fulfillmentStatus,
    remainingEvents,
  } = achievement;

  // Theme styling based on tier
  const tierThemes = {
    SILVER: {
      accent: '#64748b',
      badgeBg: 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)',
      badgeBorder: '#94a3b8',
      iconColor: '#475569',
      border: isUnlocked ? '1.5px solid #cbd5e1' : '1px solid #e2e8f0',
      glow: isUnlocked ? '0 4px 14px rgba(148, 163, 184, 0.25)' : 'none',
      icon: Award,
    },
    GOLD: {
      accent: '#d97706',
      badgeBg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      badgeBorder: '#f59e0b',
      iconColor: '#b45309',
      border: isUnlocked ? '1.5px solid #fcd34d' : '1px solid #e2e8f0',
      glow: isUnlocked ? '0 4px 16px rgba(245, 158, 11, 0.25)' : 'none',
      icon: Sparkles,
    },
    PLATINUM: {
      accent: '#047857',
      badgeBg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
      badgeBorder: '#10b981',
      iconColor: '#065f46',
      border: isUnlocked ? '1.5px solid #6ee7b7' : '1px solid #e2e8f0',
      glow: isUnlocked ? '0 4px 20px rgba(4, 120, 87, 0.25)' : 'none',
      icon: Compass,
    },
  };

  const theme = tierThemes[tier];
  const IconComponent = theme.icon;

  const formattedUnlockDate = unlockedAt
    ? new Date(unlockedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  // Progress computation
  const prevRequired = tier === 'PLATINUM' ? 10 : tier === 'GOLD' ? 5 : 0;
  const currentProgress = Math.max(0, verifiedCount - prevRequired);
  const span = requiredEvents - prevRequired;
  const progressPercent = isUnlocked
    ? 100
    : Math.min(100, Math.round((currentProgress / span) * 100));

  const handleCertificateClick = () => {
    if (onViewCertificate && certificateId) {
      onViewCertificate({
        certificateId,
        tier,
        title,
        recipientName,
        verifiedEventsCount: Math.max(requiredEvents, verifiedCount),
        unlockedAt: unlockedAt || new Date().toISOString(),
        organization: 'Bombay Natural History Society',
        seal: 'Official BNHS Seal',
      });
    }
  };

  return (
    <div
      style={{
        backgroundColor: isUnlocked ? '#ffffff' : '#f8fafc',
        borderRadius: '16px',
        border: theme.border,
        boxShadow: isUnlocked ? theme.glow : '0 1px 3px rgba(0,0,0,0.02)',
        padding: '22px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        position: 'relative',
        transition: 'all 0.2s ease',
        opacity: isUnlocked ? 1 : 0.85,
      }}
    >
      {/* Top Header: Badge Emblem, Tier Title, Unlocked Status */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: isUnlocked ? theme.badgeBg : '#e2e8f0',
              border: isUnlocked ? `1.5px solid ${theme.badgeBorder}` : '1px solid #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isUnlocked ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              flexShrink: 0,
            }}
          >
            {isUnlocked ? (
              <IconComponent size={22} color={theme.iconColor} />
            ) : (
              <Lock size={18} color="#94a3b8" />
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: isUnlocked ? theme.accent : '#64748b',
                }}
              >
                {tier} TIER
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>·</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>
                {requiredEvents} Verified Events
              </span>
            </div>
            <h3 style={{ margin: '2px 0 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              {title}
            </h3>
          </div>
        </div>

        {/* Status Pill */}
        {isUnlocked ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: '#ecfdf5',
              color: '#047857',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}
          >
            <CheckCircle2 size={13} />
            Unlocked
          </span>
        ) : (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              fontSize: '0.72rem',
              fontWeight: 600,
            }}
          >
            {remainingEvents} more to go
          </span>
        )}
      </div>

      {/* Description & Reward Info */}
      <div
        style={{
          backgroundColor: isUnlocked ? '#f8fafc' : '#ffffff',
          borderRadius: '10px',
          padding: '12px 14px',
          border: '1px solid #f1f5f9',
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Official Reward
        </div>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isUnlocked ? '#064e3b' : '#334155', marginTop: '2px' }}>
          {reward}
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
          {description}
        </p>
      </div>

      {/* Progress or Unlocked Metadata */}
      {isUnlocked ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '6px',
            borderTop: '1px solid #f1f5f9',
            marginTop: 'auto',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            <span>Awarded on: <strong>{formattedUnlockDate}</strong></span>
          </div>

          {tier === 'SILVER' && certificateId && (
            <button
              onClick={handleCertificateClick}
              style={{
                backgroundColor: '#047857',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 4px rgba(4, 120, 87, 0.15)',
              }}
            >
              <FileText size={13} />
              View Certificate
            </button>
          )}

          {(tier === 'GOLD' || tier === 'PLATINUM') && (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color:
                  fulfillmentStatus === 'completed'
                    ? '#047857'
                    : fulfillmentStatus === 'approved'
                    ? '#0284c7'
                    : '#d97706',
                backgroundColor:
                  fulfillmentStatus === 'completed'
                    ? '#ecfdf5'
                    : fulfillmentStatus === 'approved'
                    ? '#e0f2fe'
                    : '#fef3c7',
                padding: '3px 8px',
                borderRadius: '6px',
                textTransform: 'capitalize',
              }}
            >
              {fulfillmentStatus === 'pending_approval' ? 'Pending BNHS Approval' : fulfillmentStatus}
            </span>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto', paddingTop: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
            <span>Progress: {Math.min(verifiedCount, requiredEvents)} / {requiredEvents} events</span>
            <span>{progressPercent}%</span>
          </div>
          <div
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: '#e2e8f0',
              borderRadius: '9999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundColor: '#047857',
                borderRadius: '9999px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
