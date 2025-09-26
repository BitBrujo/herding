import { NextRequest, NextResponse } from 'next/server';
import { getLLMClient } from '@/lib/llm-client';
import type { MessageAnalysis } from '@/lib/types';

const ANALYSIS_SYSTEM_PROMPT = `You are an expert scheduling assistant that extracts structured information from conversational messages about meeting scheduling.

Your task is to analyze messages and extract:
1. Primary intent (what the user wants to accomplish)
2. Time/date references and constraints
3. Preference indicators and intensity
4. Emotional context and urgency level
5. Actionable data points

Always return valid JSON with high confidence scores for clear intents.`;

const ANALYSIS_USER_TEMPLATE = (message: string, context: any) => `
Analyze this scheduling message:

MESSAGE: "${message}"

CONTEXT:
- Event: ${context.event?.title || 'Unnamed'}
- Meeting Type: ${context.event?.meeting_type || 'general'}
- Importance: ${context.event?.meeting_importance || 'medium'}
- Participant Role: ${context.participant?.role || 'participant'}
- Previous Messages: ${context.messageCount || 0}

Extract information in this JSON format:
{
  "intent": "schedule_conflict|preference_change|question|availability_update|complaint|suggestion|confirmation",
  "confidence": 0.95,
  "timeReferences": [
    {
      "type": "absolute|relative|range",
      "value": "2024-01-15T14:00:00Z",
      "preference": "preferred|available|unavailable|flexible"
    }
  ],
  "preferences": {
    "preferredTimes": [],
    "avoidTimes": [],
    "flexibility": "high|medium|low",
    "duration": "shorter|standard|longer"
  },
  "emotional_context": {
    "urgency": "low|medium|high|critical",
    "frustration": 0.2,
    "enthusiasm": 0.8,
    "concern": 0.1
  },
  "constraints": [
    {
      "type": "hard|soft",
      "description": "Cannot do mornings",
      "impact": "high|medium|low"
    }
  ],
  "actionable_items": [
    "update_availability",
    "suggest_alternatives",
    "clarify_requirements"
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context = {} } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const client = getLLMClient();

    const messages = [
      { role: 'system' as const, content: ANALYSIS_SYSTEM_PROMPT },
      { role: 'user' as const, content: ANALYSIS_USER_TEMPLATE(message, context) }
    ];

    const response = await client.chat(messages);

    // Try to parse the JSON response
    let analysis: MessageAnalysis;
    try {
      analysis = JSON.parse(response.content);
    } catch (parseError) {
      // If JSON parsing fails, return a basic analysis
      analysis = {
        intent: 'question',
        confidence: 0.5,
        timeReferences: [],
        preferences: {
          preferredTimes: [],
          avoidTimes: [],
          flexibility: 'medium'
        },
        emotional_context: {
          urgency: 'medium',
          frustration: 0.1,
          enthusiasm: 0.5,
          concern: 0.1
        },
        constraints: [],
        actionable_items: ['clarify_requirements']
      };
    }

    return NextResponse.json({
      success: true,
      analysis,
      rawResponse: response.content,
      processingTime: response.processingTime
    });

  } catch (error) {
    console.error('Message analysis error:', error);
    return NextResponse.json(
      {
        error: 'Message analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}