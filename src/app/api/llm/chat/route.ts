import { NextRequest, NextResponse } from 'next/server';
import { getLLMClient } from '@/lib/llm-client';
import { DatabaseService } from '@/lib/database';

const SCHEDULING_SYSTEM_PROMPT = `You are a helpful AI scheduling assistant for Herding Katz, a smart group scheduling platform.

Your responsibilities:
- Help users find optimal meeting times
- Resolve scheduling conflicts diplomatically
- Provide clear, actionable recommendations
- Use natural, conversational language
- Focus on solutions and positive outcomes

Key guidelines:
- Be empathetic when people have conflicts
- Explain scheduling recommendations with data
- Suggest alternatives when conflicts arise
- Keep responses concise but helpful
- Use encouraging, collaborative language

When suggesting times, always explain:
1. Why this time works well (attendance, preferences)
2. Who would be available/unavailable
3. Any potential concerns and solutions`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, eventId, participantId, context = {} } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const client = getLLMClient();
    const db = new DatabaseService();

    // Get event context if eventId provided
    let eventContext = {};
    if (eventId) {
      try {
        const event = await db.getEvent(eventId);
        const participants = await db.getEventParticipants(eventId);
        const availability = await db.getEventAvailability(eventId);

        eventContext = {
          event,
          participants,
          availability,
          totalParticipants: participants.length,
          respondedCount: participants.filter(p => p.has_responded).length
        };
      } catch (error) {
        console.warn('Could not fetch event context:', error);
      }
    }

    // Build conversation context
    const conversationContext = {
      ...context,
      ...eventContext,
      timestamp: new Date().toISOString()
    };

    const messages = [
      { role: 'system' as const, content: SCHEDULING_SYSTEM_PROMPT },
      {
        role: 'user' as const,
        content: `Context: ${JSON.stringify(conversationContext, null, 2)}\n\nUser message: "${message}"`
      }
    ];

    const response = await client.chat(messages);

    // Store the conversation in database if eventId provided
    if (eventId) {
      try {
        await db.addMessage({
          event_id: eventId,
          participant_id: participantId || null,
          message_type: 'user_input',
          content: message,
          is_visible_to_all: true
        });

        await db.addMessage({
          event_id: eventId,
          participant_id: null,
          message_type: 'llm_response',
          content: response.content,
          is_visible_to_all: true,
          llm_model: response.model,
          processing_time_ms: response.processingTime
        });
      } catch (error) {
        console.warn('Could not store conversation:', error);
      }
    }

    return NextResponse.json({
      success: true,
      response: response.content,
      model: response.model,
      processingTime: response.processingTime,
      context: conversationContext
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      {
        error: 'Chat processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}