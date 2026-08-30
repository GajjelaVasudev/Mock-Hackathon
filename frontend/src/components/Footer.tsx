import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Heart, Shield, BookOpen, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Col 1 */}
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div className="nav-logo-badge" style={{ background: '#ffffff', border: '1.5px solid rgba(255,255,255,0.2)', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/bnhs-logo-bird.png" alt="BNHS Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
              </div>
              <h3 style={{ margin: 0 }}>Bombay Natural History Society</h3>
            </div>
            <p>
              Dedicated to wildlife research, biodiversity conservation, nature education, and citizen science across India since 1883.
            </p>
          </div>

          {/* Col 2 */}
          <div className="footer-col">
            <h4>Explore</h4>
            <ul>
              <li><Link to="/activities">All Nature Activities</Link></li>
              <li><Link to="/activities?type=walk">Guided Nature Walks</Link></li>
              <li><Link to="/activities?type=camp">Herpetology & Field Camps</Link></li>
              <li><Link to="/activities?type=course">Biodiversity Courses</Link></li>
              <li><Link to="/recommendations">Personalized Recommendations</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="footer-col">
            <h4>Engagement</h4>
            <ul>
              <li><Link to="/assistant">AI Knowledge Assistant</Link></li>
              <li><Link to="/volunteer">BNHS-SEVA Volunteering</Link></li>
              <li><Link to="/my-activities">My Activities & Registrations</Link></li>
              <li><Link to="/dashboard">Member Dashboard</Link></li>
              <li><Link to="/profile">Edit Interest Profile</Link></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="footer-col">
            <h4>Heritage & Science</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: '14px', lineHeight: 1.5 }}>
              Hornbill House, Dr. Sálim Ali Chowk, Shaheed Bhagat Singh Road, Mumbai 400 001.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--color-sage)' }}>
              <Shield size={14} /> Grounded on Archival Knowledge Base
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} Bombay Natural History Society (BNHS). Built with FastAPI, ChromaDB, and React.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>Conservation Research</span>
            <span>Citizen Science</span>
            <span>Education</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
