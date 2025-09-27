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
      content: `Hi ${participantName}! I'm here to help you coordinate your schedule. You can tell me about your availability in natural language, like "I can't do Tuesday mornings" or "I prefer afternoons this week."`,
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'llm',
      content: `Here are some examples of what you can tell me:\n\n• "I can't do mornings" - I'll mark morning slots as unavailable\n• "I prefer afternoons" - I'll prioritize afternoon time slots\n• "I'm free Tuesday and Thursday" - I'll mark those specific days\n• "No meetings on Friday" - I'll block all Friday slots\n\nFeel free to use the quick suggestions below or type your own availability preferences!`,
      timestamp: new Date()
    },
    {
      id: '3',
      type: 'user',
      content: `I can't do mornings`,
      timestamp: new Date(),
      participantName: participantName
    },
    {
      id: '4',
      type: 'llm',
      content: `Perfect! I understand you're not available for morning meetings. I'll help you mark morning time slots (before 11 AM) as unavailable in your schedule. This is a great way to ensure you only get meeting invitations for times that work best for you.`,
      timestamp: new Date()
    },
    {
      id: '5',
      type: 'user',
      content: `Also, I prefer afternoon meetings after 2 PM`,
      timestamp: new Date(),
      participantName: participantName
    },
    {
      id: '6',
      type: 'llm',
      content: `Excellent! So you prefer afternoon meetings after 2 PM and can't do mornings. I'll update your availability to:\n\n✅ Available: 2 PM - 6 PM (afternoon preference)\n❌ Unavailable: Before 11 AM (morning restriction)\n⚠️ Flexible: 11 AM - 2 PM (neutral time)\n\nThis should help find the perfect meeting times for you and your team!`,
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl h-[700px] flex flex-col shadow-2xl border-pink-200 bg-gradient-to-br from-white via-pink-50 to-rose-50">
        <CardHeader className="flex flex-row items-center justify-between border-b border-pink-200 bg-gradient-to-r from-pink-100 to-rose-100">
          <CardTitle className="flex items-center gap-3 text-gray-800">
            <RobotCatIcon className="h-6 w-6 text-pink-600" />
            <span className="font-semibold">Katz Scheduling Assistant</span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-pink-200/50">
            <X className="h-4 w-4 text-gray-600" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 bg-white/50 overflow-hidden">
          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-6 space-y-4 chat-messages-scroll"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#f9a8d4 #fce7f3'
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
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center shadow-lg">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <RobotCatIcon className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                  <div
                    className={`rounded-xl p-4 shadow-sm ${
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white'
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 border border-gray-300'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <div className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-pink-100' : 'text-gray-500'
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
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <RobotCatIcon className="h-5 w-5 text-white" />
                </div>
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-4 shadow-sm border border-gray-300">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="flex-shrink-0 border-t border-pink-200 p-6 bg-gradient-to-r from-pink-50 to-rose-50">
            <div className="text-sm text-gray-600 mb-4 font-medium">🐱 Quick Katz suggestions:</div>
            <div className="flex flex-wrap gap-2 mb-6">
              {quickPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPrompt(prompt)}
                  disabled={isTyping}
                  className="text-xs bg-white hover:bg-pink-100 border-pink-300 text-gray-700 hover:text-pink-800 transition-all duration-200"
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
                className="flex-1 p-4 border border-pink-300 rounded-xl bg-white/80 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-200 text-gray-800 placeholder:text-gray-500"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                size="sm"
                className="px-6 py-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl shadow-lg transition-all duration-200"
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