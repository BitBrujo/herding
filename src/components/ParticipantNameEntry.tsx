"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserPlus, ArrowRight, Calendar, Clock, Users } from 'lucide-react';
import { ParticipantIcon } from '@/components/icons/ParticipantIcon';

interface ParticipantNameEntryProps {
  eventTitle: string;
  onNameSubmit: (name: string) => void;
  isLoading?: boolean;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  participantCount: number;
}

export function ParticipantNameEntry({
  eventTitle,
  onNameSubmit,
  isLoading = false,
  startDate,
  endDate,
  startTime,
  endTime,
  participantCount
}: ParticipantNameEntryProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onNameSubmit(name.trim());
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              What&apos;s your name?
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Enter your name"
              required
              autoFocus
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!name.trim() || isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Joining...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Join and Set Availability
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
          <div className="flex flex-col items-start justify-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6" />
              {startTime} - {endTime}
            </div>
            <div className="flex items-center gap-2">
              <ParticipantIcon className="h-6 w-6" />
              {participantCount} Katz
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}