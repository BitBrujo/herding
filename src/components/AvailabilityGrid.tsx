"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Share2, Copy, X, ChevronRight, Square, CheckCircle } from 'lucide-react';
import { ParticipantIcon } from '@/components/icons/ParticipantIcon';
import { RealtimeStatus } from '@/components/RealtimeStatus';

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
  realtimeState?: {
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
    lastActivity: Date | null;
  };
  isOrganizer?: boolean;
  isEventFinalized?: boolean;
  finalizedSlot?: { date: string; time: string } | null;
  showFinalizationAnimation?: boolean;
  onFinalizationClick?: () => void;
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
  showParticipantList = false,
  realtimeState,
  isOrganizer = false,
  isEventFinalized = false,
  finalizedSlot,
  showFinalizationAnimation = false,
  onFinalizationClick,
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
  const [statusButtonRaised, setStatusButtonRaised] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statusButtonRef = useRef<HTMLButtonElement>(null);

  // Helper function to format time in 12-hour format
  const formatTime12Hour = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

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
            time: formatTime12Hour(hour, minute),
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

  // Get inner border styles to show multiple participants
  const getInnerBorderStyle = (date: string, time: string) => {
    const slotKey = `${date}-${time}`;
    const availableParticipants = participants.filter(p =>
      p.availability[slotKey] === 'available'
    );
    const maybeParticipants = participants.filter(p =>
      p.availability[slotKey] === 'maybe'
    );

    const totalResponses = availableParticipants.length + maybeParticipants.length;

    if (totalResponses <= 1) return undefined;

    // Create inner borders for each additional participant
    const borderWidths = Math.min(totalResponses - 1, 3); // Max 3 inner borders
    return Array.from({ length: borderWidths }, (_, i) => {
      const offset = (i + 1) * 2;
      return `inset ${offset}px ${offset}px 0 0 rgba(34, 197, 94, 0.4), inset -${offset}px -${offset}px 0 0 rgba(34, 197, 94, 0.4)`;
    }).join(', ');
  };

  // Get color based on availability percentage
  const getSlotColor = (date: string, time: string) => {
    const heat = getSlotHeatData(date, time);
    const slotKey = `${date}-${time}`;

    // Check if this is the finalized slot
    const isFinalized = finalizedSlot && finalizedSlot.date === date && finalizedSlot.time === time;

    // Current participant's availability (if any)
    const currentAvailability = currentParticipant
      ? participants.find(p => p.participantId === currentParticipant.id)?.availability[slotKey]
      : null;

    // If this slot is finalized, use special styling
    if (isFinalized) {
      return 'bg-pink-500 border-pink-600 text-white font-bold';
    }

    if (currentParticipant && currentAvailability) {
      if (currentAvailability === 'available') {
        // Green shades when current participant is available - darker = more participants available
        if (heat.percentage > 0.8) return 'bg-green-600 border-green-700 text-white';
        if (heat.percentage > 0.6) return 'bg-green-500 border-green-600 text-white';
        if (heat.percentage > 0.4) return 'bg-green-400 border-green-500';
        if (heat.percentage > 0.2) return 'bg-green-300 border-green-400';
        return 'bg-green-200 border-green-300';
      } else if (currentAvailability === 'maybe') {
        // Light green for maybe (avoiding pale green, using green-200)
        return 'bg-green-200 border-green-300';
      } else {
        // Gray for unavailable
        return 'bg-gray-100 border-gray-300';
      }
    }

    // Heat map colors for viewing mode - green gradient (light to dark)
    if (heat.total === 0) return 'bg-gray-50 border-gray-200';

    // High availability = Darker green (better choice)
    if (heat.percentage > 0.8) return 'bg-green-600 border-green-700 text-white';
    if (heat.percentage > 0.6) return 'bg-green-500 border-green-600 text-white';
    if (heat.percentage > 0.4) return 'bg-green-400 border-green-500';
    if (heat.percentage > 0.2) return 'bg-green-300 border-green-400';
    // Low availability = Light green (avoiding pale green)
    return 'bg-green-200 border-green-300';
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

    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Set tooltip to appear after 2 seconds (2000ms)
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredSlot(slotKey);
    }, 2000);

    if (dragState.isDragging && dragState.dragMode && currentParticipant) {
      onAvailabilityChange?.(currentParticipant.id, { date, time, hour: 0, minute: 0 }, dragState.dragMode);
    }
  };

  const handleMouseLeave = () => {
    // Clear timeout to prevent tooltip from appearing
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    // Hide tooltip immediately
    setHoveredSlot(null);
  };

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      startSlot: null,
      dragMode: null
    });
  }, []);

  // Touch event handlers
  const handleTouchStart = (date: string, time: string, event: React.TouchEvent) => {
    event.preventDefault(); // Prevent default touch behaviors
    handleMouseDown(date, time);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (!dragState.isDragging) return;

    event.preventDefault(); // Prevent scrolling during drag

    const touch = event.touches[0];
    if (!touch) return;

    // Find the element under the touch point
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!elementBelow) return;

    // Find the closest cell element with data attributes
    const cellElement = elementBelow.closest('[data-date][data-time]') as HTMLElement;
    if (!cellElement) return;

    const date = cellElement.dataset.date;
    const time = cellElement.dataset.time;

    if (date && time) {
      handleMouseEnter(date, time);
    }
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    event.preventDefault();
    handleMouseUp();
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => handleMouseUp();
    const handleGlobalTouchEnd = () => handleMouseUp();

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchend', handleGlobalTouchEnd);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [handleMouseUp]);

  // Handle clicking outside status button to lower it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusButtonRaised && statusButtonRef.current && !statusButtonRef.current.contains(event.target as Node)) {
        setStatusButtonRaised(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [statusButtonRaised]);

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

  // Get animation classes for finalized slot
  const getAnimationClasses = (date: string, time: string) => {
    const isFinalized = finalizedSlot && finalizedSlot.date === date && finalizedSlot.time === time;
    if (isFinalized && showFinalizationAnimation) {
      console.log('Applying animation to slot:', { date, time, finalizedSlot, showFinalizationAnimation });
      return 'animate-pulse-pink-green';
    }
    return '';
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="space-y-4">

            {/* Title box only */}
            <div className="text-center">
                <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-6 py-4 w-full flex items-center justify-center min-h-16">
                  <CardTitle className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-gray-100 leading-tight">
                    {event.title}
                    {currentParticipant && (
                      <>
                        <span className="text-sm md:text-base text-gray-700 dark:text-gray-300"> with </span>
                        {currentParticipant.name}
                      </>
                    )}
                  </CardTitle>
                </div>
            </div>
          </div>

        </CardHeader>

        <CardContent className="p-0">
          <div className="w-full overflow-x-auto rounded-lg overflow-hidden">
            <div
              ref={gridRef}
              className="availability-grid grid gap-0 select-none bg-gradient-to-br from-background to-muted/20 w-full overflow-y-auto max-h-[85vh] touch-pan-y"
              style={{
                gridTemplateColumns: `auto repeat(${timeLabels.length}, clamp(28px, 4vw, 55px))`,
              }}
            >
            {/* Header row with corner square and times */}
            {/* Corner square with icon - part of date column */}
            <div className="sticky top-0 left-0 bg-gray-700 h-12 w-[50px] z-30 flex items-center justify-center border-r border-border">
              <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center border-2 border-white">
                <ChevronRight className="h-4 w-4 text-white" />
              </div>
            </div>
            {timeLabels.map(time => {
              // Only show labels for full hours (when minutes are :00)
              const shouldShowLabel = time.includes(':00');
              return (
                <div
                  key={time}
                  className="text-xs text-center py-1 font-semibold text-white border-b border-border sticky top-0 bg-gray-700 h-12 flex items-center justify-center"
                >
                  {shouldShowLabel ? time : ''}
                </div>
              );
            })}

          {/* Grid rows for each date */}
          {dates.map((date) => (
              <React.Fragment key={date}>
                {/* Date label */}
                <div className="text-xs font-semibold py-1 px-2 text-center border-r border-border bg-gray-700 sticky left-0 z-20 w-[50px] h-12 relative flex items-center justify-center">
                  <div className="leading-tight">
                    <div className="font-bold text-white">
                      {new Date(date).toLocaleDateString('en-US', {
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-[10px] text-gray-300">
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'short'
                      })}
                    </div>
                  </div>
                </div>

                {/* Time slots for this date */}
                {timeLabels.map(time => {
                  const slotKey = `${date}-${time}`;
                  const tooltip = getTooltipContent(date, time);

                  return (
                    <div
                      key={slotKey}
                      data-date={date}
                      data-time={time}
                      className={`
                        grid-cell h-12 border cursor-pointer transition-all duration-150 relative min-h-[48px] sm:min-h-[48px]
                        ${getSlotColor(date, time)}
                        ${hoveredSlot === slotKey ? 'ring-2 ring-purple-300 scale-105 z-20' : ''}
                        ${currentParticipant ? 'hover:scale-102 hover:shadow-sm' : ''}
                        ${dragState.isDragging ? '' : ''}
                        ${getAnimationClasses(date, time)}
                      `}
                      style={{
                        boxShadow: getInnerBorderStyle(date, time)
                      }}
                      onMouseDown={() => handleMouseDown(date, time)}
                      onMouseEnter={() => handleMouseEnter(date, time)}
                      onMouseLeave={handleMouseLeave}
                      onTouchStart={(e) => handleTouchStart(date, time, e)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                    {hoveredSlot === slotKey && tooltip.total > 0 && (
                      <div className="relative">
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-black text-white text-xs rounded p-3 z-10 min-w-max shadow-lg">
                          <div className="font-medium mb-1">{tooltip.date} at {tooltip.time}</div>

                          {/* Heatmap score */}
                          <div className="text-gray-300 mb-2">
                            Score: {Math.round(getSlotHeatData(date, time).percentage * 100)}%
                            ({getSlotHeatData(date, time).available}/{getSlotHeatData(date, time).total} available)
                          </div>

                          {(() => {
                            const currentParticipantAvailability = currentParticipant ?
                              participants.find(p => p.participantId === currentParticipant.id)?.availability[slotKey] : null;

                            if (currentParticipantAvailability === 'available' || currentParticipantAvailability === 'maybe') {
                              // After selection: show participants breakdown
                              return (
                                <>
                                  {tooltip.available.length > 0 && (
                                    <div className="text-green-300 mb-1">
                                      ✓ Can attend: {tooltip.available.join(', ')}
                                    </div>
                                  )}
                                  {tooltip.maybe.length > 0 && (
                                    <div className="text-yellow-300">
                                      ? Maybe: {tooltip.maybe.join(', ')}
                                    </div>
                                  )}
                                </>
                              );
                            } else {
                              // Before selection: show available participants
                              return (
                                <>
                                  {tooltip.available.length > 0 && (
                                    <div className="text-green-300 mb-1">
                                      ✓ Can attend: {tooltip.available.join(', ')}
                                    </div>
                                  )}
                                  {tooltip.maybe.length > 0 && (
                                    <div className="text-yellow-300 mb-1">
                                      ? Maybe: {tooltip.maybe.join(', ')}
                                    </div>
                                  )}
                                  {tooltip.available.length === 0 && tooltip.maybe.length === 0 && (
                                    <div className="text-red-300">
                                      No participants can attend
                                    </div>
                                  )}
                                </>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
          </div>

        </CardContent>

        {/* Buttons below the grid */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex justify-center gap-4 mb-4">
            {onShareClick && (
              <Button
                variant="outline"
                onClick={() => {
                  // Cat meow sound effect
                  if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance('meow');
                    utterance.rate = 1.5;
                    utterance.pitch = 1.8;
                    utterance.volume = 0.8;
                    window.speechSynthesis.speak(utterance);
                  }
                  onShareClick();
                }}
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

            {/* Live status button */}
            {realtimeState && (
              <Button
                ref={statusButtonRef}
                variant="outline"
                onClick={() => {
                  setStatusButtonRaised(!statusButtonRaised);
                }}
                className={`flex items-center gap-2 flex-1 max-w-xs border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 hover:border-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 relative transition-all duration-150 ${
                  statusButtonRaised ? 'scale-[1.33] z-50' : 'scale-100'
                }`}
              >
                <RealtimeStatus state={realtimeState} showText={true} />
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
              Playing Katz
            </Button>
          </div>

          {/* Share popup or Participant list below buttons */}
          {showParticipantList && (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 w-full flex items-center h-10 mb-2">
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
          )}

          {/* Stop!!! Button for organizer */}
          {isOrganizer && (
            <div className="mt-4">
              <Button
                variant={isEventFinalized ? "outline" : "destructive"}
                onClick={onFinalizationClick}
                disabled={isEventFinalized}
                className="w-full flex items-center justify-center gap-2 h-12 text-lg font-bold"
              >
                {isEventFinalized ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Final
                  </>
                ) : (
                  <>
                    <Square className="h-5 w-5" />
                    Stop!!!
                  </>
                )}
              </Button>
            </div>
          )}

          {showShareInfo && (
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
          )}
        </div>

      </Card>

    </div>
  );
}