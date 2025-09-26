"use client";

import { useOptionalAuth as useAuthContext } from '@/components/auth/AuthProvider';
import {
  generateSessionId,
  getAnonymousSession,
  saveAnonymousSession,
  getDisplayName,
  isAuthenticatedParticipant
} from '@/lib/auth-optional';
import type { ParticipantIdentity } from '@/lib/auth-optional';

import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/lib/auth-optional';

export interface UseOptionalAuthReturn {
  // Auth state
  isAuthenticated: boolean;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;

  // Auth methods
  signUp: (email: string, password: string, metadata?: { display_name?: string }) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithProvider: (provider: 'google' | 'github') => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;

  // Hybrid identity management
  getParticipantIdentity: (anonymousName?: string) => ParticipantIdentity;
  getDisplayName: (identity?: ParticipantIdentity) => string;
  isAuthenticatedParticipant: (identity: ParticipantIdentity) => boolean;

  // Anonymous session management
  getAnonymousSessionId: () => string;
  saveToAnonymousSession: (eventId: string, data?: Record<string, unknown>) => void;
  getAnonymousSessionData: () => { sessionId: string; name: string; eventIds: string[]; preferences?: Record<string, unknown> } | null;

  // Conversion helpers
  suggestAccountCreation: () => boolean;
  canClaimAnonymousData: () => boolean;
  claimAnonymousSession: () => Promise<{ error: Error | null }>;
}

export function useOptionalAuth(): UseOptionalAuthReturn {
  const auth = useAuthContext();

  // Get or create anonymous session ID
  const getAnonymousSessionId = (): string => {
    const existingSession = getAnonymousSession();
    if (existingSession) {
      return existingSession.sessionId;
    }

    const newSessionId = generateSessionId();
    saveAnonymousSession({
      sessionId: newSessionId,
      name: 'Anonymous',
      eventIds: []
    });
    return newSessionId;
  };

  // Save data to anonymous session
  const saveToAnonymousSession = (eventId: string, data?: Record<string, unknown>) => {
    const existing = getAnonymousSession();
    const sessionId = existing?.sessionId || generateSessionId();

    saveAnonymousSession({
      sessionId,
      name: existing?.name || 'Anonymous',
      eventIds: [...(existing?.eventIds || []), eventId].filter((id, index, arr) => arr.indexOf(id) === index),
      preferences: { ...existing?.preferences, ...data }
    });
  };

  // Get anonymous session data
  const getAnonymousSessionData = () => {
    return getAnonymousSession();
  };

  // Create participant identity
  const createParticipantIdentity = (anonymousName?: string): ParticipantIdentity => {
    if (auth.isAuthenticated && auth.user && auth.profile) {
      return {
        user: auth.user,
        profile: auth.profile,
        isAnonymous: false
      };
    }

    const sessionData = getAnonymousSession();
    return {
      name: anonymousName || sessionData?.name || 'Anonymous',
      sessionId: sessionData?.sessionId || getAnonymousSessionId(),
      isAnonymous: true
    };
  };

  // Get display name for current or provided identity
  const getCurrentDisplayName = (identity?: ParticipantIdentity): string => {
    if (identity) {
      return getDisplayName(identity);
    }
    return getDisplayName(createParticipantIdentity());
  };

  // Check if should suggest account creation
  const suggestAccountCreation = (): boolean => {
    if (auth.isAuthenticated) return false;

    const sessionData = getAnonymousSession();
    // Suggest account creation if user has participated in multiple events
    return (sessionData?.eventIds?.length || 0) >= 2;
  };

  // Check if user has anonymous data that can be claimed
  const canClaimAnonymousData = (): boolean => {
    if (!auth.isAuthenticated) return false;

    const sessionData = getAnonymousSession();
    return Boolean(sessionData && sessionData.eventIds.length > 0);
  };

  // Claim anonymous session data
  const claimAnonymousSession = async () => {
    const sessionData = getAnonymousSession();
    if (!sessionData) {
      return { error: new Error('No anonymous session data found') };
    }

    return auth.claimAnonymousSession({
      eventIds: sessionData.eventIds,
      preferences: sessionData.preferences
    });
  };

  return {
    // Auth state
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    profile: auth.profile,
    loading: auth.loading,

    // Auth methods
    signUp: auth.signUp,
    signIn: auth.signIn,
    signInWithProvider: auth.signInWithProvider,
    signOut: auth.signOut,
    updateProfile: auth.updateProfile,

    // Hybrid identity management
    getParticipantIdentity: createParticipantIdentity,
    getDisplayName: getCurrentDisplayName,
    isAuthenticatedParticipant,

    // Anonymous session management
    getAnonymousSessionId,
    saveToAnonymousSession,
    getAnonymousSessionData,

    // Conversion helpers
    suggestAccountCreation,
    canClaimAnonymousData,
    claimAnonymousSession
  };
}