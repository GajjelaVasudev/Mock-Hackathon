import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Sparkles,
  Shield,
  Trash2,
  BookOpen,
  CornerDownRight,
  HelpCircle,
  RotateCcw,
  Compass,
} from 'lucide-react';
import { ChatMessage as ChatMessageType, ChatActivityCardData, PendingRegistrationData, PendingVolunteerData } from '../types';
import { ChatMessage } from '../components/ChatMessage';
import { useUser } from '../context/UserContext';
import api from '../services/api';

const SUGGESTED_PROMPTS = [
  'What events can I register for?',
  'Which bird watching events are available?',
  'What can I do this weekend?',
  'Recommend the best activity for me',
  'What can I volunteer for?',
  'What is BNHS?',
  'Show me volunteer opportunities',
  'Can I register for the Flamingo Watch?',
  'Which events need volunteers?',
  'What beginner activities can I join?',
];

export const AssistantPage: React.FC = () => {
  const { currentUser } = useUser();

  // Stable session ID for multi-turn conversational memory
  const [sessionId, setSessionId] = useState<string>(() => {
    return localStorage.getItem('bnhs_chat_session_id') || `session_${Date.now()}`;
  });

  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: 'welcome_initial',
      sender: 'assistant',
      text: "Namaste! I am your **AI Nature Guide & Registration Assistant**, grounded directly on the Bombay Natural History Society's archival corpus with multi-turn memory.\n\nYou can ask about BNHS history, camps, bird walks, or directly ask: *'What events can I register for?'*, *'Recommend activities for me'*, or *'Register me for the Flamingo Watch'*.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [lastContextResolved, setLastContextResolved] = useState<string | null>(null);

  // Active activities tracked in the conversation for references ("the first one", "that one")
  const [activeActivities, setActiveActivities] = useState<ChatActivityCardData[]>([]);
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistrationData | null>(null);
  const [pendingVolunteer, setPendingVolunteer] = useState<PendingVolunteerData | null>(null);
  const [isVolunteering, setIsVolunteering] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('bnhs_chat_session_id', sessionId);
  }, [sessionId]);

  // Safe inner-container scroll without moving the browser window
  const scrollToBottom = useCallback((smooth = true) => {
    const container = messagesContainerRef.current;
    if (container) {
      if (smooth) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      } else {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isTyping, isRegistering, scrollToBottom]);

  // Send general message
  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isTyping || isRegistering) return;

    const userMessageId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const userMsg: ChatMessageType = {
      id: userMessageId,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Immediately append user message
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      const response = await api.askAssistant(
        textToSend,
        sessionId,
        currentUser || undefined,
        activeActivities.length > 0 ? activeActivities : undefined,
        pendingRegistration?.activityId
      );

      const displayText = response.answer || "I could not find sufficient information about this in the BNHS knowledge base.";
      if (response.rewritten_query && response.rewritten_query.toLowerCase() !== textToSend.toLowerCase()) {
        setLastContextResolved(response.rewritten_query);
      } else {
        setLastContextResolved(null);
      }

      // Update active session activities if new activities returned
      if (response.activities && Array.isArray(response.activities) && response.activities.length > 0) {
        setActiveActivities(response.activities);
      }

      // Update pending registration state
      if (response.pendingRegistration) {
        setPendingRegistration(response.pendingRegistration);
      } else if (response.intent === 'REGISTRATION_CONFIRMATION' || response.intent === 'REGISTRATION_CANCEL') {
        setPendingRegistration(null);
      }

      const assistantMessageId = `assistant_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const assistantMsg: ChatMessageType = {
        id: assistantMessageId,
        sender: 'assistant',
        text: displayText,
        sources: response.sources || [],
        intent: response.intent,
        activities: response.activities,
        pendingRegistration: response.pendingRegistration,
        registrationResult: response.registrationResult,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMessageId = `error_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const errorMsg: ChatMessageType = {
        id: errorMessageId,
        sender: 'assistant',
        text: `⚠️ ${err.message || 'Unable to retrieve answer from BNHS assistant. Please ensure the backend is running.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Direct Click on [Register] button inside an activity card
  const handleRegisterActivity = async (activity: ChatActivityCardData) => {
    const actId = activity.id || activity._id || '';
    const actTitle = activity.title || activity.name || 'BNHS Activity';

    // Append a simulated prompt or trigger registration request
    const userMessageId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const userMsg: ChatMessageType = {
      id: userMessageId,
      sender: 'user',
      text: `Register me for ${actTitle}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await api.askAssistant(
        `Register me for ${actTitle}`,
        sessionId,
        currentUser || undefined,
        [activity],
        actId
      );

      if (response.pendingRegistration) {
        setPendingRegistration(response.pendingRegistration);
      }

      const assistantMessageId = `assistant_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const assistantMsg: ChatMessageType = {
        id: assistantMessageId,
        sender: 'assistant',
        text: response.answer || `You're about to register for ${actTitle}. Would you like to confirm?`,
        pendingRegistration: response.pendingRegistration || {
          activityId: actId,
          activityTitle: actTitle,
          date: activity.date,
          location: activity.location,
          type: activity.type,
          difficulty: activity.difficulty,
        },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMessageId = `error_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setMessages((prev) => [
        ...prev,
        {
          id: errorMessageId,
          sender: 'assistant',
          text: `⚠️ Could not process registration request: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // User Clicks [Confirm Registration] inside chat
  const handleConfirmRegistration = async (activityId: string) => {
    setIsRegistering(true);

    const userMessageId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const userMsg: ChatMessageType = {
      id: userMessageId,
      sender: 'user',
      text: 'Yes, confirm registration',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await api.askAssistant(
        'confirm',
        sessionId,
        currentUser || undefined,
        activeActivities,
        activityId,
        true
      );

      setPendingRegistration(null);

      // Mark this activity as registered in local active activities state
      setActiveActivities((prev) =>
        prev.map((act) =>
          (act.id === activityId || act._id === activityId)
            ? { ...act, isRegistered: true }
            : act
        )
      );

      const assistantMessageId = `assistant_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const assistantMsg: ChatMessageType = {
        id: assistantMessageId,
        sender: 'assistant',
        text: response.answer,
        intent: response.intent,
        registrationResult: response.registrationResult,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMessageId = `error_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setMessages((prev) => [
        ...prev,
        {
          id: errorMessageId,
          sender: 'assistant',
          text: `⚠️ Registration failed: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setIsRegistering(false);
    }
  };

  // User Clicks [Cancel] inside chat
  const handleCancelRegistration = async (activityId: string) => {
    const userMessageId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const userMsg: ChatMessageType = {
      id: userMessageId,
      sender: 'user',
      text: 'Cancel registration',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setPendingRegistration(null);

    try {
      const response = await api.askAssistant(
        'cancel',
        sessionId,
        currentUser || undefined,
        activeActivities,
        activityId,
        false
      );

      const assistantMessageId = `assistant_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          sender: 'assistant',
          text: response.answer || 'Registration cancelled. Let me know if you would like to explore other walks!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      // ignore
    }
  };

  // ============================================================
  // VOLUNTEER WORKFLOW
  // ============================================================

  // User clicks [Volunteer] on an activity card
  const handleVolunteerActivity = async (activity: ChatActivityCardData) => {
    const actTitle = activity.title || activity.name || 'BNHS Volunteer Opportunity';
    const actId = activity.id || activity._id || actTitle;

    // Append simulated user message
    const userMessageId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        sender: 'user',
        text: `Volunteer for ${actTitle}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    setIsVolunteering(true);

    try {
      // Server-side eligibility check (JWT-based — cannot be spoofed)
      const eligibility = await api.getVolunteerEligibility();

      const confirmData: PendingVolunteerData = {
        opportunityId: actId,
        opportunityTitle: actTitle,
        opportunityLocation: activity.location || 'BNHS Mumbai',
        commitment: activity.duration,
        theme: activity.category,
      };

      if (!eligibility.eligible) {
        // Show ineligibility message
        const attended = eligibility.attendedEvents || 0;
        const required = eligibility.requiredEvents || 6;
        const remaining = eligibility.remainingEvents || (required - attended);
        const assistantMessageId = `assistant_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessageId,
            sender: 'assistant',
            text: `🔒 You're not eligible to volunteer yet.\n\nYou've completed **${attended} of ${required}** required activities. Attend **${remaining} more** ${remaining === 1 ? 'activity' : 'activities'} to unlock volunteering opportunities.\n\nKeep exploring nature walks and camps to build your BNHS journey!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      }

      // Eligible — show confirmation card
      setPendingVolunteer(confirmData);
      const assistantMessageId = `assistant_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          sender: 'assistant',
          text: `Great! You're about to submit a volunteer request for **${actTitle}**.`,
          pendingVolunteer: confirmData,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      const errorMessageId = `error_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setMessages((prev) => [
        ...prev,
        {
          id: errorMessageId,
          sender: 'assistant',
          text: `⚠️ Could not check volunteer eligibility: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setIsVolunteering(false);
    }
  };

  // User Clicks [Confirm Volunteering] inside chat
  const handleConfirmVolunteer = async (opportunityId: string) => {
    if (!pendingVolunteer) return;
    setIsVolunteering(true);

    const userMessageId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        sender: 'user',
        text: 'Yes, confirm volunteering',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    const snap = { ...pendingVolunteer };
    setPendingVolunteer(null);

    try {
      const result = await api.applyForVolunteer({
        opportunityId: snap.opportunityId,
        opportunityTitle: snap.opportunityTitle,
        opportunityLocation: snap.opportunityLocation,
        opportunityTheme: snap.theme,
      });

      const assistantMessageId = `assistant_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          sender: 'assistant',
          text: '✓ Your volunteer request has been sent to the BNHS admin.',
          volunteerResult: {
            opportunityTitle: snap.opportunityTitle,
            opportunityLocation: snap.opportunityLocation,
            status: 'pending',
            applicationId: result.application?._id || result.application?.id,
            message: 'Your request is now pending admin approval. You will be notified once it is reviewed.',
          },
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      const msg = err.message || 'Failed to submit volunteer application.';
      const isDuplicate = msg.toLowerCase().includes('already') || msg.toLowerCase().includes('duplicate') || (err.status === 400);
      const assistantMessageId = `error_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          sender: 'assistant',
          text: isDuplicate
            ? `ℹ️ You're already waiting for approval for this volunteering opportunity. Check your volunteer requests for the current status.`
            : `⚠️ Volunteer application failed: ${msg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: !isDuplicate,
        },
      ]);
    } finally {
      setIsVolunteering(false);
    }
  };

  // User Clicks [Cancel] on volunteer confirmation
  const handleCancelVolunteer = () => {
    setPendingVolunteer(null);
    const assistantMessageId = `assistant_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        sender: 'assistant',
        text: 'No problem! Your volunteer request has been cancelled. Let me know if you would like to explore other opportunities.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = async () => {
    const newSession = `session_${Date.now()}`;
    try {
      await api.clearChatSession(sessionId);
    } catch {
      // ignore
    }
    setSessionId(newSession);
    localStorage.setItem('bnhs_chat_session_id', newSession);
    setLastContextResolved(null);
    setActiveActivities([]);
    setPendingRegistration(null);
    setPendingVolunteer(null);
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        sender: 'assistant',
        text: 'New chat session started. Conversation memory cleared. How can I assist you with BNHS knowledge, event registrations, or volunteer opportunities today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="container" style={{ padding: '24px 20px 40px', maxWidth: '1020px' }}>
      {/* Top Title & Subtitle */}
      <div style={{ marginBottom: '16px', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-sage-light)',
            color: 'var(--color-forest-primary)',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            marginBottom: '6px',
          }}
        >
          <Sparkles size={13} /> AI Nature Guide & Instant Chat-to-Register
        </div>
        <h1 style={{ fontSize: '1.9rem', color: 'var(--color-forest-dark)', margin: 0, fontWeight: 800 }}>
          BNHS Conversational Naturalist
        </h1>
        <p style={{ color: 'var(--color-text-light)', margin: '4px 0 0', fontSize: '0.88rem' }}>
          Discover biodiversity camps, bird walks, archival history, and register directly within chat.
        </p>
      </div>

      {/* Main Chat Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 280px',
          gap: '20px',
          alignItems: 'start',
        }}
        className="assistant-grid"
      >
        {/* Chat Window Box */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '640px',
            padding: 0,
            overflow: 'hidden',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--color-border-subtle)',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Chat Window Header */}
          <div
            style={{
              padding: '12px 18px',
              borderBottom: '1px solid var(--color-border-subtle)',
              backgroundColor: 'var(--color-surface)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-forest-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <Sparkles size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text-main)' }}>
                  BNHS Archival AI Guide
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--color-text-light)' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                  Conversational Memory • Direct Booking
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handleClearChat}
                title="Clear conversation session"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '5px 9px',
                  fontSize: '0.74rem',
                  color: 'var(--color-text-light)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <RotateCcw size={12} /> New Session
              </button>
            </div>
          </div>

          {/* Pronoun / Context Resolution Bar */}
          {lastContextResolved && (
            <div
              style={{
                padding: '6px 16px',
                backgroundColor: 'rgba(5, 150, 105, 0.08)',
                borderBottom: '1px solid rgba(5, 150, 105, 0.15)',
                fontSize: '0.74rem',
                color: 'var(--color-forest-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CornerDownRight size={13} />
              <span>
                <strong>Context Rewritten:</strong> &ldquo;{lastContextResolved}&rdquo;
              </span>
            </div>
          )}

          {/* Messages Scroll Container */}
          <div
            ref={messagesContainerRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backgroundColor: '#fafbfc',
            }}
          >
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onRegisterActivity={handleRegisterActivity}
                onVolunteerActivity={handleVolunteerActivity}
                onConfirmRegistration={handleConfirmRegistration}
                onCancelRegistration={handleCancelRegistration}
                onConfirmVolunteer={handleConfirmVolunteer}
                onCancelVolunteer={handleCancelVolunteer}
                isRegistering={isRegistering}
                isVolunteering={isVolunteering}
              />
            ))}

            {/* Typing Indicator */}
            {(isTyping || isRegistering) && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-emerald)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <Sparkles size={14} />
                </div>
                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--color-border-subtle)',
                    fontSize: '0.8rem',
                    color: 'var(--color-text-light)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span className="dot-pulse" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-forest-primary)' }}></span>
                  {isRegistering ? 'Processing booking...' : isVolunteering ? 'Processing volunteer request...' : 'Searching BNHS knowledge & activities...'}
                </div>
              </div>
            )}
          </div>

          {/* Input Box Footer */}
          <div
            style={{
              padding: '14px 18px',
              borderTop: '1px solid var(--color-border-subtle)',
              backgroundColor: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                ref={inputRef}
                type="text"
                id="chat-input-query"
                placeholder="Ask anything or e.g. 'What events can I register for?'"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping || isRegistering}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid var(--color-border-subtle)',
                  fontSize: '0.88rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  backgroundColor: '#f8fafc',
                }}
              />
              <button
                type="button"
                id="chat-send-btn"
                onClick={() => handleSend()}
                disabled={!inputQuery.trim() || isTyping || isRegistering}
                style={{
                  backgroundColor: 'var(--color-forest-primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 16px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: !inputQuery.trim() || isTyping || isRegistering ? 'not-allowed' : 'pointer',
                  opacity: !inputQuery.trim() || isTyping || isRegistering ? 0.6 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Send size={15} /> Send
              </button>
            </div>

            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-light)', marginTop: '8px', textAlign: 'center' }}>
              Try: <em>&ldquo;What can I volunteer for?&rdquo;</em>, <em>&ldquo;Register me for the Flamingo Watch&rdquo;</em>, or <em>&ldquo;What is BNHS?&rdquo;</em>
            </div>
          </div>
        </div>

        {/* Sidebar: Suggested Prompts & Knowledge Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Suggested Prompts Box */}
          <div
            className="card"
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border-subtle)',
              backgroundColor: '#ffffff',
            }}
          >
            <div
              style={{
                fontSize: '0.84rem',
                fontWeight: 700,
                color: 'var(--color-forest-dark)',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Compass size={15} color="var(--color-forest-primary)" />
              Explore & Book
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  disabled={isTyping || isRegistering}
                  style={{
                    textAlign: 'left',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '7px 10px',
                    fontSize: '0.77rem',
                    color: '#334155',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    lineHeight: 1.3,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ecfdf5';
                    e.currentTarget.style.borderColor = '#6ee7b7';
                    e.currentTarget.style.color = '#065f46';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.color = '#334155';
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Grounded Corpus Info Box */}
          <div
            className="card"
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border-subtle)',
              backgroundColor: '#ffffff',
            }}
          >
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--color-forest-dark)',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <BookOpen size={14} color="var(--color-forest-primary)" />
              Knowledge Grounding
            </div>
            <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--color-text-light)', lineHeight: 1.45 }}>
              Responses are strictly synthesized from the 25-page official BNHS document archive and live MongoDB activity database with verifiable page citations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
