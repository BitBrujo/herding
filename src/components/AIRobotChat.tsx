"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Bot, User, X, Send, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  parameterUpdates?: ParameterUpdate[];
}

interface ParameterUpdate {
  field: string;
  value: string | number | boolean;
  label: string;
}

interface AIRobotChatProps {
  isOpen: boolean;
  onClose: () => void;
  onParameterUpdate: (updates: Record<string, string | number | boolean>) => void;
}

export function AIRobotChat({ isOpen, onClose, onParameterUpdate }: AIRobotChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      type: 'assistant',
      content: "Hi! I'm your AI assistant for setting up your herd. I can help you configure parameters like participant limits, timezones, dates, and more. Just tell me what you'd like to change!",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageCounter, setMessageCounter] = useState(2);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (content: string, type: 'user' | 'assistant', parameterUpdates?: ParameterUpdate[]) => {
    const messageId = `${type}-${messageCounter}`;
    setMessageCounter(prev => prev + 1);

    const newMessage: Message = {
      id: messageId,
      type,
      content,
      timestamp: new Date(),
      parameterUpdates
    };
    setMessages(prev => [...prev, newMessage]);
    return messageId;
  };

  const updateMessage = (id: string, content: string, parameterUpdates?: ParameterUpdate[]) => {
    setMessages(prev => prev.map(msg =>
      msg.id === id
        ? { ...msg, content, parameterUpdates, isStreaming: false }
        : msg
    ));
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    addMessage(userMessage, 'user');
    setInputValue('');
    setIsLoading(true);

    // Add streaming message placeholder
    const assistantMessageId = addMessage('', 'assistant');

    try {
      const response = await fetch('/api/llm/herd-params/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: userMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      if (data.success && data.updates) {
        updateMessage(assistantMessageId, data.response, data.parameterUpdates);
        onParameterUpdate(data.updates);
      } else {
        updateMessage(assistantMessageId, data.error || 'Sorry, I encountered an error processing your request.');
      }
    } catch (error) {
      updateMessage(assistantMessageId, 'Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Robot Help
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-3 max-w-[80%] ${
                    message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {message.type === 'user' ? (
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div
                      className={`rounded-lg p-3 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    {/* Parameter Updates */}
                    {message.parameterUpdates && message.parameterUpdates.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.parameterUpdates.map((update, index) => (
                          <div
                            key={index}
                            className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full border border-green-200 inline-block mr-1"
                          >
                            ✅ {update.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask me to change parameters..."
                className="flex-1 p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="sm"
                className="px-4"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}