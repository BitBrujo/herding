import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      event_id,
      name,
      email,
      timezone,
      role = 'required',
      priority_weight = 1.0
    } = body;

    if (!event_id || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: event_id and name' },
        { status: 400 }
      );
    }

    // Check if event exists
    const { data: event } = await supabase
      .from('events')
      .select('id')
      .eq('id', event_id)
      .single();

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const { data: participant, error } = await supabase
      .from('participants')
      .insert([{
        event_id,
        name,
        email,
        timezone,
        role,
        priority_weight
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // unique violation
        return NextResponse.json(
          { error: 'Participant with this name already exists for this event' },
          { status: 409 }
        );
      }
      console.error('Error creating participant:', error);
      return NextResponse.json(
        { error: 'Failed to create participant' },
        { status: 500 }
      );
    }

    return NextResponse.json({ participant }, { status: 201 });
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
    const event_id = searchParams.get('event_id');

    if (!event_id) {
      return NextResponse.json(
        { error: 'event_id parameter is required' },
        { status: 400 }
      );
    }

    const { data: participants, error } = await supabase
      .from('participants')
      .select('*')
      .eq('event_id', event_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching participants:', error);
      return NextResponse.json(
        { error: 'Failed to fetch participants' },
        { status: 500 }
      );
    }

    return NextResponse.json({ participants });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}