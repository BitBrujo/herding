"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import type {
  OptionalAuthContext,
  UserProfile,
  AuthState
} from '@/lib/auth-optional';
import {
  clearAnonymousSession
} from '@/lib/auth-optional';

const AuthContext = createContext<OptionalAuthContext | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    isAuthenticated: false
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Load user profile when user changes
  const loadUserProfile = async (user: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user profile:', error);
        return null;
      }

      // If no profile exists, create one
      if (!profile) {
        const newProfile = {
          user_id: user.id,
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          email: user.email,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          notification_preferences: {
            email_reminders: true,
            event_updates: true
          }
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          console.error('Error creating user profile:', createError);
          return null;
        }

        return createdProfile;
      }

      return profile;
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const profile = await loadUserProfile(session.user);
          setAuthState({
            user: session.user,
            profile,
            session,
            loading: false,
            isAuthenticated: true
          });
        } else {
          setAuthState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            isAuthenticated: false
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthState({
          user: null,
          profile: null,
          session: null,
          loading: false,
          isAuthenticated: false
        });
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await loadUserProfile(session.user);
          setAuthState({
            user: session.user,
            profile,
            session,
            loading: false,
            isAuthenticated: true
          });
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            isAuthenticated: false
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Auth methods
  const signUp = async (email: string, password: string, metadata?: { display_name?: string }) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signInWithProvider = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!authState.user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', authState.user.id);

      if (!error && authState.profile) {
        setAuthState(prev => ({
          ...prev,
          profile: { ...prev.profile!, ...updates }
        }));
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const claimAnonymousSession = async (anonymousData: {
    eventIds: string[],
    preferences?: Record<string, unknown>
  }) => {
    if (!authState.user) {
      return { error: new Error('User not authenticated') };
    }

    try {
      // Here you would implement logic to:
      // 1. Find anonymous participants with matching session IDs
      // 2. Link them to the authenticated user
      // 3. Update any events they created as organizer

      // Clear anonymous session data
      clearAnonymousSession();

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const contextValue: OptionalAuthContext = {
    ...authState,
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    updateProfile,
    claimAnonymousSession
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useOptionalAuth(): OptionalAuthContext {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useOptionalAuth must be used within an AuthProvider');
  }
  return context;
}