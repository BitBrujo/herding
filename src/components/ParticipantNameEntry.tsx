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
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
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

            <Button
              type="button"
              variant="outline"
              className="w-full border-green-500 text-green-500 hover:bg-green-50"
            >
              <div className="flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 240 238"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M213.467 10V24.5332H198.933V39.0669H184.4V24.5332H169.867V10H155.333V68.1333H140.8V53.6001H126.267V39.0669H68.1333V53.6001H53.6001V68.1333H39.0667V82.6665H24.5333V24.5332H39.0667V10H24.5333V24.5332H10V82.6665H24.5333V140.8H39.0667V213.467H53.6001V228H82.6667V213.467H68.1333V140.8H82.6667V126.267H97.2V111.733H111.733V126.267H126.267V140.8H140.8V155.333H155.333V213.467H169.867V228H198.933V213.467H184.4V169.867H198.933V126.267H213.467V97.2002H228V10H213.467ZM184.4 68.1333H169.867V53.6001H184.4V68.1333ZM213.467 68.1333H198.933V53.6001H213.467V68.1333Z"
                    fill="currentColor"
                  />
                </svg>
                Toys
              </div>
            </Button>
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