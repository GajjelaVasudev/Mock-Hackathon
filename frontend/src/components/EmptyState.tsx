import React from 'react';
import { Compass, Sparkles, FolderSearch } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  actionLink?: string;
  onActionClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  actionLink,
  onActionClick,
}) => {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px dashed var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '48px 24px',
        textAlign: 'center',
        maxWidth: '540px',
        margin: '40px auto',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--color-sage-light)',
          color: 'var(--color-forest-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}
      >
        {icon || <FolderSearch size={28} />}
      </div>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--color-forest-dark)' }}>{title}</h3>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.925rem', marginBottom: '24px', lineHeight: 1.5 }}>
        {description}
      </p>
      {actionText && actionLink && (
        <Link to={actionLink} className="btn btn-primary btn-sm">
          {actionText}
        </Link>
      )}
      {actionText && onActionClick && !actionLink && (
        <button onClick={onActionClick} className="btn btn-primary btn-sm">
          {actionText}
        </button>
      )}
    </div>
  );
};
