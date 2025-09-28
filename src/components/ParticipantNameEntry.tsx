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
  maxParticipants?: number;
}

export function ParticipantNameEntry({
  eventTitle,
  onNameSubmit,
  isLoading = false,
  startDate,
  endDate,
  startTime,
  endTime,
  participantCount,
  maxParticipants
}: ParticipantNameEntryProps) {
  const [name, setName] = useState('');

  // Helper function to format time in 12-hour format
  const formatTime12Hour = (time24: string): string => {
    const [hour, minute] = time24.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onNameSubmit(name.trim());
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <ParticipantIcon className="h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">
            Enter Your Name
          </h1>
        </div>
        <p className="text-lg text-muted-foreground mb-2">
          find your herd
        </p>
        {participantCount >= 1 && (
          <p className="text-sm text-muted-foreground">
            There are Katz waiting.
          </p>
        )}
        <div className="w-4/5 h-0.5 bg-border/60 mt-4 mx-auto"></div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 items-stretch">
          <div className="flex-1 flex flex-col justify-between gap-4">
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

            <div className="flex-1"></div>
          </div>

          <div className="flex-shrink-0 flex flex-col">
            <label className="block text-sm font-medium mb-2 text-left">
              Herd Details
            </label>
            <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground flex-1 flex">
              <div className="flex flex-col items-start justify-center gap-3 w-full">
                <div className="flex items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-6 w-6" />
                  {formatTime12Hour(startTime)} - {formatTime12Hour(endTime)}
                </div>
                <div className="flex items-center gap-2">
                  <ParticipantIcon className="h-6 w-6" />
                  {participantCount}{maxParticipants ? ` / ${maxParticipants}` : ''} Katz
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full mt-4"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}