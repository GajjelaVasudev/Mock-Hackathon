import React, { useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { usePWA } from '../context/PWAContext';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, isPromptDismissed, promptInstall, dismissPrompt, isIOS } = usePWA();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already installed or dismissed, do not render banner
  if (isInstalled || isPromptDismissed) {
    return null;
  }

  // Handle native install prompt
  const handleInstallClick = async () => {
    if (isInstallable) {
      await promptInstall();
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  // Only show banner if browser triggered beforeinstallprompt OR if user is on iOS Safari
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <aside
        aria-label="Install BNHS Application"
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          zIndex: 9990,
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '16px 18px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e2e8f0',
          maxWidth: '380px',
          width: 'calc(100% - 48px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                padding: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              }}
            >
              <img
                src="/bnhs-logo-bird.png"
                alt="BNHS App Icon"
                style={{ width: '34px', height: '34px', objectFit: 'contain' }}
              />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#064e3b' }}>
                Install BNHS
              </h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.35 }}>
                Get faster access to nature activities, community and the AI Nature Guide.
              </p>
            </div>
          </div>

          <button
            onClick={dismissPrompt}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Dismiss install banner"
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={dismissPrompt}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            Not now
          </button>

          <button
            onClick={handleInstallClick}
            style={{
              padding: '7px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#047857',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(4, 120, 87, 0.2)',
            }}
          >
            <Download size={14} />
            Install
          </button>
        </div>
      </aside>

      {/* iOS Safari Install Guidance Modal */}
      {showIOSModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowIOSModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                margin: '0 auto 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
              }}
            >
              <img src="/bnhs-logo-bird.png" alt="BNHS" style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#064e3b', margin: '0 0 8px' }}>
              Install BNHS on iOS
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 18px' }}>
              To install the Bombay Natural History Society app on your iPhone or iPad:
            </p>

            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '0.82rem',
                color: '#334155',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 800, color: '#047857' }}>1.</span>
                <span>Tap the <strong>Share</strong> button <Share size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> in Safari toolbar.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 800, color: '#047857' }}>2.</span>
                <span>Scroll down and select <strong>"Add to Home Screen" ➕</strong>.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 800, color: '#047857' }}>3.</span>
                <span>Tap <strong>Add</strong> in the top-right corner.</span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: '#047857',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
