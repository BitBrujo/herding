"use client";

import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function AuthCallback() {
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          window.location.href = '/?error=auth_failed';
          return;
        }

        if (data.session) {
          // Successful authentication, redirect to dashboard or intended page
          const redirectTo = new URLSearchParams(window.location.search).get('redirectTo') || '/dashboard';
          window.location.href = redirectTo;
        } else {
          // No session, redirect to home
          window.location.href = '/';
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        window.location.href = '/?error=unexpected';
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Completing sign in...</h2>
        <p className="text-muted-foreground">Please wait while we finish setting up your account.</p>
      </div>
    </div>
  );
}