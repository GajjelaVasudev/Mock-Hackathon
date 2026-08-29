import React from 'react';
import { ChatActivityCardData } from '../../types';
import { ActivityChatCard } from './ActivityChatCard';

interface ChatActivityListProps {
  activities: ChatActivityCardData[];
  onRegister?: (activity: ChatActivityCardData) => void;
  onVolunteer?: (activity: ChatActivityCardData) => void;
  isRegistering?: boolean;
  isVolunteering?: boolean;
}

export const ChatActivityList: React.FC<ChatActivityListProps> = ({
  activities,
  onRegister,
  onVolunteer,
  isRegistering = false,
  isVolunteering = false,
}) => {
  if (!activities || activities.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginTop: '10px',
        width: '100%',
      }}
    >
      {activities.map((activity) => (
        <ActivityChatCard
          key={activity.id || activity._id}
          activity={activity}
          onRegister={onRegister}
          onVolunteer={onVolunteer}
          isRegistering={isRegistering}
          isVolunteering={isVolunteering}
        />
      ))}
    </div>
  );
};
