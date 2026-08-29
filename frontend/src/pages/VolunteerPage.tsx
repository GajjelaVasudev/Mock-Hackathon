import React from 'react';
import { Link } from 'react-router-dom';
import {
  HeartHandshake,
  BookOpen,
  Binary,
  TreeDeciduous,
  Shield,
  MessageSquareText,
  CheckCircle2,
  ArrowRight,
  Users,
} from 'lucide-react';

export const VolunteerPage: React.FC = () => {
  return (
    <div className="container" style={{ padding: '40px 24px 80px' }}>
      {/* Hero */}
      <div style={{ maxWidth: '800px', margin: '0 auto 48px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: '#fef3c7', color: '#92400e', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px' }}>
          <HeartHandshake size={15} />
          BNHS-SEVA Volunteer Programme
        </div>
        <h1 style={{ fontSize: '2.8rem', color: 'var(--color-forest-dark)', marginBottom: '16px' }}>
          Contribute Your Skills to Conservation
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.15rem', lineHeight: 1.6 }}>
          BNHS-SEVA is a structured volunteer programme described in the BNHS Annual Report, designed to increase member involvement by matching volunteers with staff, scientists, and conservation researchers.
        </p>
      </div>

      {/* 3 Core Volunteer Domains */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px', marginBottom: '56px' }}>
        {/* Domain 1 */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: '#e0e7ff', color: '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Binary size={24} />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: 'var(--color-forest-dark)' }}>
              AI & Bird-Ringing Digitisation
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '16px' }}>
              Help digitise and verify transcription accuracy of historic bird-ringing cards and field observation records using AI-assisted quality control.
            </p>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              <strong>Ideal for:</strong> Students, tech enthusiasts, zoology researchers
            </div>
          </div>
          <Link to="/activities/bnhs_bird_ringing_digitisation" className="btn btn-secondary btn-sm">
            View Details <ArrowRight size={14} />
          </Link>
        </div>

        {/* Domain 2 */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--color-sage-light)', color: 'var(--color-forest-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <BookOpen size={24} />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: 'var(--color-forest-dark)' }}>
              Library, Archives & Publications
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '16px' }}>
              Support the historic BNHS Hornbill House library, cataloguing natural history journals, archival books, and educational outreach publications.
            </p>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              <strong>Ideal for:</strong> Literature lovers, archivists, history buffs
            </div>
          </div>
          <Link to="/activities/bnhs_seva_volunteer_program" className="btn btn-secondary btn-sm">
            View Details <ArrowRight size={14} />
          </Link>
        </div>

        {/* Domain 3 */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: '#ffe3db', color: '#c94a29', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <TreeDeciduous size={24} />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: 'var(--color-forest-dark)' }}>
              Habitat Restoration & Plantation
            </h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '16px' }}>
              Participate in on-ground native sapling plantation, fireline maintenance, and water-bund construction drives at BNHS reserves.
            </p>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              <strong>Ideal for:</strong> Corporate CSR, youth groups, active volunteers
            </div>
          </div>
          <Link to="/activities/bnhs_corporate_csr_plantation" className="btn btn-secondary btn-sm">
            View Details <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Knowledge Base Note & Assistant CTA */}
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '36px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
        }}
      >
        <div style={{ maxWidth: '600px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Shield size={16} style={{ color: 'var(--color-emerald)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-forest-primary)', textTransform: 'uppercase' }}>
              Documented in 141st Annual Report (Page 13)
            </span>
          </div>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--color-forest-dark)', marginBottom: '8px' }}>
            Want to know more about volunteering opportunities?
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            Ask our AI Assistant about the 90+ volunteers matched in BNHS-SEVA and how to contribute your specific skills.
          </p>
        </div>

        <Link to="/assistant" className="btn btn-primary btn-lg">
          <MessageSquareText size={18} />
          Ask Assistant About BNHS-SEVA
        </Link>
      </div>
    </div>
  );
};
