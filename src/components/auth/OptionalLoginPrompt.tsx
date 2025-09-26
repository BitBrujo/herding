"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { User, Mail, Calendar, X, CheckCircle } from 'lucide-react';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';

interface OptionalLoginPromptProps {
  trigger: 'multiple_events' | 'event_created' | 'preferences_suggested';
  onDismiss: () => void;
  onCreateAccount: () => void;
  className?: string;
}

const promptContent = {
  multiple_events: {
    title: "Save Your Scheduling Preferences",
    description: "You've participated in multiple events. Create an account to save your preferences and manage your events.",
    benefits: ["Remember your timezone and availability", "Access your event history", "Get personalized scheduling suggestions"],
    icon: Calendar,
    actionText: "Create Account"
  },
  event_created: {
    title: "Want to Manage This Event Later?",
    description: "Create an account to access your event dashboard and make changes anytime.",
    benefits: ["Edit event details after creation", "View participant responses", "Access advanced scheduling features"],
    icon: User,
    actionText: "Save My Event"
  },
  preferences_suggested: {
    title: "Unlock Smarter Scheduling",
    description: "I notice you have specific preferences. An account would help me remember and suggest better times.",
    benefits: ["Personalized LLM assistance", "Automatic preference detection", "Better meeting recommendations"],
    icon: CheckCircle,
    actionText: "Get Personalized Help"
  }
};

export function OptionalLoginPrompt({
  trigger,
  onDismiss,
  onCreateAccount,
  className = ""
}: OptionalLoginPromptProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { suggestAccountCreation, getAnonymousSessionData } = useOptionalAuth();

  const content = promptContent[trigger];
  const Icon = content.icon;

  // Don't show if already dismissed or if not relevant
  if (!isVisible || !suggestAccountCreation()) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  const handleCreateAccount = () => {
    setIsVisible(false);
    onCreateAccount();
  };

  const anonymousData = getAnonymousSessionData();
  const eventCount = anonymousData?.eventIds?.length || 0;

  return (
    <Card className={`bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{content.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {content.description}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="p-2 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Benefits List */}
          <div className="space-y-2">
            {content.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-muted-foreground">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Stats if available */}
          {eventCount > 1 && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{eventCount} events participated</span>
              </div>
              {anonymousData?.preferences && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>Preferences detected</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleCreateAccount} className="flex-1">
              <Mail className="h-4 w-4 mr-2" />
              {content.actionText}
            </Button>
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="flex-shrink-0"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook to manage prompt display logic
export function useOptionalLoginPrompt() {
  const [dismissedPrompts, setDismissedPrompts] = useState<Set<string>>(
    () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('herding_dismissed_prompts');
        return new Set(stored ? JSON.parse(stored) : []);
      }
      return new Set();
    }
  );

  const dismissPrompt = (promptId: string) => {
    const newDismissed = new Set(dismissedPrompts);
    newDismissed.add(promptId);
    setDismissedPrompts(newDismissed);

    if (typeof window !== 'undefined') {
      localStorage.setItem('herding_dismissed_prompts', JSON.stringify([...newDismissed]));
    }
  };

  const shouldShowPrompt = (promptId: string): boolean => {
    return !dismissedPrompts.has(promptId);
  };

  const clearDismissedPrompts = () => {
    setDismissedPrompts(new Set());
    if (typeof window !== 'undefined') {
      localStorage.removeItem('herding_dismissed_prompts');
    }
  };

  return {
    shouldShowPrompt,
    dismissPrompt,
    clearDismissedPrompts
  };
}