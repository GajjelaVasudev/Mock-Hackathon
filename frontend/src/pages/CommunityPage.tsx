import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Camera,
  MessageSquare,
  Filter,
  Plus,
  Compass,
  Heart,
  TrendingUp,
  Clock,
  ShieldCheck,
  Search,
  BookOpen,
  Calendar,
  MapPin,
  ArrowRight,
  ShieldAlert,
  Loader2,
  MessagesSquare,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { ExperiencePost, Activity } from '../types';
import { ExperienceCard } from '../components/community/ExperienceCard';
import { ShareExperienceModal } from '../components/community/ShareExperienceModal';
import { ImageLightbox } from '../components/community/ImageLightbox';
import { ReportModal } from '../components/community/ReportModal';
import { AdminModerationPanel } from '../components/community/AdminModerationPanel';
import { MyConversations } from '../components/community/MyConversations';
import { useUser } from '../context/UserContext';
import { getMediaUrl } from '../utils/media';
import api from '../services/api';

const FILTER_CATEGORIES = [
  { id: 'all', label: 'All Experiences' },
  { id: 'bird', label: 'Birds' },
  { id: 'marine', label: 'Marine' },
  { id: 'tree', label: 'Trees & Flora' },
  { id: 'camp', label: 'Field Camps' },
  { id: 'conservation', label: 'Conservation' },
  { id: 'volunteer', label: 'Volunteering' },
];

