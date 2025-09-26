"use client";

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { OptionalLoginPrompt, useOptionalLoginPrompt } from '@/components/auth/OptionalLoginPrompt';
import { QuickSignup } from '@/components/auth/QuickSignup';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';
import { Calendar, MessageSquare, Brain, Users, Clock, Zap, ArrowRight } from 'lucide-react';

export default function Home() {
  const [showSignup, setShowSignup] = useState(false);
  const { isAuthenticated, suggestAccountCreation } = useOptionalAuth();
  const { shouldShowPrompt, dismissPrompt } = useOptionalLoginPrompt();
  return (
    <AppShell>
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
          Smart Group Scheduling
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          AI-powered meeting scheduling with intelligent conflict resolution and natural language input.
          Find the perfect time for everyone, effortlessly.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" className="text-lg" onClick={() => window.location.href = '/create'}>
            <Calendar className="mr-2 h-5 w-5" />
            Create Event
          </Button>
          <Button variant="outline" size="lg" className="text-lg">
            <Users className="mr-2 h-5 w-5" />
            Join Event
          </Button>
        </div>

        {/* Authenticated user dashboard link */}
        {isAuthenticated && (
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard'}
              className="flex items-center gap-2"
            >
              View My Events
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <Brain className="h-8 w-8 text-primary mb-2" />
            <CardTitle>AI-Powered Intelligence</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Smart conflict resolution and natural language processing to understand your scheduling needs.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <MessageSquare className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Natural Language</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Just say &quot;I can&apos;t do Tuesday mornings&quot; and our AI will understand and suggest alternatives.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Zap className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Real-time Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Live collaboration with instant updates as participants respond and preferences change.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Optional Login Prompt */}
      {!isAuthenticated && suggestAccountCreation() && shouldShowPrompt('multiple_events') && (
        <div className="mb-8">
          <OptionalLoginPrompt
            trigger="multiple_events"
            onDismiss={() => dismissPrompt('multiple_events')}
            onCreateAccount={() => setShowSignup(true)}
          />
        </div>
      )}

      {/* Recent Events */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-6">
          {isAuthenticated ? 'Your Recent Events' : 'Recent Events'}
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Team Weekly Sync</CardTitle>
                <span className="text-sm text-green-400 bg-green-400/10 px-2 py-1 rounded">
                  Active
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>5/8 responded</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Wed 10 AM preferred</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Client Meeting</CardTitle>
                <span className="text-sm text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
                  Pending
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>2/4 responded</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Needs more responses</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-card rounded-lg p-8 border border-border">
        <h3 className="text-2xl font-semibold text-foreground mb-4">
          Ready to schedule smarter?
        </h3>
        <p className="text-muted-foreground mb-6">
          Experience the future of group scheduling with AI assistance.
        </p>
        <Button
          size="lg"
          onClick={() => isAuthenticated ? window.location.href = '/dashboard' : setShowSignup(true)}
        >
          {isAuthenticated ? 'Go to Dashboard' : 'Get Started Now'}
        </Button>
      </div>

      {/* Quick Signup Modal */}
      <QuickSignup
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onSuccess={() => console.log('Account created successfully!')}
      />
    </AppShell>
  );
}
