# Library Layer - CLAUDE.md

This file provides guidance for working with utility libraries and core business logic in HerdingKatz.

## Library Structure

The `src/lib/` directory contains core utilities, database logic, and shared functionality:

### Database & API
- `supabase.ts` - Supabase client configuration and initialization
- `database.ts` - Database schema types and helper functions
- `database.sql` - SQL schema definitions for Supabase
- `types.ts` - TypeScript type definitions for the application

### Core Functionality
- `llm-client.ts` - LLM integration and natural language processing
- `scoring.ts` - Availability scoring and recommendation algorithms
- `timezone-utils.ts` - Timezone handling and conversion utilities
- `utils.ts` - General utility functions and helpers

### Authentication & Hooks
- `auth-optional.ts` - Optional authentication helpers and flows
- `useOptionalAuth.ts` - Hook for optional authentication state

### Real-time System
- `useRealtime.ts` - Core real-time subscription management
- `useMeetingRealtime.ts` - Herd-specific real-time hooks

## Development Guidelines

### Database Layer (`database.ts`)

#### Type Definitions
```typescript
export interface Event {
  id: string;
  title: string;
  description?: string;
  date_start: string;
  date_end: string;
  time_start: string;
  time_end: string;
  duration_minutes: number;
  timezone: string;
  token: string;
  max_participants: number;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: string;
  event_id: string;
  name: string;
  email?: string;
  timezone?: string;
  created_at: string;
}

export interface Availability {
  id: string;
  participant_id: string;
  event_id: string;
  date: string;
  time_start: string;
  time_end: string;
  status: 'available' | 'unavailable' | 'maybe';
  created_at: string;
}
```

#### Database Helpers
```typescript
export async function createEvent(eventData: CreateEventData): Promise<Event> {
  // Implementation with proper error handling and max_participants validation
}

export async function getEventByToken(token: string): Promise<Event | null> {
  // Implementation with null checks
}

export async function createParticipant(
  eventId: string,
  participantData: CreateParticipantData
): Promise<Participant> {
  // Implementation with participant limit enforcement
}

export async function updateAvailability(
  participantId: string,
  availability: AvailabilityUpdate[]
): Promise<void> {
  // Batch update implementation
}
```

### Supabase Client (`supabase.ts`)

#### Client Configuration
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10, // Rate limiting for real-time events
    },
  },
});
```

#### Authentication Helpers
```typescript
export async function signInAnonymously(): Promise<AuthResponse> {
  // Anonymous auth implementation
}

export async function getCurrentUser(): Promise<User | null> {
  // Get current authenticated user
}
```

### LLM Integration (`llm-client.ts`)

#### Chat Processing
```typescript
export interface LLMChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface AvailabilityUpdate {
  participantId: string;
  timeSlots: {
    date: string;
    timeStart: string;
    timeEnd: string;
    status: 'available' | 'unavailable' | 'maybe';
  }[];
}

export async function processChatMessage(
  message: string,
  context: ChatContext
): Promise<{
  response: string;
  availabilityUpdates?: AvailabilityUpdate[];
}> {
  // Natural language processing implementation
}
```

#### Quick Prompts
```typescript
export const QUICK_PROMPTS = [
  "I can't do mornings",
  "I prefer afternoons",
  "I'm not available on weekends",
  "I can only do 30-minute slots",
  "I'm flexible with timing",
  "I need at least 2 hours notice",
  "I prefer Tuesday or Thursday"
] as const;

export function expandQuickPrompt(prompt: string, context: ChatContext): string {
  // Convert quick prompts to detailed availability statements
}
```

### Availability Parser (`availability-parser.ts`)

#### Natural Language Processing Engine
```typescript
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
```

#### Core Parsing Functions
```typescript
export function parseAvailabilityStatement(
  text: string,
  eventContext: EventContext
): ParsedAvailability {
  // Main parsing function - converts natural language to availability updates
  // Handles complex patterns like "I can't do Tuesday mornings" (48 time slots)
  // Returns confidence scores 0.8-1.0 for high-accuracy parsing
}

export function parseMultipleStatements(
  text: string,
  eventContext: EventContext
): ParsedAvailability {
  // Parse multiple statements from a single message
  // Splits on sentence separators and processes each independently
}

export function validateAvailabilityUpdates(
  updates: AvailabilityUpdate[],
  eventContext: EventContext
): AvailabilityUpdate[] {
  // Validate that updates are within event constraints
}
```

### Timezone Utilities (`timezone-utils.ts`)

#### Timezone Conversion
```typescript
export function convertToUserTimezone(
  dateTime: string,
  fromTimezone: string,
  toTimezone: string
): string {
  // Safe timezone conversion with fallbacks
}

