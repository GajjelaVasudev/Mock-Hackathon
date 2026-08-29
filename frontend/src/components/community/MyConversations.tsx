import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Camera,
  MapPin,
  Calendar,
  Users,
  Compass,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { MyConversation } from '../../types';
import { getMediaUrl } from '../../utils/media';
import api from '../../services/api';

interface MyConversationsProps {
  onCountChange?: (count: number, unreadTotal: number) => void;
}

export const MyConversations: React.FC<MyConversationsProps> = ({ onCountChange }) => {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<MyConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent' | 'photos' | 'unread'>('all');

  const fetchConversations = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setError(null);

    try {
      const res = await api.getMyConversations();
      const list = res.conversations || [];
      setConversations(list);

      const unreadSum = list.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
      if (onCountChange) {
        onCountChange(list.length, unreadSum);
      }
    } catch (err: any) {
      console.error('Failed to load my conversations:', err);
      if (!isSilent) {
        setError(err.message || "Couldn't load your conversations.");
      }
    } finally {
      if (!isSilent) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    fetchConversations(false);
  }, [fetchConversations]);

  // Polling every 8 seconds for background updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Filter & Search
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // 1. Filter Tab
      if (activeFilter === 'unread' && (!c.unreadCount || c.unreadCount === 0)) {
        return false;
      }
      if (activeFilter === 'photos' && !c.lastMessage?.hasImages) {
        return false;
      }
      if (activeFilter === 'recent') {
        const msgDate = new Date(c.lastMessage?.createdAt || 0).getTime();
        const twoDaysAgo = Date.now() - 48 * 3600 * 1000;
        if (msgDate < twoDaysAgo) return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = (c.activityTitle || '').toLowerCase().includes(query);
        const locationMatch = (c.location || '').toLowerCase().includes(query);
        const textMatch = (c.lastMessage?.text || '').toLowerCase().includes(query);
        const senderMatch = (c.lastMessage?.senderName || '').toLowerCase().includes(query);
        return titleMatch || locationMatch || textMatch || senderMatch;
      }

      return true;
    });
  }, [conversations, activeFilter, searchQuery]);

  // WhatsApp-style timestamp formatter
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);

      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      if (d.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      if (d.getFullYear() === now.getFullYear()) {
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      }
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const getCategoryIcon = (category?: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('bird')) return '🦅';
    if (cat.includes('marine') || cat.includes('coast')) return '🌊';
    if (cat.includes('flamingo') || cat.includes('wetland')) return '🦩';
    if (cat.includes('butterfly') || cat.includes('insect')) return '🦋';
    if (cat.includes('forest') || cat.includes('trail') || cat.includes('camp')) return '🌲';
    return '🌿';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header Controls: Search & Filter Tabs */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: '#ffffff',
          padding: '16px 18px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#064e3b', margin: '0 0 2px' }}>
              My Conversations
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
              Continue your conversations from activities you've joined.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true);
              fetchConversations(false);
            }}
            disabled={isRefreshing || isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search your conversations by activity, location, or message text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.86rem',
              outline: 'none',
              backgroundColor: '#f8fafc',
            }}
          />
        </div>

        {/* Quick Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(
            [
              { key: 'all', label: 'All Discussions' },
              { key: 'unread', label: 'Unread Only' },
              { key: 'photos', label: 'With Photos' },
              { key: 'recent', label: 'Last 48 Hours' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              style={{
                backgroundColor: activeFilter === tab.key ? '#047857' : '#f1f5f9',
                color: activeFilter === tab.key ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '20px',
                padding: '5px 12px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        /* WhatsApp-Style Skeleton Rows */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                padding: '14px 18px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#e2e8f0',
                  animation: 'pulse 1.5s infinite',
                }}
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ width: '50%', height: '14px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} />
                <div style={{ width: '75%', height: '12px', backgroundColor: '#f1f5f9', borderRadius: '4px' }} />
              </div>
              <div style={{ width: '40px', height: '12px', backgroundColor: '#f1f5f9', borderRadius: '4px' }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '14px',
            padding: '24px 20px',
            textAlign: 'center',
          }}
        >
          <AlertCircle size={28} color="#dc2626" style={{ margin: '0 auto 8px' }} />
          <div style={{ color: '#991b1b', fontWeight: 700, fontSize: '0.92rem', marginBottom: '6px' }}>
            {error}
          </div>
          <button
            type="button"
            onClick={() => fetchConversations(false)}
            style={{
              padding: '6px 16px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      ) : filteredConversations.length === 0 ? (
        /* Empty State */
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '48px 24px',
            textAlign: 'center',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <MessageSquare size={28} />
          </div>

          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: '0 0 6px' }}>
            {searchQuery || activeFilter !== 'all' ? 'No matching discussions' : 'No conversations yet'}
          </h4>

          <p style={{ color: '#64748b', fontSize: '0.86rem', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            {searchQuery || activeFilter !== 'all'
              ? 'Try changing your search keywords or switching filter tabs.'
              : "Once you participate in an activity discussion, your active conversations will appear here like WhatsApp chats."}
          </p>

          {!searchQuery && activeFilter === 'all' && (
            <button
              type="button"
              onClick={() => navigate('/activities')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#047857',
                color: '#ffffff',
                padding: '10px 20px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(4, 120, 87, 0.25)',
              }}
            >
              <Compass size={16} /> Explore Activities →
            </button>
          )}
        </div>
      ) : (
        /* WhatsApp-Style Conversation List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredConversations.map((conv) => {
            const hasUnread = (conv.unreadCount || 0) > 0;
            const lastMsg = conv.lastMessage;
            const timeDisplay = formatTime(lastMsg?.createdAt);

            return (
              <div
                key={conv.activityId || conv.activityMongoId}
                onClick={() => navigate(`/community/activity/${encodeURIComponent(conv.activityId || conv.activityMongoId)}`)}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  border: hasUnread ? '1.5px solid #059669' : '1px solid #e2e8f0',
                  boxShadow: hasUnread ? '0 3px 10px rgba(5, 150, 105, 0.08)' : '0 2px 5px rgba(0, 0, 0, 0.03)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Circular Activity Avatar */}
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: '#ecfdf5',
                    border: '1.5px solid #a7f3d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    flexShrink: 0,
                  }}
                >
                  {getCategoryIcon(conv.category)}
                </div>

                {/* Main Conversation Details */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <h4
                      style={{
                        fontSize: '0.96rem',
                        fontWeight: 800,
                        color: '#064e3b',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {conv.activityTitle}
                    </h4>

                    {timeDisplay && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: hasUnread ? 700 : 500,
                          color: hasUnread ? '#059669' : '#94a3b8',
                          flexShrink: 0,
                        }}
                      >
                        {timeDisplay}
                      </span>
                    )}
                  </div>

                  {/* Metadata Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '0.73rem',
                      color: '#64748b',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <MapPin size={10} /> {conv.location}
                    </span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Calendar size={10} /> {conv.activityDate}
                    </span>
                    {conv.participantCount > 0 && (
                      <>
                        <span>•</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Users size={10} /> {conv.participantCount}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Last Message Preview */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      marginTop: '2px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.84rem',
                        color: hasUnread ? '#1e293b' : '#64748b',
                        fontWeight: hasUnread ? 600 : 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      {lastMsg ? (
                        <>
                          <span style={{ fontWeight: 700, color: lastMsg.isCurrentUser ? '#059669' : '#334155' }}>
                            {lastMsg.senderName}:
                          </span>

                          {lastMsg.senderRole === 'staff' && (
                            <span
                              style={{
                                fontSize: '0.58rem',
                                fontWeight: 800,
                                backgroundColor: '#dcfce7',
                                color: '#15803d',
                                padding: '1px 3px',
                                borderRadius: '2px',
                                textTransform: 'uppercase',
                              }}
                            >
                              STAFF
                            </span>
                          )}

                          {lastMsg.senderRole === 'admin' && (
                            <span
                              style={{
                                fontSize: '0.58rem',
                                fontWeight: 800,
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                padding: '1px 3px',
                                borderRadius: '2px',
                                textTransform: 'uppercase',
                              }}
                            >
                              ADMIN
                            </span>
                          )}

                          {lastMsg.hasImages && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#0284c7' }}>
                              <Camera size={12} /> {lastMsg.imageCount > 1 ? `${lastMsg.imageCount} Photos` : 'Photo'}
                            </span>
                          )}

                          {lastMsg.text && (
                            <span>{lastMsg.text}</span>
                          )}
                        </>
                      ) : (
                        <span>No messages yet</span>
                      )}
                    </div>

                    {/* Unread Pill or Chevron */}
                    {hasUnread ? (
                      <span
                        style={{
                          backgroundColor: '#059669',
                          color: '#ffffff',
                          borderRadius: '12px',
                          padding: '2px 8px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {conv.unreadCount} new
                      </span>
                    ) : (
                      <ArrowRight size={14} color="#cbd5e1" style={{ flexShrink: 0 }} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
