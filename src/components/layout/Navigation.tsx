"use client";

import React from 'react';
import Link from 'next/link';
import { Calendar, MessageSquare, Settings, Home } from 'lucide-react';

export function Navigation() {
  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold text-foreground">
              Herding Katz
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            <Link
              href="/create"
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Calendar className="h-4 w-4" />
              <span>Create Event</span>
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <MessageSquare className="h-5 w-5" />
            </button>
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Join Event
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}