export function getTimezoneOffset(timezone: string): number {
  // Get timezone offset in minutes
}

export function formatTimeInTimezone(
  dateTime: string,
  timezone: string,
  format: string = 'HH:mm'
): string {
  // Format time for display in specific timezone
}
```

#### Timezone Detection
```typescript
export function detectUserTimezone(): string {
  // Detect user's current timezone
}

export function validateTimezone(timezone: string): boolean {
  // Validate timezone string
}
```

### Scoring System (`scoring.ts`)

#### Availability Scoring
```typescript
export interface AvailabilityScore {
  timeSlot: TimeSlot;
  score: number; // 0-100, higher is better
  participantCount: number;
  participants: {
    id: string;
    name: string;
    status: 'available' | 'unavailable' | 'maybe';
  }[];
}

export function calculateAvailabilityScores(
  event: Event,
  participants: Participant[],
  availability: Availability[]
): AvailabilityScore[] {
  // Calculate scores for all possible time slots
}

export function recommendBestTimes(
  scores: AvailabilityScore[],
  count: number = 3
): AvailabilityScore[] {
  // Return top N recommended time slots
}
```

#### Heat Map Calculation
```typescript
export function calculateHeatMapData(
  availability: Availability[],
  participants: Participant[]
): HeatMapData {
  // Calculate heat map colors and intensities
}
```

### Real-time Hooks

#### Core Real-time Hook (`useRealtime.ts`)
```typescript
export function useRealtime() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // Connection management
    const subscription = supabase.channel('connection')
      .on('presence', { event: 'sync' }, () => {
        setIsConnected(true);
        setConnectionError(null);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setConnectionError('Connection failed');
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { isConnected, connectionError };
}
```

#### Meeting-specific Real-time (`useMeetingRealtime.ts`)
```typescript
export function useMeetingRealtime(eventId: string) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);

  useEffect(() => {
    const subscription = supabase
      .channel(`meeting_${eventId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'participants',
        filter: `event_id=eq.${eventId}`
      }, handleParticipantChange)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'availability',
        filter: `event_id=eq.${eventId}`
      }, handleAvailabilityChange)
      .subscribe();

    return () => subscription.unsubscribe();
  }, [eventId]);

  return { participants, availability };
}
```

### Utility Functions (`utils.ts`)

#### General Utilities
```typescript
export function generateToken(length: number = 8): string {
  // Generate secure random token
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  // Debounce implementation for API calls
}

export function cn(...classes: (string | undefined | null)[]): string {
  // Tailwind class merging utility
}
```

#### Date/Time Utilities
```typescript
export function formatDate(date: string | Date, format: string): string {
  // Date formatting with timezone support
}

export function isValidTimeSlot(
  start: string,
  end: string,
  duration: number
): boolean {
  // Validate time slot parameters
}

export function generateTimeSlots(
  startTime: string,
  endTime: string,
  duration: number
): TimeSlot[] {
  // Generate time slots for given parameters
}
```

### Error Handling Patterns

#### Database Errors
```typescript
export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export function handleSupabaseError(error: any): never {
  if (error.code === 'PGRST116') {
    throw new DatabaseError('Resource not found', 'NOT_FOUND');
  }
  throw new DatabaseError(error.message, error.code);
}
```

#### Real-time Error Recovery
```typescript
export function createResilientSubscription(
  channelName: string,
  config: SubscriptionConfig
): RealtimeChannel {
  // Implementation with automatic reconnection
}
```

### Performance Guidelines

#### Database Queries
- Use selective queries to minimize data transfer
- Implement proper indexing strategies
- Use pagination for large datasets
- Cache frequently accessed data

#### Real-time Optimization
- Limit subscription scope to necessary data
- Implement proper cleanup on unmount
- Use channel-specific filters
- Handle high-frequency updates efficiently

#### Memory Management
- Clean up subscriptions and timers
- Avoid memory leaks in long-running processes
- Use proper dependency arrays in hooks
- Implement garbage collection for cached data

### Testing Considerations

#### Unit Testing
- Mock Supabase client for consistent tests
- Test timezone conversion edge cases
- Verify scoring algorithm accuracy
- Test error handling scenarios

#### Integration Testing
- Test real-time subscription behavior
- Verify database transaction integrity
- Test LLM integration end-to-end
- Validate timezone handling across regions

#### Performance Testing
- Test with large datasets
- Verify real-time performance under load
- Test memory usage over time
- Validate response times for critical operations