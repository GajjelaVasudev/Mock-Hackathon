/**
 * BNHS Nature-Engagement Platform — User Session & Demo Persona Context
 * Manages active user state, persona switching for demonstrations, and MongoDB synchronization.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import api from '../services/api';

export interface DemoPersona {
  id: string;
  name: string;
  role: string;
  age_group: string;
  location: string;
  interests: string[];
  experience_level: string;
  preferred_activity_type: string;
  previous_activities: string[];
  avatar: string;
  description: string;
}

export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: 'persona_aarav',
    name: 'Aarav Sharma',
    role: 'Student & Beginner Birdwatcher',
    age_group: 'student',
    location: 'Mumbai',
    interests: ['birds', 'photography', 'wetlands'],
    experience_level: 'beginner',
    preferred_activity_type: 'walk',
    previous_activities: ['BNHS Awareness Bird Walk at Vetal Tekdi'],
    avatar: '🦅',
    description: 'College student looking for weekend bird walks and photography around Mumbai & Navi Mumbai.',
  },
  {
    id: 'persona_priya',
    name: 'Priya Iyer',
    role: 'Senior Botanist & Tree Enthusiast',
    age_group: 'senior',
    location: 'Mumbai',
    interests: ['trees', 'botany', 'monsoon forest'],
    experience_level: 'intermediate',
    preferred_activity_type: 'walk',
    previous_activities: ['Tree Walk at Marine Drive'],
    avatar: '🌳',
    description: 'Retired botany enthusiast interested in Mumbai avenue trees, flora, and CEC walks.',
  },
  {
    id: 'persona_rohan',
    name: 'Rohan Deshmukh',
    role: 'Herpetology Explorer & Camp Enthusiast',
    age_group: 'youth',
    location: 'Maharashtra',
    interests: ['reptiles', 'amphibians', 'herpetology', 'night trails'],
    experience_level: 'intermediate',
    preferred_activity_type: 'camp',
    previous_activities: [],
    avatar: '🦎',
    description: 'Youth adventurer passionate about Western Ghats field camps in Matheran and Amboli.',
  },
  {
    id: 'persona_siddharth',
    name: 'Siddharth Mehta',
    role: 'Active Volunteer & Citizen Scientist',
    age_group: 'student',
    location: 'Mumbai',
    interests: ['volunteering', 'conservation', 'citizen science', 'AI digitisation'],
    experience_level: 'beginner',
    preferred_activity_type: 'volunteer',
    previous_activities: ['BNHS-SEVA Volunteer Program'],
    avatar: '🤝',
    description: 'Aspiring conservationist participating in BNHS-SEVA and AI bird-ringing digitisation.',
  },
  {
    id: 'persona_neha',
    name: 'Neha Verma',
    role: 'Delhi Urban Nature Explorer',
    age_group: 'adult',
    location: 'Delhi',
    interests: ['butterflies', 'birds', 'camera traps', 'citizen science'],
    experience_level: 'beginner',
    preferred_activity_type: 'walk',
    previous_activities: [],
    avatar: '🦋',
    description: 'Delhi professional interested in CEC Asola Bhatti butterfly walks and e-Mammal camera trapping.',
  },
];

interface UserContextType {
  currentUser: UserProfile;
  activePersonaId: string;
  isCustomUser: boolean;
  switchPersona: (personaId: string) => Promise<void>;
  updateProfile: (updatedData: Partial<UserProfile>) => Promise<void>;
  refreshUserData: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const defaultPersona = DEMO_PERSONAS[0];
  
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: defaultPersona.id,
    name: defaultPersona.name,
    username: defaultPersona.id,
    email: `${defaultPersona.id}@bnhs.org`,
    age_group: defaultPersona.age_group,
    location: defaultPersona.location,
    interests: defaultPersona.interests,
    experience_level: defaultPersona.experience_level,
    preferred_activity_type: defaultPersona.preferred_activity_type,
    previous_activities: defaultPersona.previous_activities,
    badges: ['BNHS Explorer', 'Nature Enthusiast'],
  });

  const [activePersonaId, setActivePersonaId] = useState<string>(defaultPersona.id);
  const [isCustomUser, setIsCustomUser] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync with MongoDB user record upon persona switch or load
  const syncWithMongoDB = async (persona: DemoPersona) => {
    setIsLoading(true);
    try {
      // Try fetching from MongoDB
      const dbUser = await api.getUser(persona.id);
      if (dbUser) {
        setCurrentUser(dbUser);
      }
    } catch {
      // If user doesn't exist yet in MongoDB, create it
      try {
        const created = await api.createUser({
          username: persona.id,
          name: persona.name,
          email: `${persona.id}@bnhs.org`,
          age_group: persona.age_group,
          location: persona.location,
          interests: persona.interests,
          experience_level: persona.experience_level,
          preferred_activity_type: persona.preferred_activity_type,
          previous_activities: persona.previous_activities,
        });
        setCurrentUser(created);
      } catch {
        // Fallback to local persona state
        setCurrentUser({
          id: persona.id,
          name: persona.name,
          username: persona.id,
          email: `${persona.id}@bnhs.org`,
          age_group: persona.age_group,
          location: persona.location,
          interests: persona.interests,
          experience_level: persona.experience_level,
          preferred_activity_type: persona.preferred_activity_type,
          previous_activities: persona.previous_activities,
          badges: ['BNHS Explorer'],
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncWithMongoDB(defaultPersona);
  }, []);

  const switchPersona = async (personaId: string) => {
    const target = DEMO_PERSONAS.find((p) => p.id === personaId);
    if (!target) return;
    setActivePersonaId(personaId);
    setIsCustomUser(false);
    await syncWithMongoDB(target);
  };

  const updateProfile = async (updatedData: Partial<UserProfile>) => {
    setIsLoading(true);
    try {
      const updated = await api.updateUser(currentUser.id, updatedData);
      setCurrentUser(updated);
      setIsCustomUser(true);
    } catch {
      setCurrentUser((prev) => ({ ...prev, ...updatedData }));
      setIsCustomUser(true);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = async () => {
    if (!currentUser.id) return;
    try {
      const refreshed = await api.getUser(currentUser.id);
      if (refreshed) {
        setCurrentUser(refreshed);
      }
    } catch {
      // ignore
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        activePersonaId,
        isCustomUser,
        switchPersona,
        updateProfile,
        refreshUserData,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
