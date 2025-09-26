"use client";

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AvailabilityGrid } from '@/components/AvailabilityGrid';
import { ParticipantNameEntry } from '@/components/ParticipantNameEntry';
import { LLMChatWindow } from '@/components/LLMChatWindow';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Calendar,
  Users,
  Clock,
  MessageSquare,
  Share2,
  CheckCircle
} from 'lucide-react';
import { Event, Participant } from '@/lib/types';

interface EventPageProps {
  params: {
    token: string;
  };
}

interface ParticipantAvailability {
  participantId: string;
  participantName: string;
  availability: {
    [key: string]: 'available' | 'unavailable' | 'maybe';
  };
}

export default function EventPage({ params }: EventPageProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [participantAvailability, setParticipantAvailability] = useState<ParticipantAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [isOrganizer] = useState(false);
  const [showShareInfo, setShowShareInfo] = useState(false);


  useEffect(() => {
    loadEventData();
  }, [params.token]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEventData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Find event by share token
      const eventsResponse = await fetch('/api/meetings');
      if (!eventsResponse.ok) throw new Error('Failed to fetch events');

      const { events } = await eventsResponse.json();
      const foundEvent = events.find((e: Event) => e.share_token === params.token);

      if (!foundEvent) {
        throw new Error('Event not found');
      }

      setEvent(foundEvent);

      // Load participants and their availability
      const participantsResponse = await fetch(`/api/participants?event_id=${foundEvent.id}`);
      if (participantsResponse.ok) {
        const { participants: eventParticipants } = await participantsResponse.json();

        // Transform participants into availability format
        const availabilityData = eventParticipants.map((p: Participant) => ({
          participantId: p.id,
          participantName: p.name,
          availability: {} // This would be loaded from availability table in real implementation
        }));

        setParticipantAvailability(availabilityData);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinAsParticipant = async (name: string) => {
    if (!name.trim() || !event) return;

    try {
      setIsJoining(true);

      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: event.id,
          name: name,
          email: '',
          role: 'required'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join event');
      }

      const { participant } = await response.json();
      setCurrentParticipant(participant);
      await loadEventData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join event');
    } finally {
      setIsJoining(false);
    }
  };

  const handleAvailabilityChange = (participantId: string, timeSlot: { date: string; time: string }, status: 'available' | 'unavailable' | 'maybe') => {
    const slotKey = `${timeSlot.date}-${timeSlot.time}`;

    setParticipantAvailability(prev =>
      prev.map(p =>
        p.participantId === participantId
          ? {
              ...p,
              availability: {
                ...p.availability,
                [slotKey]: status
              }
            }
          : p
      )
    );

    // In real implementation, this would also save to the database
  };

  const handleLLMAvailabilityUpdate = (message: string) => {
    // In real implementation, this would process the natural language
    // and update availability accordingly
    console.log('Processing LLM message:', message);
  };

  const copyShareLink = async () => {
    try {
      const shareUrl = `${window.location.origin}/event/${params.token}`;
      await navigator.clipboard.writeText(shareUrl);
      setShowShareInfo(true);
      setTimeout(() => setShowShareInfo(false), 3000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const copyEventCode = async () => {
    try {
      await navigator.clipboard.writeText(params.token);
      setShowShareInfo(true);
      setTimeout(() => setShowShareInfo(false), 3000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <Card className="max-w-md mx-auto mt-12">
          <CardContent className="text-center py-8">
            <div className="text-red-600 mb-4">
              <Calendar className="h-12 w-12 mx-auto mb-3" />
              <h2 className="text-lg font-semibold">Event Not Found</h2>
            </div>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.href = '/'}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  if (!event) return null;

  // If no current participant, show name entry
  if (!currentParticipant) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto">
          {/* Event Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {event.title}
            </h1>
            <p className="text-muted-foreground mb-4">
              Find the best time for everyone to meet
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {event.start_time} - {event.end_time}
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {participantAvailability.length} participants
              </div>
            </div>
          </div>

          <ParticipantNameEntry
            eventTitle={event.title}
            onNameSubmit={handleJoinAsParticipant}
            isLoading={isJoining}
          />
        </div>
      </AppShell>
    );
  }

  // Main grid interface
  return (
    <AppShell>
      <div className="max-w-7xl mx-auto">
        {/* Header with title and actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>
            <p className="text-muted-foreground">
              Welcome, {currentParticipant.name}! Click and drag to set your availability.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowChatWindow(true)}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Chat Assistant
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowShareInfo(!showShareInfo)}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share Event
            </Button>

            {/* Future organizer controls */}
            {isOrganizer && (
              <Button className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Finalize Meeting
              </Button>
            )}
          </div>
        </div>

        {/* Share Information Panel */}
        {showShareInfo && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
            <h3 className="font-semibold mb-3 text-blue-800 dark:text-blue-200">Share this event with others</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-blue-700 dark:text-blue-300">Event Code (Quick Share)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={params.token}
                    readOnly
                    className="flex-1 p-2 border border-blue-300 rounded bg-white text-center font-mono"
                  />
                  <Button size="sm" onClick={copyEventCode} variant="outline">
                    Copy Code
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-blue-700 dark:text-blue-300">Full Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/event/${params.token}`}
                    readOnly
                    className="flex-1 p-2 border border-blue-300 rounded bg-white text-xs font-mono"
                  />
                  <Button size="sm" onClick={copyShareLink} variant="outline">
                    Copy Link
                  </Button>
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowShareInfo(false)}
              className="mt-3 text-blue-600 hover:text-blue-800"
            >
              Close
            </Button>
          </div>
        )}

        {/* Main availability grid */}
        <AvailabilityGrid
          event={event}
          currentParticipant={currentParticipant}
          participants={participantAvailability}
          onAvailabilityChange={handleAvailabilityChange}
        />

        {/* LLM Chat Window */}
        <LLMChatWindow
          participantName={currentParticipant.name}
          isOpen={showChatWindow}
          onClose={() => setShowChatWindow(false)}
          onAvailabilityUpdate={handleLLMAvailabilityUpdate}
        />
      </div>
    </AppShell>
  );
}