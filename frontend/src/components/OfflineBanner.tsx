import React from 'react';
import { WifiOff } from 'lucide-react';
import { usePWA } from '../context/PWAContext';

export const OfflineBanner: React.FC = () => {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div
      style={{
        backgroundColor: '#991b1b',
        color: '#ffffff',
        padding: '8px 16px',
        fontSize: '0.82rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        position: 'sticky',
        top: 0,
        zIndex: 10001,
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        textAlign: 'center',
      }}
    >
      <WifiOff size={15} />
      <span>
        You are currently offline. Cached BNHS pages remain accessible; please reconnect to register, post, or use live AI features.
      </span>
    </div>
  );
};
