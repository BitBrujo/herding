"use client";

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Calendar, Users, UserPlus } from 'lucide-react';
import { ParticipantIcon } from '@/components/icons/ParticipantIcon';
import { QuickSignup } from '@/components/auth/QuickSignup';

export default function Home() {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinInput, setJoinInput] = useState('');
  const [showSignup, setShowSignup] = useState(false);

  return (
    <AppShell>
      <div className="text-center max-w-2xl mx-auto">
        <div className="flex justify-center mb-8">
          <ParticipantIcon className="text-primary" width={120} height={148} />
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6">
          HerdingKatz
        </h1>
        <p className="text-xl text-muted-foreground mb-12">
          A simple app to help herd up
        </p>

        <div className="flex flex-col gap-4 justify-center max-w-md mx-auto">
          <Button
            size="lg"
            className="text-lg py-4 px-8"
            onClick={() => window.location.href = '/create'}
          >
            <Calendar className="mr-2 h-5 w-5" />
            Create Event
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="text-lg py-4 px-8"
            onClick={() => setShowJoinModal(true)}
          >
            <Users className="mr-2 h-5 w-5" />
            Join Event
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="text-lg py-4 px-8"
            onClick={() => setShowSignup(true)}
          >
            <UserPlus className="mr-2 h-5 w-5" />
            Sign Up
          </Button>
        </div>
      </div>

      {/* Join Event Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Join Event</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Event Code or Link
                </label>
                <input
                  type="text"
                  placeholder="Enter event code or paste link"
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value)}
                  className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    let eventToken = joinInput.trim();

                    // Extract token from URL if full URL is provided
                    if (eventToken.includes('/event/')) {
                      const urlParts = eventToken.split('/event/');
                      eventToken = urlParts[1]?.split('?')[0] || eventToken;
                    }

                    if (eventToken) {
                      window.location.href = `/event/${eventToken}`;
                    }
                  }}
                  disabled={!joinInput.trim()}
                >
                  Join Event
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowJoinModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Signup Modal */}
      <QuickSignup
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onSuccess={() => console.log('Account created successfully!')}
      />
    </AppShell>
  );
}
