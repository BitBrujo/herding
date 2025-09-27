"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Send, User, X } from 'lucide-react';
import { RobotCatIcon } from '@/components/icons/RobotCatIcon';

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
      content: `Hi ${participantName}, I can help you herd your Katz. What do you need?`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "I can't do mornings",
    "Weekends don't work for me",
    "I prefer late afternoons"
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl h-[700px] flex flex-col shadow-2xl border-gray-600 bg-gradient-to-br from-gray-800 via-gray-750 to-gray-800">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-600 bg-gradient-to-r from-gray-700 to-gray-600">
          <CardTitle className="flex items-center gap-3 text-green-100">
            <RobotCatIcon className="h-6 w-6 text-green-400" />
            <span className="font-semibold">RoboKatz</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-gray-600/50">
            <X className="h-4 w-4 text-gray-300" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 bg-gray-800/80 overflow-hidden">
          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-6 space-y-4 chat-messages-scroll"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#4ade80 #374151'
            }}
          >
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
                </div>
              </div>
            ))}

            {isTyping && (
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

          {/* Quick Prompts */}
          <div className="flex-shrink-0 border-t border-gray-600 p-6 bg-gradient-to-r from-gray-700 to-gray-650">
            <div className="text-sm text-green-300 mb-4 font-medium">🐱 Suggestions:</div>
            <div className="flex flex-wrap gap-2 mb-6">
              {quickPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPrompt(prompt)}
                  disabled={isTyping}
                  className="text-xs bg-gray-600 hover:bg-green-600 border-gray-500 text-gray-200 hover:text-white transition-all duration-200"
                >
                  {prompt}
                </Button>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tell me about your availability, like 'I can't do mornings'..."
                className="flex-1 p-4 border border-gray-500 rounded-xl bg-gray-600/80 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all duration-200 text-gray-100 placeholder:text-gray-400"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                size="sm"
                className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl shadow-lg transition-all duration-200"
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