"use client";

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Calendar, Users, UserPlus, CheckCircle, Copy } from 'lucide-react';
import { ParticipantIcon } from '@/components/icons/ParticipantIcon';
import { QuickSignup } from '@/components/auth/QuickSignup';
import { MeetingCreator } from '@/components/MeetingCreator';
import { ParticipantNameEntry } from '@/components/ParticipantNameEntry';

interface CreatedMeeting {
  id: string;
  title: string;
  shareToken: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  maxParticipants?: number;
}

export default function Home() {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinInput, setJoinInput] = useState('');
  const [showSignup, setShowSignup] = useState(false);

  // New flow state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createdMeeting, setCreatedMeeting] = useState<CreatedMeeting | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showNameEntry, setShowNameEntry] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  // Handler for when herd is created successfully
  const handleMeetingCreated = (meetingId: string, shareToken: string, title: string) => {
    // Load the event data to get all details
    fetch('/api/meetings')
      .then(res => res.json())
      .then(({ events }) => {
        const event = events.find((e: { id: string; start_date: string; end_date: string; start_time: string; end_time: string; max_participants?: number }) => e.id === meetingId);
        if (event) {
          setCreatedMeeting({
            id: meetingId,
            title: title,
            shareToken: shareToken,
            startDate: event.start_date,
            endDate: event.end_date,
            startTime: event.start_time,
            endTime: event.end_time,
            maxParticipants: event.max_participants
          });
          setShowSuccessPopup(true);
        }
      })
      .catch(err => console.error('Failed to load event details:', err));
  };

  // Handler for success popup continue button
  const handleSuccessPopupContinue = () => {
    setShowSuccessPopup(false);
    setShowNameEntry(true);
  };

  // Handler for participant name submission
  const handleNameSubmit = async (name: string) => {
    if (!createdMeeting) return;

    try {
      setIsJoining(true);

      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: createdMeeting.id,
          name: name,
          email: '',
          role: 'organizer'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join event');
      }

      const { participant } = await response.json();

      // Navigate to event page with participant ID to avoid duplicate name entry
      window.location.href = `/event/${createdMeeting.shareToken}?participant=${participant.id}`;
    } catch (err) {
      console.error('Failed to join as organizer:', err);
    } finally {
      setIsJoining(false);
    }
  };

  // Handler to copy share link to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Handler to reset flow
  const handleBackToStart = () => {
    setShowCreateForm(false);
    setCreatedMeeting(null);
    setShowSuccessPopup(false);
    setShowNameEntry(false);
  };

  return (
    <AppShell>
      <div className="text-center max-w-4xl mx-auto">
        <div className="flex justify-center mb-8">
          <ParticipantIcon className="text-primary" width={120} height={148} />
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6">
          HerdingKatz
        </h1>
        <p className="text-xl text-muted-foreground mb-12">
          A simple app to help herd up
        </p>

        {/* Main content area */}
        {!showCreateForm && !showNameEntry ? (
          // Initial buttons
          <div className="flex flex-col gap-4 justify-center max-w-md mx-auto">
            <Button
              size="lg"
              className="text-lg py-4 px-8"
              onClick={() => setShowCreateForm(true)}
            >
              <Calendar className="mr-2 h-5 w-5" />
              Create Herd
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg py-4 px-8"
              onClick={() => setShowJoinModal(true)}
            >
              <Users className="mr-2 h-5 w-5" />
              Join Herd
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg py-4 px-8"
              onClick={() => setShowSignup(true)}
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Login (optional)
            </Button>
          </div>
        ) : (
          // Herd creation and name entry flow
          <div className="space-y-8">
            {/* Create Herd Section */}
            <div className={`transition-opacity duration-300 ${showNameEntry ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {showCreateForm && (
                <MeetingCreator
                  onMeetingCreated={handleMeetingCreated}
                  onCancel={handleBackToStart}
                />
              )}
            </div>

            {/* Name Entry Section */}
            {showNameEntry && createdMeeting && (
              <div className="mt-8">
                <ParticipantNameEntry
                  eventTitle={createdMeeting.title}
                  onNameSubmit={handleNameSubmit}
                  isLoading={isJoining}
                  startDate={createdMeeting.startDate}
                  endDate={createdMeeting.endDate}
                  startTime={createdMeeting.startTime}
                  endTime={createdMeeting.endTime}
                  participantCount={0}
                  maxParticipants={createdMeeting.maxParticipants}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Join Herd Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Join Herd</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Herd Code or Link
                </label>
                <input
                  type="text"
                  placeholder="Enter herd code or paste link"
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
                  Join Herd
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

      {/* Success Popup */}
      {showSuccessPopup && createdMeeting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md mx-4">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-green-600">
                Herd Created Successfully!
              </h2>
              <p className="text-sm text-muted-foreground">
                Your herd &quot;{createdMeeting.title}&quot; is ready for Katz to join.
              </p>

              {/* Share link preview */}
              <div className="bg-muted/30 rounded-lg p-3 text-left">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={`${window.location.origin}/event/${createdMeeting.shareToken}`}
                    readOnly
                    className="flex-1 p-2 border border-border rounded bg-background text-xs font-mono"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(`${window.location.origin}/event/${createdMeeting.shareToken}`)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                {copiedToClipboard && (
                  <p className="text-xs text-green-600 mt-1">Copied to clipboard!</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleBackToStart}
                  className="flex-1"
                >
                  Back to Start
                </Button>
                <Button
                  onClick={handleSuccessPopupContinue}
                  className="flex-1"
                >
                  Continue
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
