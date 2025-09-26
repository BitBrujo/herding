"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, Clock, Users, Calendar, Share2, Copy, X } from 'lucide-react';
import { ParticipantIcon } from '@/components/icons/ParticipantIcon';

interface TimeSlot {
  date: string;
  time: string;
  hour: number;
  minute: number;
}

interface ParticipantAvailability {
  participantId: string;
  participantName: string;
  availability: {
    [key: string]: 'available' | 'unavailable' | 'maybe';
  };
}

interface AvailabilityGridProps {
  event: {
    id: string;
    title: string;
    start_date: string;
    end_date: string;
    start_time: string;
    end_time: string;
    duration_minutes: number;
  };
  currentParticipant?: {
    id: string;
    name: string;
  };
  participants: ParticipantAvailability[];
  onAvailabilityChange?: (participantId: string, timeSlot: TimeSlot, status: 'available' | 'unavailable' | 'maybe') => void;
  onShareClick?: () => void;
  showShareInfo?: boolean;
  onCopyShareLink?: () => void;
  shareUrl?: string;
  onKatzClick?: () => void;
  showParticipantList?: boolean;
}

export function AvailabilityGrid({
  event,
  currentParticipant,
  participants = [],
  onAvailabilityChange,
  onShareClick,
  showShareInfo = false,
  onCopyShareLink,
  shareUrl,
  onKatzClick,
  showParticipantList = false
}: AvailabilityGridProps) {
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startSlot: string | null;
    dragMode: 'available' | 'unavailable' | null;
  }>({
    isDragging: false,
    startSlot: null,
    dragMode: null
  });

  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Generate time slots based on event parameters
  const generateTimeSlots = useCallback(() => {
    const slots: TimeSlot[] = [];
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    const [startHour, startMinute] = event.start_time.split(':').map(Number);
    const [endHour, endMinute] = event.end_time.split(':').map(Number);

    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];

      for (let hour = startHour; hour <= endHour; hour++) {
        const startMinutes = hour === startHour ? startMinute : 0;
        const endMinutes = hour === endHour ? endMinute : 60;

        for (let minute = startMinutes; minute < endMinutes; minute += 60) {
          slots.push({
            date: dateStr,
            time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
            hour,
            minute
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  }, [event]);

  const timeSlots = generateTimeSlots();
  const dates = [...new Set(timeSlots.map(slot => slot.date))];
  const timeLabels = [...new Set(timeSlots.map(slot => slot.time))];

  // Get heat map data for each time slot
  const getSlotHeatData = (date: string, time: string) => {
    const slotKey = `${date}-${time}`;
    const availableCount = participants.filter(p =>
      p.availability[slotKey] === 'available'
    ).length;
    const maybeCount = participants.filter(p =>
      p.availability[slotKey] === 'maybe'
    ).length;
    const totalParticipants = participants.length;

    return {
      available: availableCount,
      maybe: maybeCount,
      unavailable: totalParticipants - availableCount - maybeCount,
      total: totalParticipants,
      percentage: totalParticipants > 0 ? (availableCount + maybeCount * 0.5) / totalParticipants : 0
    };
  };

  // Get color based on availability percentage
  const getSlotColor = (date: string, time: string) => {
    const heat = getSlotHeatData(date, time);
    const slotKey = `${date}-${time}`;

    // Current participant's availability (if any)
    const currentAvailability = currentParticipant
      ? participants.find(p => p.participantId === currentParticipant.id)?.availability[slotKey]
      : null;

    if (currentParticipant && currentAvailability) {
      if (currentAvailability === 'available') {
        if (heat.percentage > 0.75) return 'bg-pink-600 border-pink-700';
        if (heat.percentage > 0.5) return 'bg-pink-500 border-pink-600';
        if (heat.percentage > 0.25) return 'bg-pink-400 border-pink-500';
        return 'bg-pink-300 border-pink-400';
      } else if (currentAvailability === 'maybe') {
        return 'bg-pink-200 border-pink-300';
      } else {
        return 'bg-gray-100 border-gray-300';
      }
    }

    // Heat map colors for viewing mode - pink theme
    if (heat.total === 0) return 'bg-gray-50 border-gray-200';

    if (heat.percentage > 0.8) return 'bg-pink-600 border-pink-700';
    if (heat.percentage > 0.6) return 'bg-pink-500 border-pink-600';
    if (heat.percentage > 0.4) return 'bg-pink-400 border-pink-500';
    if (heat.percentage > 0.2) return 'bg-pink-300 border-pink-400';
    return 'bg-pink-100 border-pink-200';
  };

  // Handle mouse events for drag selection
  const handleMouseDown = (date: string, time: string) => {
    if (!currentParticipant) return;

    const slotKey = `${date}-${time}`;
    const currentStatus = participants
      .find(p => p.participantId === currentParticipant.id)
      ?.availability[slotKey] || 'unavailable';

    const newMode = currentStatus === 'available' ? 'unavailable' : 'available';

    setDragState({
      isDragging: true,
      startSlot: slotKey,
      dragMode: newMode
    });

    onAvailabilityChange?.(currentParticipant.id, { date, time, hour: 0, minute: 0 }, newMode);
  };

  const handleMouseEnter = (date: string, time: string) => {
    const slotKey = `${date}-${time}`;
    setHoveredSlot(slotKey);

    if (dragState.isDragging && dragState.dragMode && currentParticipant) {
      onAvailabilityChange?.(currentParticipant.id, { date, time, hour: 0, minute: 0 }, dragState.dragMode);
    }
  };

  const handleMouseUp = () => {
    setDragState({
      isDragging: false,
      startSlot: null,
      dragMode: null
    });
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => handleMouseUp();
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Get tooltip content for hovered slot
  const getTooltipContent = (date: string, time: string) => {
    const heat = getSlotHeatData(date, time);
    const availableNames = participants
      .filter(p => p.availability[`${date}-${time}`] === 'available')
      .map(p => p.participantName);
    const maybeNames = participants
      .filter(p => p.availability[`${date}-${time}`] === 'maybe')
      .map(p => p.participantName);

    return {
      date: new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }),
      time,
      available: availableNames,
      maybe: maybeNames,
      total: heat.total
    };
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="space-y-4">
            {/* Title box, Share popup, or Participant list */}
            <div className="text-center">
              {showParticipantList ? (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 w-full flex items-center h-10">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0 mr-2">All Katz {'→'}</span>
                  <div className="flex items-center gap-2 overflow-x-auto flex-1 mr-2">
                    {participants.map((participant) => (
                      <div key={participant.participantId} className="flex items-center gap-1 text-sm whitespace-nowrap flex-shrink-0">
                        <ParticipantIcon className="h-3 w-3" />
                        <span className="text-xs">{participant.participantName}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onKatzClick}
                    className="p-1 h-6 w-6 flex-shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : showShareInfo ? (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 w-full flex items-center h-10">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0 mr-2">Share this link</span>
                  <div className="flex items-center gap-1 flex-1 mr-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onCopyShareLink}
                      className="p-1 h-6 w-6 flex-shrink-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <input
                      type="text"
                      value={shareUrl || ''}
                      readOnly
                      className="p-1 border rounded bg-white dark:bg-gray-700 text-xs font-mono flex-1 h-6"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onShareClick}
                    className="p-1 h-6 w-6 flex-shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 w-full flex items-center justify-center h-10">
                  <CardTitle className="text-lg font-bold text-center">
                    {event.title}
                    {currentParticipant && (
                      <>
                        <span className="text-lg text-muted-foreground"> for </span>
                        {currentParticipant.name}
                      </>
                    )}
                  </CardTitle>
                </div>
              )}
            </div>

            {/* Share button and Katz count below title */}
            <div className="flex justify-center gap-4">
              {onShareClick && (
                <Button
                  variant="outline"
                  onClick={onShareClick}
                  className={`flex items-center gap-2 flex-1 max-w-xs ${
                    showShareInfo
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Share2 className="h-4 w-4" />
                  Call More Katz
                </Button>
              )}
              <Button
                variant="outline"
                onClick={onKatzClick}
                className={`flex items-center gap-2 flex-1 max-w-xs ${
                  showParticipantList
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <ParticipantIcon className="h-4 w-4" />
                {participants.length} Katz
              </Button>
            </div>
          </div>

        </CardHeader>

        <CardContent className="p-0">
          <div
            ref={gridRef}
            className="grid gap-1 select-none p-3 bg-gradient-to-br from-background to-muted/20 max-h-[60vh] overflow-auto"
            style={{
              gridTemplateColumns: `100px repeat(${timeLabels.length}, minmax(40px, 1fr))`,
            }}
          >
            {/* Header row with times */}
            <div className="sticky top-0 bg-background"></div>
            {timeLabels.map(time => (
              <div
                key={time}
                className="text-xs text-center py-1 font-semibold text-foreground border-b border-border sticky top-0 bg-background/90 backdrop-blur-sm"
              >
                {time}
              </div>
            ))}

          {/* Grid rows for each date */}
          {dates.map(date => (
              <React.Fragment key={date}>
                {/* Date label */}
                <div className="text-xs font-semibold py-2 pr-2 text-right border-r border-border bg-muted/40 sticky left-0 z-10">
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    day: 'numeric'
                  })}
                </div>

                {/* Time slots for this date */}
                {timeLabels.map(time => {
                  const slotKey = `${date}-${time}`;
                  const tooltip = getTooltipContent(date, time);

                  return (
                    <div
                      key={slotKey}
                      className={`
                        h-8 border rounded cursor-pointer transition-all duration-150 relative
                        ${getSlotColor(date, time)}
                        ${hoveredSlot === slotKey ? 'ring-2 ring-blue-300 scale-105 z-20' : ''}
                        ${currentParticipant ? 'hover:scale-102 hover:shadow-sm' : ''}
                        ${dragState.isDragging ? 'pointer-events-none' : ''}
                      `}
                      onMouseDown={() => handleMouseDown(date, time)}
                      onMouseEnter={() => handleMouseEnter(date, time)}
                      onMouseLeave={() => setHoveredSlot(null)}
                      title={`${tooltip.date} at ${tooltip.time}\n${tooltip.available.length} available, ${tooltip.maybe.length} maybe\nTotal: ${tooltip.total} participants`}
                    >
                    {hoveredSlot === slotKey && tooltip.total > 0 && (
                      <div className="relative">
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-black text-white text-xs rounded p-2 z-10 min-w-max">
                          <div className="font-medium">{tooltip.date} at {tooltip.time}</div>
                          {tooltip.available.length > 0 && (
                            <div className="text-green-300">
                              ✓ Available: {tooltip.available.join(', ')}
                            </div>
                          )}
                          {tooltip.maybe.length > 0 && (
                            <div className="text-yellow-300">
                              ? Maybe: {tooltip.maybe.join(', ')}
                            </div>
                          )}
                          <div className="text-gray-300">
                            Total: {tooltip.total} participants
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>


        </CardContent>
      </Card>
    </div>
  );
}