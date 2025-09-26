"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { COMMON_TIMEZONES, detectUserTimezone } from '@/lib/timezone-utils';

interface MeetingData {
  title: string;
  timezone: string;
  duration_minutes: number;
  password?: string;
  enable_google_calendar: boolean;
}

interface MeetingCreatorProps {
  onMeetingCreated?: (meetingId: string, shareToken: string) => void;
  onCancel?: () => void;
}

export function MeetingCreator({ onMeetingCreated, onCancel }: MeetingCreatorProps) {
  const [formData, setFormData] = useState<MeetingData>({
    title: '',
    timezone: detectUserTimezone(),
    duration_minutes: 60,
    password: '',
    enable_google_calendar: false
  });


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof MeetingData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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
          // Set default date range for grid setup (next 7 days)
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          start_time: '09:00',
          end_time: '17:00'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create meeting');
      }

      const { event } = await response.json();
      onMeetingCreated?.(event.id, event.share_token);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Create New Meeting
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Event Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Event Name *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Team Meeting"
              required
            />
          </div>

          {/* Meeting Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Duration
              </label>
              <select
                value={formData.duration_minutes}
                onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value))}
                className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {COMMON_TIMEZONES.map(tz => (
                  <option key={tz.name} value={tz.name}>
                    {tz.abbreviation} - {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Settings */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Optional Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Protect your event with a password"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for public access
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="google-calendar"
                checked={formData.enable_google_calendar}
                onChange={(e) => handleInputChange('enable_google_calendar', e.target.checked)}
                className="h-4 w-4 text-primary border-border rounded focus:ring-2 focus:ring-primary/20"
              />
              <label htmlFor="google-calendar" className="text-sm font-medium">
                Enable Google Calendar integration
              </label>
            </div>
          </div>


          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Meeting...' : 'Create Meeting'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}