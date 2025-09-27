import { NextRequest, NextResponse } from 'next/server';
import { getLLMClient } from '@/lib/llm-client';

interface ParameterUpdate {
  field: string;
  value: string | number | boolean;
  label: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const client = getLLMClient();

    const systemPrompt = `You are an AI assistant that helps users set parameters for creating a herd (meeting/event).

Parse the user's natural language request and extract specific parameter updates. Respond with a JSON object containing:
1. "updates" - object with parameter changes
2. "response" - friendly confirmation message
3. "parameterUpdates" - array of user-friendly descriptions

Available parameters:
- title: string (herd name)
- timezone: string (e.g., "America/New_York", "America/Los_Angeles", "Europe/London")
- max_participants: number (1-50)
- start_date: string (YYYY-MM-DD format)
- start_time: string (HH:MM format, 24-hour)
- end_time: string (HH:MM format, 24-hour)
- duration_minutes: number (15, 30, 45, 60, 90, 120)

Common timezone mappings:
- EST/Eastern: "America/New_York"
- PST/Pacific: "America/Los_Angeles"
- CST/Central: "America/Chicago"
- MST/Mountain: "America/Denver"
- GMT/UTC: "Europe/London"

Time mappings:
- morning: 09:00-12:00
- afternoon: 12:00-17:00
- evening: 17:00-21:00
- business hours: 09:00-17:00

Example response format:
{
  "updates": {
    "max_participants": 10,
    "timezone": "America/New_York"
  },
  "response": "Set max participants to 10 and timezone to Eastern Time",
  "parameterUpdates": [
    {"field": "max_participants", "value": 10, "label": "Max participants: 10"},
    {"field": "timezone", "value": "America/New_York", "label": "Timezone: Eastern Time"}
  ]
}

Only include parameters that you can confidently extract from the user's request. If no parameters can be extracted, return an empty updates object with an explanation.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: prompt }
    ];

    const response = await client.chat(messages);

    try {
      // Clean the response content - remove markdown code blocks if present
      let cleanedContent = response.content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsedResponse = JSON.parse(cleanedContent);

      return NextResponse.json({
        success: true,
        ...parsedResponse,
        processingTime: response.processingTime
      });
    } catch (parseError) {
      // If JSON parsing fails, return the raw response
      return NextResponse.json({
        success: false,
        error: 'Could not parse LLM response as valid parameters',
        rawResponse: response.content
      });
    }

  } catch (error) {
    console.error('LLM herd params error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process parameter request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Herd Parameters LLM API endpoint',
    description: 'Send POST requests with natural language prompts to update herd creation parameters',
    examplePrompts: [
      'Set this for 10 people in EST timezone',
      'Make it a morning meeting for next Tuesday',
      '30-minute slots, max 5 participants',
      'Evening time slots for 15 people'
    ]
  });
}