import { createClient } from '@supabase/supabase-js';
import type {
  Event,
  Participant,
  Availability,
  Message,
  MeetingSlot,
  LLMContext
} from './types';

// Database type definitions for Supabase
export interface Database {
  public: {
    Tables: {
      events: {
        Row: Event;
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'share_token'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          share_token?: string;
        };
        Update: Partial<Omit<Event, 'id' | 'created_at'>>;
      };
      participants: {
        Row: Participant;
        Insert: Omit<Participant, 'id' | 'created_at' | 'last_updated'> & {
          id?: string;
          created_at?: string;
          last_updated?: string;
        };
        Update: Partial<Omit<Participant, 'id' | 'created_at'>>;
      };
      availability: {
        Row: Availability;
        Insert: Omit<Availability, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Availability, 'id' | 'created_at'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Message, 'id' | 'created_at'>>;
      };
      meeting_slots: {
        Row: MeetingSlot;
        Insert: Omit<MeetingSlot, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<MeetingSlot, 'id' | 'created_at'>>;
      };
      llm_context: {
        Row: LLMContext;
        Insert: Omit<LLMContext, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<LLMContext, 'id' | 'created_at'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_share_token: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      event_status: 'active' | 'finalized' | 'cancelled';
      meeting_importance: 'low' | 'medium' | 'high' | 'critical';
      participant_role: 'organizer' | 'required' | 'optional';
      availability_status: 'available' | 'unavailable' | 'preferred' | 'maybe';
      message_type: 'user_input' | 'llm_response' | 'system_notification';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Create a typed Supabase client
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient<Database>(supabaseUrl, supabaseKey);
};

// Database utility functions
export class DatabaseService {
  private supabase = createSupabaseClient();

  // Events
  async createEvent(event: Database['public']['Tables']['events']['Insert']) {
    const { data, error } = await this.supabase
      .from('events')
      .insert(event)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getEvent(id: string) {
    const { data, error } = await this.supabase
      .from('events')
      .select(`
        *,
        participants (*),
        messages (*),
        meeting_slots (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async getEventByToken(shareToken: string) {
    const { data, error } = await this.supabase
      .from('events')
      .select(`
        *,
        participants (*),
        availability (*)
      `)
      .eq('share_token', shareToken)
      .single();

    if (error) throw error;
    return data;
  }

  async updateEvent(id: string, updates: Database['public']['Tables']['events']['Update']) {
    const { data, error } = await this.supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Participants
  async addParticipant(participant: Database['public']['Tables']['participants']['Insert']) {
    const { data, error } = await this.supabase
      .from('participants')
      .insert(participant)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getEventParticipants(eventId: string) {
    const { data, error } = await this.supabase
      .from('participants')
      .select(`
        *,
        availability (*)
      `)
      .eq('event_id', eventId);

    if (error) throw error;
    return data;
  }

  async updateParticipant(id: string, updates: Database['public']['Tables']['participants']['Update']) {
    const { data, error } = await this.supabase
      .from('participants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Availability
  async setAvailability(availability: Database['public']['Tables']['availability']['Insert']) {
    const { data, error } = await this.supabase
      .from('availability')
      .upsert(availability, {
        onConflict: 'participant_id,date,start_time,end_time'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getEventAvailability(eventId: string) {
    const { data, error } = await this.supabase
      .from('availability')
      .select(`
        *,
        participants (name, role, priority_weight)
      `)
      .eq('event_id', eventId);

    if (error) throw error;
    return data;
  }

  // Messages
  async addMessage(message: Database['public']['Tables']['messages']['Insert']) {
    const { data, error } = await this.supabase
      .from('messages')
      .insert(message)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getEventMessages(eventId: string) {
    const { data, error } = await this.supabase
      .from('messages')
      .select(`
        *,
        participants (name)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Meeting Slots
  async addMeetingSlot(slot: Database['public']['Tables']['meeting_slots']['Insert']) {
    const { data, error } = await this.supabase
      .from('meeting_slots')
      .insert(slot)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getEventMeetingSlots(eventId: string) {
    const { data, error } = await this.supabase
      .from('meeting_slots')
      .select('*')
      .eq('event_id', eventId)
      .order('attendance_score', { ascending: false });

    if (error) throw error;
    return data;
  }

  async finalizeMeetingSlot(id: string, selectedBy: string, reasoning?: string) {
    const { data, error } = await this.supabase
      .from('meeting_slots')
      .update({
        is_final: true,
        selected_by: selectedBy,
        selection_reasoning: reasoning
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // LLM Context
  async upsertLLMContext(context: Database['public']['Tables']['llm_context']['Insert']) {
    const { data, error } = await this.supabase
      .from('llm_context')
      .upsert(context, { onConflict: 'event_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getLLMContext(eventId: string) {
    const { data, error } = await this.supabase
      .from('llm_context')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  }

  // Real-time subscriptions
  subscribeToEventUpdates(eventId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel(`event-${eventId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'availability',
          filter: `event_id=eq.${eventId}`
        },
        callback
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `event_id=eq.${eventId}`
        },
        callback
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `event_id=eq.${eventId}`
        },
        callback
      )
      .subscribe();
  }
}