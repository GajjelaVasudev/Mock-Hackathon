import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Shield,
  Trash2,
  BookOpen,
  CornerDownRight,
} from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../types';
import { ChatMessage } from '../components/ChatMessage';
import api from '../services/api';

const QUICK_QUESTIONS = [
  'What is BNHS-SEVA?',
  'What nature activities and walks does BNHS conduct?',
  'What is the Matheran Herpetofauna Camp?',
  'What conservation work does BNHS do for vultures?',
  'What are the different BNHS membership categories?',
  'What is e-Mammal India and who participates in it?',
];

export const AssistantPage: React.FC = () => {
  // Session ID for multi-turn conversational memory
  const [sessionId, setSessionId] = useState<string>(() => {
    return localStorage.getItem('bnhs_chat_session_id') || `session_${Date.now()}`;
  });

  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: 'welcome_1',
      sender: 'assistant',
      text: "Namaste! I am the **BNHS Knowledge Assistant**, with conversational memory grounded on the Bombay Natural History Society's archival corpus.\n\nYou can ask multi-turn questions (e.g. ask *'What is the Matheran Herpetofauna Camp?'* followed by *'Where is it held?'*).",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('bnhs_chat_session_id', sessionId);
  }, [sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isTyping) return;

    const userMsg: ChatMessageType = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      const response = await api.askAssistant(textToSend, sessionId);
      
      let displayText = response.answer;
      if (response.rewritten_query && response.rewritten_query.toLowerCase() !== textToSend.toLowerCase()) {
        displayText = `*(Context resolved: "${response.rewritten_query}")*\n\n${response.answer}`;
      }

      const assistantMsg: ChatMessageType = {
        id: `assistant_${Date.now()}`,
        sender: 'assistant',
        text: displayText,
        sources: response.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessageType = {
        id: `assistant_${Date.now()}`,
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleClearChat = async () => {
    try {
      await api.clearChatHistory(sessionId);
    } catch {
      // ignore
    }
    const newSession = `session_${Date.now()}`;
    setSessionId(newSession);
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        sender: 'assistant',
        text: 'New chat session started. Conversation memory cleared. How can I assist you with BNHS knowledge today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="container" style={{ padding: '30px 24px 60px' }}>
      <div className="chat-container">
        {/* Chat Header */}
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-emerald-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Bot size={22} />
            </div>
            <div>
              <h3>BNHS Knowledge Assistant</h3>
              <p>Conversational RAG • ChromaDB & 25-Page Knowledge Base</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                color: 'var(--color-sage)',
              }}
            >
              <Shield size={12} /> Context Memory Active
            </div>
            <button
              onClick={handleClearChat}
              title="Start New Session & Clear History"
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={13} />
              New Session
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="chat-messages">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {isTyping && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <Sparkles size={16} />
              </div>
              <div
                className="chat-bubble bubble-assistant"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 18px' }}
              >
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Rewriting context & retrieving citations from BNHS corpus...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input & Quick Prompts */}
        <div className="chat-input-container">
          {/* Quick Questions Carousel */}
          <div style={{ marginBottom: '8px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Suggested Inquiries:
          </div>
          <div className="quick-prompts">
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                className="quick-prompt-btn"
                onClick={() => handleSend(q)}
                disabled={isTyping}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Text Input Box */}
          <div className="chat-input-wrapper">
            <input
              type="text"
              placeholder="Ask a question or follow-up (e.g. 'Where is it held?')"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="chat-input"
              disabled={isTyping}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputQuery.trim() || isTyping}
              className="btn btn-primary btn-sm"
              style={{
                borderRadius: '50%',
                width: '38px',
                height: '38px',
                padding: 0,
                flexShrink: 0,
              }}
              aria-label="Send Message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
