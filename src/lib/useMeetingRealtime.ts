"use client";

import { useCallback, useEffect, useState } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useRealtime, RealtimeState } from './useRealtime';
import { supabase } from './supabase';
import type { Event, Participant, Availability, MeetingSlot } from './types';

export interface MeetingRealtimeData {
  event: Event | null;
  participants: Participant[];
  timeSlots: (MeetingSlot & {
    responses?: Array<{
      participant_id: string;
      status: string;
      preference_score: number;
      notes?: string;
      participants?: { id: string; name: string; role: string; priority_weight: number };
    }>;
  })[];
  availability: Availability[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface MeetingRealtimeConfig {
  eventId: string;
  participantId?: string;
  onParticipantResponse?: (participantId: string, slotId: string, response: Availability) => void;
  onScoreUpdate?: (slotId: string, newScore: number) => void;
  onParticipantJoin?: (participant: Participant) => void;
}

export interface UseMeetingRealtimeReturn {
  data: MeetingRealtimeData;
  realtimeState: RealtimeState;
  refreshData: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => void;
}

export function useMeetingRealtime(config: MeetingRealtimeConfig): UseMeetingRealtimeReturn {
  const [data, setData] = useState<MeetingRealtimeData>({
    event: null,
    participants: [],
    timeSlots: [],
    availability: [],
    isLoading: true,
    error: null,
    lastUpdated: null
  });

  const updateData = useCallback((updates: Partial<MeetingRealtimeData>) => {
    setData(prev => ({
      ...prev,
      ...updates,
      lastUpdated: new Date(),
      isLoading: false
    }));
  }, []);

  const handleRealtimeChange = useCallback((payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
    const { eventType, table, new: newRecord, old: oldRecord } = payload;

    switch (table) {
      case 'availability':
        if (eventType === 'INSERT' || eventType === 'UPDATE') {
          setData(prev => {
            const filtered = prev.availability.filter(a =>
              !(a.participant_id === newRecord.participant_id &&
                a.date === newRecord.date &&
                a.start_time === newRecord.start_time &&
                a.end_time === newRecord.end_time)
            );

            const updated = [...filtered, newRecord as Availability];

            // Trigger callback if this is for a specific participant
            if (config.onParticipantResponse && newRecord.participant_id !== config.participantId) {
              // Find which time slot this availability belongs to
              const slot = prev.timeSlots.find(s =>
                s.date === newRecord.date &&
                s.start_time === newRecord.start_time &&
                s.end_time === newRecord.end_time
              );
              if (slot) {
                config.onParticipantResponse(newRecord.participant_id, slot.id, newRecord);
              }
            }

            return {
              ...prev,
              availability: updated,
              lastUpdated: new Date()
            };
          });
        } else if (eventType === 'DELETE') {
          setData(prev => ({
            ...prev,
            availability: prev.availability.filter(a => a.id !== oldRecord.id),
            lastUpdated: new Date()
          }));
        }
        break;

      case 'meeting_slots':
        if (eventType === 'INSERT' || eventType === 'UPDATE') {
          setData(prev => {
            const filtered = prev.timeSlots.filter(s => s.id !== newRecord.id);
            const updated = [...filtered, newRecord as MeetingSlot].sort((a, b) =>
              (b.attendance_score || 0) - (a.attendance_score || 0)
            );

            // Trigger score update callback
            if (config.onScoreUpdate && eventType === 'UPDATE' &&
                oldRecord.attendance_score !== newRecord.attendance_score) {
              config.onScoreUpdate(newRecord.id, newRecord.attendance_score);
            }

            return {
              ...prev,
              timeSlots: updated,
              lastUpdated: new Date()
            };
          });
        } else if (eventType === 'DELETE') {
          setData(prev => ({
            ...prev,
            timeSlots: prev.timeSlots.filter(s => s.id !== oldRecord.id),
            lastUpdated: new Date()
          }));
        }
        break;

      case 'participants':
        if (eventType === 'INSERT') {
          setData(prev => {
            const exists = prev.participants.some(p => p.id === newRecord.id);
            if (!exists) {
              config.onParticipantJoin?.(newRecord as Participant);
              return {
                ...prev,
                participants: [...prev.participants, newRecord as Participant],
                lastUpdated: new Date()
              };
            }
            return prev;
          });
        } else if (eventType === 'UPDATE') {
          setData(prev => ({
            ...prev,
            participants: prev.participants.map(p =>
              p.id === newRecord.id ? { ...p, ...newRecord } : p
            ),
            lastUpdated: new Date()
          }));
        } else if (eventType === 'DELETE') {
          setData(prev => ({
            ...prev,
            participants: prev.participants.filter(p => p.id !== oldRecord.id),
            lastUpdated: new Date()
          }));
        }
        break;

      case 'events':
        if (eventType === 'UPDATE' && newRecord.id === config.eventId) {
          setData(prev => ({
            ...prev,
            event: { ...prev.event!, ...newRecord },
            lastUpdated: new Date()
          }));
        }
        break;
    }
  }, [config]);

  const fetchInitialData = useCallback(async () => {
    try {
      updateData({ isLoading: true, error: null });

      // Fetch event details
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', config.eventId)
        .single();

      if (eventError) throw eventError;

      // Fetch participants
      const { data: participants, error: participantsError } = await supabase
        .from('participants')
        .select('*')
        .eq('event_id', config.eventId)
        .order('created_at', { ascending: true });

      if (participantsError) throw participantsError;

      // Fetch time slots with scores
      const { data: timeSlots, error: timeSlotsError } = await supabase
        .from('meeting_slots')
        .select('*')
        .eq('event_id', config.eventId)
        .order('attendance_score', { ascending: false });

      if (timeSlotsError) throw timeSlotsError;

      // Fetch availability responses
      const { data: availability, error: availabilityError } = await supabase
        .from('availability')
        .select('*')
        .eq('event_id', config.eventId)
        .order('created_at', { ascending: true });

      if (availabilityError) throw availabilityError;

      // Fetch responses for each time slot
      const timeSlotsWithResponses = await Promise.all(
        (timeSlots || []).map(async (slot) => {
          const { data: responses } = await supabase
            .from('availability')
            .select(`
              participant_id,
              status,
              preference_score,
              notes,
              participants!inner (
                id,
                name,
                role,
                priority_weight
              )
            `)
            .eq('event_id', config.eventId)
            .eq('date', slot.date)
            .eq('start_time', slot.start_time)
            .eq('end_time', slot.end_time);

          return {
            ...slot,
            responses: responses || []
          };
        })
      );

      updateData({
        event: event as Event,
        participants: participants as Participant[] || [],
        timeSlots: timeSlotsWithResponses,
        availability: availability as Availability[] || [],
        isLoading: false,
        error: null
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load meeting data';
      updateData({
        isLoading: false,
        error: errorMessage
      });
      console.error('Error fetching meeting data:', error);
    }
  }, [config.eventId, updateData]);

  const realtime = useRealtime(
    {
      channelName: `meeting-${config.eventId}`,
      tables: [
        {
          table: 'availability',
          filter: `event_id=eq.${config.eventId}`
        },
        {
          table: 'meeting_slots',
          filter: `event_id=eq.${config.eventId}`
        },
        {
          table: 'participants',
          filter: `event_id=eq.${config.eventId}`
        },
        {
          table: 'events',
          filter: `id=eq.${config.eventId}`
        }
      ],
      onConnect: () => {
        console.log(`Connected to real-time updates for meeting ${config.eventId}`);
      },
      onDisconnect: () => {
        console.log(`Disconnected from real-time updates for meeting ${config.eventId}`);
      },
      onError: (error) => {
        console.error(`Real-time error for meeting ${config.eventId}:`, error);
        updateData({ error: error.message || 'Real-time connection error' });
      }
    },
    handleRealtimeChange,
    [config.eventId]
  );

  // Load initial data
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return {
    data,
    realtimeState: realtime.state,
    refreshData: fetchInitialData,
    disconnect: realtime.unsubscribe,
    reconnect: realtime.reconnect
  };
}