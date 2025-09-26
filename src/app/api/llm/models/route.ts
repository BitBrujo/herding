import { NextResponse } from 'next/server';
import { getLLMClient } from '@/lib/llm-client';

export async function GET() {
  try {
    const client = getLLMClient();
    const models = await client.listModels();

    return NextResponse.json({
      success: true,
      models: models,
      currentModel: client['config'].model,
      endpoint: client['config'].endpoint
    });

  } catch (error) {
    console.error('Error listing models:', error);
    return NextResponse.json(
      {
        error: 'Failed to list models',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}