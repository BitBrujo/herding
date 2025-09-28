"use client";

import React, { useState, useEffect, use } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AvailabilityGrid } from '@/components/AvailabilityGrid';
import { ParticipantNameEntry } from '@/components/ParticipantNameEntry';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Calendar,
  CheckCircle
} from 'lucide-react';
import { Event, Participant } from '@/lib/types';
import { useRealtime } from '@/lib/useRealtime';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface EventPageProps {
  params: Promise<{
    token: string;
  }>;
  searchParams?: Promise<{
    participant?: string;
  }>;
}

interface ParticipantAvailability {
  participantId: string;
  participantName: string;
  availability: {
    [key: string]: 'available' | 'unavailable' | 'maybe';
  };
}

// Helper function to convert 24-hour time to 12-hour format
const formatTimeTo12Hour = (time24: string): string => {
  const [hour, minute] = time24.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
};

// Helper function to convert 12-hour time to 24-hour format
const formatTimeTo24Hour = (time12: string): string => {
  const [time, period] = time12.split(' ');
  const [hour, minute] = time.split(':').map(Number);

  let hour24 = hour;
  if (period === 'AM' && hour === 12) {
    hour24 = 0;
  } else if (period === 'PM' && hour !== 12) {
    hour24 = hour + 12;
  }

  return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
};

