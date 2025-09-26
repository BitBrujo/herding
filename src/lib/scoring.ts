import { ScoredTimeSlot, ParticipantStatus, HeatMapData, HeatMapCell, HeatMapStats } from './types';

export interface ParticipantResponse {
  participant_id: string;
  name: string;
  status: 'available' | 'unavailable' | 'preferred' | 'maybe';
  preference_score: number;
  priority_weight: number;
  role: 'organizer' | 'required' | 'optional';
  notes?: string;
}

export interface TimeSlotData {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  responses: ParticipantResponse[];
  total_participants: number;
}

export function calculateTimeSlotScore(
  timeSlot: TimeSlotData,
  allParticipants: { id: string; name: string; priority_weight: number; role: string }[]
): ScoredTimeSlot {
  const startMinutes = timeToMinutes(timeSlot.start_time);
  const endMinutes = timeToMinutes(timeSlot.end_time);

  let totalScore = 0;
  let totalWeight = 0;
  let availableCount = 0;
  let conflictLevel = 0;
  const participantStatuses: ParticipantStatus[] = [];

  allParticipants.forEach(participant => {
    const response = timeSlot.responses.find(r => r.participant_id === participant.id);
    const weight = participant.priority_weight;

    let score = 0;
    let status: 'available' | 'unavailable' | 'maybe' = 'unavailable';
    let preferenceScore = 1;

    if (response) {
      switch (response.status) {
        case 'available':
          score = 1.0;
          status = 'available';
          availableCount++;
          preferenceScore = response.preference_score;
          break;
        case 'preferred':
          score = 1.2; // Slight bonus for preferred times
          status = 'available';
          availableCount++;
          preferenceScore = Math.min(response.preference_score + 1, 5);
          break;
        case 'maybe':
          score = response.preference_score / 5.0; // Convert 1-5 scale to 0-1
          status = 'maybe';
          availableCount += 0.5;
          preferenceScore = response.preference_score;
          break;
        case 'unavailable':
          score = 0;
          status = 'unavailable';
          conflictLevel += weight;
          preferenceScore = 1;
          break;
      }
    } else {
      // No response = unavailable
      conflictLevel += weight;
    }

    // Apply time-of-day preference multiplier
    const timePreferenceMultiplier = getTimePreferenceMultiplier(startMinutes, endMinutes);
    score *= timePreferenceMultiplier;

    // Apply role-based weight
    const roleMultiplier = getRoleMultiplier(participant.role);
    const effectiveWeight = weight * roleMultiplier;

    totalScore += score * effectiveWeight;
    totalWeight += effectiveWeight;

    participantStatuses.push({
      name: participant.name,
      status,
      preferenceScore,
      weight: effectiveWeight,
      notes: response?.notes
    });
  });

  const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;
  const attendanceRate = allParticipants.length > 0 ? availableCount / allParticipants.length : 0;
  const weightedScore = normalizedScore * 100; // Convert to percentage

  return {
    date: timeSlot.date,
    startTime: timeSlot.start_time,
    endTime: timeSlot.end_time,
    startMinutes,
    endMinutes,
    score: Math.round(normalizedScore * 100) / 100,
    availableCount: Math.round(availableCount * 10) / 10,
    totalParticipants: allParticipants.length,
    attendanceRate: Math.round(attendanceRate * 100) / 100,
    weightedScore: Math.round(weightedScore * 100) / 100,
    conflictLevel: Math.round(conflictLevel * 100) / 100,
    participants: participantStatuses
  };
}

export function generateHeatMap(
  scoredSlots: ScoredTimeSlot[],
  dateRange: string[]
): HeatMapData {
  const heatMap: Record<string, Record<string, HeatMapCell>> = {};
  let totalSlots = 0;
  let perfectSlots = 0;
  let goodSlots = 0;
  let okaySlots = 0;
  let conflictSlots = 0;
  let bestScore = 0;
  let totalScore = 0;

  // Initialize heat map structure
  dateRange.forEach(date => {
    heatMap[date] = {};
  });

  // Populate heat map with scored slots
  scoredSlots.forEach(slot => {
    const timeKey = `${slot.startTime}-${slot.endTime}`;
    const intensity = slot.score;

    if (!heatMap[slot.date]) {
      heatMap[slot.date] = {};
    }

    heatMap[slot.date][timeKey] = {
      intensity,
      availableCount: slot.availableCount,
      totalParticipants: slot.totalParticipants,
      score: slot.weightedScore,
      conflictLevel: slot.conflictLevel,
      participants: slot.participants
    };

    totalSlots++;
    totalScore += slot.score;
    bestScore = Math.max(bestScore, slot.score);

    // Categorize slots
    if (slot.score >= 0.9) perfectSlots++;
    else if (slot.score >= 0.7) goodSlots++;
    else if (slot.score >= 0.5) okaySlots++;
    else conflictSlots++;
  });

  // Sort slots by score to get top recommendations
  const topSlots = [...scoredSlots]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const statistics: HeatMapStats = {
    totalSlots,
    perfectSlots,
    goodSlots,
    okaySlots,
    conflictSlots,
    bestScore: Math.round(bestScore * 100) / 100,
    averageScore: totalSlots > 0 ? Math.round((totalScore / totalSlots) * 100) / 100 : 0
  };

  return {
    heatMap,
    topSlots,
    statistics
  };
}

