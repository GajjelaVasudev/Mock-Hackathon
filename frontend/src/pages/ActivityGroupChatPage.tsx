import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Send,
  Camera,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  Lock,
  CheckCheck,
  Clock,
  RefreshCw,
  ImageOff,
} from 'lucide-react';
import { CommunityMessage } from '../types';
import { ImageLightbox } from '../components/community/ImageLightbox';
import { useUser } from '../context/UserContext';
import { getMediaUrl } from '../utils/media';
import api from '../services/api';

interface ExtendedMessage extends CommunityMessage {
  tempId?: string;
  isSending?: boolean;
  hasError?: boolean;
}

export const ActivityGroupChatPage: React.FC = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUser();

  const [activityInfo, setActivityInfo] = useState<any>(null);
  const [permissions, setPermissions] = useState<{
    canChat: boolean;
    isRegistered: boolean;
    isAttended: boolean;
    isStaffOrAdmin: boolean;
  }>({
    canChat: false,
    isRegistered: false,
    isAttended: false,
    isStaffOrAdmin: false,
  });

  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scroll & Viewport State
  const [hasNewMessagesBelow, setHasNewMessagesBelow] = useState(false);
  const chatScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);
  const isInitialLoadDoneRef = useRef(false);

  // Lightbox State
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Check if scroll is near bottom
  const checkIsNearBottom = useCallback(() => {
    if (!chatScrollContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
      setHasNewMessagesBelow(false);
    }
  }, []);

  // 1. Load Activity Info & Chat Permissions
  const loadChatInfo = useCallback(async () => {
    if (!activityId) return;
    setIsLoadingInfo(true);
    setError(null);
    try {
      const data = await api.getActivityChatInfo(activityId);
      setActivityInfo(data.activity);
      setPermissions(data.permissions);
    } catch (err: any) {
      setError(err.message || 'Failed to load activity details');
    } finally {
      setIsLoadingInfo(false);
    }
  }, [activityId]);

  // 2. Initial Message History Load (Latest 50 messages)
  const loadInitialMessages = useCallback(async () => {
    if (!activityId) return;
    setIsLoadingInitial(true);
    try {
      const data = await api.getActivityMessages(activityId, undefined, 50);
      setMessages(data.messages || []);
      setHasMoreOlder(!!data.hasMore);

      // Scroll to bottom on initial load
      setTimeout(() => {
        scrollToBottom(false);
        isInitialLoadDoneRef.current = true;
      }, 60);
    } catch (err) {
      console.error('Failed to load initial messages:', err);
    } finally {
      setIsLoadingInitial(false);
    }
  }, [activityId, scrollToBottom]);

  useEffect(() => {
    isInitialLoadDoneRef.current = false;
    loadChatInfo();
    loadInitialMessages();
  }, [loadChatInfo, loadInitialMessages]);

  // 3. Load Older Messages (Pagination) when scrolling to top
  const loadOlderMessages = useCallback(async () => {
    if (!activityId || isLoadingOlder || !hasMoreOlder || messages.length === 0) return;

    const oldestMessage = messages[0];
    if (!oldestMessage || !oldestMessage.createdAt) return;

    setIsLoadingOlder(true);
    const container = chatScrollContainerRef.current;
    const prevScrollHeight = container ? container.scrollHeight : 0;

    try {
      const data = await api.getActivityMessages(activityId, oldestMessage.createdAt, 40);
      const older = data.messages || [];
      setHasMoreOlder(!!data.hasMore);

      if (older.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m._id || m.id || m.tempId));
          const filteredOlder = older.filter((m) => !existingIds.has(m._id || m.id));
          return [...filteredOlder, ...prev];
        });

        // Preserve scroll position so viewport does NOT jump
        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - prevScrollHeight;
          }
        });
      }
    } catch (err) {
      console.error('Failed to load older messages:', err);
    } finally {
      setIsLoadingOlder(false);
    }
  }, [activityId, isLoadingOlder, hasMoreOlder, messages]);

  // 4. Polling for genuinely new messages (every 4 seconds)
  useEffect(() => {
    if (!activityId || !permissions.canChat) return;

    const interval = setInterval(async () => {
      try {
        const data = await api.getActivityMessages(activityId, undefined, 30);
        const incoming = data.messages || [];

        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m._id || m.id));
          const trulyNew = incoming.filter((m) => (m._id || m.id) && !existingIds.has(m._id || m.id));

          if (trulyNew.length === 0) return prev;

          const updated = [...prev, ...trulyNew];

          if (isNearBottomRef.current) {
            setTimeout(() => scrollToBottom(true), 50);
          } else {
            setHasNewMessagesBelow(true);
          }

          return updated;
        });
      } catch {
        // silent polling
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activityId, permissions.canChat, scrollToBottom]);

  // Scroll Container Listener
  const handleContainerScroll = () => {
    if (!chatScrollContainerRef.current) return;
    const isBottom = checkIsNearBottom();
    isNearBottomRef.current = isBottom;

    if (isBottom) {
      setHasNewMessagesBelow(false);
    }

    // Trigger pagination when reaching within 40px of top
    if (chatScrollContainerRef.current.scrollTop < 40 && hasMoreOlder && !isLoadingOlder) {
      loadOlderMessages();
    }
  };

  // Image Selection Handler (Up to 5 images)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    for (const file of files) {
      if (selectedFiles.length + validFiles.length >= 5) {
        alert('Maximum 5 images allowed per message.');
        break;
      }
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type.toLowerCase())) {
        alert(`File "${file.name}" is not a valid format. Only JPG, PNG, and WEBP are supported.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 5MB size limit.`);
        continue;
      }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviewUrls((prev) => [...prev, ...validPreviews]);
  };

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // 5. Optimistic Send Handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && selectedFiles.length === 0) || isSending) return;

    const messageText = inputText.trim();
    const currentFiles = [...selectedFiles];
    const currentPreviews = [...previewUrls];

    // Clear inputs immediately
    setInputText('');
    setSelectedFiles([]);
    setPreviewUrls([]);
    setIsSending(true);

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const optimisticMessage: ExtendedMessage = {
      _id: tempId,
      tempId,
      activity: activityId!,
      user: {
        _id: currentUser?.id || 'me',
        name: currentUser?.name || 'You',
        username: currentUser?.username || '',
        role: currentUser?.role || 'user',
      },
      userName: currentUser?.name || 'You',
      userRole: currentUser?.role || 'user',
      message: messageText,
      imageUrls: currentPreviews, // Local preview blobs for instant feedback
      isCurrentUser: true,
      isSending: true,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(() => scrollToBottom(true), 20);

    try {
      let uploadedUrls: string[] = [];
      if (currentFiles.length > 0) {
        const formData = new FormData();
        currentFiles.forEach((file) => formData.append('images', file));
        const uploadRes = await api.uploadImages(formData);
        uploadedUrls = uploadRes.urls || [];
      }

      const res = await api.sendActivityMessage(activityId!, {
        message: messageText,
        imageUrls: uploadedUrls,
      });

      // Replace optimistic message with canonical MongoDB document
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId
            ? {
                ...res.chatMessage,
                isCurrentUser: true,
                isSending: false,
              }
            : msg
        )
      );
      setTimeout(() => scrollToBottom(true), 20);
    } catch (err: any) {
      console.error('Send error:', err);
      // Mark as failed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempId
            ? { ...msg, isSending: false, hasError: true }
            : msg
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenLightbox = (images: string[], index: number) => {
    const fullUrls = images.map((img) => getMediaUrl(img));
    setLightboxImages(fullUrls);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  // Helper to format date groups
  const formatDateGroup = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'TODAY';
    if (d.toDateString() === yesterday.toDateString()) return 'YESTERDAY';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (isLoadingInfo) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <Loader2 size={32} className="animate-spin" color="#059669" style={{ margin: '0 auto 12px' }} />
        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Connecting to Activity Group Discussion...</div>
      </div>
    );
  }

  if (error || !activityInfo) {
    return (
      <div className="container" style={{ padding: '40px 20px', maxWidth: '600px', textAlign: 'center' }}>
        <AlertCircle size={40} color="#dc2626" style={{ margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: '1.2rem', color: '#991b1b', marginBottom: '8px' }}>Activity Discussion Not Found</h2>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '20px' }}>
          {error || 'Unable to load activity discussion.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/community')}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            backgroundColor: '#059669',
            color: '#ffffff',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Return to Community
        </button>
      </div>
    );
  }

  return (
    <div
      className="container"
      style={{
        padding: '16px 16px 32px',
        maxWidth: '880px',
        height: 'calc(100vh - 90px)',
        minHeight: '580px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* WhatsApp-Style Event Header Bar */}
      <div
        style={{
          backgroundColor: '#064e3b',
          borderRadius: '16px 16px 0 0',
          padding: '14px 18px',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => navigate('/community')}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
            }}
            title="Back to Community"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                🌿 {activityInfo.name || activityInfo.title}
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '12px', fontSize: '0.74rem', color: '#a7f3d0', marginTop: '2px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={11} /> {activityInfo.date}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={11} /> {activityInfo.location}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Users size={11} /> {activityInfo.participantCount} participants
              </span>
            </div>
          </div>
        </div>

        {/* Toggle Details Button */}
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#d1fae5',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Details
        </button>
      </div>

      {/* Expandable Activity Details Banner */}
      {showDetails && (
        <div
          style={{
            backgroundColor: '#047857',
            padding: '12px 18px',
            color: '#ffffff',
            fontSize: '0.82rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          <div style={{ color: '#d1fae5', lineHeight: 1.4 }}>
            {activityInfo.description || 'Join fellow naturalists in this verified BNHS field activity discussion.'}
          </div>
          <div style={{ display: 'flex', gap: '14px', fontSize: '0.74rem', color: '#a7f3d0', flexWrap: 'wrap' }}>
            <span><strong>Difficulty:</strong> {activityInfo.difficulty}</span>
            <span><strong>Category:</strong> {activityInfo.category}</span>
            <span><strong>Status:</strong> {activityInfo.status}</span>
          </div>
        </div>
      )}

      {/* Permission Gate (If not registered) */}
      {!permissions.canChat ? (
        <div
          style={{
            flex: 1,
            backgroundColor: '#f8fafc',
            borderLeft: '1px solid #e2e8f0',
            borderRight: '1px solid #e2e8f0',
            borderBottom: '1px solid #e2e8f0',
            borderRadius: '0 0 16px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Lock size={26} />
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>
            Participant-Only Group Chat
          </h3>

          <p style={{ fontSize: '0.86rem', color: '#64748b', maxWidth: '440px', margin: '0 0 20px', lineHeight: 1.5 }}>
            To maintain a safe and authentic nature discussion, activity group chats are reserved for registered participants, leaders, and BNHS staff.
          </p>

          <Link
            to={`/activities/${encodeURIComponent(activityInfo.id || activityInfo._id)}`}
            style={{
              backgroundColor: '#047857',
              color: '#ffffff',
              padding: '10px 22px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.88rem',
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(4, 120, 87, 0.25)',
            }}
          >
            View Activity & Register
          </Link>
        </div>
      ) : (
        <>
          {/* WhatsApp-Style Chat Bubble Container (Fixed Scroll Region) */}
          <div
            ref={chatScrollContainerRef}
            onScroll={handleContainerScroll}
            style={{
              flex: 1,
              backgroundColor: '#efeae2',
              backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              borderLeft: '1px solid #e2e8f0',
              borderRight: '1px solid #e2e8f0',
              padding: '18px 16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              position: 'relative',
            }}
          >
            {/* Top Indicator: Loading Older Messages / Beginning of Conversation */}
            {isLoadingOlder && (
              <div style={{ textAlign: 'center', padding: '6px 0' }}>
                <span style={{ fontSize: '0.72rem', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#ffffff', padding: '3px 10px', borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                  <Loader2 size={12} className="animate-spin" /> Loading older messages...
                </span>
              </div>
            )}

            {!hasMoreOlder && messages.length > 0 && (
              <div style={{ textAlign: 'center', margin: '4px 0 8px' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', backgroundColor: 'rgba(255,255,255,0.7)', padding: '2px 8px', borderRadius: '8px' }}>
                  🌱 Beginning of activity discussion
                </span>
              </div>
            )}

            {isLoadingInitial ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Loader2 size={26} className="animate-spin" color="#059669" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Loading conversation history...</div>
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b', fontSize: '0.86rem' }}>
                👋 No messages yet in this group discussion. Say hello and share your sighting questions!
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe =
                  msg.isCurrentUser ||
                  (currentUser &&
                    ((typeof msg.user === 'object' && msg.user?._id === currentUser.id) ||
                      msg.user === currentUser.id));

                const senderName =
                  typeof msg.user === 'object' && msg.user
                    ? msg.user.name || msg.user.username
                    : msg.userName;
                const senderRole =
                  typeof msg.user === 'object' && msg.user ? msg.user.role : msg.userRole;

                // Date separator divider logic
                const currentDateGroup = formatDateGroup(msg.createdAt);
                const prevDateGroup =
                  index > 0 ? formatDateGroup(messages[index - 1].createdAt) : null;
                const showDateHeader = currentDateGroup !== prevDateGroup;

                return (
                  <React.Fragment key={msg._id || msg.tempId || index}>
                    {showDateHeader && (
                      <div style={{ textAlign: 'center', margin: '8px 0 6px' }}>
                        <span
                          style={{
                            backgroundColor: '#ffffff',
                            color: '#64748b',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '12px',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {currentDateGroup}
                        </span>
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                        width: '100%',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '75%',
                          backgroundColor: isMe ? '#d9fdd3' : '#ffffff',
                          borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                          padding: '8px 12px',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        {/* Sender Name & Role Tag (for other participants) */}
                        {!isMe && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <span
                              style={{
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                color:
                                  senderRole === 'staff'
                                    ? '#047857'
                                    : senderRole === 'admin'
                                    ? '#991b1b'
                                    : '#0284c7',
                              }}
                            >
                              {senderName || 'Naturalist'}
                            </span>

                            {senderRole && senderRole !== 'user' && (
                              <span
                                style={{
                                  fontSize: '0.6rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  padding: '1px 4px',
                                  borderRadius: '3px',
                                  backgroundColor: senderRole === 'admin' ? '#fee2e2' : '#dcfce7',
                                  color: senderRole === 'admin' ? '#991b1b' : '#15803d',
                                }}
                              >
                                {senderRole}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Text Message */}
                        {msg.message && (
                          <div style={{ fontSize: '0.86rem', color: '#1e293b', lineHeight: 1.45, whiteSpace: 'pre-line' }}>
                            {msg.message}
                          </div>
                        )}

                        {/* Attached Images Grid */}
                        {msg.imageUrls && msg.imageUrls.length > 0 && (
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns:
                                msg.imageUrls.length === 1
                                  ? '1fr'
                                  : msg.imageUrls.length === 2
                                  ? '1fr 1fr'
                                  : 'repeat(auto-fit, minmax(100px, 1fr))',
                              gap: '6px',
                              marginTop: '4px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                            }}
                          >
                            {msg.imageUrls.map((imgUrl: string, i: number) => {
                              const resolvedUrl = getMediaUrl(imgUrl);
                              return (
                                <div
                                  key={i}
                                  onClick={() => handleOpenLightbox(msg.imageUrls || [], i)}
                                  style={{
                                    width: msg.imageUrls && msg.imageUrls.length === 1 ? '220px' : '110px',
                                    height: msg.imageUrls && msg.imageUrls.length === 1 ? '160px' : '95px',
                                    borderRadius: '6px',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    backgroundColor: '#e2e8f0',
                                    position: 'relative',
                                  }}
                                >
                                  <img
                                    src={resolvedUrl}
                                    alt={`Observation ${i + 1}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const parent = e.currentTarget.parentElement;
                                      if (parent) {
                                        parent.innerHTML =
                                          '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:0.68rem;color:#94a3b8;gap:3px;"><span style="font-size:12px;">📷</span> Image unavailable</div>';
                                      }
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Message Timestamp & Status */}
                        <div
                          style={{
                            fontSize: '0.66rem',
                            color: '#64748b',
                            alignSelf: 'flex-end',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            marginTop: '2px',
                          }}
                        >
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>

                          {isMe && (
                            msg.isSending ? (
                              <Clock size={11} color="#94a3b8" />
                            ) : msg.hasError ? (
                              <span style={{ color: '#dc2626', fontSize: '0.64rem' }}>Failed</span>
                            ) : (
                              <CheckCheck size={12} color="#059669" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}

            {/* "↓ New messages" Floating Pill */}
            {hasNewMessagesBelow && (
              <button
                type="button"
                onClick={() => scrollToBottom(true)}
                style={{
                  position: 'sticky',
                  bottom: '10px',
                  alignSelf: 'center',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
                  cursor: 'pointer',
                  zIndex: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                ↓ New messages
              </button>
            )}
          </div>

          {/* Bottom Message Composer (Fixed in Card) */}
          <div
            style={{
              backgroundColor: '#f0f2f5',
              borderRadius: '0 0 16px 16px',
              border: '1px solid #e2e8f0',
              borderTop: 'none',
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              flexShrink: 0,
            }}
          >
            {/* Multiple Image Previews before sending */}
            {previewUrls.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {previewUrls.map((pUrl, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      width: '54px',
                      height: '54px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1.5px solid #059669',
                    }}
                  >
                    <img src={pUrl} alt="Upload preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => handleRemoveSelectedFile(idx)}
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      title="Remove image"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  {previewUrls.length} {previewUrls.length === 1 ? 'photo' : 'photos'} attached
                </span>
              </div>
            )}

            <form onSubmit={handleSendMessage} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Photo Upload Button */}
              <label
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                title="Attach photos (up to 5)"
              >
                <Camera size={18} color="#059669" />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </label>

              {/* Text Input */}
              <input
                type="text"
                placeholder="Write a message to group participants..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isSending}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '24px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.86rem',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                }}
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={(!inputText.trim() && selectedFiles.length === 0) || isSending}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#047857',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: (!inputText.trim() && selectedFiles.length === 0) || isSending ? 'not-allowed' : 'pointer',
                  opacity: (!inputText.trim() && selectedFiles.length === 0) || isSending ? 0.5 : 1,
                  flexShrink: 0,
                  boxShadow: '0 2px 5px rgba(4, 120, 87, 0.3)',
                }}
                title="Send message"
              >
                {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </div>
        </>
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
    </div>
  );
};
