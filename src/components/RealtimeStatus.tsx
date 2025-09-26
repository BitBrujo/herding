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
        icon: <Wifi className="h-3 w-3 text-green-600" />,
        text: "Live",
        textColor: "text-green-600"
      };
    } else if (state.isConnecting) {
      return {
        icon: <div className="h-3 w-3 rounded-full bg-yellow-600 animate-pulse" />,
        text: "Connecting...",
        textColor: "text-yellow-600"
      };
    } else if (state.error) {
      return {
        icon: <AlertTriangle className="h-3 w-3 text-red-600" />,
        text: "Error",
        textColor: "text-red-600"
      };
    } else {
      return {
        icon: <WifiOff className="h-3 w-3 text-red-600" />,
        text: "Offline",
        textColor: "text-red-600"
      };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className={`flex items-center gap-1 text-xs ${className}`}>
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