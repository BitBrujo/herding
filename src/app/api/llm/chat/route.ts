import { NextRequest, NextResponse } from 'next/server';
import { getLLMClient } from '@/lib/llm-client';
import { DatabaseService, createSupabaseClient } from '@/lib/database';
import {
  parseMultipleStatements,
  validateAvailabilityUpdates,
  type EventContext,
  type AvailabilityUpdate
} from '@/lib/availability-parser';

const SCHEDULING_SYSTEM_PROMPT = `You are a helpful AI scheduling assistant for Herding Katz, a smart group scheduling platform.

Your responsibilities:
- Help users find optimal meeting times
- Resolve scheduling conflicts diplomatically
- Provide clear, actionable recommendations
- Use natural, conversational language
- Focus on solutions and positive outcomes
- Parse availability statements and provide appropriate responses

Key guidelines:
- Be empathetic when people have conflicts
- Explain scheduling recommendations with data
- Suggest alternatives when conflicts arise
- Keep responses concise but helpful
- Use encouraging, collaborative language
- When users express availability preferences, acknowledge what you understood

Availability Response Guidelines:
- If a user states availability (e.g., "I can't do mornings", "Tuesday works"), acknowledge their preference
- Confirm what time slots you understood from their message
- Provide helpful context about how this affects the group scheduling
- Use cat-themed language occasionally ("That sounds paw-some!", "Let's herd those times together!")

When suggesting times, always explain:
1. Why this time works well (attendance, preferences)
2. Who would be available/unavailable
3. Any potential concerns and solutions

Response Format:
- Always provide a conversational, helpful response
- If availability preferences were detected, mention what you understood
- Keep the tone friendly and encouraging`;

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
    let eventContext: any = {};
    let availabilityUpdates: AvailabilityUpdate[] = [];
    let parsingConfidence = 0;
    let parsingSummary = '';

    if (eventId) {
      try {
        // Get just basic event data without complex joins
        const supabase = createSupabaseClient();
        const { data: event, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (error) throw error;

        eventContext = {
          event,
          participants: [], // Skip participants for now due to DB schema issues
          availability: [], // Skip availability for now due to DB schema issues
          totalParticipants: 0,
          respondedCount: 0
        };

        // Parse availability if event context is available
        if (event) {
          const parserEventContext: EventContext = {
            startDate: event.start_date,
            endDate: event.end_date,
            startTime: event.start_time,
            endTime: event.end_time,
            participantName: context.participantName,
            eventTitle: event.title
          };

          const parseResult = parseMultipleStatements(message, parserEventContext);
          availabilityUpdates = validateAvailabilityUpdates(parseResult.updates, parserEventContext);
          parsingConfidence = parseResult.confidence;
          parsingSummary = parseResult.summary;

          console.log('Parsed availability:', {
            message,
            eventContext: parserEventContext,
            updatesCount: availabilityUpdates.length,
            confidence: parsingConfidence,
            summary: parsingSummary,
            sampleUpdates: availabilityUpdates.slice(0, 3)
          });
        }
      } catch (error) {
        console.warn('Could not fetch event context or parse availability:', error);
      }
    }

    // Build conversation context
    const conversationContext = {
      ...context,
      ...eventContext,
      timestamp: new Date().toISOString(),
      parsedAvailability: availabilityUpdates.length > 0 ? {
        updatesCount: availabilityUpdates.length,
        confidence: parsingConfidence,
        summary: parsingSummary,
        updates: availabilityUpdates.slice(0, 5) // Include first few updates for context
      } : null
    };

    // Enhance system prompt with parsing results
    let enhancedPrompt = SCHEDULING_SYSTEM_PROMPT;
    if (availabilityUpdates.length > 0) {
      enhancedPrompt += `

IMPORTANT: I detected availability preferences in the user's message:
- Summary: ${parsingSummary}
- Confidence: ${Math.round(parsingConfidence * 100)}%
- Updates: ${availabilityUpdates.length} time slots

Please acknowledge these preferences in your response and provide helpful context about how this affects their scheduling. Be encouraging and confirm what you understood.`;
    }

    const messages = [
      { role: 'system' as const, content: enhancedPrompt },
      {
        role: 'user' as const,
        content: `Context: ${JSON.stringify(conversationContext, null, 2)}\n\nUser message: "${message}"`
      }
    ];

    const response = await client.chat(messages);

    // Skip storing conversation for now due to DB schema issues
    // TODO: Re-enable when messages table is properly set up
    if (eventId) {
      console.log('Skipping message storage due to DB schema issues');
    }

    return NextResponse.json({
      success: true,
      response: response.content,
      model: response.model,
      processingTime: response.processingTime,
      context: conversationContext,
      // Include availability updates if parsed
      ...(availabilityUpdates.length > 0 && {
        availabilityUpdates,
        parsingConfidence,
        parsingSummary
      })
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