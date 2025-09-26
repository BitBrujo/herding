export interface Event {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description?: string;
  organizer_name: string;
  organizer_email?: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  duration_minutes: number;
  is_finalized: boolean;
  is_locked: boolean;
  allow_anonymous: boolean;
  max_participants: number;
  meeting_importance: 'low' | 'medium' | 'high' | 'critical';
  meeting_type?: string;
  relationship_context?: Record<string, any>;
  share_token: string;
  status: 'active' | 'finalized' | 'cancelled';
}

export interface Participant {
  id: string;
  created_at: string;
  event_id: string;
  name: string;
  email?: string;
  timezone?: string;
  role: 'organizer' | 'required' | 'optional';
  priority_weight: number;
  has_responded: boolean;
  last_updated: string;
}

export interface Availability {
  id: string;
  created_at: string;
  participant_id: string;
  event_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'unavailable' | 'preferred' | 'maybe';
  preference_score: number;
  notes?: string;
}

export interface Message {
  id: string;
  created_at: string;
  event_id: string;
  participant_id?: string;
  message_type: 'user_input' | 'llm_response' | 'system_notification';
  content: string;
  intent?: string;
  extracted_data?: Record<string, any>;
  confidence_score?: number;
  conversation_thread_id?: string;
  is_visible_to_all: boolean;
  llm_model?: string;
  processing_time_ms?: number;
}

export interface MeetingSlot {
  id: string;
  created_at: string;
  event_id: string;
  date: string;
  start_time: string;
  end_time: string;
  timezone?: string;
  total_participants: number;
  available_participants: number;
  attendance_score: number;
  is_final: boolean;
  selected_by?: string;
  selection_reasoning?: string;
  alternative_suggestions?: Record<string, any>;
}

export interface LLMContext {
  id: string;
  created_at: string;
  updated_at: string;
  event_id: string;
  conversation_state?: Record<string, any>;
  participant_preferences?: Record<string, any>;
  group_dynamics?: Record<string, any>;
  scheduling_constraints?: Record<string, any>;
  negotiation_history?: Record<string, any>;
  successful_strategies?: Record<string, any>;
  pain_points?: Record<string, any>;
  response_effectiveness?: number;
  user_satisfaction_score?: number;
}

// Scheduling Engine Types
export interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  startMinutes: number;
  endMinutes: number;
}

export interface ScoredTimeSlot extends TimeSlot {
  score: number;
  availableCount: number;
  totalParticipants: number;
  attendanceRate: number;
  weightedScore: number;
  conflictLevel: number;
  participants: ParticipantStatus[];
}

export interface ParticipantStatus {
  name: string;
  status: 'available' | 'unavailable' | 'maybe';
  preferenceScore: number;
  weight: number;
  notes?: string;
}

export interface HeatMapData {
  heatMap: Record<string, Record<string, HeatMapCell>>;
  topSlots: ScoredTimeSlot[];
  statistics: HeatMapStats;
}

export interface HeatMapCell {
  intensity: number;
  availableCount: number;
  totalParticipants: number;
  score: number;
  conflictLevel: number;
  participants: ParticipantStatus[];
}

export interface HeatMapStats {
  totalSlots: number;
  perfectSlots: number;
  goodSlots: number;
  okaySlots: number;
  conflictSlots: number;
  bestScore: number;
  averageScore: number;
}

// LLM Types
export interface MessageAnalysis {
  intent: string;
  confidence: number;
  timeReferences: TimeReference[];
  preferences: Preferences;
  emotional_context: EmotionalContext;
  constraints: Constraint[];
  actionable_items: string[];
}

export interface TimeReference {
  type: 'absolute' | 'relative' | 'range';
  value: string;
  preference: 'preferred' | 'available' | 'unavailable' | 'flexible';
}

export interface Preferences {
  preferredTimes: string[];
  avoidTimes: string[];
  flexibility: 'high' | 'medium' | 'low';
  duration?: 'shorter' | 'standard' | 'longer';
}

export interface EmotionalContext {
  urgency: 'low' | 'medium' | 'high' | 'critical';
  frustration: number;
  enthusiasm: number;
  concern: number;
}

export interface Constraint {
  type: 'hard' | 'soft';
  description: string;
  impact: 'high' | 'medium' | 'low';
}