export default function EventPage({ params, searchParams }: EventPageProps) {
  const { token } = use(params);
  const searchParamsData = searchParams ? use(searchParams) : {};
  const participantId = searchParamsData.participant;
  const [event, setEvent] = useState<Event | null>(null);
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [participantAvailability, setParticipantAvailability] = useState<ParticipantAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isOrganizer] = useState(false);
  const [showShareInfo, setShowShareInfo] = useState(false);
  const [showParticipantList, setShowParticipantList] = useState(false);

  // Real-time subscription for availability changes
  const handleRealtimeChange = (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
    if (payload.table === 'availability' && event) {
      const availability = payload.new as { participant_id: string; date: string; start_time: string; status: string };

      // Convert database format to grid format
      const time12Hour = formatTimeTo12Hour(availability.start_time);
      const slotKey = `${availability.date}-${time12Hour}`;

      // Update local state with real-time change
      setParticipantAvailability(prev =>
        prev.map(p =>
          p.participantId === availability.participant_id
            ? {
                ...p,
                availability: {
                  ...p.availability,
                  [slotKey]: availability.status
                }
              }
            : p
        )
      );
    }
  };

  const { state: realtimeState } = useRealtime(
    {
      channelName: `event-${event?.id || 'loading'}`,
      tables: [
        {
          table: 'availability',
          filter: event ? `event_id=eq.${event.id}` : '',
          event: '*'
        }
      ],
      onConnect: () => console.log('Real-time connected'),
      onDisconnect: () => console.log('Real-time disconnected'),
      onError: (error) => console.error('Real-time error:', error)
    },
    handleRealtimeChange,
    [event?.id] // Re-subscribe when event changes
  );

  useEffect(() => {
    loadEventData();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEventData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Find event by share token
      const eventsResponse = await fetch('/api/meetings');
      if (!eventsResponse.ok) throw new Error('Failed to fetch events');

      const { events } = await eventsResponse.json();
      const foundEvent = events.find((e: Event) => e.share_token === token);

      if (!foundEvent) {
        throw new Error('Event not found');
      }

      setEvent(foundEvent);

      // Load participants and their availability
      const participantsResponse = await fetch(`/api/participants?event_id=${foundEvent.id}`);
      if (participantsResponse.ok) {
        const { participants: eventParticipants } = await participantsResponse.json();

        // Load availability data for this event
        const availabilityResponse = await fetch(`/api/availability?event_id=${foundEvent.id}`);
        let availabilityByParticipant: Record<string, Record<string, string>> = {};

        if (availabilityResponse.ok) {
          const { availability: availabilityData } = await availabilityResponse.json();

          // Transform database availability into grid format
          availabilityByParticipant = availabilityData.reduce((acc: Record<string, Record<string, string>>, avail: { participant_id: string; date: string; start_time: string; status: string }) => {
            if (!acc[avail.participant_id]) {
              acc[avail.participant_id] = {};
            }

            // Convert database time format to grid format
            const time12Hour = formatTimeTo12Hour(avail.start_time);
            const slotKey = `${avail.date}-${time12Hour}`;
            acc[avail.participant_id][slotKey] = avail.status;

            return acc;
          }, {});
        }

        // Transform participants into availability format
        const availabilityData = eventParticipants.map((p: Participant) => ({
          participantId: p.id,
          participantName: p.name,
          availability: availabilityByParticipant[p.id] || {}
        }));

        setParticipantAvailability(availabilityData);

        // If participant ID is provided in URL, set as current participant
        if (participantId) {
          const foundParticipant = eventParticipants.find((p: Participant) => p.id === participantId);
          if (foundParticipant) {
            setCurrentParticipant(foundParticipant);
          }
        }
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

  const handleAvailabilityChange = async (participantId: string, timeSlot: { date: string; time: string }, status: 'available' | 'unavailable' | 'maybe') => {
    const slotKey = `${timeSlot.date}-${timeSlot.time}`;

    // Optimistic update - update UI immediately
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

    // Save to database
    try {
      if (!event) return;

      const startTime24 = formatTimeTo24Hour(timeSlot.time);

      // Calculate end time (30 minutes later for now)
      const startDate = new Date(`2000-01-01T${startTime24}`);
      const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
      const endTime24 = endDate.toTimeString().slice(0, 8);

      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participant_id: participantId,
          event_id: event.id,
          date: timeSlot.date,
          start_time: startTime24,
          end_time: endTime24,
          status: status,
          preference_score: status === 'available' ? 1 : status === 'maybe' ? 0.5 : 0
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save availability');
      }

    } catch (error) {
      console.error('Error saving availability:', error);

      // Rollback optimistic update on error
      setParticipantAvailability(prev =>
        prev.map(p =>
          p.participantId === participantId
            ? {
                ...p,
                availability: {
                  ...p.availability,
                  [slotKey]: p.availability[slotKey] === status
                    ? (status === 'available' ? 'unavailable' : 'available')
                    : p.availability[slotKey]
                }
              }
            : p
        )
      );

      setError('Failed to save availability change. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };


  const copyShareLink = async () => {
    try {
      const shareUrl = `${window.location.origin}/event/${token}`;
      await navigator.clipboard.writeText(shareUrl);
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
            <h1 className="text-5xl font-bold text-foreground mb-2">
              {event.title}
            </h1>
          </div>

          <ParticipantNameEntry
            eventTitle={event.title}
            onNameSubmit={handleJoinAsParticipant}
            isLoading={isJoining}
            startDate={event.start_date}
            endDate={event.end_date}
            startTime={event.start_time}
            endTime={event.end_time}
            participantCount={participantAvailability.length}
            maxParticipants={event.max_participants}
          />
        </div>
      </AppShell>
    );
  }

  // Main grid interface
  return (
    <AppShell>
      <div className="max-w-7xl mx-auto">
        {/* Main availability grid */}
        <AvailabilityGrid
          event={event}
          currentParticipant={currentParticipant}
          participants={participantAvailability}
          onAvailabilityChange={handleAvailabilityChange}
          onShareClick={() => {
            if (showShareInfo) {
              // If share popup is already showing, close it (restart state)
              setShowShareInfo(false);
            } else {
              // Show share popup and hide participant list
              setShowShareInfo(true);
              setShowParticipantList(false);
            }
          }}
          showShareInfo={showShareInfo}
          onCopyShareLink={copyShareLink}
          shareUrl={`${window.location.origin}/event/${token}`}
          onKatzClick={() => {
            if (showParticipantList) {
              // If participant list is already showing, close it (restart state)
              setShowParticipantList(false);
            } else {
              // Show participant list and hide share popup
              setShowParticipantList(true);
              setShowShareInfo(false);
            }
          }}
          showParticipantList={showParticipantList}
          realtimeState={realtimeState}
        />

        {/* Future organizer controls */}
        {isOrganizer && (
          <div className="flex justify-center mt-6 w-full max-w-lg mx-auto">
            <Button className="flex items-center gap-2 flex-1">
              <CheckCircle className="h-4 w-4" />
              Finalize Meeting
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}