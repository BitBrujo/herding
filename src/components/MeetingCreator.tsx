"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Calendar, Clock, MapPin, ArrowLeft, X, Gamepad2 } from 'lucide-react';
import { ParticipantIcon } from '@/components/icons/ParticipantIcon';
import { COMMON_TIMEZONES, detectUserTimezone } from '@/lib/timezone-utils';

interface MeetingData {
  title: string;
  timezone: string;
  duration_minutes: number;
  password?: string;
  enable_google_calendar: boolean;
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
          start_time: '06:00',
          end_time: '22:00'
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
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={isSubmitting}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
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

          {/* Event Name */}
          <div>
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
          <div>
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

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Herd...' : 'Create Herd'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 240 238"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M213.467 10V24.5332H198.933V39.0669H184.4V24.5332H169.867V10H155.333V68.1333H140.8V53.6001H126.267V39.0669H68.1333V53.6001H53.6001V68.1333H39.0667V82.6665H24.5333V24.5332H39.0667V10H24.5333V24.5332H10V82.6665H24.5333V140.8H39.0667V213.467H53.6001V228H82.6667V213.467H68.1333V140.8H82.6667V126.267H97.2V111.733H111.733V126.267H126.267V140.8H140.8V155.333H155.333V213.467H169.867V228H198.933V213.467H184.4V169.867H198.933V126.267H213.467V97.2002H228V10H213.467ZM184.4 68.1333H169.867V53.6001H184.4V68.1333ZM213.467 68.1333H198.933V53.6001H213.467V68.1333Z"
                  fill="currentColor"
                />
              </svg>
              Toys
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}