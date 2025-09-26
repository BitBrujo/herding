export interface TimezoneInfo {
  name: string;
  offset: string;
  abbreviation: string;
  label: string;
}

export const COMMON_TIMEZONES: TimezoneInfo[] = [
  { name: 'UTC', offset: '+00:00', abbreviation: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { name: 'America/New_York', offset: '-05:00', abbreviation: 'EST', label: 'Eastern Time (US)' },
  { name: 'America/Chicago', offset: '-06:00', abbreviation: 'CST', label: 'Central Time (US)' },
  { name: 'America/Denver', offset: '-07:00', abbreviation: 'MST', label: 'Mountain Time (US)' },
  { name: 'America/Los_Angeles', offset: '-08:00', abbreviation: 'PST', label: 'Pacific Time (US)' },
  { name: 'Europe/London', offset: '+00:00', abbreviation: 'GMT', label: 'Greenwich Mean Time' },
  { name: 'Europe/Paris', offset: '+01:00', abbreviation: 'CET', label: 'Central European Time' },
  { name: 'Europe/Berlin', offset: '+01:00', abbreviation: 'CET', label: 'Central European Time' },
  { name: 'Asia/Tokyo', offset: '+09:00', abbreviation: 'JST', label: 'Japan Standard Time' },
  { name: 'Asia/Shanghai', offset: '+08:00', abbreviation: 'CST', label: 'China Standard Time' },
  { name: 'Asia/Kolkata', offset: '+05:30', abbreviation: 'IST', label: 'India Standard Time' },
  { name: 'Australia/Sydney', offset: '+11:00', abbreviation: 'AEDT', label: 'Australian Eastern Time' },
];

export function detectUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

export function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const targetTime = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
    return (targetTime.getTime() - utc.getTime()) / (1000 * 60 * 60);
  } catch {
    return 0;
  }
}

export function convertTimeToTimezone(
  date: string,
  time: string,
  fromTimezone: string,
  toTimezone: string
): { date: string; time: string } {
  try {
    const datetime = new Date(`${date}T${time}:00`);

    // Create a date in the source timezone
    const sourceDate = new Date(datetime.toLocaleString('en-US', { timeZone: fromTimezone }));

    // Convert to target timezone
    const targetDate = new Date(sourceDate.toLocaleString('en-US', { timeZone: toTimezone }));

    return {
      date: targetDate.toISOString().split('T')[0],
      time: targetDate.toTimeString().slice(0, 5)
    };
  } catch (error) {
    console.error('Error converting timezone:', error);
    return { date, time };
  }
}

export function formatTimeInTimezone(
  date: string,
  time: string,
  timezone: string,
  options: {
    includeDate?: boolean;
    includeTimezone?: boolean;
    format24Hour?: boolean;
  } = {}
): string {
  try {
    const {
      includeDate = true,
      includeTimezone = true,
      format24Hour = false
    } = options;

    const datetime = new Date(`${date}T${time}:00`);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: includeDate ? 'numeric' : undefined,
      month: includeDate ? 'short' : undefined,
      day: includeDate ? 'numeric' : undefined,
      hour: 'numeric',
      minute: '2-digit',
      hour12: !format24Hour,
      timeZoneName: includeTimezone ? 'short' : undefined
    });

    return formatter.format(datetime);
  } catch (error) {
    console.error('Error formatting time:', error);
    return `${date} ${time}`;
  }
}

export function getTimezoneAbbreviation(timezone: string): string {
  const info = COMMON_TIMEZONES.find(tz => tz.name === timezone);
  if (info) return info.abbreviation;

  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(now);
    const timezonePart = parts.find(part => part.type === 'timeZoneName');
    return timezonePart?.value || timezone;
  } catch {
    return timezone;
  }
}

export function getBusinessHoursInTimezone(
  timezone: string,
  businessHours: { start: string; end: string } = { start: '09:00', end: '17:00' }
): { start: string; end: string } {
  try {
    const today = new Date().toISOString().split('T')[0];
    const startConverted = convertTimeToTimezone(today, businessHours.start, 'UTC', timezone);
    const endConverted = convertTimeToTimezone(today, businessHours.end, 'UTC', timezone);

    return {
      start: startConverted.time,
      end: endConverted.time
    };
  } catch {
    return businessHours;
  }
}

export function generateTimeSlots(
  startDate: string,
  endDate: string,
  startTime: string,
  endTime: string,
  durationMinutes: number = 60,
  intervalMinutes: number = 30
): Array<{ date: string; startTime: string; endTime: string }> {
  const slots = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    const dateStr = current.toISOString().split('T')[0];

    // Skip weekends (optional - could be configurable)
    const dayOfWeek = current.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    for (let minutes = startMinutes; minutes + durationMinutes <= endMinutes; minutes += intervalMinutes) {
      const slotStart = minutesToTime(minutes);
      const slotEnd = minutesToTime(minutes + durationMinutes);

      slots.push({
        date: dateStr,
        startTime: slotStart,
        endTime: slotEnd
      });
    }
  }

  return slots;
}

export function isTimeSlotInBusinessHours(
  time: string,
  timezone: string,
  businessHours: { start: string; end: string } = { start: '09:00', end: '17:00' }
): boolean {
  try {
    const timeMinutes = timeToMinutes(time);
    const startMinutes = timeToMinutes(businessHours.start);
    const endMinutes = timeToMinutes(businessHours.end);

    return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
  } catch {
    return true;
  }
}

export function getConflictingTimeSlots(
  primarySlot: { date: string; startTime: string; endTime: string },
  otherSlots: Array<{ date: string; startTime: string; endTime: string }>
): Array<{ date: string; startTime: string; endTime: string }> {
  return otherSlots.filter(slot => {
    if (slot.date !== primarySlot.date) return false;

    const primaryStart = timeToMinutes(primarySlot.startTime);
    const primaryEnd = timeToMinutes(primarySlot.endTime);
    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);

    // Check for overlap
    return (primaryStart < slotEnd && primaryEnd > slotStart);
  });
}

// Helper functions
function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} minutes`;
  } else if (mins === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minutes`;
  }
}

export function getTimezoneFriendlyLabel(timezone: string): string {
  const info = COMMON_TIMEZONES.find(tz => tz.name === timezone);
  return info?.label || timezone;
}