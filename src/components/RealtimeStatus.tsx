"use client";

import React from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { RealtimeState } from '@/lib/useRealtime';

interface RealtimeStatusProps {
  state: RealtimeState;
  showText?: boolean;
  className?: string;
}

export function RealtimeStatus({ state, showText = true, className = "" }: RealtimeStatusProps) {
  const getStatusDisplay = () => {
    if (state.isConnected) {
      return {
        icon: <Wifi className="h-4 w-4 text-green-700" />,
        text: "Live",
        textColor: "text-green-700"
      };
    } else if (state.isConnecting) {
      return {
        icon: <div className="h-4 w-4 rounded-full bg-orange-600 animate-pulse" />,
        text: "Connecting...",
        textColor: "text-orange-600"
      };
    } else if (state.error) {
      return {
        icon: <AlertTriangle className="h-4 w-4 text-red-700" />,
        text: "Error",
        textColor: "text-red-700"
      };
    } else {
      return {
        icon: <WifiOff className="h-4 w-4 text-red-700" />,
        text: "Offline",
        textColor: "text-red-700"
      };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {status.icon}
      {showText && (
        <span className={status.textColor}>
          {status.text}
        </span>
      )}
      {state.lastActivity && state.isConnected && (
        <span className="text-muted-foreground">
          • {state.lastActivity.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </span>
      )}
    </div>
  );
}