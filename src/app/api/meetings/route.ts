import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      title,
      description,
      organizer_name,
      organizer_email,
      start_date,
      end_date,
      start_time,
      end_time,
      timezone = 'UTC',
      duration_minutes = 60,
      allow_anonymous = true,
      max_participants = 50,
      meeting_importance = 'medium',
      meeting_type,
      relationship_context
    } = body;

    if (!title || !start_date || !end_date || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: event, error } = await supabase
      .from('events')
      .insert([{
        title,
        description: description || '',
        organizer_name: organizer_name || 'Anonymous Organizer',
        organizer_email: organizer_email || '',
        start_date,
        end_date,
        start_time,
        end_time,
        timezone,
        duration_minutes,
        allow_anonymous: allow_anonymous ?? true,
        max_participants: max_participants ?? 50,
        meeting_importance: meeting_importance || 'medium',
        meeting_type: meeting_type || 'general',
        relationship_context: relationship_context || {}
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json(
        { error: 'Failed to create event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const organizer_email = searchParams.get('organizer_email');

    let query = supabase.from('events').select('*');

    if (status) {
      query = query.eq('status', status);
    }

    if (organizer_email) {
      query = query.eq('organizer_email', organizer_email);
    }

    const { data: events, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}