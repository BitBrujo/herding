import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { date, start_time, end_time, timezone } = body;

    if (!date || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields: date, start_time, end_time' },
        { status: 400 }
      );
    }

    // Check if event exists
    const { data: event } = await supabase
      .from('events')
      .select('id, timezone')
      .eq('id', params.id)
      .single();

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get participants count for initial scoring
    const { count: participantCount } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', params.id);

    const { data: timeSlot, error } = await supabase
      .from('meeting_slots')
      .insert([{
        event_id: params.id,
        date,
        start_time,
        end_time,
        timezone: timezone || event.timezone,
        total_participants: participantCount || 0,
        available_participants: 0,
        attendance_score: 0.0
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating time slot:', error);
      return NextResponse.json(
        { error: 'Failed to create time slot' },
        { status: 500 }
      );
    }

    return NextResponse.json({ timeSlot }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: timeSlots, error } = await supabase
      .from('meeting_slots')
      .select(`
        *,
        events!inner (
          title,
          timezone
        )
      `)
      .eq('event_id', params.id)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching time slots:', error);
      return NextResponse.json(
        { error: 'Failed to fetch time slots' },
        { status: 500 }
      );
    }

    return NextResponse.json({ timeSlots });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}