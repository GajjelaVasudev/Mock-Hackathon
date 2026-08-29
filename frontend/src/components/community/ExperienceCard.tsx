import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Bookmark,
  MoreVertical,
  Flag,
  Trash2,
  Send,
  MapPin,
  Share2,
  Check,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ExperiencePost, CommunityComment } from '../../types';
import { getMediaUrl } from '../../utils/media';
import api from '../../services/api';

interface ExperienceCardProps {
  post: ExperiencePost;
  onPostDeleted?: (postId: string) => void;
  onOpenLightbox?: (images: string[], index: number) => void;
  onOpenReport?: (postId: string, authorName: string) => void;
  onHashtagClick?: (tag: string) => void;
  onCategoryClick?: (category: string) => void;
  currentUserId?: string;
  isAdmin?: boolean;
}

export const ExperienceCard: React.FC<ExperienceCardProps> = ({
  post,
  onPostDeleted,
  onOpenLightbox,
  onOpenReport,
  onHashtagClick,
  onCategoryClick,
  currentUserId,
  isAdmin = false,
}) => {
  const [isLiked, setIsLiked] = useState<boolean>(!!post.isLiked);
  const [reactionsCount, setReactionsCount] = useState<number>(post.reactionsCount || 0);
  const [isSaved, setIsSaved] = useState<boolean>(!!post.isSaved);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [comments, setComments] = useState<CommunityComment[]>(post.comments || []);
  const [commentsCount, setCommentsCount] = useState<number>(post.commentsCount || (post.comments?.length || 0));
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [imageError, setImageError] = useState(false);

  const authorName: string =
    (typeof post.user === 'object' && post.user
      ? post.user.name || post.user.username
      : post.userName) || 'Nature Enthusiast';

  const authorAvatar =
    typeof post.user === 'object' && post.user && post.user.avatar
      ? post.user.avatar
      : post.avatar || null;

  const isOwner =
    post.isOwner ||
    (currentUserId &&
      ((typeof post.user === 'object' && post.user?._id === currentUserId) ||
        post.user === currentUserId));

  // Compute primary image
  const primaryImage =
    post.imageUrls && post.imageUrls.length > 0
      ? getMediaUrl(post.imageUrls[0])
      : 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80';

  // Compute relative time string
  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  // Determine category badge
  const categoryTag = post.category || post.activityCategory || 'General Nature';
  const displayCategory = categoryTag;

  const handleToggleReaction = async () => {
    const prevLiked = isLiked;
    const prevCount = reactionsCount;

    // Optimistic UI update
    setIsLiked(!prevLiked);
    setReactionsCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await api.toggleExperienceReaction(post._id || post.id || '');
      setIsLiked(res.isLiked);
      setReactionsCount(res.reactionsCount);
    } catch {
      setIsLiked(prevLiked);
      setReactionsCount(prevCount);
    }
  };

  const handleToggleSave = async () => {
    const prevSaved = isSaved;
    setIsSaved(!prevSaved);

    try {
      const res = await api.toggleSaveExperiencePost(post._id || post.id || '');
      setIsSaved(res.isSaved);
    } catch {
      setIsSaved(prevSaved);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await api.addExperienceComment(post._id || post.id || '', newComment.trim());
      setComments((prev) => [...prev, res.comment]);
      setCommentsCount(res.commentsCount);
      setNewComment('');
    } catch (err: any) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this experience post?')) return;
    try {
      await api.deleteExperiencePost(post._id || post.id || '');
      if (onPostDeleted) {
        onPostDeleted(post._id || post.id || '');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete post');
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/community?post=${encodeURIComponent(post._id || post.id || '')}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    setShowMenu(false);
  };

  // Extract normalized hashtags
  const hashtags = (
    post.hashtags && post.hashtags.length > 0
      ? post.hashtags
      : (post.content.match(/#[a-zA-Z0-9_-]+/g) || [])
  ).map((t) => (t.startsWith('#') ? t : `#${t}`));

  // Clean caption without trailing hashtags
  const cleanCaption = post.content.replace(/#[a-zA-Z0-9_-]+/g, '').trim();

  return (
    <div
      className="experience-social-card"
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        position: 'relative',
      }}
    >
      {/* 1. Header: Avatar, Author, Timestamp, 3-dots Menu */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          background: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt={authorName}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid #e2e8f0',
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.82rem',
                flexShrink: 0,
              }}
            >
              {authorName.charAt(0).toUpperCase()}
            </div>
          )}

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#0f172a',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.2,
              }}
            >
              {authorName}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
              {formatTimeAgo(post.createdAt)}
            </div>
          </div>
        </div>

        {/* 3-Dot Options Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Post options"
          >
            <MoreVertical size={16} />
          </button>

          {showMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: '#ffffff',
                borderRadius: '10px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)',
                border: '1px solid #e2e8f0',
                zIndex: 40,
                minWidth: '150px',
                padding: '6px 0',
              }}
            >
              <button
                onClick={handleCopyLink}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 14px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  fontSize: '0.82rem',
                  color: '#334155',
                  cursor: 'pointer',
                }}
              >
                {copiedLink ? <Check size={14} color="#059669" /> : <Share2 size={14} />}
                {copiedLink ? 'Link Copied!' : 'Copy Link'}
              </button>

              {onOpenReport && !isOwner && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onOpenReport(post._id || post.id || '', authorName);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 14px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    fontSize: '0.82rem',
                    color: '#e11d48',
                    cursor: 'pointer',
                  }}
                >
                  <Flag size={14} /> Report Post
                </button>
              )}

              {(isOwner || isAdmin) && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleDelete();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 14px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    fontSize: '0.82rem',
                    color: '#dc2626',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Large Image Viewport with Overlay Badge */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '80%', // 5:4 aspect ratio for maximum visual presence
          backgroundColor: '#f1f5f9',
          overflow: 'hidden',
          cursor: onOpenLightbox ? 'pointer' : 'default',
        }}
        onClick={() => {
          if (onOpenLightbox && post.imageUrls && post.imageUrls.length > 0) {
            onOpenLightbox(post.imageUrls, 0);
          }
        }}
      >
        <img
          src={primaryImage}
          alt={post.content || 'BNHS Nature Experience'}
          loading="lazy"
          onError={() => setImageError(true)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
          }}
        />

        {/* Category Badge Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            zIndex: 10,
          }}
        >
          <span
            onClick={(e) => {
              e.stopPropagation();
              if (onCategoryClick) {
                onCategoryClick(displayCategory);
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: '#047857',
              color: '#ffffff',
              fontSize: '0.72rem',
              fontWeight: 700,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            {displayCategory}
          </span>
        </div>
      </div>

      {/* 3. Post Caption */}
      <div style={{ padding: '14px 16px 8px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.9rem',
            color: '#1e293b',
            fontWeight: 600,
            lineHeight: 1.45,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {cleanCaption || post.content}
        </p>

        {/* Hashtags list beneath caption */}
        {hashtags.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginTop: '8px',
            }}
          >
            {hashtags.map((tag, idx) => (
              <span
                key={idx}
                onClick={() => onHashtagClick && onHashtagClick(tag.replace(/^#/, ''))}
                style={{
                  fontSize: '0.75rem',
                  color: '#047857',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 4. Engagement Bar: Like, Comment, Save */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px 14px',
          borderTop: '1px solid #f1f5f9',
          marginTop: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Like Action */}
          <button
            onClick={handleToggleReaction}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isLiked ? '#e11d48' : '#64748b',
              fontSize: '0.84rem',
              fontWeight: 700,
              padding: 0,
              transition: 'transform 0.15s ease',
            }}
            aria-label="Like post"
          >
            <Heart size={18} fill={isLiked ? '#e11d48' : 'none'} color={isLiked ? '#e11d48' : '#64748b'} />
            <span>{reactionsCount}</span>
          </button>

          {/* Comment Action */}
          <button
            onClick={() => setShowComments(!showComments)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: showComments ? '#047857' : '#64748b',
              fontSize: '0.84rem',
              fontWeight: 700,
              padding: 0,
            }}
            aria-label="Comments"
          >
            <MessageCircle size={18} />
            <span>{commentsCount}</span>
          </button>
        </div>

        {/* Save / Bookmark Action */}
        <button
          onClick={handleToggleSave}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: isSaved ? '#047857' : '#64748b',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Save post"
        >
          <Bookmark size={18} fill={isSaved ? '#047857' : 'none'} color={isSaved ? '#047857' : '#64748b'} />
        </button>
      </div>

      {/* 5. Inline Comment Drawer */}
      {showComments && (
        <div
          style={{
            borderTop: '1px solid #f1f5f9',
            backgroundColor: '#f8fafc',
            padding: '12px 16px',
            maxHeight: '220px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Comment list */}
          <div
            style={{
              overflowY: 'auto',
              maxHeight: '130px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '10px',
            }}
          >
            {comments.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center', padding: '6px 0' }}>
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((c, i) => (
                <div key={c._id || i} style={{ fontSize: '0.8rem', lineHeight: 1.35 }}>
                  <strong style={{ color: '#0f172a', marginRight: '6px' }}>{c.userName}:</strong>
                  <span style={{ color: '#334155' }}>{c.content}</span>
                </div>
              ))
            )}
          </div>

          {/* Add comment form */}
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Add a nature comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 12px',
                borderRadius: '9999px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                outline: 'none',
                backgroundColor: '#ffffff',
              }}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmittingComment}
              style={{
                background: '#047857',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: !newComment.trim() ? 0.5 : 1,
              }}
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
