"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Calendar, Users, Clock, Plus, X, MapPin } from 'lucide-react';
import { COMMON_TIMEZONES, detectUserTimezone } from '@/lib/timezone-utils';

interface Participant {
  name: string;
  email: string;
  role: 'organizer' | 'required' | 'optional';
  timezone?: string;
}

interface MeetingData {
  title: string;
  description: string;
  organizer_name: string;
  organizer_email: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  duration_minutes: number;
  meeting_importance: 'low' | 'medium' | 'high' | 'critical';
  meeting_type: string;
  participants: Participant[];
}

interface MeetingCreatorProps {
  onMeetingCreated?: (meetingId: string, shareToken: string) => void;
  onCancel?: () => void;
}

export function MeetingCreator({ onMeetingCreated, onCancel }: MeetingCreatorProps) {
  const [formData, setFormData] = useState<MeetingData>({
    title: '',
    description: '',
    organizer_name: '',
    organizer_email: '',
    start_date: '',
    end_date: '',
    start_time: '09:00',
    end_time: '17:00',
    timezone: detectUserTimezone(),
    duration_minutes: 60,
    meeting_importance: 'medium',
    meeting_type: 'team_meeting',
    participants: []
  });

  const [newParticipant, setNewParticipant] = useState<Participant>({
    name: '',
    email: '',
    role: 'required',
    timezone: detectUserTimezone()
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof MeetingData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addParticipant = () => {
    if (!newParticipant.name.trim()) return;

    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, { ...newParticipant }]
    }));

    setNewParticipant({
      name: '',
      email: '',
      role: 'required',
      timezone: detectUserTimezone()
    });
  };

  const removeParticipant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.title.trim() || !formData.organizer_name.trim() ||
          !formData.start_date || !formData.end_date) {
        throw new Error('Please fill in all required fields');
      }

      if (new Date(formData.end_date) < new Date(formData.start_date)) {
        throw new Error('End date must be after start date');
      }

      // Create the meeting
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          participants: undefined // Don't include participants in meeting creation
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create meeting');
      }

      const { event } = await response.json();

      // Add participants to the meeting
      for (const participant of formData.participants) {
        const participantResponse = await fetch('/api/participants', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_id: event.id,
            ...participant
          }),
        });

        if (!participantResponse.ok) {
          console.warn('Failed to add participant:', participant.name);
        }
      }

      // Add organizer as a participant
      await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: event.id,
          name: formData.organizer_name,
          email: formData.organizer_email,
          role: 'organizer',
          timezone: formData.timezone,
          priority_weight: 1.5
        }),
      });

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

          {/* Basic Meeting Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Meeting Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Weekly Team Sync"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Meeting Type
              </label>
              <select
                value={formData.meeting_type}
                onChange={(e) => handleInputChange('meeting_type', e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="team_meeting">Team Meeting</option>
                <option value="client_meeting">Client Meeting</option>
                <option value="interview">Interview</option>
                <option value="social">Social Event</option>
                <option value="workshop">Workshop</option>
                <option value="presentation">Presentation</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              rows={3}
              placeholder="Brief description of the meeting..."
            />
          </div>

          {/* Organizer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Your Name *
              </label>
              <input
                type="text"
                value={formData.organizer_name}
                onChange={(e) => handleInputChange('organizer_name', e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Your Email
              </label>
              <input
                type="email"
                value={formData.organizer_email}
                onChange={(e) => handleInputChange('organizer_email', e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="john@company.com"
              />
            </div>
          </div>

          {/* Date Range & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Earliest Time
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => handleInputChange('start_time', e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Latest Time
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => handleInputChange('end_time', e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Meeting Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Duration (minutes)
              </label>
              <select
                value={formData.duration_minutes}
                onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value))}
                className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Importance
              </label>
              <select
                value={formData.meeting_importance}
                onChange={(e) => handleInputChange('meeting_importance', e.target.value)}
                className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
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

          {/* Participants */}
          <div>
            <label className="block text-sm font-medium mb-4">
              <Users className="inline h-4 w-4 mr-1" />
              Participants
            </label>

            {/* Add Participant Form */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 p-4 bg-muted/30 rounded-lg">
              <input
                type="text"
                value={newParticipant.name}
                onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                className="p-2 border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Participant name"
              />
              <input
                type="email"
                value={newParticipant.email}
                onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                className="p-2 border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Email (optional)"
              />
              <select
                value={newParticipant.role}
                onChange={(e) => setNewParticipant(prev => ({ ...prev, role: e.target.value as 'organizer' | 'required' | 'optional' }))}
                className="p-2 border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="required">Required</option>
                <option value="optional">Optional</option>
              </select>
              <Button
                type="button"
                onClick={addParticipant}
                disabled={!newParticipant.name.trim()}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {/* Participants List */}
            {formData.participants.length > 0 && (
              <div className="space-y-2">
                {formData.participants.map((participant, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{participant.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {participant.email && `${participant.email} • `}
                        {participant.role} participant
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeParticipant(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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