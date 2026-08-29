import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  MessageSquareText,
  HeartHandshake,
  ArrowRight,
  Shield,
  CheckCircle2,
  TreeDeciduous,
  Bird,
  Eye,
  BookOpen,
} from 'lucide-react';
import { Activity } from '../types';
import { ActivityCard } from '../components/ActivityCard';
import { RegistrationModal } from '../components/RegistrationModal';
import api from '../services/api';

export const HomePage: React.FC = () => {
  const [featuredActivities, setFeaturedActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const res = await api.getActivities();
        setFeaturedActivities(res.activities.slice(0, 3));
      } catch {
        // ignore fallback
      }
    };
    loadFeatured();
  }, []);

  const handleRegister = (activity: Activity) => {
    setSelectedActivity(activity);
    setModalOpen(true);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <div className="hero-tag">
              <Shield size={14} />
              Preserving Biodiversity Since 1883
            </div>
            <h1 className="hero-title">
              Discover nature, learn, <span>participate</span> & contribute.
            </h1>
            <p className="hero-description">
              Connect with India’s foremost wildlife conservation NGO. Explore naturalist-led walks, herpetology field camps, citizen science, and our grounded AI Knowledge Assistant.
            </p>
            <div className="hero-actions">
              <Link to="/activities" className="btn btn-primary btn-lg">
                <Compass size={18} />
                Explore Activities
              </Link>
              <Link to="/recommendations" className="btn btn-secondary btn-lg">
                <Sparkles size={18} style={{ color: 'var(--color-mint)' }} />
                Get Recommendations
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <h4>20+</h4>
                <p>Authentic Activities</p>
              </div>
              <div className="stat-item">
                <h4>140+</h4>
                <p>Years of Conservation</p>
              </div>
              <div className="stat-item">
                <h4>68+</h4>
                <p>Indexed Knowledge Chunks</p>
              </div>
            </div>
          </div>

          {/* Hero Interactive Preview */}
          <div className="hero-card-preview">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--color-sage-light)',
                  color: 'var(--color-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.1rem', margin: 0 }}>Intelligent Recommendation</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Rule-based & content matching engine
                </p>
              </div>
            </div>

            <div style={{ background: 'var(--color-bg)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-forest-primary)', textTransform: 'uppercase' }}>
                  Top Match (94%)
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Navi Mumbai</span>
              </div>
              <h4 style={{ fontSize: '1.15rem', color: 'var(--color-forest-dark)', marginBottom: '8px' }}>
                Flamingo Watch at TS Chanakya
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                Guided wetland birding focusing on feeding ecology, mudflats, and seasonal migratory flocks.
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span className="tag">#birds</span>
                <span className="tag">#wetlands</span>
                <span className="tag">#photography</span>
              </div>
            </div>

            <Link to="/assistant" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
              <MessageSquareText size={16} />
              Ask AI Assistant about BNHS
            </Link>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section style={{ padding: '80px 0', background: 'var(--color-surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-emerald)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Conservation Pillars
            </span>
            <h2 style={{ fontSize: '2.4rem', marginTop: '8px', color: 'var(--color-forest-dark)' }}>
              How BNHS Engages the Community
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' }}>
            {/* Box 1 */}
            <div style={{ padding: '32px', borderRadius: 'var(--radius-xl)', background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--color-sage-light)', color: 'var(--color-forest-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Eye size={24} />
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '12px' }}>Nature & Tree Walks</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '16px' }}>
                Naturalist-led forest trails in CEC Goregaon, Vetal Tekdi Pune, Marine Drive avenue trees, and NRI wetlands.
              </p>
              <Link to="/activities?type=walk" style={{ fontWeight: 600, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Browse Walks <ArrowRight size={14} />
              </Link>
            </div>

            {/* Box 2 */}
            <div style={{ padding: '32px', borderRadius: 'var(--radius-xl)', background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: '#ffe3db', color: '#c94a29', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <TreeDeciduous size={24} />
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '12px' }}>Field Camps & Herpetology</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '16px' }}>
                Overnight immersive study camps in Western Ghats biodiversity hotspots including Matheran and Amboli.
              </p>
              <Link to="/activities?type=camp" style={{ fontWeight: 600, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Explore Camps <ArrowRight size={14} />
              </Link>
            </div>

            {/* Box 3 */}
            <div style={{ padding: '32px', borderRadius: 'var(--radius-xl)', background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: '#fef3c7', color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <HeartHandshake size={24} />
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '12px' }}>BNHS-SEVA Volunteering</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '16px' }}>
                Structured volunteer matching connecting member skills with bird-ringing digitisation, publications, and conservation.
              </p>
              <Link to="/volunteer" style={{ fontWeight: 600, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Join as Volunteer <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Activities Section */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px' }}>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-emerald)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Authentic Experiences
              </span>
              <h2 style={{ fontSize: '2.2rem', marginTop: '6px', color: 'var(--color-forest-dark)' }}>
                Upcoming Activities
              </h2>
            </div>
            <Link to="/activities" className="btn btn-secondary">
              View All 20 Activities
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="cards-grid" style={{ marginTop: 0 }}>
            {featuredActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onRegisterClick={handleRegister}
              />
            ))}
          </div>
        </div>
      </section>

      {/* AI Assistant Banner */}
      <section style={{ padding: '60px 0', background: 'linear-gradient(135deg, var(--color-forest-dark), var(--color-forest-primary))', color: '#fff' }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '32px' }}>
          <div style={{ maxWidth: '600px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', color: 'var(--color-sage)', marginBottom: '16px' }}>
              <Shield size={14} /> Grounded on 25-Page BNHS Archival Corpus
            </div>
            <h2 style={{ fontSize: '2.4rem', color: '#fff', marginBottom: '14px' }}>
              Have Questions About BNHS? Ask our AI Assistant.
            </h2>
            <p style={{ color: 'var(--color-text-light)', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Get verified factual answers about vulture conservation, Sálim Ali Centre, nature walks, and membership rules with precise page citations.
            </p>
          </div>
          <div>
            <Link to="/assistant" className="btn btn-accent btn-lg">
              <MessageSquareText size={20} />
              Open AI Assistant
            </Link>
          </div>
        </div>
      </section>

      {/* Registration Modal */}
      <RegistrationModal
        activity={selectedActivity}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};
