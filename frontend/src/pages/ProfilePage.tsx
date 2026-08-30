import React, { useState, useEffect } from 'react';
import {
  User,
  MapPin,
  Sparkles,
  Check,
  Save,
  CheckCircle,
  AlertCircle,
  Compass,
  Sliders,
  Shield,
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { UserProfile } from '../types';
import { NatureAchievementsSection } from '../components/achievements/NatureAchievementsSection';

const AVAILABLE_INTERESTS = [
  'birds',
  'birdwatching',
  'photography',
  'wetlands',
  'trees',
  'botany',
  'marine life',
  'reptiles',
  'amphibians',
  'herpetology',
  'monsoon forest',
  'night trails',
  'conservation',
  'citizen science',
  'volunteering',
  'AI digitisation',
  'camera traps',
  'entomology',
  'butterflies',
];

export const ProfilePage: React.FC = () => {
  const { currentUser, updateProfile } = useUser();

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: currentUser.name,
    email: currentUser.email,
    location: currentUser.location || 'Mumbai',
    age_group: currentUser.age_group || 'adult',
    experience_level: currentUser.experience_level || 'beginner',
    preferred_activity_type: currentUser.preferred_activity_type || '',
    interests: [...(currentUser.interests || [])],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      name: currentUser.name,
      email: currentUser.email,
      location: currentUser.location || 'Mumbai',
      age_group: currentUser.age_group || 'adult',
      experience_level: currentUser.experience_level || 'beginner',
      preferred_activity_type: currentUser.preferred_activity_type || '',
      interests: [...(currentUser.interests || [])],
    });
  }, [currentUser]);

  const toggleInterest = (interest: string) => {
    const current = formData.interests || [];
    if (current.includes(interest)) {
      setFormData({
        ...formData,
        interests: current.filter((i) => i !== interest),
      });
    } else {
      setFormData({
        ...formData,
        interests: [...current, interest],
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    try {
      await updateProfile(formData);
      setSuccessMsg('Profile and nature preferences updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Error saving profile: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container-narrow" style={{ padding: '40px 24px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-emerald)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Account Settings
          </span>
          {currentUser.role && (
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--color-sage-light)', color: 'var(--color-forest-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Role: {currentUser.role}
            </span>
          )}
        </div>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--color-forest-dark)', marginBottom: '8px' }}>
          Nature Engagement Profile
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>
          Manage your interests, location, and activity preferences used by our personalized recommendation engine.
        </p>
      </div>

      {/* Nature Achievements & Recognition Section */}
      <div style={{ marginBottom: '32px' }}>
        <NatureAchievementsSection userName={currentUser.name} />
      </div>

      {/* Main Profile Form */}
      <form
        onSubmit={handleSave}
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '36px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <h3 style={{ fontSize: '1.3rem', marginBottom: '24px', color: 'var(--color-forest-dark)' }}>
          Personal & Field Preferences
        </h3>

        {/* Name & Email */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label className="filter-label">Full Name</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="filter-input"
            />
          </div>
          <div>
            <label className="filter-label">Email Address</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="filter-input"
            />
          </div>
        </div>

        {/* Location, Age Group, Experience */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px', marginBottom: '28px' }}>
          <div>
            <label className="filter-label">Location / City</label>
            <select
              value={formData.location || 'Mumbai'}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="filter-select"
            >
              <option value="Mumbai">Mumbai</option>
              <option value="Navi Mumbai">Navi Mumbai</option>
              <option value="Pune">Pune</option>
              <option value="Delhi">Delhi (CEC Asola Bhatti)</option>
              <option value="Maharashtra">Maharashtra (General)</option>
              <option value="Other">Other India</option>
            </select>
          </div>

          <div>
            <label className="filter-label">Age Category</label>
            <select
              value={formData.age_group || 'adult'}
              onChange={(e) => setFormData({ ...formData, age_group: e.target.value })}
              className="filter-select"
            >
              <option value="student">Student</option>
              <option value="youth">Youth</option>
              <option value="adult">Adult</option>
              <option value="senior">Senior</option>
              <option value="all">All / Family</option>
            </select>
          </div>

          <div>
            <label className="filter-label">Experience Level</label>
            <select
              value={formData.experience_level || 'beginner'}
              onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
              className="filter-select"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <div>
            <label className="filter-label">Preferred Format</label>
            <select
              value={formData.preferred_activity_type || ''}
              onChange={(e) => setFormData({ ...formData, preferred_activity_type: e.target.value || null })}
              className="filter-select"
            >
              <option value="">Any Format</option>
              <option value="walk">Nature Walk</option>
              <option value="camp">Field Camp</option>
              <option value="course">Certificate Course</option>
              <option value="volunteer">Volunteer / SEVA</option>
            </select>
          </div>
        </div>

        {/* Interests Selector */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <label className="filter-label" style={{ margin: 0 }}>
              Nature Interests (Selected: {formData.interests?.length || 0})
            </label>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Click tags to toggle preferences
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {AVAILABLE_INTERESTS.map((interest) => {
              const isSelected = formData.interests?.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: `1.5px solid ${isSelected ? 'var(--color-emerald-light)' : 'var(--color-border)'}`,
                    background: isSelected ? 'var(--color-sage-light)' : 'var(--color-bg)',
                    color: isSelected ? 'var(--color-forest-primary)' : 'var(--color-text-muted)',
                  }}
                >
                  {isSelected && <Check size={14} style={{ color: 'var(--color-emerald)' }} />}
                  <span>{interest}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 18px',
              background: 'var(--color-success-bg)',
              color: 'var(--color-success)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Save Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
        >
          <Save size={18} />
          {isSaving ? 'Saving Preferences...' : 'Save Profile Changes'}
        </button>
      </form>
    </div>
  );
};
