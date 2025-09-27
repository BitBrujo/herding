"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Calendar, Clock, MapPin, ArrowLeft, X, Gamepad2, ChevronDown, ChevronRight } from 'lucide-react';
import { ParticipantIcon } from '@/components/icons/ParticipantIcon';
import { COMMON_TIMEZONES, detectUserTimezone } from '@/lib/timezone-utils';
import { LLMPromptBox } from '@/components/LLMPromptBox';

interface MeetingData {
  title: string;
  timezone: string;
  duration_minutes: number;
  password?: string;
  enable_google_calendar: boolean;
  start_date: string;
  start_time: string;
  end_time: string;
  max_participants: number;
}

interface MeetingCreatorProps {
  onMeetingCreated?: (meetingId: string, shareToken: string, title: string) => void;
  onCancel?: () => void;
}

export function MeetingCreator({ onMeetingCreated, onCancel }: MeetingCreatorProps) {
  const [formData, setFormData] = useState<MeetingData>({
    title: '',
    timezone: detectUserTimezone(),
    duration_minutes: 60,
    password: '',
    enable_google_calendar: false,
    start_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '19:00',
    max_participants: 7
  });


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const handleInputChange = (field: keyof MeetingData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleParameterUpdate = (updates: Record<string, string | number | boolean>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Please enter an event name');
      }

      // Create the meeting with minimal data - dates will be set via grid
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          description: '',
          organizer_name: '',
          organizer_email: '',
          meeting_importance: 'medium',
          meeting_type: 'general',
          // Set end date to 7 days from start date
          end_date: new Date(new Date(formData.start_date).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create meeting');
      }

      const { event } = await response.json();
      onMeetingCreated?.(event.id, event.share_token, event.title);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1"></div>
          <CardTitle className="flex items-center gap-3 text-3xl">
            <ParticipantIcon className="h-8 w-8 text-primary" />
            Create New Herd
          </CardTitle>
          <div className="flex-1 flex justify-end">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Herd Name and Timezone Row */}
          <div className="flex gap-4 items-end">
            {/* Event Name */}
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                Herd Name
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="event"
                required
              />
            </div>

            {/* Timezone */}
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.75rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em'
                }}
              >
                {COMMON_TIMEZONES.map(tz => (
                  <option key={tz.name} value={tz.name}>
                    {tz.abbreviation} - {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Herd...' : 'Create Herd'}
            </Button>
          </div>

          {/* Options Toggle */}
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="flex items-center gap-2 w-full justify-center"
            >
              {showAdvancedOptions ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Options (for picky katz)
            </Button>
          </div>

          {/* Advanced Options - Hidden by default */}
          {showAdvancedOptions && (
            <div className="space-y-6 pt-2">
              {/* Row: Start Date, Time Range, Max Participants */}
              <div className="flex gap-4 items-end">
                {/* Start Date */}
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">
                    <Calendar className="inline h-4 w-4 mr-1 text-white" />
                    Start Date (7 day range from selected date)
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    style={{
                      colorScheme: 'dark'
                    }}
                    required
                  />
                </div>

                {/* Time Range Dropdown */}
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Daily Time Range
                  </label>
                  <select
                    value={`${formData.start_time}-${formData.end_time}`}
                    onChange={(e) => {
                      const [start, end] = e.target.value.split('-');
                      setFormData(prev => ({ ...prev, start_time: start, end_time: end }));
                    }}
                    className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.75rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em'
                    }}
                  >
                    <option value="09:00-19:00">Standard (9:00am - 7:00pm)</option>
                    <option value="04:00-12:00">Early Morning (4:00am - 12:00pm)</option>
                    <option value="15:00-22:00">Afternoon (3:00pm - 10:00pm)</option>
                    <option value="20:00-04:00">Late Night (8:00pm - 4:00am)</option>
                  </select>
                </div>

                {/* Max Participants */}
                <div className="w-24">
                  <label className="block text-sm font-medium mb-2">
                    <ParticipantIcon className="inline h-4 w-4 mr-1" />
                    Max Katz
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.max_participants}
                    onChange={(e) => handleInputChange('max_participants', parseInt(e.target.value) || 7)}
                    className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* LLM Prompt Box */}
          <LLMPromptBox onParameterUpdate={handleParameterUpdate} />
        </form>
      </CardContent>
    </Card>
  );
}