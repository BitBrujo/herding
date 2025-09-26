import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { participant_id, status, preference_score = 3, notes } = body;

    if (!participant_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: participant_id, status' },
        { status: 400 }
      );
    }

    // Get the time slot details
    const { data: timeSlot } = await supabase
      .from('meeting_slots')
      .select('event_id, date, start_time, end_time')
      .eq('id', params.id)
      .single();

    if (!timeSlot) {
      return NextResponse.json(
        { error: 'Time slot not found' },
        { status: 404 }
      );
    }

    // Verify participant belongs to this event
    const { data: participant } = await supabase
      .from('participants')
      .select('id')
      .eq('id', participant_id)
      .eq('event_id', timeSlot.event_id)
      .single();

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found or not associated with this event' },
        { status: 404 }
      );
    }

    // Upsert availability response
    const { data: availability, error } = await supabase
      .from('availability')
      .upsert([{
        participant_id,
        event_id: timeSlot.event_id,
        date: timeSlot.date,
        start_time: timeSlot.start_time,
        end_time: timeSlot.end_time,
        status,
        preference_score,
        notes
      }], {
        onConflict: 'participant_id,date,start_time,end_time',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating availability:', error);
      return NextResponse.json(
        { error: 'Failed to update availability' },
        { status: 500 }
      );
    }

    // Update participant response status
    await supabase
      .from('participants')
      .update({ has_responded: true, last_updated: new Date().toISOString() })
      .eq('id', participant_id);

    // Recalculate time slot scores
    await recalculateTimeSlotScore(params.id);

    return NextResponse.json({ availability });
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
    // Get the time slot details
    const { data: timeSlot } = await supabase
      .from('meeting_slots')
      .select('event_id, date, start_time, end_time')
      .eq('id', params.id)
      .single();

    if (!timeSlot) {
      return NextResponse.json(
        { error: 'Time slot not found' },
        { status: 404 }
      );
    }

    const { data: responses, error } = await supabase
      .from('availability')
      .select(`
        *,
        participants!inner (
          id,
          name,
          email,
          role,
          priority_weight
        )
      `)
      .eq('event_id', timeSlot.event_id)
      .eq('date', timeSlot.date)
      .eq('start_time', timeSlot.start_time)
      .eq('end_time', timeSlot.end_time)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching responses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      );
    }

    return NextResponse.json({ responses });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const participant_id = searchParams.get('participant_id');

    if (!participant_id) {
      return NextResponse.json(
        { error: 'participant_id parameter is required' },
        { status: 400 }
      );
    }

    // Get the time slot details
    const { data: timeSlot } = await supabase
      .from('meeting_slots')
      .select('event_id, date, start_time, end_time')
      .eq('id', params.id)
      .single();

    if (!timeSlot) {
      return NextResponse.json(
        { error: 'Time slot not found' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('availability')
      .delete()
      .eq('participant_id', participant_id)
      .eq('event_id', timeSlot.event_id)
      .eq('date', timeSlot.date)
      .eq('start_time', timeSlot.start_time)
      .eq('end_time', timeSlot.end_time);

    if (error) {
      console.error('Error deleting response:', error);
      return NextResponse.json(
        { error: 'Failed to delete response' },
        { status: 500 }
      );
    }

    // Recalculate time slot scores
    await recalculateTimeSlotScore(params.id);

    return NextResponse.json({ message: 'Response deleted successfully' });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to recalculate time slot scores
async function recalculateTimeSlotScore(timeSlotId: string) {
  try {
    // Get time slot and related data
    const { data: timeSlot } = await supabase
      .from('meeting_slots')
      .select(`
        event_id,
        date,
        start_time,
        end_time,
        events!inner (
          id
        )
      `)
      .eq('id', timeSlotId)
      .single();

    if (!timeSlot) return;

    // Get all participants for this event
    const { data: participants } = await supabase
      .from('participants')
      .select('id, priority_weight')
      .eq('event_id', timeSlot.event_id);

    // Get all availability responses for this time slot
    const { data: responses } = await supabase
      .from('availability')
      .select('participant_id, status, preference_score')
      .eq('event_id', timeSlot.event_id)
      .eq('date', timeSlot.date)
      .eq('start_time', timeSlot.start_time)
      .eq('end_time', timeSlot.end_time);

    const totalParticipants = participants?.length || 0;
    let availableCount = 0;
    let weightedScore = 0;
    let totalWeight = 0;

    participants?.forEach(participant => {
      const response = responses?.find(r => r.participant_id === participant.id);
      const weight = participant.priority_weight;
      totalWeight += weight;

      if (response) {
        let score = 0;
        switch (response.status) {
          case 'available':
            score = 1.0;
            availableCount++;
            break;
          case 'preferred':
            score = 1.2;
            availableCount++;
            break;
          case 'maybe':
            score = response.preference_score / 5.0; // Convert 1-5 scale to 0-1
            availableCount += 0.5;
            break;
          case 'unavailable':
            score = 0;
            break;
        }
        weightedScore += score * weight;
      }
    });

    const attendanceScore = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;

    // Update time slot with calculated scores
    await supabase
      .from('meeting_slots')
      .update({
        total_participants: totalParticipants,
        available_participants: Math.round(availableCount),
        attendance_score: Math.round(attendanceScore * 100) / 100
      })
      .eq('id', timeSlotId);

  } catch (error) {
    console.error('Error recalculating scores:', error);
  }
}