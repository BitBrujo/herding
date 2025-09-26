"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar, MessageSquare, Settings, Home, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { UserMenu, AnonymousUserPrompt } from '@/components/auth/UserMenu';
import { QuickSignup } from '@/components/auth/QuickSignup';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';

export function Navigation() {
  const [showSignup, setShowSignup] = useState(false);
  const { isAuthenticated, loading } = useOptionalAuth();

  return (
    <>
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-primary" />
              <span className="text-xl font-semibold text-foreground">
                Herding Katz
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/"
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>

              {/* Dashboard link for authenticated users */}
              {isAuthenticated && (
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  <span>My Events</span>
                </Link>
              )}

              <Link
                href="/create"
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Event</span>
              </Link>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Notification/Messages (hidden for now) */}
              <button className="hidden p-2 text-muted-foreground hover:text-foreground transition-colors">
                <MessageSquare className="h-5 w-5" />
              </button>

              {/* Settings (hidden for now) */}
              <button className="hidden p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Settings className="h-5 w-5" />
              </button>

              {/* Join Event Button (for anonymous users) */}
              <Button
                variant="outline"
                onClick={() => {
                  // TODO: Implement join event modal or navigation
                  const eventCode = prompt('Enter event code or share link:');
                  if (eventCode) {
                    // Handle join event logic
                    console.log('Joining event:', eventCode);
                  }
                }}
              >
                Join Event
              </Button>

              {/* Auth UI */}
              {loading ? (
                <div className="w-20 h-10 bg-muted/50 rounded-lg animate-pulse"></div>
              ) : isAuthenticated ? (
                <UserMenu />
              ) : (
                <AnonymousUserPrompt onSignUp={() => setShowSignup(true)} />
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Quick Signup Modal */}
      <QuickSignup
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onSuccess={() => console.log('Account created successfully!')}
      />
    </>
  );
}