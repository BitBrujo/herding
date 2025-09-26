"use client";

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { TimeSlotProposer } from '@/components/TimeSlotProposer';
import { AvailabilityResponder } from '@/components/AvailabilityResponder';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  Calendar,
  Users,
  Clock,
  Settings,
  BarChart3,
  UserPlus,
  Share2
} from 'lucide-react';
import { Event, Participant, MeetingSlot } from '@/lib/types';
import { getTimezoneFriendlyLabel } from '@/lib/timezone-utils';

interface EventPageProps {
  params: {
    token: string;
  };
  searchParams: {
    role?: string;
  };
}

export default function EventPage({ params, searchParams }: EventPageProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [timeSlots, setTimeSlots] = useState<MeetingSlot[]>([]);
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'respond' | 'propose' | 'results'>('respond');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantEmail, setNewParticipantEmail] = useState('');

  const isOrganizer = searchParams.role === 'organizer';

  useEffect(() => {
    loadEventData();
  }, [params.token]);

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

      // Load participants
      const participantsResponse = await fetch(`/api/participants?event_id=${foundEvent.id}`);
      if (participantsResponse.ok) {
        const { participants: eventParticipants } = await participantsResponse.json();
        setParticipants(eventParticipants);

        // Try to identify current participant (this would be more sophisticated in a real app)
        if (isOrganizer) {
          const organizer = eventParticipants.find((p: Participant) => p.role === 'organizer');
          setCurrentParticipant(organizer);
        }
      }

      // Load time slots
      const slotsResponse = await fetch(`/api/meetings/${foundEvent.id}/timeslots`);
      if (slotsResponse.ok) {
        const { timeSlots: eventTimeSlots } = await slotsResponse.json();
        setTimeSlots(eventTimeSlots);
      }

      // Set default tab based on role and content
      if (isOrganizer) {
        setActiveTab('propose');
      } else {
        setActiveTab('respond');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinAsParticipant = async () => {
    if (!newParticipantName.trim() || !event) return;

    try {
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: event.id,
          name: newParticipantName,
          email: newParticipantEmail,
          role: 'required'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join event');
      }

      const { participant } = await response.json();
      setCurrentParticipant(participant);
      setShowJoinForm(false);
      await loadEventData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join event');
    }
  };

  const copyShareLink = async () => {
    try {
      const shareUrl = `${window.location.origin}/event/${params.token}`;
      await navigator.clipboard.writeText(shareUrl);
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

  const formatEventDate = () => {
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);

    if (event.start_date === event.end_date) {
      return start.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        {/* Event Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {event.title}
              </h1>
              {event.description && (
                <p className="text-muted-foreground mb-4">
                  {event.description}
                </p>
              )}
            </div>

            <Button
              variant="outline"
              onClick={copyShareLink}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Date Range</div>
                    <div className="text-sm text-muted-foreground">
                      {formatEventDate()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Duration</div>
                    <div className="text-sm text-muted-foreground">
                      {event.duration_minutes} minutes
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Participants</div>
                    <div className="text-sm text-muted-foreground">
                      {participants.length} joined
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Timezone</div>
                    <div className="text-sm text-muted-foreground">
                      {getTimezoneFriendlyLabel(event.timezone)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Join as Participant */}
        {!currentParticipant && !isOrganizer && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Join This Meeting
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!showJoinForm ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">
                    To respond to time proposals, please join this meeting.
                  </p>
                  <Button onClick={() => setShowJoinForm(true)}>
                    Join Meeting
                  </Button>
                </div>
              ) : (
                <div className="max-w-md mx-auto">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        value={newParticipantName}
                        onChange={(e) => setNewParticipantName(e.target.value)}
                        className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email (optional)
                      </label>
                      <input
                        type="email"
                        value={newParticipantEmail}
                        onChange={(e) => setNewParticipantEmail(e.target.value)}
                        className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="john@company.com"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleJoinAsParticipant}
                        disabled={!newParticipantName.trim()}
                        className="flex-1"
                      >
                        Join Meeting
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowJoinForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation Tabs */}
        {(currentParticipant || isOrganizer) && (
          <div className="flex gap-4 mb-6 border-b border-border">
            <Button
              variant="ghost"
              onClick={() => setActiveTab('respond')}
              className={`pb-3 rounded-none border-b-2 ${
                activeTab === 'respond'
                  ? 'border-primary text-primary'
                  : 'border-transparent'
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              Respond to Times
            </Button>

            {isOrganizer && (
              <Button
                variant="ghost"
                onClick={() => setActiveTab('propose')}
                className={`pb-3 rounded-none border-b-2 ${
                  activeTab === 'propose'
                    ? 'border-primary text-primary'
                    : 'border-transparent'
                }`}
              >
                <Clock className="h-4 w-4 mr-2" />
                Propose Times
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={() => setActiveTab('results')}
              className={`pb-3 rounded-none border-b-2 ${
                activeTab === 'results'
                  ? 'border-primary text-primary'
                  : 'border-transparent'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Results
            </Button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'respond' && currentParticipant && (
          <AvailabilityResponder
            event={event}
            participant={currentParticipant}
            timeSlots={timeSlots}
            onResponseUpdated={loadEventData}
          />
        )}

        {activeTab === 'propose' && isOrganizer && (
          <TimeSlotProposer
            event={event}
            onTimeSlotsUpdated={loadEventData}
          />
        )}

        {activeTab === 'results' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Meeting Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Results and scoring dashboard coming soon...</p>
                <p className="text-sm">This will show optimal times and participant responses.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}