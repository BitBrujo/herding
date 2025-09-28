// Natural Language Availability Parser for HerdingKatz
// Converts statements like "I can't do Tuesday mornings" into structured availability updates

export interface AvailabilityUpdate {
  date: string; // YYYY-MM-DD format
  time: string; // 12-hour format like "2:00 PM"
  status: 'available' | 'unavailable' | 'maybe';
}

export interface EventContext {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM:SS (24-hour)
  endTime: string; // HH:MM:SS (24-hour)
  participantName?: string;
  eventTitle?: string;
}

export interface ParsedAvailability {
  updates: AvailabilityUpdate[];
  confidence: number; // 0-1 scale
  summary: string; // Human-readable summary of what was parsed
}

// Time period definitions (in 24-hour format)
const TIME_PERIODS = {
  'early morning': { start: '06:00', end: '09:00' },
  'morning': { start: '09:00', end: '12:00' },
  'late morning': { start: '10:00', end: '12:00' },
  'noon': { start: '12:00', end: '13:00' },
  'lunch': { start: '12:00', end: '14:00' },
  'early afternoon': { start: '12:00', end: '15:00' },
  'afternoon': { start: '12:00', end: '18:00' },
  'late afternoon': { start: '15:00', end: '18:00' },
  'early evening': { start: '17:00', end: '20:00' },
  'evening': { start: '18:00', end: '21:00' },
  'night': { start: '21:00', end: '23:59' },
  'late night': { start: '22:00', end: '23:59' }
};

// Day patterns
const DAY_PATTERNS = {
  'monday': [1],
  'tuesday': [2],
  'wednesday': [3],
  'thursday': [4],
  'friday': [5],
  'saturday': [6],
  'sunday': [0],
  'weekdays': [1, 2, 3, 4, 5],
  'weekends': [0, 6],
  'weekend': [0, 6]
};

// Status indicators
const STATUS_PATTERNS = {
  unavailable: [
    "can't do", "cannot do", "not available", "unavailable", "don't work",
    "doesn't work", "won't work", "no good", "bad for me", "impossible",
    "not free", "busy", "conflict", "booked", "occupied"
  ],
  available: [
    "can do", "available", "free", "open", "good", "works", "fine",
    "prefer", "best", "ideal", "perfect", "great", "convenient"
  ],
  maybe: [
    "maybe", "might", "possibly", "could work", "if needed", "not ideal",
    "difficult but possible", "tight", "push it", "stretch"
  ]
};

/**
 * Convert 24-hour time to 12-hour format for grid compatibility
 */
function formatTimeTo12Hour(time24: string): string {
  const [hour, minute] = time24.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

/**
 * Convert 12-hour time to 24-hour format
 */
function formatTimeTo24Hour(time12: string): string {
  const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return '00:00';

  const [, hourStr, minuteStr, period] = match;
  let hour = parseInt(hourStr);
  const minute = parseInt(minuteStr);

  if (period.toUpperCase() === 'AM' && hour === 12) hour = 0;
  if (period.toUpperCase() === 'PM' && hour !== 12) hour += 12;

  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/**
 * Generate time slots in 30-minute intervals within a time range
 */
function generateTimeSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);

  const current = new Date(start);
  while (current < end) {
    const timeStr = current.toTimeString().slice(0, 5);
    slots.push(formatTimeTo12Hour(timeStr));
    current.setMinutes(current.getMinutes() + 30);
  }

  return slots;
}

/**
 * Get dates that match the specified day pattern within the event date range
 */
