import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Service Unavailable',
  message,
  onRetry,
}) => {
  return (
    <div
      style={{
        background: 'var(--color-danger-bg)',
        border: '1px solid #fecdd3',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        maxWidth: '560px',
        margin: '40px auto',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'var(--color-danger)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}
      >
        <AlertTriangle size={24} />
      </div>
      <h3 style={{ fontSize: '1.25rem', color: '#9f1239', marginBottom: '8px' }}>{title}</h3>
      <p style={{ fontSize: '0.9rem', color: '#881337', marginBottom: '20px', lineHeight: 1.5 }}>
        {message}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-primary btn-sm">
          <RefreshCw size={14} />
          Try Again
        </button>
      )}
    </div>
  );
};
