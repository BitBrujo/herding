"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Clock, Plus, Calendar, Zap, X, CheckCircle } from 'lucide-react';
import { generateTimeSlots, formatTimeInTimezone } from '@/lib/timezone-utils';
import { Event } from '@/lib/types';

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
}

interface ProposedSlot extends TimeSlot {
  id?: string;
  isSubmitting?: boolean;
}

interface TimeSlotProposerProps {
  event: Event;
  onTimeSlotsUpdated?: () => void;
}

export function TimeSlotProposer({ event, onTimeSlotsUpdated }: TimeSlotProposerProps) {
  const [proposedSlots, setProposedSlots] = useState<ProposedSlot[]>([]);
  const [customSlot, setCustomSlot] = useState<TimeSlot>({
    date: '',
    startTime: '10:00',
    endTime: '11:00'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationSettings, setGenerationSettings] = useState({
    intervalMinutes: 30,
    skipWeekends: true,
    businessHoursOnly: true
  });

  useEffect(() => {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setCustomSlot(prev => ({
      ...prev,
      date: tomorrow.toISOString().split('T')[0]
    }));
  }, []);

  const generateSuggestedSlots = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const startTime = generationSettings.businessHoursOnly ? '09:00' : event.start_time;
      const endTime = generationSettings.businessHoursOnly ? '17:00' : event.end_time;

      const slots = generateTimeSlots(
        event.start_date,
        event.end_date,
        startTime,
        endTime,
        event.duration_minutes,
        generationSettings.intervalMinutes
      );

      // Filter out weekends if requested
      const filteredSlots = generationSettings.skipWeekends
        ? slots.filter(slot => {
            const date = new Date(slot.date);
            const dayOfWeek = date.getDay();
            return dayOfWeek !== 0 && dayOfWeek !== 6; // Not Sunday or Saturday
          })
        : slots;

      // Limit to a reasonable number of slots
      const limitedSlots = filteredSlots.slice(0, 20);

      setProposedSlots(limitedSlots);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate time slots');
    } finally {
      setIsGenerating(false);
    }
  };

  const addCustomSlot = () => {
    if (!customSlot.date || !customSlot.startTime || !customSlot.endTime) {
      setError('Please fill in all fields for the custom time slot');
      return;
    }

    const start = new Date(`${customSlot.date}T${customSlot.startTime}`);
    const end = new Date(`${customSlot.date}T${customSlot.endTime}`);

    if (end <= start) {
      setError('End time must be after start time');
      return;
    }

    // Check if slot already exists
    const exists = proposedSlots.some(slot =>
      slot.date === customSlot.date &&
      slot.startTime === customSlot.startTime &&
      slot.endTime === customSlot.endTime
    );

    if (exists) {
      setError('This time slot is already proposed');
      return;
    }

    setProposedSlots(prev => [...prev, { ...customSlot }]);
    setError(null);

    // Reset custom slot to next day
    const nextDay = new Date(customSlot.date);
    nextDay.setDate(nextDay.getDate() + 1);
    setCustomSlot(prev => ({
      ...prev,
      date: nextDay.toISOString().split('T')[0]
    }));
  };

  const removeSlot = (index: number) => {
    setProposedSlots(prev => prev.filter((_, i) => i !== index));
  };

  const submitSlot = async (slot: ProposedSlot, index: number) => {
    setProposedSlots(prev => prev.map((s, i) =>
      i === index ? { ...s, isSubmitting: true } : s
    ));

    try {
      const response = await fetch(`/api/meetings/${event.id}/timeslots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: slot.date,
          start_time: slot.startTime,
          end_time: slot.endTime,
          timezone: event.timezone
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create time slot');
      }

      const { timeSlot } = await response.json();

      // Update the slot with the ID from the server
      setProposedSlots(prev => prev.map((s, i) =>
        i === index ? { ...s, id: timeSlot.id, isSubmitting: false } : s
      ));

      onTimeSlotsUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit time slot');
      setProposedSlots(prev => prev.map((s, i) =>
        i === index ? { ...s, isSubmitting: false } : s
      ));
    }
  };

  const submitAllSlots = async () => {
    const unsubmittedSlots = proposedSlots
      .map((slot, index) => ({ slot, index }))
      .filter(({ slot }) => !slot.id && !slot.isSubmitting);

    for (const { slot, index } of unsubmittedSlots) {
      await submitSlot(slot, index);
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const formatSlotDisplay = (slot: TimeSlot) => {
    const date = new Date(slot.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return {
      day: dayName,
      date: dateStr,
      time: formatTimeInTimezone(slot.date, slot.startTime, event.timezone, {
        includeDate: false,
        includeTimezone: false,
        format24Hour: false
      }) + ' - ' + formatTimeInTimezone(slot.date, slot.endTime, event.timezone, {
        includeDate: false,
        includeTimezone: false,
        format24Hour: false
      })
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Propose Meeting Times
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Generation Settings */}
        <div>
          <h3 className="font-medium mb-3">Smart Generation Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-2">
                Time Interval
              </label>
              <select
                value={generationSettings.intervalMinutes}
                onChange={(e) => setGenerationSettings(prev => ({
                  ...prev,
                  intervalMinutes: parseInt(e.target.value)
                }))}
                className="w-full p-2 border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value={15}>Every 15 minutes</option>
                <option value={30}>Every 30 minutes</option>
                <option value={60}>Every hour</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generationSettings.skipWeekends}
                  onChange={(e) => setGenerationSettings(prev => ({
                    ...prev,
                    skipWeekends: e.target.checked
                  }))}
                  className="rounded border-border"
                />
                <span className="text-sm">Skip weekends</span>
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={generationSettings.businessHoursOnly}
                  onChange={(e) => setGenerationSettings(prev => ({
                    ...prev,
                    businessHoursOnly: e.target.checked
                  }))}
                  className="rounded border-border"
                />
                <span className="text-sm">Business hours only</span>
              </label>
            </div>
          </div>

          <Button
            onClick={generateSuggestedSlots}
            disabled={isGenerating}
            className="mt-3"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Smart Suggestions'}
          </Button>
        </div>

        {/* Custom Time Slot */}
        <div>
          <h3 className="font-medium mb-3">Add Custom Time Slot</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={customSlot.date}
                onChange={(e) => setCustomSlot(prev => ({ ...prev, date: e.target.value }))}
                min={event.start_date}
                max={event.end_date}
                className="w-full p-2 border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input
                type="time"
                value={customSlot.startTime}
                onChange={(e) => setCustomSlot(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full p-2 border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="time"
                value={customSlot.endTime}
                onChange={(e) => setCustomSlot(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full p-2 border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                onClick={addCustomSlot}
                size="sm"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Proposed Slots */}
        {proposedSlots.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Proposed Time Slots ({proposedSlots.length})</h3>
              <Button
                onClick={submitAllSlots}
                size="sm"
                disabled={proposedSlots.every(slot => slot.id || slot.isSubmitting)}
              >
                Submit All
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {proposedSlots.map((slot, index) => {
                const display = formatSlotDisplay(slot);
                return (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg transition-colors ${
                      slot.id
                        ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                        : 'bg-background border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {display.day}, {display.date}
                          {slot.id && <CheckCircle className="h-4 w-4 text-green-600" />}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {display.time}
                        </div>
                      </div>

                      <div className="flex gap-1">
                        {!slot.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => submitSlot(slot, index)}
                            disabled={slot.isSubmitting}
                          >
                            {slot.isSubmitting ? '...' : 'Submit'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeSlot(index)}
                          disabled={slot.isSubmitting}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {proposedSlots.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No time slots proposed yet.</p>
            <p className="text-sm">Use the smart generator or add custom slots above.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}