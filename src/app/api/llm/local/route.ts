import { NextRequest, NextResponse } from 'next/server';
import { getLLMClient } from '@/lib/llm-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, messages, model, temperature, maxTokens } = body;

    if (!prompt && !messages) {
      return NextResponse.json(
        { error: 'Either prompt or messages is required' },
        { status: 400 }
      );
    }

    const client = getLLMClient();

    // Update config if provided
    if (model) client['config'].model = model;
    if (temperature !== undefined) client['config'].temperature = temperature;
    if (maxTokens !== undefined) client['config'].maxTokens = maxTokens;

    let response;
    if (messages) {
      // Chat format
      response = await client.chat(messages);
    } else {
      // Completion format
      response = await client.complete(prompt);
    }

    return NextResponse.json({
      success: true,
      response: response.content,
      model: response.model,
      tokens: response.tokens,
      processingTime: response.processingTime
    });

  } catch (error) {
    console.error('LLM API error:', error);
    return NextResponse.json(
      {
        error: 'LLM processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Local LLM API endpoint',
    endpoints: {
      POST: 'Send prompt or messages for completion/chat',
      'GET /models': 'List available models',
      'POST /config': 'Update configuration'
    }
  });
}