import { NextRequest, NextResponse } from 'next/server';
import { getLLMClient, LLMConfig } from '@/lib/llm-client';

export async function GET() {
  try {
    const client = getLLMClient();
    const config = client['config'] as LLMConfig;

    return NextResponse.json({
      success: true,
      config: {
        endpoint: config.endpoint,
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        hasApiKey: !!config.apiKey
      }
    });

  } catch (error) {
    console.error('Error getting LLM config:', error);
    return NextResponse.json(
      {
        error: 'Failed to get configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, model, temperature, maxTokens, apiKey } = body;

    const client = getLLMClient();
    const config = client['config'] as LLMConfig;

    // Update configuration
    if (endpoint !== undefined) config.endpoint = endpoint;
    if (model !== undefined) config.model = model;
    if (temperature !== undefined) config.temperature = temperature;
    if (maxTokens !== undefined) config.maxTokens = maxTokens;
    if (apiKey !== undefined) config.apiKey = apiKey;

    // Test the connection with new config
    try {
      const models = await client.listModels();

      return NextResponse.json({
        success: true,
        message: 'Configuration updated successfully',
        config: {
          endpoint: config.endpoint,
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          hasApiKey: !!config.apiKey
        },
        availableModels: models
      });

    } catch (testError) {
      return NextResponse.json({
        success: false,
        message: 'Configuration updated but connection test failed',
        config: {
          endpoint: config.endpoint,
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          hasApiKey: !!config.apiKey
        },
        error: testError instanceof Error ? testError.message : 'Connection test failed'
      });
    }

  } catch (error) {
    console.error('Error updating LLM config:', error);
    return NextResponse.json(
      {
        error: 'Failed to update configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}