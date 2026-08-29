import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Users,
  Tag,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Trash2,
  ExternalLink,
  Check,
} from 'lucide-react';
import { AdminEventItem, ActivityImage } from '../types';
import { NatureImage } from './NatureImage';
import api from '../services/api';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventToEdit?: AdminEventItem | null;
}

const COMMON_TAGS = ['birds', 'wetlands', 'trees', 'photography', 'botany', 'monsoon forest', 'reptiles', 'conservation', 'citizen science', 'butterflies'];

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  eventToEdit,
}) => {
  const isEditing = Boolean(eventToEdit);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('walk');
  const [location, setLocation] = useState('Mumbai');
  const [date, setDate] = useState('');
  const [capacity, setCapacity] = useState('30');
  const [status, setStatus] = useState('upcoming');
  const [tags, setTags] = useState<string[]>(['birds', 'nature walks']);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Automatic Image State (Single Best Match)
  const [selectedImage, setSelectedImage] = useState<ActivityImage | null>(null);
  const [seenUrls, setSeenUrls] = useState<string[]>([]);
  const [isSearchingImage, setIsSearchingImage] = useState(false);
  const [searchQueryUsed, setSearchQueryUsed] = useState('');
  const [imageSearchError, setImageSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title || eventToEdit.name || '');
      setDescription(eventToEdit.description || '');
      setType(eventToEdit.type || 'walk');
      setLocation(eventToEdit.location || 'Mumbai');
      setDate(eventToEdit.date ? new Date(eventToEdit.date).toISOString().slice(0, 10) : '');
      setCapacity(String(eventToEdit.capacity || 30));
      setStatus(eventToEdit.status || 'upcoming');
      setTags(eventToEdit.tags?.length ? eventToEdit.tags : (eventToEdit.interests || ['birds']));
      
      if (eventToEdit.image && eventToEdit.image.url) {
        setSelectedImage(eventToEdit.image);
        setSeenUrls([eventToEdit.image.url]);
      } else if (eventToEdit.imageUrl) {
        const imgObj: ActivityImage = {
          url: eventToEdit.imageUrl,
          source: 'custom',
          photographer: 'BNHS',
          alt: eventToEdit.title || eventToEdit.name || 'Nature Event'
        };
        setSelectedImage(imgObj);
        setSeenUrls([eventToEdit.imageUrl]);
      } else {
        setSelectedImage(null);
        setSeenUrls([]);
      }
      setSearchQueryUsed('');
      setImageSearchError(null);
    } else {
      setTitle('');
      setDescription('');
      setType('walk');
      setLocation('Mumbai');
      const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      setDate(d.toISOString().slice(0, 10));
      setCapacity('30');
      setStatus('upcoming');
      setTags(['birds', 'nature walks']);
      setSelectedImage(null);
      setSeenUrls([]);
      setSearchQueryUsed('');
      setImageSearchError(null);
    }
  }, [eventToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Find Single Best Image automatically
  const handleAutoFindImage = async (findNext = false) => {
    if (!title && !description && !tags.length) {
      setImageSearchError('Please enter event title or tags to find a relevant image.');
      return;
    }

    setIsSearchingImage(true);
    setImageSearchError(null);

    const exclude = findNext ? seenUrls : [];

    try {
      const res = await api.searchEventImage({
        title,
        name: title,
        description,
        type,
        tags,
        location,
        excludeUrls: exclude,
      });

      setSearchQueryUsed(res.query);

      if (res.image && res.image.url) {
        setSelectedImage(res.image);
        setSeenUrls((prev) => Array.from(new Set([...prev, res.image.url])));
      } else {
        setImageSearchError('No additional images found for this nature topic.');
      }
    } catch (err: any) {
      console.error('Auto image search failed:', err);
      setImageSearchError(err.message || 'Unable to connect to image search service.');
    } finally {
      setIsSearchingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !location || !date || !capacity) {
      setError('Please fill in all required fields.');
      return;
    }

    const numCapacity = parseInt(capacity, 10);
    if (isNaN(numCapacity) || numCapacity <= 0) {
      setError('Capacity must be a positive number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: Partial<AdminEventItem> = {
        title,
        name: title,
        description,
        type,
        location,
        date,
        capacity: numCapacity,
        status,
        tags,
        interests: tags,
        image: selectedImage,
        imageUrl: selectedImage ? selectedImage.url : null,
      };

      if (isEditing && eventToEdit) {
        await api.updateAdminEvent(eventToEdit.id || eventToEdit._id, payload);
      } else {
        await api.createAdminEvent(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save event. Please verify all inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(11, 31, 23, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          background: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--color-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--color-sage-light)',
                color: 'var(--color-forest-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-text-main)' }}>
                {isEditing ? 'Edit Nature Activity' : 'Create Nature Activity'}
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0 }}>
                {isEditing ? 'Update event parameters and imagery' : 'Publish a new field observation walk, camp, or workshop'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {error && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Section 1: Basic Event Details */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-forest-primary)', marginBottom: '12px' }}>
              1. Basic Information
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="filter-label">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flamingo Watch at TS Chanakya Wetlands"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div>
                <label className="filter-label">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the nature trail, target species, ecology focus, and gear requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="filter-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="filter-label">Activity Type *</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="filter-input">
                    <option value="walk">Nature Walk</option>
                    <option value="trail">Field Trail</option>
                    <option value="camp">Nature Camp</option>
                    <option value="course">Certificate Course</option>
                    <option value="volunteer">Volunteer Event</option>
                    <option value="monitoring">Fauna Monitoring</option>
                    <option value="conservation-project">Conservation Project</option>
                  </select>
                </div>

                <div>
                  <label className="filter-label">Publishing Status *</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="filter-input">
                    <option value="upcoming">Upcoming</option>
                    <option value="open">Open for Registration</option>
                    <option value="draft">Draft</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="full">Full / Sold Out</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Tags & Interests */}
          <div>
            <label className="filter-label">Tags & Nature Interests</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="Add custom tag (e.g. wetlands, flamingos)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="filter-input"
                style={{ flex: 1 }}
              />
              <button type="button" onClick={handleAddTag} className="btn btn-secondary btn-sm" style={{ padding: '0 14px' }}>
                <Plus size={14} /> Add
              </button>
            </div>

            {/* Active Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-sage-light)',
                    color: 'var(--color-forest-primary)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-forest-primary)', display: 'flex' }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            {/* Suggestions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {COMMON_TAGS.filter((t) => !tags.includes(t)).slice(0, 5).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTags([...tags, t])}
                  style={{
                    background: 'none',
                    border: '1px dashed var(--color-border)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  + {t}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Schedule, Location & Capacity */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-forest-primary)', marginBottom: '12px' }}>
              2. Schedule, Location & Capacity
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              <div>
                <label className="filter-label">Event Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div>
                <label className="filter-label">Location / City *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Navi Mumbai / TS Chanakya"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="filter-input"
                />
              </div>

              <div>
                <label className="filter-label">Max Capacity *</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  required
                  placeholder="30"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Fully Automatic Event Image System */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 800, color: '#064e3b' }}>
                  <ImageIcon size={18} color="#059669" /> Automatic Event Image
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Automatically selects the highest-relevance nature photography based on species, habitat, and event details.
                </div>
              </div>

              {/* Automatic Search / Refresh Trigger */}
              {!selectedImage && (
                <button
                  type="button"
                  disabled={isSearchingImage}
                  onClick={() => handleAutoFindImage(false)}
                  style={{
                    backgroundColor: '#047857',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: isSearchingImage ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(4, 120, 87, 0.2)',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {isSearchingImage ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Finding Best Match...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Find Relevant Image
                    </>
                  )}
                </button>
              )}
            </div>

            {searchQueryUsed && (
              <div
                style={{
                  fontSize: '0.74rem',
                  color: '#065f46',
                  backgroundColor: '#ecfdf5',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #a7f3d0',
                }}
              >
                Intelligent query: <strong>"{searchQueryUsed}"</strong>
              </div>
            )}

            {imageSearchError && (
              <div style={{ fontSize: '0.78rem', color: '#b91c1c', backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                {imageSearchError}
              </div>
            )}

            {/* Automatically Selected Image Preview Card */}
            {selectedImage ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  padding: '14px',
                  border: '1.5px solid #a7f3d0',
                  boxShadow: '0 2px 6px rgba(6, 78, 59, 0.04)',
                }}
              >
                {/* Large Preview Banner */}
                <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#e2e8f0' }}>
                  <img
                    src={selectedImage.url || selectedImage.smallUrl}
                    alt={selectedImage.alt || 'Auto-selected nature event'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      backgroundColor: 'rgba(6, 78, 59, 0.85)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckCircle2 size={13} color="#a7f3d0" /> Automatically Selected
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      backgroundColor: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(4px)',
                      color: '#f8fafc',
                      fontSize: '0.68rem',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    Source: {selectedImage.source || 'Pexels'}
                  </div>
                </div>

                {/* Metadata & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: '#1e293b', fontWeight: 600 }}>
                      Photo by <strong>{selectedImage.photographer || 'Pexels Contributor'}</strong>
                    </div>
                    {selectedImage.alt && (
                      <div style={{ fontSize: '0.72rem', color: '#64748b', maxWidth: '380px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedImage.alt}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedImage.attributionUrl && (
                      <a
                        href={selectedImage.attributionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          color: '#475569',
                          textDecoration: 'none',
                          fontSize: '0.74rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <ExternalLink size={12} /> View Source
                      </a>
                    )}

                    <button
                      type="button"
                      disabled={isSearchingImage}
                      onClick={() => handleAutoFindImage(true)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid #a7f3d0',
                        backgroundColor: '#ecfdf5',
                        color: '#047857',
                        fontWeight: 700,
                        fontSize: '0.74rem',
                        cursor: isSearchingImage ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {isSearchingImage ? (
                        <>
                          <Loader2 size={12} className="animate-spin" /> Searching...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={12} /> ↻ Find Another Image
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      title="Remove image"
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid #fee2e2',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        fontWeight: 600,
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px dashed #cbd5e1',
                  color: '#64748b',
                  fontSize: '0.8rem',
                }}
              >
                No image attached. When you create the activity, the system will automatically find and assign the best matching nature image.
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '10px 24px' }}>
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
