import React, { useState } from 'react';
import { X, CheckCircle, Calendar, MapPin, AlertCircle, ArrowRight } from 'lucide-react';
import { Activity } from '../types';
import { useUser } from '../context/UserContext';
import api from '../services/api';

interface RegistrationModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  activity,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !activity) return null;

  const handleRegister = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await api.registerForActivity({
        user_id: currentUser.id,
        activity_id: activity.id,
        status: 'registered',
      });
      setSuccessMsg(`You have successfully registered for "${activity.name}".`);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            padding: '4px',
          }}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {successMsg ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'var(--color-success-bg)',
                color: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle size={36} />
            </div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Registration Confirmed!</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px', fontSize: '0.95rem' }}>
              {successMsg}
            </p>
            <div style={{ background: 'var(--color-bg)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '24px', textAlign: 'left', fontSize: '0.85rem' }}>
              <div><strong>Activity:</strong> {activity.name}</div>
              <div><strong>Location:</strong> {activity.location}</div>
              <div><strong>Registered For:</strong> {currentUser.name} ({currentUser.email || currentUser.id})</div>
            </div>
            <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>
              Done
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'inline-flex', padding: '4px 10px', background: 'var(--color-sage-light)', color: 'var(--color-forest-primary)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
              {activity.type} Registration
            </div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '12px' }}>{activity.name}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} style={{ color: 'var(--color-emerald)' }} />
                <span>{activity.location}</span>
              </div>
              {activity.duration && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} style={{ color: 'var(--color-emerald)' }} />
                  <span>Duration: {activity.duration}</span>
                </div>
              )}
            </div>

            <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '24px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Participant Profile
              </div>
              <div style={{ fontWeight: 600, color: 'var(--color-forest-dark)' }}>{currentUser.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {currentUser.age_group} • {currentUser.experience_level} • {currentUser.location}
              </div>
            </div>

            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '16px' }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleRegister}
                disabled={isSubmitting}
                style={{ flex: 2 }}
              >
                {isSubmitting ? 'Registering...' : 'Confirm Registration'}
                {!isSubmitting && <ArrowRight size={16} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
