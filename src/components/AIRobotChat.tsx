"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { User, X, Send, Loader2 } from 'lucide-react';
import { RobotCatIcon } from '@/components/icons/RobotCatIcon';

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
      console.log('Sending request to LLM API with prompt:', userMessage);
      const response = await fetch('/api/llm/herd-params/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: userMessage }),
      });

      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`Failed to get response: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success && data.updates) {
        console.log('Applying parameter updates:', data.updates);
        updateMessage(assistantMessageId, data.response, data.parameterUpdates);
        onParameterUpdate(data.updates);
      } else {
        console.log('No updates or error:', data);
        updateMessage(assistantMessageId, data.error || 'Sorry, I encountered an error processing your request.');
      }
    } catch (error) {
      console.error('LLM request error:', error);
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col shadow-2xl border-gray-600 bg-gradient-to-br from-gray-800 via-gray-750 to-gray-800">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-600 bg-gradient-to-r from-gray-700 to-gray-600">
          <CardTitle className="flex items-center gap-2 text-green-100">
            <RobotCatIcon className="h-5 w-5 text-green-400" />
RoboKatz
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-gray-600/50">
            <X className="h-4 w-4 text-gray-300" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 bg-gray-800/80 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#4ade80 #374151'
            }}>
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
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center shadow-lg">
                        <User className="h-5 w-5 text-green-300" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-lg">
                        <RobotCatIcon className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div
                      className={`rounded-xl p-4 shadow-sm ${
                        message.type === 'user'
                          ? 'bg-gradient-to-br from-gray-700 to-gray-800 text-green-100 border border-gray-600'
                          : 'bg-gradient-to-br from-gray-600 to-gray-700 text-gray-100 border border-gray-500'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <div className={`text-xs mt-2 ${
                        message.type === 'user' ? 'text-green-300' : 'text-gray-400'
                      }`}>
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
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-lg">
                  <RobotCatIcon className="h-5 w-5 text-white" />
                </div>
                <div className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl p-4 shadow-sm border border-gray-500">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-gray-600 p-6 bg-gradient-to-r from-gray-700 to-gray-650">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask me to change parameters..."
                className="flex-1 p-4 border border-gray-500 rounded-xl bg-gray-600/80 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all duration-200 text-gray-100 placeholder:text-gray-400"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="sm"
                className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl shadow-lg transition-all duration-200"
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