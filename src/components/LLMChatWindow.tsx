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

  const processLLMResponse = async (userMessage: string) => {
    setIsTyping(true);

    try {
      console.log('LLMChatWindow sending request to LLM API with message:', userMessage);
      const response = await fetch('/api/llm/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          participantName: participantName
        }),
      });

      console.log('LLMChatWindow response status:', response.status);
      if (!response.ok) {
        throw new Error(`Failed to get response: ${response.status}`);
      }

      const data = await response.json();
      console.log('LLMChatWindow response data:', data);

      if (data.success) {
        addMessage(data.response || 'I understand your preferences. I can help you update your availability on the grid!', 'llm');

        // Notify parent component about availability update
        if (data.availabilityUpdates) {
          console.log('LLMChatWindow notifying parent of availability updates:', data.availabilityUpdates);
          onAvailabilityUpdate?.(userMessage);
        }
      } else {
        addMessage(data.error || 'Sorry, I encountered an error processing your request.', 'llm');
      }
    } catch (error) {
      console.error('LLMChatWindow request error:', error);
      addMessage('Sorry, I encountered an error. Please try again or update your availability directly on the grid.', 'llm');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    addMessage(userMessage, 'user', participantName);
    setInputValue('');

    await processLLMResponse(userMessage);
  };

  const handleQuickPrompt = (prompt: string) => {
    addMessage(prompt, 'user', participantName);
    processLLMResponse(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full h-full sm:max-w-2xl sm:h-[700px] flex flex-col shadow-2xl border-gray-600 bg-gradient-to-br from-gray-800 via-gray-750 to-gray-800 sm:rounded-lg">
        <div className="flex items-center justify-center w-full bg-gradient-to-r from-gray-700 to-gray-600 border border-gray-600 rounded-lg px-4 py-3 mx-2 sm:mx-4 mt-2 sm:mt-4 mb-2 relative">
          <CardTitle className="text-green-100 font-semibold text-center">
            RoboKatz
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-2 hover:bg-gray-600/50"
          >
            <X className="h-4 w-4 text-gray-300" />
          </Button>
        </div>

        <CardContent className="flex-1 flex flex-col p-0 bg-gray-800/80 overflow-hidden">
          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 chat-messages-scroll"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#4ade80 #374151'
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 sm:gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-2 sm:gap-3 max-w-[85%] sm:max-w-[80%] ${
                    message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {message.type === 'user' ? (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center shadow-lg">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-green-300" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-lg">
                        <RobotCatIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                    )}
                  </div>
                  <div
                    className={`rounded-xl p-3 sm:p-4 shadow-sm ${
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
              <div className="flex gap-2 sm:gap-3 justify-start">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-lg">
                  <RobotCatIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-500">
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

          {/* Quick Prompts - Moved outside input area */}
          <div className="flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4">
            <div className="text-sm text-green-300 mb-3 font-medium">Suggestions:</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {quickPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPrompt(prompt)}
                  disabled={isTyping}
                  className="text-xs bg-transparent hover:bg-green-600 border-gray-500 text-gray-200 hover:text-white transition-all duration-200"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>

          {/* Input Area - Separated */}
          <div className="flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4">
            <div className="flex gap-2 sm:gap-3 items-end">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tell me about your availability..."
                className="flex-1 p-3 sm:p-4 border border-gray-500 rounded-xl bg-gray-600/80 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all duration-200 text-gray-100 placeholder:text-gray-400 text-sm sm:text-base"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                size="sm"
                className="h-12 sm:h-[52px] px-4 sm:px-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl shadow-lg transition-all duration-200"
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