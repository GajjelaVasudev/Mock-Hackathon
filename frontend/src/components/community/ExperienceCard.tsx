import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  MapPin,
  CheckCircle2,
  MoreVertical,
  Flag,
  Trash2,
  Send,
  Sparkles,
  Users,
  Compass,
  ArrowRight,
  MessageSquare,
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
  currentUserId?: string;
  isAdmin?: boolean;
}

export const ExperienceCard: React.FC<ExperienceCardProps> = ({
  post,
  onPostDeleted,
  onOpenLightbox,
  onOpenReport,
  currentUserId,
  isAdmin = false,
}) => {
  const [isLiked, setIsLiked] = useState<boolean>(!!post.isLiked);
  const [reactionsCount, setReactionsCount] = useState<number>(post.reactionsCount || 0);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [comments, setComments] = useState<CommunityComment[]>(post.comments || []);
  const [commentsCount, setCommentsCount] = useState<number>(post.commentsCount || (post.comments?.length || 0));
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const authorName = typeof post.user === 'object' && post.user ? post.user.name || post.user.username : post.userName;
  const authorRole = typeof post.user === 'object' && post.user ? post.user.role : post.userRole;
  const isOwner = post.isOwner || (currentUserId && ((typeof post.user === 'object' && post.user?._id === currentUserId) || post.user === currentUserId));

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
      // Revert on error
      setIsLiked(prevLiked);
      setReactionsCount(prevCount);
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

  const activityTargetId = post.activityIdString || (typeof post.activity === 'object' && post.activity ? post.activity.id || post.activity._id : post.activity);

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid var(--color-border-subtle, #e2e8f0)',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        transition: 'box-shadow 0.2s',
      }}
    >
      {/* Top Author & Meta Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Avatar */}
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: authorRole === 'admin' ? '#064e3b' : authorRole === 'staff' ? '#059669' : '#3b82f6',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1rem',
              flexShrink: 0,
            }}
          >
            {authorName ? authorName.charAt(0).toUpperCase() : 'N'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
                {authorName || 'Naturalist'}
              </span>

              {authorRole && authorRole !== 'user' && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: authorRole === 'admin' ? '#fef3c7' : '#ecfdf5',
                    color: authorRole === 'admin' ? '#92400e' : '#047857',
                    border: `1px solid ${authorRole === 'admin' ? '#fde68a' : '#a7f3d0'}`,
                  }}
                >
                  {authorRole}
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
              {new Date(post.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>

        {/* Options Menu (Delete / Report) */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <MoreVertical size={18} />
          </button>

          {showMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                padding: '6px',
                zIndex: 10,
                minWidth: '140px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              {(isOwner || isAdmin) && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    handleDelete();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 10px',
                    fontSize: '0.78rem',
                    color: '#dc2626',
                    background: 'none',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <Trash2 size={13} /> Delete Post
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  if (onOpenReport) {
                    onOpenReport(post._id || post.id || '', authorName || 'Naturalist');
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  fontSize: '0.78rem',
                  color: '#64748b',
                  background: 'none',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <Flag size={13} /> Report Content
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Connected Activity Badge Box */}
      <div
        style={{
          backgroundColor: '#f0fdf4',
          borderRadius: '10px',
          padding: '10px 14px',
          border: '1px solid #bbf7d0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#064e3b' }}>
              🌿 {post.activityName}
            </span>

            {post.isAttendedVerified && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                <CheckCircle2 size={11} /> Attended
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', fontSize: '0.76rem', color: '#047857' }}>
            {post.activityDate && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} /> {post.activityDate}
              </span>
            )}
            {post.activityLocation && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} /> {post.activityLocation}
              </span>
            )}
          </div>
        </div>

        {/* Link to Activity Group Chat */}
        {activityTargetId && (
          <Link
            to={`/community/activity/${encodeURIComponent(activityTargetId)}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.76rem',
              fontWeight: 700,
              backgroundColor: '#ffffff',
              color: '#047857',
              border: '1px solid #86efac',
              borderRadius: '6px',
              padding: '5px 10px',
              textDecoration: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <MessageSquare size={13} /> Activity Group Chat <ArrowRight size={12} />
          </Link>
        )}
      </div>

      {/* Post Text Content */}
      <div style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.55, whiteSpace: 'pre-line' }}>
        {post.content}
      </div>

      {/* Attached Image Gallery */}
      {post.imageUrls && post.imageUrls.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: post.imageUrls.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '8px',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          {post.imageUrls.map((imgUrl, i) => {
            const resolvedUrl = getMediaUrl(imgUrl);
            return (
              <div
                key={i}
                onClick={() => onOpenLightbox && onOpenLightbox(post.imageUrls, i)}
                style={{
                  position: 'relative',
                  height: post.imageUrls.length === 1 ? '260px' : '160px',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  borderRadius: '8px',
                  backgroundColor: '#f1f5f9',
                }}
              >
                <img
                  src={resolvedUrl}
                  alt={`Nature capture ${i + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease',
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.innerHTML =
                        '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:0.75rem;color:#94a3b8;gap:4px;"><span>📷</span> Image unavailable</div>';
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Action Bar (Reactions & Comments) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '10px',
          borderTop: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* Reaction Button */}
          <button
            type="button"
            onClick={handleToggleReaction}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: isLiked ? '#e11d48' : '#64748b',
              fontWeight: isLiked ? 700 : 500,
              fontSize: '0.85rem',
              transition: 'transform 0.15s ease',
            }}
          >
            <Heart size={18} fill={isLiked ? '#e11d48' : 'none'} color={isLiked ? '#e11d48' : '#64748b'} />
            <span>{reactionsCount} {reactionsCount === 1 ? 'Like' : 'Likes'}</span>
          </button>

          {/* Comments Toggle Button */}
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: showComments ? '#059669' : '#64748b',
              fontWeight: 500,
              fontSize: '0.85rem',
            }}
          >
            <MessageCircle size={18} />
            <span>{commentsCount} {commentsCount === 1 ? 'Comment' : 'Comments'}</span>
          </button>
        </div>
      </div>

      {/* Expandable Comments Section */}
      {showComments && (
        <div
          style={{
            backgroundColor: '#f8fafc',
            borderRadius: '10px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginTop: '4px',
          }}
        >
          {/* Comment List */}
          {comments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {comments.map((comment, cIdx) => {
                const commentUser = typeof comment.user === 'object' && comment.user ? comment.user.name : comment.userName;
                const isUserRole = typeof comment.user === 'object' && comment.user ? comment.user.role : comment.userRole;

                return (
                  <div
                    key={comment._id || cIdx}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                          {commentUser || 'Naturalist'}
                        </span>
                        {isUserRole && isUserRole !== 'user' && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              backgroundColor: '#ecfdf5',
                              color: '#047857',
                            }}
                          >
                            {isUserRole}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        {new Date(comment.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.4 }}>
                      {comment.content}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center', padding: '6px 0' }}>
              No comments yet. Start the conversation!
            </div>
          )}

          {/* New Comment Input */}
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Write a comment or reply..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={isSubmittingComment}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                outline: 'none',
                backgroundColor: '#ffffff',
              }}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmittingComment}
              style={{
                backgroundColor: '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: !newComment.trim() || isSubmittingComment ? 'not-allowed' : 'pointer',
                opacity: !newComment.trim() || isSubmittingComment ? 0.6 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Send size={13} /> Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
