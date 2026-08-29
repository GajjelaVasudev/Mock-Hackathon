import React from 'react';
import { User, Sparkles, AlertCircle } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../types';
import { SourceCitation } from './SourceCitation';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        alignItems: 'flex-start',
      }}
    >
      {!isUser && (
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
            flexShrink: 0,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Sparkles size={16} />
        </div>
      )}

      <div className={`chat-bubble ${isUser ? 'bubble-user' : 'bubble-assistant'}`}>
        {/* Message Content */}
        <div style={{ whiteSpace: 'pre-line' }}>{message.text}</div>

        {/* Citations if available from RAG */}
        {message.sources && message.sources.length > 0 && (
          <SourceCitation sources={message.sources} />
        )}

        {/* Timestamp */}
        <div
          style={{
            fontSize: '0.7rem',
            marginTop: '8px',
            color: isUser ? 'rgba(255, 255, 255, 0.75)' : 'var(--color-text-light)',
            textAlign: isUser ? 'right' : 'left',
          }}
        >
          {message.timestamp}
        </div>
      </div>

      {isUser && (
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
            flexShrink: 0,
          }}
        >
          <User size={16} />
        </div>
      )}
    </div>
  );
};
