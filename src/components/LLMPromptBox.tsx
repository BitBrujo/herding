"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Send, Loader2, Sparkles, CheckCircle } from 'lucide-react';

interface ParameterUpdate {
  field: string;
  value: string | number | boolean;
  label: string;
}

interface LLMPromptBoxProps {
  onParameterUpdate: (updates: Record<string, string | number | boolean>) => void;
}

export function LLMPromptBox({ onParameterUpdate }: LLMPromptBoxProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [lastUpdates, setLastUpdates] = useState<ParameterUpdate[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const response = await fetch('/api/llm/herd-params', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to process prompt');
      }

      const data = await response.json();

      if (data.success && data.updates) {
        setLastUpdates(data.parameterUpdates || []);
        setResponse(data.response);
        onParameterUpdate(data.updates);
      } else {
        setError(data.error || 'Failed to process prompt');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const clearResponse = () => {
    setResponse(null);
    setLastUpdates([]);
    setError(null);
  };

  return (
    <div className="border border-border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">
          Help from a Robot
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="e.g., Set this for 10 people in EST timezone"
            className="flex-1 p-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={handleSubmit}
            size="sm"
            disabled={!prompt.trim() || isLoading}
            className="px-3"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Response Display */}
      {response && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-green-800">{response}</p>
              {lastUpdates.length > 0 && (
                <div className="mt-2 space-y-1">
                  {lastUpdates.map((update, index) => (
                    <div key={index} className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                      {update.label}
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={clearResponse}
                className="text-xs text-green-600 hover:text-green-800 mt-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-sm text-red-800">{error}</div>
            <button
              onClick={clearResponse}
              className="text-xs text-red-600 hover:text-red-800 ml-auto"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}