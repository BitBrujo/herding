import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: participant, error } = await supabase
      .from('participants')
      .select(`
        *,
        availability (
          id,
          date,
          start_time,
          end_time,
          status,
          preference_score,
          notes
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Participant not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching participant:', error);
      return NextResponse.json(
        { error: 'Failed to fetch participant' },
        { status: 500 }
      );
    }

    return NextResponse.json({ participant });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const allowedFields = [
      'name',
      'email',
      'timezone',
      'role',
      'priority_weight',
      'has_responded'
    ];

    const updateData = Object.keys(body)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = body[key];
        return obj;
      }, {} as Record<string, any>);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Add last_updated timestamp
    updateData.last_updated = new Date().toISOString();

    const { data: participant, error } = await supabase
      .from('participants')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Participant not found' },
          { status: 404 }
        );
      }
      console.error('Error updating participant:', error);
      return NextResponse.json(
        { error: 'Failed to update participant' },
        { status: 500 }
      );
    }

    return NextResponse.json({ participant });
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
    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting participant:', error);
      return NextResponse.json(
        { error: 'Failed to delete participant' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Participant deleted successfully' });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}