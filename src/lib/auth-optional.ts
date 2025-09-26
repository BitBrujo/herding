"use client";

import { createBrowserClient } from '@supabase/ssr';
import type { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  display_name?: string;
  timezone?: string;
  email?: string;
  avatar_url?: string;
  preferred_meeting_duration?: number;
  default_availability_hours?: {
    start: string;
    end: string;
  };
  notification_preferences?: {
    email_reminders: boolean;
    event_updates: boolean;
  };
}

export interface AnonymousParticipant {
  name: string;
  sessionId: string;
  isAnonymous: true;
}

export interface AuthenticatedParticipant {
  user: User;
  profile: UserProfile;
  isAnonymous: false;
}

export type ParticipantIdentity = AnonymousParticipant | AuthenticatedParticipant;

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface AuthMethods {
  signUp: (email: string, password: string, metadata?: { display_name?: string }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithProvider: (provider: 'google' | 'github') => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  claimAnonymousSession: (anonymousData: { eventIds: string[], preferences?: Record<string, unknown> }) => Promise<{ error: Error | null }>;
}

export type OptionalAuthContext = AuthState & AuthMethods;

// Create a client for browser-side operations
export const createAuthClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Utility functions for auth state management
export const getParticipantIdentity = (
  user: User | null,
  profile: UserProfile | null,
  anonymousName?: string,
  sessionId?: string
): ParticipantIdentity => {
  if (user && profile) {
    return {
      user,
      profile,
      isAnonymous: false
    };
  }

  return {
    name: anonymousName || 'Anonymous',
    sessionId: sessionId || crypto.randomUUID(),
    isAnonymous: true
  };
};

export const isAuthenticatedParticipant = (
  identity: ParticipantIdentity
): identity is AuthenticatedParticipant => {
  return !identity.isAnonymous;
};

export const getDisplayName = (identity: ParticipantIdentity): string => {
  if (isAuthenticatedParticipant(identity)) {
    return identity.profile.display_name || identity.user.email || 'User';
  }
  return identity.name;
};

// Generate a unique session ID for anonymous users
export const generateSessionId = (): string => {
  return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Local storage keys for anonymous session data
export const STORAGE_KEYS = {
  ANONYMOUS_SESSION: 'herding_anonymous_session',
  ANONYMOUS_EVENTS: 'herding_anonymous_events',
  ANONYMOUS_PREFERENCES: 'herding_anonymous_preferences'
} as const;

// Anonymous session management
export const saveAnonymousSession = (data: {
  sessionId: string;
  name: string;
  eventIds: string[];
  preferences?: Record<string, unknown>;
}) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ANONYMOUS_SESSION, JSON.stringify(data));
  }
};

export const getAnonymousSession = (): {
  sessionId: string;
  name: string;
  eventIds: string[];
  preferences?: Record<string, unknown>;
} | null => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEYS.ANONYMOUS_SESSION);
    return stored ? JSON.parse(stored) : null;
  }
  return null;
};

export const clearAnonymousSession = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.ANONYMOUS_SESSION);
    localStorage.removeItem(STORAGE_KEYS.ANONYMOUS_EVENTS);
    localStorage.removeItem(STORAGE_KEYS.ANONYMOUS_PREFERENCES);
  }
};