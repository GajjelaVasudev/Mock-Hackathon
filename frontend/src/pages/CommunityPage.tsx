import React, { useState, useEffect, useCallback } from 'react';
import {
  Home,
  User,
  Bookmark,
  MessageSquare,
  Bell,
  Shield,
  ShieldCheck,
  Plus,
  ArrowRight,
  LayoutGrid,
  List,
  Sparkles,
  ChevronDown,
  Loader2,
  Camera,
  Heart,
  Tag,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ExperiencePost } from '../types';
import { ExperienceCard } from '../components/community/ExperienceCard';
import { ShareExperienceModal } from '../components/community/ShareExperienceModal';
import { ImageLightbox } from '../components/community/ImageLightbox';
import { ReportModal } from '../components/community/ReportModal';
import { AdminModerationPanel } from '../components/community/AdminModerationPanel';
import { MyConversations } from '../components/community/MyConversations';
import { useUser } from '../context/UserContext';
import { getMediaUrl } from '../utils/media';
import { CATEGORY_PILLS, normalizeHashtag } from '../utils/communityTaxonomy';
import api from '../services/api';

type NavSection = 'all' | 'my_posts' | 'saved' | 'conversations' | 'mentions' | 'moderation';

export const CommunityPage: React.FC = () => {
  const { currentUser } = useUser();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'staff';
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigation State from URL
  const initialNav = (searchParams.get('tab') as NavSection) || 'all';
  const [activeNav, setActiveNav] = useState<NavSection>(
    ['all', 'my_posts', 'saved', 'conversations', 'mentions', 'moderation'].includes(initialNav)
      ? initialNav
      : 'all'
  );

  const initialCategory = searchParams.get('category') || 'all';
  const initialHashtag = searchParams.get('hashtag') || null;

  const [posts, setPosts] = useState<ExperiencePost[]>([]);
  const [hashtags, setHashtags] = useState<{ tag: string; count: number }[]>([]);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeHashtag, setActiveHashtag] = useState<string | null>(initialHashtag);
  const [activeSort, setActiveSort] = useState<'recent' | 'most_liked' | 'most_discussed'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Helper to sync URL search params cleanly
  const updateUrlParams = (newTab?: NavSection, newCat?: string, newTag?: string | null) => {
    const tab = newTab !== undefined ? newTab : activeNav;
    const cat = newCat !== undefined ? newCat : activeCategory;
    const tag = newTag !== undefined ? newTag : activeHashtag;

    const params: Record<string, string> = {};
    if (tab && tab !== 'all') params.tab = tab;
    if (cat && cat !== 'all') params.category = cat;
    if (tag) params.hashtag = tag.replace(/^#/, '');

    setSearchParams(params, { replace: true });
  };

  // Sync state if URL searchParams changes externally (e.g. browser back/forward)
  useEffect(() => {
    const urlTab = (searchParams.get('tab') as NavSection) || 'all';
    const urlCat = searchParams.get('category') || 'all';
    const urlTag = searchParams.get('hashtag') || null;

    if (['all', 'my_posts', 'saved', 'conversations', 'mentions', 'moderation'].includes(urlTab)) {
      setActiveNav(urlTab);
    }
    setActiveCategory(urlCat);
    setActiveHashtag(urlTag);
  }, [searchParams]);

  // Unread badge counts from My Conversations
  const [unreadTotal, setUnreadTotal] = useState(0);

  // Lightbox State
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Report Modal State
  const [reportTarget, setReportTarget] = useState<{ id: string; authorName: string } | null>(null);

  // Guidelines Modal State
  const [showGuidelines, setShowGuidelines] = useState(false);

  const handleNavChange = (nav: NavSection) => {
    setActiveNav(nav);
    updateUrlParams(nav, activeCategory, activeHashtag);
  };

  const handleCategorySelect = (catId: string) => {
    setActiveCategory(catId);
    setActiveHashtag(null); // Category selection resets specific hashtag filter
    updateUrlParams(activeNav, catId, null);
  };

  const handleHashtagClick = (tag: string) => {
    const cleanTag = tag.replace(/^#/, '');
    setActiveHashtag(cleanTag);
    setActiveCategory('all'); // Hashtag clicking sets independent hashtag filter
    updateUrlParams('all', 'all', cleanTag);
  };

  const fetchFeed = useCallback(async () => {
    if (activeNav === 'conversations' || activeNav === 'moderation') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.getCommunityFeed({
        category: activeCategory !== 'all' ? activeCategory : undefined,
        hashtag: activeHashtag || undefined,
        myPosts: activeNav === 'my_posts',
        saved: activeNav === 'saved',
        sort: activeSort,
        limit: 30,
      });

      setPosts(res.posts || []);
      if (res.hashtags && Array.isArray(res.hashtags)) {
        setHashtags(res.hashtags);
      }
    } catch (err) {
      console.error('Failed to fetch community feed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, activeHashtag, activeNav, activeSort]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handlePostCreated = (newPost: ExperiencePost) => {
    setPosts((prev) => [newPost, ...prev]);
    setIsShareModalOpen(false);
    fetchFeed(); // Refresh counts and feed
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => (p._id || p.id) !== postId));
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
    <div
      style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '24px 28px 80px',
        minHeight: 'calc(100vh - 80px)',
        backgroundColor: '#fafbfc',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '240px minmax(0, 1fr)',
          gap: '36px',
          alignItems: 'start',
        }}
      >
        {/* ======================================================== */}
        {/* 1. LEFT SIDEBAR                                         */}
        {/* ======================================================== */}
        <aside
          style={{
            position: 'sticky',
            top: '88px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Main Community Nav Items */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              backgroundColor: '#ffffff',
              padding: '12px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
            }}
          >
            {/* All Posts */}
            <button
              onClick={() => handleNavChange('all')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: activeNav === 'all' && !activeHashtag ? '#164e63' : 'transparent',
                color: activeNav === 'all' && !activeHashtag ? '#ffffff' : '#334155',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <Home size={18} />
              <span>All Posts</span>
            </button>

            {/* My Posts */}
            <button
              onClick={() => handleNavChange('my_posts')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: activeNav === 'my_posts' ? '#164e63' : 'transparent',
                color: activeNav === 'my_posts' ? '#ffffff' : '#334155',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <User size={18} />
              <span>My Posts</span>
            </button>

            {/* Saved */}
            <button
              onClick={() => handleNavChange('saved')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: activeNav === 'saved' ? '#164e63' : 'transparent',
                color: activeNav === 'saved' ? '#ffffff' : '#334155',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <Bookmark size={18} />
              <span>Saved</span>
            </button>

            {/* My Conversations */}
            <button
              onClick={() => handleNavChange('conversations')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: activeNav === 'conversations' ? '#164e63' : 'transparent',
                color: activeNav === 'conversations' ? '#ffffff' : '#334155',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MessageSquare size={18} />
                <span>My Conversations</span>
              </div>
              {unreadTotal > 0 && (
                <span
                  style={{
                    backgroundColor: '#e11d48',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '9999px',
                  }}
                >
                  {unreadTotal}
                </span>
              )}
            </button>

            {/* Mentions */}
            <button
              onClick={() => handleNavChange('mentions')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: activeNav === 'mentions' ? '#164e63' : 'transparent',
                color: activeNav === 'mentions' ? '#ffffff' : '#334155',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <Bell size={18} />
              <span>Mentions</span>
            </button>

            {/* Admin Moderation Panel (if admin/staff) */}
            {isAdmin && (
              <button
                onClick={() => handleNavChange('moderation')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: activeNav === 'moderation' ? '#164e63' : 'transparent',
                  color: activeNav === 'moderation' ? '#ffffff' : '#dc2626',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <ShieldCheck size={18} />
                <span>Moderation</span>
              </button>
            )}
          </div>

          {/* Explore Hashtags Section */}
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '18px 16px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '14px',
              }}
            >
              Explore Hashtags
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {hashtags.map((item) => {
                const isSelected = activeHashtag === item.tag;
                return (
                  <button
                    key={item.tag}
                    onClick={() => handleHashtagClick(item.tag)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isSelected ? '#f0fdf4' : 'none',
                      border: 'none',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: isSelected ? 800 : 600,
                        color: isSelected ? '#047857' : '#334155',
                      }}
                    >
                      #{item.tag}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Community Guidelines Card at Bottom */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#047857', fontWeight: 700, fontSize: '0.84rem' }}>
              <Shield size={16} />
              <span>Community Guidelines</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
              Help us keep BNHS Community positive, accurate, and respectful of wildlife.
            </p>
            <button
              onClick={() => setShowGuidelines(true)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: '#047857',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '4px',
                textAlign: 'left',
              }}
            >
              Learn More →
            </button>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* 2. MAIN CONTENT AREA                                    */}
        {/* ======================================================== */}
        <main style={{ minWidth: 0 }}>
          {/* A. If Active Tab is Conversations */}
          {activeNav === 'conversations' ? (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                  My Conversations 💬
                </h1>
                <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0 }}>
                  Real-time WhatsApp-style chat rooms for activities and field programs you've registered for.
                </p>
              </div>
              <MyConversations />
            </div>
          ) : activeNav === 'moderation' ? (
            /* B. If Active Tab is Moderation */
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                  Admin Moderation Panel 🛡️
                </h1>
                <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0 }}>
                  Review reported posts and messages to keep the nature platform safe and authentic.
                </p>
              </div>
              <AdminModerationPanel />
            </div>
          ) : (
            /* C. Main Social Image-First Community Feed */
            <div>
              {/* Header Title Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <h1
                    style={{
                      fontSize: '2.1rem',
                      fontWeight: 800,
                      color: '#0f172a',
                      margin: '0 0 4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    Community Feed 🌿
                  </h1>
                  <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0 }}>
                    {activeNav === 'my_posts'
                      ? 'Your published nature sightings and field experiences'
                      : activeNav === 'saved'
                      ? 'Your bookmarked naturalist observations and field notes'
                      : activeHashtag
                      ? `Posts tagged #${activeHashtag}`
                      : 'Share, discover and connect with fellow naturalists'}
                  </p>
                </div>

                {/* + Share Experience Button */}
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  style={{
                    backgroundColor: '#047857',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 20px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(4, 120, 87, 0.25)',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <Plus size={18} />
                  <span>Share Experience</span>
                </button>
              </div>

              {/* Category Filter Pills & Controls Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  marginBottom: '24px',
                  flexWrap: 'wrap',
                }}
              >
                {/* Category Pills */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    overflowX: 'auto',
                    paddingBottom: '4px',
                    maxWidth: '100%',
                  }}
                >
                  {CATEGORY_PILLS.map((cat) => {
                    const isSelected = activeCategory === cat.id && !activeHashtag;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                        style={{
                          padding: '7px 16px',
                          borderRadius: '9999px',
                          border: isSelected ? '1px solid #164e63' : '1px solid #e2e8f0',
                          backgroundColor: isSelected ? '#164e63' : '#ffffff',
                          color: isSelected ? '#ffffff' : '#334155',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                {/* Right Sort & View Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  {/* Sort Dropdown */}
                  <div style={{ position: 'relative' }}>
                    <select
                      value={activeSort}
                      onChange={(e) => setActiveSort(e.target.value as any)}
                      style={{
                        padding: '7px 28px 7px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#334155',
                        cursor: 'pointer',
                        appearance: 'none',
                        outline: 'none',
                      }}
                    >
                      <option value="recent">Most Recent</option>
                      <option value="most_liked">Most Liked</option>
                      <option value="most_discussed">Most Discussed</option>
                    </select>
                    <ChevronDown
                      size={14}
                      color="#64748b"
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>

                  {/* View Mode Toggle */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '2px',
                    }}
                  >
                    <button
                      onClick={() => setViewMode('grid')}
                      style={{
                        background: viewMode === 'grid' ? '#f1f5f9' : 'none',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: viewMode === 'grid' ? '#047857' : '#94a3b8',
                      }}
                      aria-label="Grid view"
                    >
                      <LayoutGrid size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      style={{
                        background: viewMode === 'list' ? '#f1f5f9' : 'none',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: viewMode === 'list' ? '#047857' : '#94a3b8',
                      }}
                      aria-label="List view"
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Feed Content */}
              {isLoading ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '80px 0',
                    color: '#047857',
                  }}
                >
                  <Loader2 size={36} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ marginTop: '12px', fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
                    Loading community field observations...
                  </p>
                </div>
              ) : posts.length === 0 ? (
                /* Empty Discovery State */
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px dashed #cbd5e1',
                    padding: '48px 24px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    maxWidth: '480px',
                    margin: '32px auto',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#ecfdf5',
                      color: '#047857',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem',
                    }}
                  >
                    🌿
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 800 }}>
                    Start the Nature Journal
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
                    Share your latest bird sighting, wildlife photograph, field observation, or conservation experience.
                  </p>
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    style={{
                      marginTop: '8px',
                      backgroundColor: '#047857',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 20px',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Plus size={16} /> Share Your First Experience
                  </button>
                </div>
              ) : (
                /* The Image-First Posts Grid (Matches the Visual Reference Screenshot!) */
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      viewMode === 'grid'
                        ? 'repeat(auto-fill, minmax(260px, 1fr))'
                        : 'minmax(0, 600px)',
                    gap: '24px',
                    justifyContent: viewMode === 'list' ? 'center' : 'stretch',
                  }}
                >
                  {posts.map((post) => (
                    <ExperienceCard
                      key={post._id || post.id}
                      post={post}
                      onPostDeleted={handlePostDeleted}
                      onOpenLightbox={handleOpenLightbox}
                      onOpenReport={handleOpenReport}
                      onHashtagClick={handleHashtagClick}
                      onCategoryClick={handleCategorySelect}
                      currentUserId={currentUser?.id}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Share Experience Modal */}
      <ShareExperienceModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onPostCreated={handlePostCreated}
      />

      {/* Image Lightbox Viewport */}
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
          isOpen={true}
          targetType="post"
          targetId={reportTarget.id}
          targetAuthor={reportTarget.authorName}
          onClose={() => setReportTarget(null)}
        />
      )}

      {/* Community Guidelines Info Modal */}
      {showGuidelines && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowGuidelines(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#047857' }}>
              <Shield size={22} />
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>
                BNHS Community Guidelines
              </h3>
            </div>
            <ul style={{ paddingLeft: '20px', color: '#334155', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 20px' }}>
              <li><strong>Ethical Birding & Photography:</strong> Keep a safe distance from nests and sensitive wildlife habitats.</li>
              <li><strong>Authentic Field Observations:</strong> Share genuine observations, date records, and locations.</li>
              <li><strong>Respectful Interaction:</strong> Keep discussions collaborative, scientific, and encouraging.</li>
              <li><strong>Verified Activity Attendance:</strong> Experiences linked to BNHS camps and walks carry verified badges.</li>
            </ul>
            <button
              onClick={() => setShowGuidelines(false)}
              style={{
                width: '100%',
                backgroundColor: '#047857',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
