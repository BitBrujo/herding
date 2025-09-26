"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { User, Clock, Users, Calendar } from 'lucide-react';

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
}

export function AvailabilityGrid({
  event,
  currentParticipant,
  participants = [],
  onAvailabilityChange
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

        for (let minute = startMinutes; minute < endMinutes; minute += 30) {
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
        return `bg-green-${Math.max(2, Math.round(heat.percentage * 5) + 1)}00 border-green-600`;
      } else if (currentAvailability === 'maybe') {
        return `bg-yellow-${Math.max(2, Math.round(heat.percentage * 5) + 1)}00 border-yellow-600`;
      } else {
        return 'bg-red-100 border-red-300';
      }
    }

    // Heat map colors for viewing mode
    if (heat.total === 0) return 'bg-gray-100 border-gray-200';

    const intensity = Math.max(1, Math.round(heat.percentage * 5));
    if (heat.percentage > 0.8) return `bg-green-${intensity * 100} border-green-500`;
    if (heat.percentage > 0.6) return `bg-lime-${intensity * 100} border-lime-500`;
    if (heat.percentage > 0.4) return `bg-yellow-${intensity * 100} border-yellow-500`;
    if (heat.percentage > 0.2) return `bg-orange-${intensity * 100} border-orange-500`;
    return `bg-red-${intensity * 100} border-red-500`;
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
    <div className="w-full max-w-6xl mx-auto">
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calendar className="h-6 w-6" />
              {event.title}
            </CardTitle>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {participants.length} participants
              </div>
              {currentParticipant && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {currentParticipant.name}
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-sm mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-400 border rounded"></div>
              <span>High availability</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 border rounded"></div>
              <span>Some availability</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-400 border rounded"></div>
              <span>Low availability</span>
            </div>
            {currentParticipant && (
              <div className="text-muted-foreground font-medium">
                💡 Drag to select your availability
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div
            ref={gridRef}
            className="grid gap-2 select-none overflow-x-auto p-4 bg-gradient-to-br from-background to-muted/20"
            style={{
              gridTemplateColumns: `140px repeat(${timeLabels.length}, minmax(80px, 1fr))`,
            }}
          >
            {/* Header row with times */}
            <div className="sticky top-0 bg-background"></div>
            {timeLabels.map(time => (
              <div
                key={time}
                className="text-sm text-center py-3 font-semibold text-foreground border-b-2 border-border sticky top-0 bg-background/90 backdrop-blur-sm"
              >
                {time}
              </div>
            ))}

          {/* Grid rows for each date */}
          {dates.map(date => (
              <React.Fragment key={date}>
                {/* Date label */}
                <div className="text-sm font-semibold py-4 pr-3 text-right border-r-2 border-border bg-muted/40 sticky left-0 z-10">
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
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
                        h-16 sm:h-20 border-2 rounded-lg cursor-pointer transition-all duration-200 relative
                        ${getSlotColor(date, time)}
                        ${hoveredSlot === slotKey ? 'ring-4 ring-blue-300 scale-110 z-20' : ''}
                        ${currentParticipant ? 'hover:scale-105 hover:shadow-lg' : ''}
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

          {/* Enhanced Instructions */}
          {currentParticipant && (
            <div className="mt-6 mx-4 mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900 dark:text-blue-100">Quick Start Guide</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-lg">🖱️</span>
                  <span className="text-blue-800 dark:text-blue-200">Click and drag to select your available times</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-lg">🟢</span>
                  <span className="text-blue-800 dark:text-blue-200">Green shows your availability</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-lg">🔥</span>
                  <span className="text-blue-800 dark:text-blue-200">Darker = more people available</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-lg">👀</span>
                  <span className="text-blue-800 dark:text-blue-200">Hover to see participant details</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}