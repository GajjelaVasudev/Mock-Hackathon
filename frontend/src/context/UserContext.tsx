/**
 * BNHS Nature-Engagement Platform — User Session & Authentication Context
 * Manages authenticated user state, role detection (user/staff/admin), and MongoDB synchronization.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import api from '../services/api';

const DEFAULT_USER: UserProfile = {
  id: '',
  name: 'Naturalist',
  username: '',
  email: '',
  role: 'user',
  age_group: 'adult',
  location: 'Mumbai',
  interests: ['birds', 'wetlands', 'conservation'],
  experience_level: 'beginner',
  preferred_activity_type: 'walk',
  previous_activities: [],
  badges: ['BNHS Member', 'Nature Enthusiast'],
};

interface UserContextType {
  currentUser: UserProfile;
  isAuthenticated: boolean;
  isStaffOrAdmin: boolean;
  loginUser: (user: Partial<UserProfile>) => void;
  logoutUser: () => Promise<void>;
  updateProfile: (updatedData: Partial<UserProfile>) => Promise<void>;
  refreshUserData: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem('bnhs_user_profile');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return DEFAULT_USER;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('bnhs_auth_state') === 'true';
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Restore authenticated user session from backend on mount
  useEffect(() => {
    const restoreSession = async () => {
      if (!isAuthenticated) return;
      setIsLoading(true);
      try {
        const res = await api.getMernCurrentUser();
        if (res && res.user) {
          const profile: UserProfile = {
            ...DEFAULT_USER,
            id: res.user._id || res.user.id || res.user.username,
            name: res.user.name || res.user.username,
            username: res.user.username,
            email: res.user.email,
            role: res.user.role || 'user',
            location: res.user.location || 'Mumbai',
            interests: res.user.interests || ['birds', 'conservation'],
            experience_level: res.user.experience_level || 'beginner',
          };
          setCurrentUser(profile);
          localStorage.setItem('bnhs_user_profile', JSON.stringify(profile));
        }
      } catch {
        // If session expired or offline, fallback to local stored user profile
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [isAuthenticated]);

  const loginUser = (user: Partial<UserProfile>) => {
    setIsAuthenticated(true);
    localStorage.setItem('bnhs_auth_state', 'true');

    const updatedProfile: UserProfile = {
      ...DEFAULT_USER,
      ...currentUser,
      ...user,
      id: user.id || user.username || currentUser.id || 'user_active',
      name: user.name || user.username || currentUser.name || 'BNHS Member',
      role: user.role || currentUser.role || 'user',
    };

    setCurrentUser(updatedProfile);
    localStorage.setItem('bnhs_user_profile', JSON.stringify(updatedProfile));
  };

  const logoutUser = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    setCurrentUser(DEFAULT_USER);
    localStorage.removeItem('bnhs_auth_state');
    localStorage.removeItem('bnhs_user_profile');
  };

  const updateProfile = async (updatedData: Partial<UserProfile>) => {
    setIsLoading(true);
    try {
      if (currentUser.id) {
        const updated = await api.updateUser(currentUser.id, updatedData);
        const merged = { ...currentUser, ...updated };
        setCurrentUser(merged);
        localStorage.setItem('bnhs_user_profile', JSON.stringify(merged));
      } else {
        const merged = { ...currentUser, ...updatedData };
        setCurrentUser(merged);
        localStorage.setItem('bnhs_user_profile', JSON.stringify(merged));
      }
    } catch (err: any) {
      const merged = { ...currentUser, ...updatedData };
      setCurrentUser(merged);
      localStorage.setItem('bnhs_user_profile', JSON.stringify(merged));
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = async () => {
    if (!currentUser.id) return;
    try {
      const refreshed = await api.getUser(currentUser.id);
      if (refreshed) {
        const merged = { ...currentUser, ...refreshed };
        setCurrentUser(merged);
        localStorage.setItem('bnhs_user_profile', JSON.stringify(merged));
      }
    } catch {
      // ignore
    }
  };

  const isStaffOrAdmin = currentUser.role === 'admin' || currentUser.role === 'staff';

  return (
    <UserContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isStaffOrAdmin,
        loginUser,
        logoutUser,
        updateProfile,
        refreshUserData,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