export const CommunityPage: React.FC = () => {
  const { currentUser } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab State: 'feed' | 'conversations' | 'moderation'
  const initialTab = (searchParams.get('tab') as any) || localStorage.getItem('bnhs_community_tab') || 'feed';
  const [activeTab, setActiveTab] = useState<'feed' | 'conversations' | 'moderation'>(
    initialTab === 'conversations' || initialTab === 'moderation' ? initialTab : 'feed'
  );

  const [posts, setPosts] = useState<ExperiencePost[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSort, setActiveSort] = useState<'recent' | 'most_liked' | 'most_discussed'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [myExperiences, setMyExperiences] = useState<ExperiencePost[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<Activity[]>([]);

  // Unread badge counts from My Conversations
  const [conversationsCount, setConversationsCount] = useState(0);
  const [unreadTotal, setUnreadTotal] = useState(0);

  // Lightbox State
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Report Modal State
  const [reportTarget, setReportTarget] = useState<{ id: string; authorName: string } | null>(null);

  const handleTabChange = (tab: 'feed' | 'conversations' | 'moderation') => {
    setActiveTab(tab);
    localStorage.setItem('bnhs_community_tab', tab);
    setSearchParams({ tab });
  };

  const fetchFeed = useCallback(async (resetPage = false) => {
    setIsLoading(true);
    try {
      const targetPage = resetPage ? 1 : page;
      const res = await api.getCommunityFeed({
        category: activeCategory !== 'all' ? activeCategory : undefined,
        sort: activeSort,
        page: targetPage,
        limit: 15,
        search: searchQuery.trim() || undefined,
      });

      if (resetPage || targetPage === 1) {
        setPosts(res.posts || []);
      } else {
        setPosts((prev) => [...prev, ...(res.posts || [])]);
      }
      setTotalPages(res.totalPages || 1);
      if (resetPage) setPage(1);
    } catch (err) {
      console.error('Failed to fetch community feed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, activeSort, searchQuery, page]);

  useEffect(() => {
    if (activeTab === 'feed') {
      fetchFeed(true);
    }
  }, [activeCategory, activeSort, activeTab]);

  useEffect(() => {
    fetchSidebarData();
  }, []);

  const fetchSidebarData = async () => {
    try {
      const [myExpRes, actRes] = await Promise.all([
        api.getMyExperiences().catch(() => ({ posts: [] })),
        api.getActivities().catch(() => ({ activities: [] })),
      ]);
      setMyExperiences(myExpRes.posts || []);
      setUpcomingActivities((actRes.activities || []).slice(0, 4));
    } catch (err) {
      console.error('Sidebar fetch error:', err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFeed(true);
  };

  const handlePostCreated = (newPost: ExperiencePost) => {
    setPosts((prev) => [newPost, ...prev]);
    setMyExperiences((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => (p._id || p.id) !== postId));
    setMyExperiences((prev) => prev.filter((p) => (p._id || p.id) !== postId));
  };

  const handleOpenLightbox = (images: string[], index: number) => {
    const fullUrls = images.map((img) => getMediaUrl(img));
    setLightboxImages(fullUrls);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const handleOpenReport = (postId: string, authorName: string) => {
    setReportTarget({ id: postId, authorName });
  };

  return (
    <div className="container" style={{ padding: '24px 20px 48px', maxWidth: '1120px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 60%, #059669 100%)',
          borderRadius: '20px',
          padding: '32px 28px',
          color: '#ffffff',
          marginBottom: '24px',
          boxShadow: '0 10px 25px -5px rgba(6, 78, 59, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '0.74rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px',
            }}
          >
            <Sparkles size={13} /> Activity-Verified Nature Community
          </div>

          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em', color: '#ffffff' }}>
            🌿 BNHS Community
          </h1>

          <p style={{ fontSize: '0.95rem', color: '#d1fae5', margin: 0, lineHeight: 1.5 }}>
            Connect with fellow naturalists, share verified field observations from activities you attended, upload photographs, and participate in WhatsApp-style activity discussions.
          </p>
        </div>

        {/* Share Experience CTA Button */}
        <div>
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            style={{
              backgroundColor: '#ffffff',
              color: '#064e3b',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 22px',
              fontSize: '0.92rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transition: 'transform 0.15s ease',
            }}
          >
            <Camera size={18} color="#059669" /> + Share Experience
          </button>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '22px',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '12px',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => handleTabChange('feed')}
          style={{
            padding: '9px 18px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: activeTab === 'feed' ? '#047857' : '#f1f5f9',
            color: activeTab === 'feed' ? '#ffffff' : '#475569',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'feed' ? '0 2px 6px rgba(4, 120, 87, 0.25)' : 'none',
          }}
        >
          <Compass size={16} /> Community Feed
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('conversations')}
          style={{
            padding: '9px 18px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: activeTab === 'conversations' ? '#047857' : '#f1f5f9',
            color: activeTab === 'conversations' ? '#ffffff' : '#475569',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'conversations' ? '0 2px 6px rgba(4, 120, 87, 0.25)' : 'none',
          }}
        >
          <MessagesSquare size={16} /> My Conversations
          {unreadTotal > 0 && (
            <span
              style={{
                backgroundColor: activeTab === 'conversations' ? '#ffffff' : '#059669',
                color: activeTab === 'conversations' ? '#047857' : '#ffffff',
                borderRadius: '12px',
                padding: '1px 6px',
                fontSize: '0.72rem',
                fontWeight: 800,
              }}
            >
              {unreadTotal}
            </span>
          )}
        </button>

        {currentUser?.role === 'admin' && (
          <button
            type="button"
            onClick={() => handleTabChange('moderation')}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: activeTab === 'moderation' ? '#dc2626' : '#fee2e2',
              color: activeTab === 'moderation' ? '#ffffff' : '#991b1b',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              marginLeft: 'auto',
            }}
          >
            <ShieldAlert size={16} /> Content Moderation
          </button>
        )}
      </div>

      {/* Tab 1: Moderation Panel (Admin) */}
      {activeTab === 'moderation' && currentUser?.role === 'admin' ? (
        <AdminModerationPanel />
      ) : activeTab === 'conversations' ? (
        /* Tab 2: My Conversations (WhatsApp-style chats list) */
        <MyConversations
          onCountChange={(count, unread) => {
            setConversationsCount(count);
            setUnreadTotal(unread);
          }}
        />
      ) : (
        /* Tab 3: Community Feed (Default) */
        <>
          {/* Filter Bar & Sorting */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '22px',
              paddingBottom: '14px',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            {/* Category Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {FILTER_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: activeCategory === cat.id ? '#047857' : '#cbd5e1',
                    backgroundColor: activeCategory === cat.id ? '#047857' : '#ffffff',
                    color: activeCategory === cat.id ? '#ffffff' : '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sort & Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
                <Search
                  size={14}
                  color="#94a3b8"
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  placeholder="Search field notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '6px 12px 6px 30px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8rem',
                    outline: 'none',
                    width: '180px',
                  }}
                />
              </form>

              <select
                value={activeSort}
                onChange={(e) => setActiveSort(e.target.value as any)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#334155',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="recent">Most Recent</option>
                <option value="most_liked">Most Liked</option>
                <option value="most_discussed">Most Discussed</option>
              </select>
            </div>
          </div>

          {/* Feed Content Grid (2 Columns: Posts + Sidebar) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) 320px',
              gap: '28px',
              alignItems: 'start',
            }}
          >
            {/* Left Column: Experience Feed Posts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {isLoading && page === 1 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <Loader2 size={32} className="animate-spin" color="#059669" style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Loading field observations...</div>
                </div>
              ) : posts.length === 0 ? (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '48px 24px',
                    textAlign: 'center',
                  }}
                >
                  <Compass size={40} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: '0 0 6px' }}>
                    No field notes found
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto 18px' }}>
                    Be the first to share your experience from a verified BNHS activity!
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(true)}
                    style={{
                      backgroundColor: '#047857',
                      color: '#ffffff',
                      padding: '9px 18px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                    }}
                  >
                    + Share First Field Note
                  </button>
                </div>
              ) : (
                <>
                  {posts.map((post) => (
                    <ExperienceCard
                      key={post._id || post.id}
                      post={post}
                      onPostDeleted={handlePostDeleted}
                      onOpenLightbox={handleOpenLightbox}
                      onOpenReport={handleOpenReport}
                    />
                  ))}

                  {/* Load More Button */}
                  {page < totalPages && (
                    <div style={{ textAlign: 'center', marginTop: '10px' }}>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => {
                          setPage((prev) => prev + 1);
                        }}
                        style={{
                          padding: '10px 24px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          color: '#047857',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        }}
                      >
                        {isLoading ? 'Loading More...' : 'Load More Experiences'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Column: Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* My Conversations Shortcut Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
                  borderRadius: '16px',
                  padding: '18px',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(6, 78, 59, 0.15)',
                  cursor: 'pointer',
                }}
                onClick={() => handleTabChange('conversations')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessagesSquare size={20} color="#a7f3d0" />
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                      My Conversations
                    </h3>
                  </div>

                  {unreadTotal > 0 && (
                    <span
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#064e3b',
                        borderRadius: '12px',
                        padding: '2px 8px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                      }}
                    >
                      {unreadTotal} new
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.8rem', color: '#d1fae5', margin: '0 0 12px', lineHeight: 1.4 }}>
                  Continue your discussions with fellow participants and BNHS naturalists.
                </p>

                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  Open Conversations <ArrowRight size={14} />
                </div>
              </div>

              {/* Activity Group Discussions Card */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '18px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <MessageSquare size={18} color="#059669" />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#064e3b', margin: 0 }}>
                    Activity Group Chats
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {upcomingActivities.map((act) => (
                    <div
                      key={act.id || act._id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#1e293b' }}>
                        {act.name || act.title}
                      </div>

                      <div style={{ display: 'flex', gap: '10px', fontSize: '0.72rem', color: '#64748b' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={11} color="#059669" /> {act.location}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Calendar size={11} color="#059669" /> {act.date ? new Date(act.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Upcoming'}
                        </span>
                      </div>

                      <Link
                        to={`/community/activity/${encodeURIComponent(act.id || act._id || '')}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#059669',
                          textDecoration: 'none',
                          marginTop: '2px',
                        }}
                      >
                        Join Discussion <ArrowRight size={12} />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* My Experiences Box */}
              {myExperiences.length > 0 && (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '18px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Camera size={16} color="#059669" />
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#064e3b', margin: 0 }}>
                      My Experiences ({myExperiences.length})
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {myExperiences.slice(0, 3).map((myExp) => (
                      <div
                        key={myExp._id || myExp.id}
                        style={{
                          fontSize: '0.78rem',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#064e3b', marginBottom: '2px' }}>
                          {myExp.activityName}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {myExp.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ethical Nature Guidelines Box */}
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  borderRadius: '16px',
                  border: '1px solid #bbf7d0',
                  padding: '18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#166534' }}>
                  <ShieldCheck size={18} />
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 800, margin: 0 }}>
                    BNHS Ethical Observation Guidelines
                  </h4>
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.75rem', color: '#15803d', lineHeight: 1.5 }}>
                  <li>Maintain respectful distance from wildlife habitats.</li>
                  <li>Do not use flash photography on nesting birds.</li>
                  <li>Verify species identification with BNHS guides.</li>
                  <li>Leave no trace on coastal trails and wetlands.</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Share Experience Modal */}
      {isShareModalOpen && (
        <ShareExperienceModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onPostCreated={handlePostCreated}
        />
      )}

      {/* Fullscreen Image Lightbox */}
      {isLightboxOpen && (
        <ImageLightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={() => setIsLightboxOpen(false)}
          onPrev={() => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : lightboxImages.length - 1))}
          onNext={() => setLightboxIndex((prev) => (prev < lightboxImages.length - 1 ? prev + 1 : 0))}
        />
      )}

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          isOpen={!!reportTarget}
          targetId={reportTarget.id}
          targetType="post"
          targetAuthor={reportTarget.authorName}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
};
