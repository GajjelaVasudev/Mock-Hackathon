import React from 'react';
import { User, Sparkles } from 'lucide-react';
import { ChatMessage as ChatMessageType, ChatActivityCardData } from '../types';
import { SourceCitation } from './SourceCitation';
import { ChatActivityList } from './chat/ChatActivityList';
import { RegistrationConfirmation } from './chat/RegistrationConfirmation';
import { RegistrationSuccess } from './chat/RegistrationSuccess';
import { VolunteerConfirmation } from './chat/VolunteerConfirmation';
import { VolunteerSuccess } from './chat/VolunteerSuccess';

interface ChatMessageProps {
  message: ChatMessageType;
  onRegisterActivity?: (activity: ChatActivityCardData) => void;
  onVolunteerActivity?: (activity: ChatActivityCardData) => void;
  onConfirmRegistration?: (activityId: string) => void;
  onCancelRegistration?: (activityId: string) => void;
  onConfirmVolunteer?: (opportunityId: string) => void;
  onCancelVolunteer?: () => void;
  isRegistering?: boolean;
  isVolunteering?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRegisterActivity,
  onVolunteerActivity,
  onConfirmRegistration,
  onCancelRegistration,
  onConfirmVolunteer,
  onCancelVolunteer,
  isRegistering = false,
  isVolunteering = false,
}) => {
  const isUser = message.sender === 'user';

  // Determine whether to show volunteer button vs register button on activity cards
  const isVolunteerIntent =
    message.intent === 'VOLUNTEER_SEARCH' ||
    message.intent === 'VOLUNTEER_REQUEST';

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        alignItems: 'flex-start',
        width: '100%',
      }}
    >
      {!isUser && (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-emerald, #059669)',
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

      <div
        className={`chat-bubble ${isUser ? 'bubble-user' : 'bubble-assistant'}`}
        style={{
          maxWidth: isUser ? '75%' : '88%',
          width: (!isUser && ((message.activities && message.activities.length > 0) || message.pendingRegistration || message.registrationResult || message.pendingVolunteer || message.volunteerResult)) ? '88%' : undefined,
        }}
      >
        {/* Message Content */}
        <div style={{ whiteSpace: 'pre-line' }}>{message.text}</div>

        {/* Activity Cards — show Register or Volunteer button based on intent */}
        {message.activities && message.activities.length > 0 && (
          <ChatActivityList
            activities={message.activities}
            onRegister={isVolunteerIntent ? undefined : onRegisterActivity}
            onVolunteer={isVolunteerIntent ? onVolunteerActivity : undefined}
            isRegistering={isRegistering}
            isVolunteering={isVolunteering}
          />
        )}

        {/* Pending Registration Confirmation Card */}
        {message.pendingRegistration && onConfirmRegistration && onCancelRegistration && (
          <RegistrationConfirmation
            pendingRegistration={message.pendingRegistration}
            onConfirm={onConfirmRegistration}
            onCancel={onCancelRegistration}
            isLoading={isRegistering}
          />
        )}

        {/* Registration Success Card */}
        {message.registrationResult && (
          <RegistrationSuccess result={message.registrationResult} />
        )}

        {/* Pending Volunteer Confirmation Card */}
        {message.pendingVolunteer && onConfirmVolunteer && onCancelVolunteer && (
          <VolunteerConfirmation
            pendingVolunteer={message.pendingVolunteer}
            onConfirm={onConfirmVolunteer}
            onCancel={onCancelVolunteer}
            isLoading={isVolunteering}
          />
        )}

        {/* Volunteer Success Card */}
        {message.volunteerResult && (
          <VolunteerSuccess result={message.volunteerResult} />
        )}

        {/* Citations if available from RAG */}
        {message.sources && message.sources.length > 0 && (
          <SourceCitation sources={message.sources} />
        )}

        {/* Timestamp */}
        <div
          style={{
            fontSize: '0.7rem',
            marginTop: '8px',
            color: isUser ? 'rgba(255, 255, 255, 0.75)' : 'var(--color-text-light, #64748b)',
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
            backgroundColor: 'var(--color-forest-primary, #064e3b)',
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
