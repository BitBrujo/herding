"use client";

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { QuickSignup } from '@/components/auth/QuickSignup';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';
import {
  Calendar,
  Users,
  Clock,
  Plus,
  TrendingUp,
  MessageSquare,
  Search,
  ExternalLink
} from 'lucide-react';

// Mock data - replace with real data from Supabase
const mockEvents = [
  {
    id: '1',
    title: 'Weekly Team Sync',
    status: 'active' as const,
    participantCount: 8,
    responseCount: 5,
    createdAt: '2024-01-15',
    scheduledFor: '2024-01-22T10:00:00Z',
    shareToken: 'abc123'
  },
  {
    id: '2',
    title: 'Project Kickoff Meeting',
    status: 'finalized' as const,
    participantCount: 12,
    responseCount: 12,
    createdAt: '2024-01-10',
    scheduledFor: '2024-01-18T14:00:00Z',
    shareToken: 'def456'
  },
  {
    id: '3',
    title: 'Client Presentation Review',
    status: 'active' as const,
    participantCount: 6,
    responseCount: 3,
    createdAt: '2024-01-20',
    scheduledFor: null,
    shareToken: 'ghi789'
  }
];

export default function DashboardPage() {
  const [showSignup, setShowSignup] = useState(false);
  const [events] = useState(mockEvents);
  const [filter, setFilter] = useState<'all' | 'active' | 'finalized'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { isAuthenticated, loading, getDisplayName, getParticipantIdentity } = useOptionalAuth();

  // Redirect to home if not authenticated after loading
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = '/';
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You need to sign in to access your dashboard.
          </p>
          <Button onClick={() => setShowSignup(true)}>
            Sign In
          </Button>
        </div>
        <QuickSignup
          isOpen={showSignup}
          onClose={() => setShowSignup(false)}
          defaultMode="signin"
        />
      </AppShell>
    );
  }

  const identity = getParticipantIdentity();
  const displayName = getDisplayName(identity);

  const filteredEvents = events.filter(event => {
    const matchesFilter = filter === 'all' || event.status === filter;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    totalEvents: events.length,
    activeEvents: events.filter(e => e.status === 'active').length,
    finalizedEvents: events.filter(e => e.status === 'finalized').length,
    totalParticipants: events.reduce((sum, e) => sum + e.participantCount, 0)
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {displayName}!
            </h1>
            <p className="text-muted-foreground">
              Manage your events and view scheduling insights
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Event
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalEvents}</p>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeEvents}</p>
                  <p className="text-sm text-muted-foreground">Active Events</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.finalizedEvents}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalParticipants}</p>
                  <p className="text-sm text-muted-foreground">Participants</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All Events
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            Active
          </Button>
          <Button
            variant={filter === 'finalized' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('finalized')}
          >
            Completed
          </Button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try adjusting your search or filters.' : 'Create your first event to get started!'}
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <span className={`text-sm px-2 py-1 rounded ${
                      event.status === 'active'
                        ? 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-400/10'
                        : 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-400/10'
                    }`}>
                      {event.status === 'active' ? 'Active' : 'Completed'}
                    </span>
                  </div>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{event.responseCount}/{event.participantCount} responded</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Created {new Date(event.createdAt).toLocaleDateString()}</span>
                  </div>
                  {event.scheduledFor && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Date(event.scheduledFor).toLocaleDateString()} at{' '}
                        {new Date(event.scheduledFor).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Share: {event.shareToken}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AppShell>
  );
}