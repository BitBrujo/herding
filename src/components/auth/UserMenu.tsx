"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { User, LogOut, Settings, Calendar, ChevronDown, Crown } from 'lucide-react';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className = "" }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, profile, getDisplayName, getParticipantIdentity, signOut, canClaimAnonymousData } = useOptionalAuth();

  const identity = getParticipantIdentity();
  const displayName = getDisplayName(identity);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const anonymousDataCount = canClaimAnonymousData();

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* User Avatar/Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-10"
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={displayName}
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
            {getInitials(displayName)}
          </div>
        )}
        <span className="hidden sm:block font-medium">
          {displayName.length > 15 ? `${displayName.slice(0, 15)}...` : displayName}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-lg z-50">
          {/* User Info Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                  {getInitials(displayName)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{displayName}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {user?.email || 'Anonymous User'}
                </p>
              </div>
            </div>

            {/* Anonymous Data Notice */}
            {anonymousDataCount && (
              <div className="mt-3 bg-primary/10 border border-primary/20 rounded-lg p-2 text-xs">
                <div className="flex items-center gap-1 text-primary font-medium">
                  <Crown className="h-3 w-3" />
                  <span>Anonymous data available</span>
                </div>
                <p className="text-muted-foreground mt-1">
                  Your previous events will be linked to this account.
                </p>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* Dashboard */}
            <button
              onClick={() => {
                // Navigate to dashboard
                window.location.href = '/dashboard';
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/50 transition-colors"
            >
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>My Events</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                // Navigate to settings or open settings modal
                console.log('Open settings');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/50 transition-colors"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span>Settings</span>
            </button>

            {/* Profile */}
            <button
              onClick={() => {
                // Navigate to profile or open profile modal
                console.log('Open profile');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted/50 transition-colors"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Profile</span>
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-border"></div>

          {/* Sign Out */}
          <div className="p-2">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-2 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Footer Info */}
          <div className="px-4 py-3 border-t border-border">
            <div className="text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Timezone: {profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
              </div>
              {user?.email_confirmed_at && (
                <div className="mt-1 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Email verified</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Anonymous user prompt component
export function AnonymousUserPrompt({ onSignUp }: { onSignUp: () => void }) {
  return (
    <Button variant="outline" onClick={onSignUp} className="flex items-center gap-2">
      <User className="h-4 w-4" />
      <span className="hidden sm:block">Sign Up</span>
    </Button>
  );
}