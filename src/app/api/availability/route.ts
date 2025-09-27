import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');
    const participantId = searchParams.get('participant_id');

    if (!eventId && !participantId) {
      return NextResponse.json(
        { error: 'Either event_id or participant_id is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('availability')
      .select(`
        *,
        participant:participants(id, name)
      `);

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    if (participantId) {
      query = query.eq('participant_id', participantId);
    }

    const { data: availability, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching availability:', error);
      return NextResponse.json(
        { error: 'Failed to fetch availability' },
        { status: 500 }
      );
    }

    return NextResponse.json({ availability });
  } catch (error) {
    console.error('Availability GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participant_id, event_id, date, start_time, end_time, status, preference_score = 1, notes } = body;

    if (!participant_id || !event_id || !date || !start_time || !end_time || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: participant_id, event_id, date, start_time, end_time, status' },
        { status: 400 }
      );
    }

    if (!['available', 'unavailable', 'preferred', 'maybe'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: available, unavailable, preferred, or maybe' },
        { status: 400 }
      );
    }

    // Check if availability already exists for this participant, event, date and time slot
    const { data: existing } = await supabase
      .from('availability')
      .select('id')
      .eq('participant_id', participant_id)
      .eq('event_id', event_id)
      .eq('date', date)
      .eq('start_time', start_time)
      .eq('end_time', end_time)
      .single();

    if (existing) {
      // Update existing availability
      const { data: availability, error } = await supabase
        .from('availability')
        .update({
          status,
          preference_score,
          notes
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating availability:', error);
        return NextResponse.json(
          { error: 'Failed to update availability' },
          { status: 500 }
        );
      }

      return NextResponse.json({ availability });
    } else {
      // Create new availability
      const { data: availability, error } = await supabase
        .from('availability')
        .insert({
          participant_id,
          event_id,
          date,
          start_time,
          end_time,
          status,
          preference_score,
          notes
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating availability:', error);
        return NextResponse.json(
          { error: 'Failed to create availability' },
          { status: 500 }
        );
      }

      return NextResponse.json({ availability }, { status: 201 });
    }
  } catch (error) {
    console.error('Availability POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participant_id');
    const eventId = searchParams.get('event_id');
    const date = searchParams.get('date');
    const startTime = searchParams.get('start_time');
    const endTime = searchParams.get('end_time');

    if (!participantId || !eventId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required parameters: participant_id, event_id, date, start_time, end_time' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('availability')
      .delete()
      .eq('participant_id', participantId)
      .eq('event_id', eventId)
      .eq('date', date)
      .eq('start_time', startTime)
      .eq('end_time', endTime);

    if (error) {
      console.error('Error deleting availability:', error);
      return NextResponse.json(
        { error: 'Failed to delete availability' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Availability DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}