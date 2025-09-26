"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { CheckCircle, XCircle, HelpCircle, MessageSquare, Star, Clock, Users } from 'lucide-react';
import { formatTimeInTimezone } from '@/lib/timezone-utils';
import { MeetingSlot, Participant, Event } from '@/lib/types';
import { useMeetingRealtime } from '@/lib/useMeetingRealtime';
import { RealtimeStatus } from '@/components/RealtimeStatus';

interface TimeSlotWithScore extends MeetingSlot {
  score?: number;
  responses?: Array<{
    participant_id: string;
    status: string;
    preference_score: number;
    notes?: string;
  }>;
}

interface AvailabilityResponderProps {
  event: Event;
  participant: Participant;
  timeSlots: TimeSlotWithScore[];
  onResponseUpdated?: () => void;
}

type ResponseStatus = 'available' | 'unavailable' | 'maybe' | 'preferred';

interface Response {
  status: ResponseStatus;
  preference_score: number;
  notes: string;
}

export function AvailabilityResponder({
  event,
  participant,
  timeSlots: initialTimeSlots,
  onResponseUpdated
}: AvailabilityResponderProps) {
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentResponses, setRecentResponses] = useState<Set<string>>(new Set());

  // Real-time integration
  const { data: realtimeData, realtimeState } = useMeetingRealtime({
    eventId: event.id,
    participantId: participant.id,
    onParticipantResponse: useCallback((participantId: string, slotId: string) => {
      if (participantId !== participant.id) {
        // Highlight recent responses from other participants
        setRecentResponses(prev => new Set([...prev, `${participantId}-${slotId}`]));
        setTimeout(() => {
          setRecentResponses(prev => {
            const newSet = new Set(prev);
            newSet.delete(`${participantId}-${slotId}`);
            return newSet;
          });
        }, 3000);
      }
    }, [participant.id]),
    onScoreUpdate: useCallback(() => {
      // Score updates are handled automatically by the real-time data
      onResponseUpdated?.();
    }, [onResponseUpdated])
  });

  // Use real-time data if available, otherwise fall back to props
  const timeSlots = realtimeData.timeSlots.length > 0 ? realtimeData.timeSlots : initialTimeSlots;

  // Load existing responses
  useEffect(() => {
    const loadExistingResponses = async () => {
      try {
        const existingResponses: Record<string, Response> = {};

        for (const slot of timeSlots) {
          const response = await fetch(`/api/timeslots/${slot.id}/responses`);
          if (response.ok) {
            const { responses: slotResponses } = await response.json();
            const participantResponse = slotResponses.find(
              (r: { participants: { id: string } }) => r.participants.id === participant.id
            );

            if (participantResponse) {
              existingResponses[slot.id] = {
                status: participantResponse.status,
                preference_score: participantResponse.preference_score,
                notes: participantResponse.notes || ''
              };
            }
          }
        }

        setResponses(existingResponses);
      } catch (err) {
        console.error('Failed to load existing responses:', err);
      }
    };

    loadExistingResponses();
  }, [timeSlots, participant.id]);

  const updateResponse = async (slotId: string, response: Partial<Response>) => {
    const currentResponse = responses[slotId] || {
      status: 'unavailable' as ResponseStatus,
      preference_score: 3,
      notes: ''
    };

    const updatedResponse = { ...currentResponse, ...response };

    // Optimistic update - show immediately
    setResponses(prev => ({ ...prev, [slotId]: updatedResponse }));
    setIsSubmitting(prev => ({ ...prev, [slotId]: true }));
    setError(null);

    // Store previous state for rollback
    const previousResponse = currentResponse;

    try {
      const apiResponse = await fetch(`/api/timeslots/${slotId}/responses`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participant_id: participant.id,
          status: updatedResponse.status,
          preference_score: updatedResponse.preference_score,
          notes: updatedResponse.notes
        }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'Failed to update response');
      }

      // Success - real-time updates will handle the rest
      onResponseUpdated?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update response';
      setError(errorMessage);

      // Rollback optimistic update on error
      setResponses(prev => {
        const newResponses = { ...prev };
        if (Object.keys(previousResponse).length === 0) {
          delete newResponses[slotId];
        } else {
          newResponses[slotId] = previousResponse;
        }
        return newResponses;
      });
    } finally {
      setIsSubmitting(prev => ({ ...prev, [slotId]: false }));
    }
  };

  const getStatusIcon = (status: ResponseStatus) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'preferred':
        return <Star className="h-5 w-5 text-yellow-600" />;
      case 'maybe':
        return <HelpCircle className="h-5 w-5 text-yellow-600" />;
      case 'unavailable':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: ResponseStatus) => {
    switch (status) {
      case 'available':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
      case 'preferred':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950';
      case 'maybe':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950';
      case 'unavailable':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
      default:
        return 'border-border bg-background';
    }
  };

  const formatSlotDisplay = (slot: TimeSlotWithScore) => {
    const date = new Date(slot.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const startTime = formatTimeInTimezone(slot.date, slot.start_time, event.timezone, {
      includeDate: false,
      includeTimezone: false,
      format24Hour: false
    });

    const endTime = formatTimeInTimezone(slot.date, slot.end_time, event.timezone, {
      includeDate: false,
      includeTimezone: false,
      format24Hour: false
    });

    return {
      dayName,
      dateStr,
      timeRange: `${startTime} - ${endTime}`
    };
  };

  const getResponseStats = () => {
    const total = timeSlots.length;
    const responded = Object.keys(responses).length;
    const available = Object.values(responses).filter(r =>
      r.status === 'available' || r.status === 'preferred'
    ).length;
    const unavailable = Object.values(responses).filter(r =>
      r.status === 'unavailable'
    ).length;
    const maybe = Object.values(responses).filter(r =>
      r.status === 'maybe'
    ).length;

    return { total, responded, available, unavailable, maybe };
  };

  const stats = getResponseStats();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Your Availability
          </CardTitle>
          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <RealtimeStatus state={realtimeState} />

            {/* Response Count */}
            <div className="text-sm text-muted-foreground">
              {stats.responded}/{stats.total} responded
            </div>
          </div>
        </div>

        {/* Response Summary */}
        {stats.responded > 0 && (
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>{stats.available} available</span>
            </div>
            <div className="flex items-center gap-1">
              <HelpCircle className="h-4 w-4 text-yellow-600" />
              <span>{stats.maybe} maybe</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="h-4 w-4 text-red-600" />
              <span>{stats.unavailable} unavailable</span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {timeSlots.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No time slots have been proposed yet.</p>
            <p className="text-sm">The organizer will add time options for you to respond to.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {timeSlots.map((slot) => {
              const display = formatSlotDisplay(slot);
              const response = responses[slot.id];
              const isExpanded = expandedSlot === slot.id;
              const isLoading = isSubmitting[slot.id];
              const hasRecentActivity = slot.responses?.some(r =>
                recentResponses.has(`${r.participant_id}-${slot.id}`)
              );
              const responseCount = slot.responses?.length || 0;
              const totalParticipants = realtimeData.participants.length || slot.total_participants || 0;

              return (
                <div
                  key={slot.id}
                  className={`border rounded-lg transition-all duration-300 ${getStatusColor(response?.status)} ${
                    hasRecentActivity ? 'ring-2 ring-blue-300 ring-opacity-50' : ''
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{display.dayName}</div>
                        <div className="text-sm text-muted-foreground">
                          {display.dateStr}
                        </div>
                        <div className="text-sm font-medium">
                          {display.timeRange}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {response && getStatusIcon(response.status)}

                        {/* Participant response count */}
                        {totalParticipants > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{responseCount}/{totalParticipants}</span>
                          </div>
                        )}

                        {/* Live score with animation */}
                        {slot.attendance_score !== undefined && (
                          <div className={`text-xs transition-all duration-300 ${
                            hasRecentActivity ? 'text-blue-600 font-medium' : 'text-muted-foreground'
                          }`}>
                            Score: {Math.round(slot.attendance_score)}%
                          </div>
                        )}

                        {/* Recent activity indicator */}
                        {hasRecentActivity && (
                          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                        )}
                      </div>
                    </div>

                    {/* Response Buttons */}
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      <Button
                        size="sm"
                        variant={response?.status === 'preferred' ? 'default' : 'outline'}
                        onClick={() => updateResponse(slot.id, { status: 'preferred' })}
                        disabled={isLoading}
                        className="flex items-center gap-1"
                      >
                        <Star className="h-3 w-3" />
                        Prefer
                      </Button>

                      <Button
                        size="sm"
                        variant={response?.status === 'available' ? 'default' : 'outline'}
                        onClick={() => updateResponse(slot.id, { status: 'available' })}
                        disabled={isLoading}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Yes
                      </Button>

                      <Button
                        size="sm"
                        variant={response?.status === 'maybe' ? 'default' : 'outline'}
                        onClick={() => updateResponse(slot.id, { status: 'maybe' })}
                        disabled={isLoading}
                        className="flex items-center gap-1"
                      >
                        <HelpCircle className="h-3 w-3" />
                        Maybe
                      </Button>

                      <Button
                        size="sm"
                        variant={response?.status === 'unavailable' ? 'default' : 'outline'}
                        onClick={() => updateResponse(slot.id, { status: 'unavailable' })}
                        disabled={isLoading}
                        className="flex items-center gap-1"
                      >
                        <XCircle className="h-3 w-3" />
                        No
                      </Button>
                    </div>

                    {/* Expanded Options */}
                    {response && (response.status === 'maybe' || isExpanded) && (
                      <div className="mt-4 p-3 bg-muted/30 rounded-lg space-y-3">
                        {response.status === 'maybe' && (
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Confidence Level (1 = unsure, 5 = likely)
                            </label>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((score) => (
                                <Button
                                  key={score}
                                  size="sm"
                                  variant={response.preference_score === score ? 'default' : 'outline'}
                                  onClick={() => updateResponse(slot.id, { preference_score: score })}
                                  disabled={isLoading}
                                  className="w-8 h-8 p-0"
                                >
                                  {score}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Notes (optional)
                          </label>
                          <textarea
                            value={response.notes}
                            onChange={(e) => updateResponse(slot.id, { notes: e.target.value })}
                            className="w-full p-2 text-sm border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                            rows={2}
                            placeholder="Any specific constraints or preferences..."
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    )}

                    {/* Toggle Advanced Options */}
                    {response && response.status !== 'maybe' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedSlot(isExpanded ? null : slot.id)}
                        className="mt-2 text-xs"
                      >
                        {isExpanded ? 'Hide' : 'Add'} Notes
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {timeSlots.length > 0 && stats.responded < stats.total && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Please respond to all time slots to help find the best meeting time.
          </div>
        )}
      </CardContent>
    </Card>
  );
}