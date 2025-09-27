// Local LLM Client for testing with Ollama/LocalAI

export interface LLMConfig {
  endpoint: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  tokens?: number;
  processingTime: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class LocalLLMClient {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = {
      temperature: 0.7,
      maxTokens: 2000,
      ...config
    };
  }

  async complete(prompt: string): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      // Ollama API format
      if (this.config.endpoint.includes('ollama')) {
        return await this.completionOllama(prompt, startTime);
      }

      // LocalAI/OpenAI-compatible format
      return await this.completionOpenAI(prompt, startTime);
    } catch (error) {
      console.error('LLM completion error:', error);
      throw new Error(`LLM completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async chat(messages: ChatMessage[]): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      // Ollama chat format
      if (this.config.endpoint.includes('ollama')) {
        return await this.chatOllama(messages, startTime);
      }

      // LocalAI/OpenAI-compatible chat format
      return await this.chatOpenAI(messages, startTime);
    } catch (error) {
      console.error('LLM chat error:', error);
      throw new Error(`LLM chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async completionOllama(prompt: string, startTime: number): Promise<LLMResponse> {
    const response = await fetch(`${this.config.endpoint}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const processingTime = Date.now() - startTime;

    return {
      content: data.response,
      model: this.config.model,
      tokens: data.eval_count,
      processingTime
    };
  }

  private async chatOllama(messages: ChatMessage[], startTime: number): Promise<LLMResponse> {
    const response = await fetch(`${this.config.endpoint}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: messages,
        stream: false,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const processingTime = Date.now() - startTime;

    return {
      content: data.message.content,
      model: this.config.model,
      tokens: data.eval_count,
      processingTime
    };
  }

  private async completionOpenAI(prompt: string, startTime: number): Promise<LLMResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(`${this.config.endpoint}/v1/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.config.model,
        prompt: prompt,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`LocalAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const processingTime = Date.now() - startTime;

    return {
      content: data.choices[0].text,
      model: this.config.model,
      tokens: data.usage?.total_tokens,
      processingTime
    };
  }

  private async chatOpenAI(messages: ChatMessage[], startTime: number): Promise<LLMResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(`${this.config.endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.config.model,
        messages: messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`LocalAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const processingTime = Date.now() - startTime;

    return {
      content: data.choices[0].message.content,
      model: this.config.model,
      tokens: data.usage?.total_tokens,
      processingTime
    };
  }

  async listModels(): Promise<string[]> {
    try {
      if (this.config.endpoint.includes('ollama')) {
        const response = await fetch(`${this.config.endpoint}/api/tags`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.models?.map((m: any) => m.name) || [];
      } else {
        const headers: Record<string, string> = {};
        if (this.config.apiKey) {
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }

        const response = await fetch(`${this.config.endpoint}/v1/models`, { headers });
        if (!response.ok) return [];
        const data = await response.json();
        return data.data?.map((m: any) => m.id) || [];
      }
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  }
}

// Default configuration
export const getDefaultLLMConfig = (): LLMConfig => {
  return {
    endpoint: process.env.LLM_ENDPOINT || 'http://100.87.169.2:11434',
    model: process.env.LLM_MODEL || 'qwen2.5-coder:7b',
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '2000'),
    apiKey: process.env.LLM_API_KEY
  };
};

// Create a singleton client instance
let clientInstance: LocalLLMClient | null = null;

export const getLLMClient = (): LocalLLMClient => {
  if (!clientInstance) {
    clientInstance = new LocalLLMClient(getDefaultLLMConfig());
  }
  return clientInstance;
};