import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import { AttendedActivityOption, ExperiencePost } from '../../types';
import api from '../../services/api';

interface ShareExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: ExperiencePost) => void;
  preselectedActivityId?: string;
}

export const ShareExperienceModal: React.FC<ShareExperienceModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
  preselectedActivityId,
}) => {
  const [attendedActivities, setAttendedActivities] = useState<AttendedActivityOption[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAttendedActivities();
    }
  }, [isOpen]);

  const fetchAttendedActivities = async () => {
    setIsLoadingActivities(true);
    setError(null);
    try {
      const data = await api.getAttendedActivitiesForPost();
      setAttendedActivities(data.activities || []);
      if (preselectedActivityId) {
        setSelectedActivityId(preselectedActivityId);
      } else if (data.activities && data.activities.length > 0) {
        setSelectedActivityId(data.activities[0].id || data.activities[0]._id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load your attended activities.');
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      if (selectedFiles.length + validFiles.length >= 5) {
        setError('Maximum 5 photos allowed per experience post.');
        break;
      }

      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type.toLowerCase())) {
        setError('Only JPG, PNG, and WEBP formats are supported.');
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds 5MB size limit.`);
        continue;
      }

      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivityId) {
      setError('Please select an activity you attended.');
      return;
    }
    if (!content.trim()) {
      setError('Please write about your experience.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let uploadedImageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append('images', file));
        const uploadRes = await api.uploadImages(formData);
        uploadedImageUrls = uploadRes.urls || [];
      }

      const res = await api.createExperiencePost({
        activityId: selectedActivityId,
        content: content.trim(),
        imageUrls: uploadedImageUrls,
      });

      onPostCreated(res.post);
      setContent('');
      setSelectedFiles([]);
      setPreviews([]);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to publish experience post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedActivity = attendedActivities.find(
    (a) => a.id === selectedActivityId || a._id === selectedActivityId
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#064e3b', margin: 0 }}>
              Share Field Experience
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
              Share observations, sightings, and photos from activities you attended
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {isLoadingActivities ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Loader2 size={28} className="animate-spin" color="#059669" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Loading your verified attended activities...
            </div>
          </div>
        ) : attendedActivities.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '30px 20px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px dashed #cbd5e1',
            }}
          >
            <Calendar size={36} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 6px' }}>
              No Attended Activities Yet
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px', lineHeight: 1.4 }}>
              To ensure all community posts are authentic field reports, experiences can only be shared for activities with verified attendance in your BNHS Nature Passport.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#059669',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Explore Upcoming Activities
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Activity Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                Select Attended Activity:
              </label>
              <select
                value={selectedActivityId}
                onChange={(e) => setSelectedActivityId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                }}
              >
                {attendedActivities.map((act) => (
                  <option key={act.id || act._id} value={act.id || act._id}>
                    {act.name || act.title} — {act.location} ({act.date})
                  </option>
                ))}
              </select>

              {selectedActivity && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.76rem',
                    color: '#065f46',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle2 size={13} color="#059669" />
                    Verified Attendance Record
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#047857' }}>
                    <MapPin size={12} /> {selectedActivity.location}
                  </span>
                </div>
              )}
            </div>

            {/* Experience Content */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                What did you observe or experience?
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your trail notes, species sightings, photography tips, or memorable moments..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.86rem',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Photo Upload Area */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                Attach Photographs (Up to 5):
              </label>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                {previews.map((previewUrl, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      width: '78px',
                      height: '78px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid #cbd5e1',
                    }}
                  >
                    <img
                      src={previewUrl}
                      alt={`Preview ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Remove image"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {selectedFiles.length < 5 && (
                  <label
                    style={{
                      width: '78px',
                      height: '78px',
                      borderRadius: '8px',
                      border: '1.5px dashed #cbd5e1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      color: '#64748b',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      backgroundColor: '#f8fafc',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <Camera size={18} color="#059669" />
                    + Add Photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      multiple
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Submit Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !content.trim() || !selectedActivityId}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#047857',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: isSubmitting || !content.trim() ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting || !content.trim() ? 0.6 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(4, 120, 87, 0.2)',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Publishing...
                  </>
                ) : (
                  'Publish Experience'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
