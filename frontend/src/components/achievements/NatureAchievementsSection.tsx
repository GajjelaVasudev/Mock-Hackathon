import React, { useState, useEffect } from 'react';
import { Award, Sparkles, CheckCircle2, ChevronRight, Loader2, Compass, Shield } from 'lucide-react';
import { NatureAchievementSummary, CertificateDetails } from '../../types';
import { AchievementCard } from './AchievementCard';
import { CertificateModal } from './CertificateModal';
import api from '../../services/api';

interface NatureAchievementsSectionProps {
  userName?: string;
  onRefreshParent?: () => void;
}

export const NatureAchievementsSection: React.FC<NatureAchievementsSectionProps> = ({
  userName = 'Naturalist',
  onRefreshParent,
}) => {
  const [summary, setSummary] = useState<NatureAchievementSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateDetails | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState<boolean>(false);

  // In-app celebration notification state
  const [unlockedBanner, setUnlockedBanner] = useState<string | null>(null);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setIsLoading(true);
      const data = await api.getUserAchievements();
      setSummary(data);

      // Check if user recently unlocked a tier and hasn't dismissed yet
      if (data.currentTier) {
        const key = `bnhs_ach_celebrated_${data.currentTier}`;
        const alreadyCelebrated = localStorage.getItem(key);
        if (!alreadyCelebrated) {
          setUnlockedBanner(`🎉 Congratulations! You’ve unlocked ${data.currentTitle}.`);
          localStorage.setItem(key, 'true');
        }
      }
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCertificate = (cert: CertificateDetails) => {
    setSelectedCertificate(cert);
    setIsCertModalOpen(true);
  };

  if (isLoading) {
    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '36px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#047857',
          gap: '10px',
        }}
      >
        <Loader2 size={28} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>
          Calculating verified nature achievements...
        </span>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <section
      aria-label="Nature Achievements & Recognition"
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Unlocked Toast Banner */}
      {unlockedBanner && (
        <div
          style={{
            backgroundColor: '#064e3b',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 4px 14px rgba(6, 78, 59, 0.25)',
            animation: 'slideDown 0.3s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} color="#b7e4c7" />
            <span style={{ fontSize: '0.92rem', fontWeight: 700 }}>{unlockedBanner}</span>
          </div>
          <button
            onClick={() => setUnlockedBanner(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.8rem',
              textDecoration: 'underline',
              fontWeight: 600,
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Banner: Stats & Current Tier */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          paddingBottom: '20px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              backgroundColor: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(4, 120, 87, 0.12)',
              flexShrink: 0,
            }}
          >
            <img src="/bnhs-logo-bird.png" alt="BNHS" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                Nature Achievements & Recognition
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#64748b' }}>
              Automatic honors unlocked through verified participation in BNHS field activities.
            </p>
          </div>
        </div>

        {/* Counter Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            backgroundColor: '#f8fafc',
            borderRadius: '14px',
            padding: '12px 18px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
              Verified Events
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#064e3b', lineHeight: 1.1 }}>
              {summary.verifiedAttendanceCount}
            </div>
          </div>

          <div style={{ height: '32px', width: '1px', backgroundColor: '#cbd5e1' }} />

          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
              Current Status
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: summary.currentTier ? '#047857' : '#64748b' }}>
              {summary.currentTitle || 'Aspiring Explorer'}
            </div>
          </div>
        </div>
      </div>

      {/* Progress to Next Achievement */}
      {summary.nextTier && (
        <div
          style={{
            backgroundColor: '#f0fdf4',
            borderRadius: '12px',
            padding: '14px 18px',
            border: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={18} color="#047857" />
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#064e3b' }}>
              {summary.remainingEventsToNextAchievement === 1
                ? `1 more verified event to unlock ${summary.nextTitle}!`
                : `${summary.remainingEventsToNextAchievement} more verified events to unlock ${summary.nextTitle}!`}
            </span>
          </div>

          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#047857' }}>
            {summary.verifiedAttendanceCount} / {summary.requiredForNext} Events
          </span>
        </div>
      )}

      {/* 3 Tier Achievement Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
        }}
      >
        {summary.tiers.map((tierData) => (
          <AchievementCard
            key={tierData.tier}
            achievement={tierData}
            verifiedCount={summary.verifiedAttendanceCount}
            onViewCertificate={handleOpenCertificate}
            recipientName={userName}
          />
        ))}
      </div>

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        certificate={selectedCertificate}
      />
    </section>
  );
};