function getDatesForDayPattern(dayNumbers: number[], eventContext: EventContext): string[] {
  const startDate = new Date(eventContext.startDate);
  const endDate = new Date(eventContext.endDate);
  const dates: string[] = [];

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    if (dayNumbers.includes(currentDate.getDay())) {
      dates.push(currentDate.toISOString().split('T')[0]);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

/**
 * Parse specific time references like "2 PM", "2:30 PM", "14:00"
 */
function parseSpecificTimes(text: string): string[] {
  const timePattern = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)?/gi;
  const times: string[] = [];
  let match;

  while ((match = timePattern.exec(text)) !== null) {
    const [, hourStr, minuteStr = '00', period] = match;
    let hour = parseInt(hourStr);

    // If no period specified and hour is <= 12, assume both AM and PM possibilities
    if (!period) {
      if (hour <= 12) {
        times.push(formatTimeTo12Hour(`${hour.toString().padStart(2, '0')}:${minuteStr}`));
        if (hour !== 12) {
          times.push(formatTimeTo12Hour(`${(hour + 12).toString().padStart(2, '0')}:${minuteStr}`));
        }
      } else {
        times.push(formatTimeTo12Hour(`${hour.toString().padStart(2, '0')}:${minuteStr}`));
      }
    } else {
      if (period.toUpperCase() === 'AM' && hour === 12) hour = 0;
      if (period.toUpperCase() === 'PM' && hour !== 12) hour += 12;
      times.push(formatTimeTo12Hour(`${hour.toString().padStart(2, '0')}:${minuteStr}`));
    }
  }

  return times;
}

/**
 * Parse day references from text
 */
function parseDayReferences(text: string, eventContext: EventContext): string[] {
  const lowerText = text.toLowerCase();
  const allDates: string[] = [];

  // Check for specific day patterns
  for (const [pattern, dayNumbers] of Object.entries(DAY_PATTERNS)) {
    if (lowerText.includes(pattern)) {
      allDates.push(...getDatesForDayPattern(dayNumbers, eventContext));
    }
  }

  // Check for specific date patterns (e.g., "January 15", "1/15", "15th")
  const datePatterns = [
    /(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?/gi, // "January 15th"
    /(\d{1,2})\/(\d{1,2})/g, // "1/15"
    /(\d{1,2})(?:st|nd|rd|th)/gi // "15th"
  ];

  for (const pattern of datePatterns) {
    while (pattern.exec(text) !== null) {
      // For simplicity, we'll skip complex date parsing for now
      // In a production system, you'd want more robust date parsing
    }
  }

  // If no specific days found, return all event dates
  if (allDates.length === 0) {
    const startDate = new Date(eventContext.startDate);
    const endDate = new Date(eventContext.endDate);
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      allDates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return [...new Set(allDates)]; // Remove duplicates
}

/**
 * Parse time period references from text
 */
function parseTimePeriods(text: string, eventContext: EventContext): string[] {
  const lowerText = text.toLowerCase();
  const times: string[] = [];

  // Check for time period patterns
  for (const [period, timeRange] of Object.entries(TIME_PERIODS)) {
    if (lowerText.includes(period)) {
      // Generate time slots for this period within event constraints
      const eventStart = eventContext.startTime.slice(0, 5); // Remove seconds
      const eventEnd = eventContext.endTime.slice(0, 5);

      const periodStart = timeRange.start;
      const periodEnd = timeRange.end;

      // Find overlap between period and event time window
      const overlapStart = periodStart >= eventStart ? periodStart : eventStart;
      const overlapEnd = periodEnd <= eventEnd ? periodEnd : eventEnd;

      if (overlapStart < overlapEnd) {
        times.push(...generateTimeSlots(overlapStart, overlapEnd));
      }
    }
  }

  // Check for specific times
  times.push(...parseSpecificTimes(text));

  // If no specific times found, use all event times
  if (times.length === 0) {
    const eventStart = eventContext.startTime.slice(0, 5);
    const eventEnd = eventContext.endTime.slice(0, 5);
    times.push(...generateTimeSlots(eventStart, eventEnd));
  }

  return [...new Set(times)]; // Remove duplicates
}

/**
 * Determine status from text
 */
function parseStatus(text: string): 'available' | 'unavailable' | 'maybe' {
  const lowerText = text.toLowerCase();

  for (const [status, patterns] of Object.entries(STATUS_PATTERNS)) {
    for (const pattern of patterns) {
      if (lowerText.includes(pattern)) {
        return status as 'available' | 'unavailable' | 'maybe';
      }
    }
  }

  // Default to unavailable if unclear (safer assumption)
  return 'unavailable';
}

/**
 * Calculate confidence score based on how specific the input is
 */
function calculateConfidence(text: string, updates: AvailabilityUpdate[]): number {
  let confidence = 0.5; // Base confidence

  // Higher confidence for specific patterns
  if (parseSpecificTimes(text).length > 0) confidence += 0.3;
  if (Object.keys(DAY_PATTERNS).some(day => text.toLowerCase().includes(day))) confidence += 0.2;
  if (Object.keys(TIME_PERIODS).some(period => text.toLowerCase().includes(period))) confidence += 0.2;
  if (Object.values(STATUS_PATTERNS).flat().some(pattern => text.toLowerCase().includes(pattern))) confidence += 0.3;

  // Lower confidence for very broad statements
  if (updates.length > 20) confidence -= 0.2;

  return Math.min(1.0, Math.max(0.1, confidence));
}

/**
 * Main parsing function - converts natural language to availability updates
 */
export function parseAvailabilityStatement(
  text: string,
  eventContext: EventContext
): ParsedAvailability {
  try {
    const dates = parseDayReferences(text, eventContext);
    const times = parseTimePeriods(text, eventContext);
    const status = parseStatus(text);

    const updates: AvailabilityUpdate[] = [];

    // Generate all combinations of dates and times
    for (const date of dates) {
      for (const time of times) {
        updates.push({ date, time, status });
      }
    }

    const confidence = calculateConfidence(text, updates);

    // Generate summary
    const dayCount = dates.length;
    const timeCount = times.length;
    const statusText = status === 'available' ? 'available' :
                      status === 'maybe' ? 'maybe available' : 'unavailable';

    let summary = `Marked ${updates.length} time slots as ${statusText}`;
    if (dayCount === 1 && timeCount === 1) {
      summary = `Marked ${dates[0]} at ${times[0]} as ${statusText}`;
    } else if (dayCount > 1 && timeCount === 1) {
      summary = `Marked ${times[0]} on ${dayCount} days as ${statusText}`;
    } else if (dayCount === 1 && timeCount > 1) {
      summary = `Marked ${timeCount} time slots on ${dates[0]} as ${statusText}`;
    }

    return {
      updates,
      confidence,
      summary
    };

  } catch (error) {
    console.error('Error parsing availability statement:', error);
    return {
      updates: [],
      confidence: 0,
      summary: 'Could not parse availability statement'
    };
  }
}

/**
 * Parse multiple statements from a single message
 */
export function parseMultipleStatements(
  text: string,
  eventContext: EventContext
): ParsedAvailability {
  // Split on common sentence separators
  const statements = text.split(/[.!;]\s+|,\s+but\s+|,\s+however\s+|\s+and\s+/).filter(s => s.trim());

  if (statements.length <= 1) {
    return parseAvailabilityStatement(text, eventContext);
  }

  const allUpdates: AvailabilityUpdate[] = [];
  const summaries: string[] = [];
  let totalConfidence = 0;

  for (const statement of statements) {
    const result = parseAvailabilityStatement(statement.trim(), eventContext);
    allUpdates.push(...result.updates);
    if (result.updates.length > 0) {
      summaries.push(result.summary);
      totalConfidence += result.confidence;
    }
  }

  const averageConfidence = summaries.length > 0 ? totalConfidence / summaries.length : 0;

  return {
    updates: allUpdates,
    confidence: averageConfidence,
    summary: summaries.join('; ')
  };
}

/**
 * Validate that updates are within event constraints
 */
export function validateAvailabilityUpdates(
  updates: AvailabilityUpdate[],
  eventContext: EventContext
): AvailabilityUpdate[] {
  const startDate = new Date(eventContext.startDate);
  const endDate = new Date(eventContext.endDate);
  const eventStartTime = formatTimeTo24Hour(formatTimeTo12Hour(eventContext.startTime.slice(0, 5)));
  const eventEndTime = formatTimeTo24Hour(formatTimeTo12Hour(eventContext.endTime.slice(0, 5)));

  return updates.filter(update => {
    const updateDate = new Date(update.date);
    const updateTime24 = formatTimeTo24Hour(update.time);

    // Check date is within event range
    if (updateDate < startDate || updateDate > endDate) return false;

    // Check time is within event window
    if (updateTime24 < eventStartTime || updateTime24 >= eventEndTime) return false;

    return true;
  });
}