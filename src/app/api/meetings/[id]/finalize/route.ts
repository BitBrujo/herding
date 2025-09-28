import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();

    const {
      organizer_name,
      selected_slot // { date: string, time: string }
    } = body;

    console.log('Finalization request:', { eventId, organizer_name, selected_slot });

    if (!eventId || !organizer_name || !selected_slot) {
      return NextResponse.json(
        { error: 'Missing required fields: organizer_name and selected_slot' },
        { status: 400 }
      );
    }

    // Get event and verify organizer
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Verify the requester is the organizer
    let isAuthorized = event.organizer_name === organizer_name;

    // For anonymous events, check if this is the first participant (event creator)
    if (!isAuthorized && event.organizer_name === 'Anonymous Organizer') {
      const { data: participants } = await supabase
        .from('participants')
        .select('name, created_at')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })
        .limit(1);

      if (participants && participants.length > 0) {
        isAuthorized = participants[0].name === organizer_name;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Only the event organizer can finalize the meeting' },
        { status: 403 }
      );
    }

    // Check if already finalized
    if (event.is_finalized || event.status === 'finalized') {
      return NextResponse.json(
        { error: 'Meeting is already finalized' },
        { status: 409 }
      );
    }

    // Convert time to 24-hour format for database storage
    const formatTimeTo24Hour = (time12: string): string => {
      console.log('Parsing time:', time12);

      const [time, period] = time12.trim().split(' ');
      const timeParts = time.split(':');

      if (timeParts.length !== 2) {
        throw new Error(`Invalid time format: ${time12}. Expected format: "H:MM AM/PM"`);
      }

      const hour = parseInt(timeParts[0]);
      const minute = parseInt(timeParts[1]);

      if (isNaN(hour) || isNaN(minute)) {
        throw new Error(`Invalid time values in: ${time12}`);
      }

      let hour24 = hour;
      if (period === 'AM' && hour === 12) {
        hour24 = 0;
      } else if (period === 'PM' && hour !== 12) {
        hour24 = hour + 12;
      }

      console.log('Converted time:', { time12, hour, minute, period, hour24 });
      return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
    };

    const startTime24 = formatTimeTo24Hour(selected_slot.time);

    // Calculate end time (add event duration)
    const startDate = new Date(`2000-01-01T${startTime24}`);
    const endDate = new Date(startDate.getTime() + (event.duration_minutes || 60) * 60 * 1000);
    const endTime24 = endDate.toTimeString().slice(0, 8);

    // Start transaction: Update event and create meeting slot
    const { error: updateError } = await supabase
      .from('events')
      .update({
        is_finalized: true,
        status: 'finalized',
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId);

    if (updateError) {
      console.error('Error updating event:', updateError);
      return NextResponse.json(
        { error: 'Failed to finalize event' },
        { status: 500 }
      );
    }

    // Create the final meeting slot
    const { data: meetingSlot, error: slotError } = await supabase
      .from('meeting_slots')
      .insert([{
        event_id: eventId,
        date: selected_slot.date,
        start_time: startTime24,
        end_time: endTime24,
        timezone: event.timezone,
        is_final: true,
        selected_by: organizer_name,
        selection_reasoning: 'Finalized by organizer',
        total_participants: 0, // Will be calculated by trigger or subsequent query
        available_participants: 0, // Will be calculated by trigger or subsequent query
        attendance_score: 1.0 // Perfect score for organizer selection
      }])
      .select()
      .single();

    if (slotError) {
      console.error('Error creating meeting slot:', slotError);
      // Try to rollback event update
      await supabase
        .from('events')
        .update({
          is_finalized: false,
          status: 'active'
        })
        .eq('id', eventId);

      return NextResponse.json(
        { error: 'Failed to create meeting slot' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event: {
        ...event,
        is_finalized: true,
        status: 'finalized'
      },
      meeting_slot: meetingSlot
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}