"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MessageSquare, Send, Bot, User, X } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'llm' | 'system';
  content: string;
  timestamp: Date;
  participantName?: string;
}

interface LLMChatWindowProps {
  participantName: string;
  isOpen: boolean;
  onClose: () => void;
  onAvailabilityUpdate?: (message: string) => void;
}

export function LLMChatWindow({
  participantName,
  isOpen,
  onClose,
  onAvailabilityUpdate
}: LLMChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'llm',
      content: `Hi ${participantName}! I'm here to help you coordinate your schedule. You can tell me about your availability in natural language, like "I can't do Tuesday mornings" or "I prefer afternoons this week."`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "I can't do mornings",
    "I prefer afternoons",
    "Weekends work better for me",
    "I'm free Tuesday and Thursday",
    "No meetings on Friday",
    "Early morning or late afternoon only"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (content: string, type: 'user' | 'llm' | 'system', participantName?: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      participantName
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const simulateLLMResponse = async (userMessage: string) => {
    setIsTyping(true);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    let response = '';

    // Simple keyword-based responses (in real implementation, this would be an actual LLM)
    if (userMessage.toLowerCase().includes('morning')) {
      response = "I understand you have preferences about morning times. I'll help you mark those time slots accordingly. Would you like me to automatically mark all morning slots (before 11 AM) as unavailable for you?";
    } else if (userMessage.toLowerCase().includes('afternoon')) {
      response = "Got it! Afternoons work better for you. I can help highlight afternoon time slots. Should I prioritize times after 1 PM for your availability?";
    } else if (userMessage.toLowerCase().includes('weekend')) {
      response = "Weekends can work better for some schedules! I see there are some weekend slots available. Would you like me to mark weekend times as preferred for you?";
    } else if (userMessage.toLowerCase().includes('tuesday') || userMessage.toLowerCase().includes('thursday')) {
      response = "Perfect! I can help you mark specific days. It sounds like Tuesday and Thursday work well for you. Should I mark those days as available in the grid?";
    } else if (userMessage.toLowerCase().includes('friday')) {
      response = "No Friday meetings - got it! I'll help you avoid Friday slots. Would you like me to mark all Friday time slots as unavailable?";
    } else if (userMessage.toLowerCase().includes('early') || userMessage.toLowerCase().includes('late')) {
      response = "I understand you prefer early morning or late afternoon slots. This can help avoid the busy middle of the day. Should I focus on times before 9 AM or after 4 PM?";
    } else {
      response = `Thanks for letting me know: "${userMessage}". I'm analyzing your preferences and will help update your availability accordingly. You can also click and drag directly on the grid to set your times!`;
    }

    setIsTyping(false);
    addMessage(response, 'llm');

    // Notify parent component about potential availability update
    onAvailabilityUpdate?.(userMessage);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    addMessage(userMessage, 'user', participantName);
    setInputValue('');

    await simulateLLMResponse(userMessage);
  };

  const handleQuickPrompt = (prompt: string) => {
    addMessage(prompt, 'user', participantName);
    simulateLLMResponse(prompt);
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
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Scheduling Assistant
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
                </div>
              </div>
            ))}

            {isTyping && (
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

          {/* Quick Prompts */}
          <div className="border-t p-4">
            <div className="text-sm text-muted-foreground mb-3">Quick suggestions:</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {quickPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPrompt(prompt)}
                  disabled={isTyping}
                  className="text-xs"
                >
                  {prompt}
                </Button>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tell me about your availability..."
                className="flex-1 p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}