export function findOptimalTimeSlots(
  scoredSlots: ScoredTimeSlot[],
  targetDuration: number = 60,
  limit: number = 5
): ScoredTimeSlot[] {
  return scoredSlots
    .filter(slot => {
      const duration = slot.endMinutes - slot.startMinutes;
      return Math.abs(duration - targetDuration) <= 30; // Within 30 minutes of target
    })
    .sort((a, b) => {
      // Primary sort: score
      if (Math.abs(a.score - b.score) > 0.1) {
        return b.score - a.score;
      }
      // Secondary sort: attendance rate
      if (Math.abs(a.attendanceRate - b.attendanceRate) > 0.1) {
        return b.attendanceRate - a.attendanceRate;
      }
      // Tertiary sort: lower conflict level
      return a.conflictLevel - b.conflictLevel;
    })
    .slice(0, limit);
}

export function analyzeTimeSlotTrends(scoredSlots: ScoredTimeSlot[]): {
  bestDayOfWeek: string;
  bestTimeOfDay: string;
  worstConflicts: string[];
  participationTrends: Record<string, number>;
} {
  const dayScores: Record<string, number[]> = {};
  const hourScores: Record<number, number[]> = {};
  const conflicts: string[] = [];
  const participationByTime: Record<string, number> = {};

  scoredSlots.forEach(slot => {
    const date = new Date(slot.date);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const hour = Math.floor(slot.startMinutes / 60);
    const timeKey = `${slot.startTime}-${slot.endTime}`;

    // Day of week analysis
    if (!dayScores[dayOfWeek]) dayScores[dayOfWeek] = [];
    dayScores[dayOfWeek].push(slot.score);

    // Hour analysis
    if (!hourScores[hour]) hourScores[hour] = [];
    hourScores[hour].push(slot.score);

    // Conflict analysis
    if (slot.score < 0.3) {
      conflicts.push(`${slot.date} ${slot.startTime}: Low participation (${slot.attendanceRate}%)`);
    }

    // Participation tracking
    participationByTime[timeKey] = (participationByTime[timeKey] || 0) + slot.attendanceRate;
  });

  // Find best day of week
  const bestDay = Object.entries(dayScores)
    .map(([day, scores]) => ({
      day,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length
    }))
    .sort((a, b) => b.avgScore - a.avgScore)[0];

  // Find best time of day
  const bestHour = Object.entries(hourScores)
    .map(([hour, scores]) => ({
      hour: parseInt(hour),
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length
    }))
    .sort((a, b) => b.avgScore - a.avgScore)[0];

  const bestTimeOfDay = bestHour ?
    `${bestHour.hour.toString().padStart(2, '0')}:00` :
    '10:00';

  return {
    bestDayOfWeek: bestDay?.day || 'Wednesday',
    bestTimeOfDay,
    worstConflicts: conflicts.slice(0, 5),
    participationTrends: participationByTime
  };
}

// Helper functions

function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

function getTimePreferenceMultiplier(startMinutes: number, endMinutes: number): number {
  const startHour = startMinutes / 60;
  const endHour = endMinutes / 60;

  // Business hours (9 AM - 5 PM) get a slight bonus
  if (startHour >= 9 && endHour <= 17) {
    return 1.1;
  }

  // Early morning (6-9 AM) gets a small penalty
  if (startHour >= 6 && startHour < 9) {
    return 0.9;
  }

  // Evening (5-8 PM) gets a small penalty
  if (startHour >= 17 && endHour <= 20) {
    return 0.9;
  }

  // Very early or very late gets larger penalties
  if (startHour < 6 || endHour > 20) {
    return 0.7;
  }

  return 1.0;
}

function getRoleMultiplier(role: string): number {
  switch (role) {
    case 'organizer':
      return 1.5; // Organizer preferences are weighted more heavily
    case 'required':
      return 1.0; // Standard weight
    case 'optional':
      return 0.7; // Optional participants have less weight
    default:
      return 1.0;
  }
}