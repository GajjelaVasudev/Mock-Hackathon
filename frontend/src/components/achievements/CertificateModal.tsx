import React, { useRef } from 'react';
import { X, Printer, Award, ShieldCheck, Download } from 'lucide-react';
import { CertificateDetails } from '../../types';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: CertificateDetails | null;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  certificate,
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = certificate.unlockedAt
    ? new Date(certificate.unlockedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          maxWidth: '820px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Controls Header */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#064e3b',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          className="no-print"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={20} color="#b7e4c7" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.02em' }}>
              Official BNHS Certificate of Appreciation
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handlePrint}
              style={{
                backgroundColor: '#047857',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              }}
            >
              <Printer size={15} />
              Print / Save PDF
            </button>

            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Close certificate"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Certificate Canvas */}
        <div
          ref={certificateRef}
          className="bnhs-printable-certificate"
          style={{
            padding: '44px 48px',
            backgroundColor: '#fcfdfa',
            backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            border: '12px double #064e3b',
            margin: '24px',
            borderRadius: '12px',
            textAlign: 'center',
            position: 'relative',
            boxShadow: 'inset 0 0 20px rgba(6, 78, 59, 0.05)',
          }}
        >
          {/* Watermark Seal / Emblem */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: 0.04,
              pointerEvents: 'none',
              width: '320px',
              height: '320px',
            }}
          >
            <img src="/bnhs-logo-bird.png" alt="BNHS Seal" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          {/* Certificate Header Branding */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: '#ffffff',
                border: '2px solid #064e3b',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(6, 78, 59, 0.15)',
                marginBottom: '12px',
              }}
            >
              <img src="/bnhs-logo-bird.png" alt="BNHS Emblem" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
            </div>

            <h2
              style={{
                fontFamily: "'Outfit', Georgia, serif",
                fontSize: '1.5rem',
                fontWeight: 900,
                color: '#064e3b',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              Bombay Natural History Society
            </h2>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '2px' }}>
              Conserving Nature Since 1883 · Hornbill House, Mumbai
            </span>
          </div>

          {/* Certificate Title */}
          <div style={{ margin: '24px 0 16px' }}>
            <div style={{ display: 'inline-block', borderBottom: '2px solid #047857', paddingBottom: '4px' }}>
              <span
                style={{
                  fontSize: '1.9rem',
                  fontWeight: 800,
                  fontFamily: "'Outfit', Georgia, serif",
                  color: '#0f172a',
                  letterSpacing: '-0.01em',
                  textTransform: 'uppercase',
                }}
              >
                Certificate of Appreciation
              </span>
            </div>
            <p style={{ fontSize: '0.92rem', color: '#64748b', fontStyle: 'italic', margin: '8px 0 0' }}>
              This honor is proudly conferred upon
            </p>
          </div>

          {/* Recipient Name */}
          <div style={{ margin: '14px 0 18px' }}>
            <div
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: '#064e3b',
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: '-0.02em',
                borderBottom: '1px dashed #cbd5e1',
                display: 'inline-block',
                padding: '0 32px 6px',
              }}
            >
              {certificate.recipientName}
            </div>
          </div>

          {/* Achievement Description */}
          <p
            style={{
              maxWidth: '560px',
              margin: '0 auto 28px',
              fontSize: '0.92rem',
              color: '#334155',
              lineHeight: 1.6,
            }}
          >
            In distinguished recognition of exemplary dedication to Indian biodiversity, field exploration, and citizen science by completing{' '}
            <strong>{certificate.verifiedEventsCount} verified BNHS nature activities</strong> and attaining the title of{' '}
            <strong style={{ color: '#064e3b' }}>{certificate.title}</strong>.
          </p>

          {/* Signatures & Seal Section */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginTop: '36px',
              paddingTop: '20px',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            {/* Left: Date & Reference ID */}
            <div style={{ textAlign: 'left', fontSize: '0.8rem', color: '#64748b' }}>
              <div><strong>Date Awarded:</strong> {formattedDate}</div>
              <div style={{ marginTop: '4px' }}>
                <strong>Certificate ID:</strong>{' '}
                <span style={{ fontFamily: 'monospace', color: '#064e3b', fontWeight: 700 }}>
                  {certificate.certificateId}
                </span>
              </div>
            </div>

            {/* Middle: Official Seal Badge */}
            <div
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                border: '2px solid #047857',
                backgroundColor: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                boxShadow: '0 2px 8px rgba(4, 120, 87, 0.15)',
              }}
            >
              <ShieldCheck size={26} color="#047857" />
              <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#064e3b', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>
                VERIFIED SEAL
              </span>
            </div>

            {/* Right: Authorizing Signatory */}
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontFamily: "'Outfit', cursive, serif",
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: '#064e3b',
                  marginBottom: '2px',
                }}
              >
                Director, BNHS
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                Bombay Natural History Society
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
