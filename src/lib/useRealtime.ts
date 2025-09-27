"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface RealtimeConfig {
  channelName: string;
  tables: {
    table: string;
    filter?: string;
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  }[];
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export interface RealtimeState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastActivity: Date | null;
}

export interface RealtimeHookReturn {
  state: RealtimeState;
  subscribe: () => void;
  unsubscribe: () => void;
  reconnect: () => void;
}

export function useRealtime(
  config: RealtimeConfig,
  onDataChange: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void,
  deps: React.DependencyList = []
): RealtimeHookReturn {
  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastActivity: null,
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = useRef(1000);

  // Use refs to avoid infinite loops
  const onDataChangeRef = useRef(onDataChange);
  const configRef = useRef(config);

  // Update refs when values change
  onDataChangeRef.current = onDataChange;
  configRef.current = config;

  const updateState = useCallback((updates: Partial<RealtimeState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleDataChange = useCallback((payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
    updateState({ lastActivity: new Date(), error: null });
    onDataChangeRef.current(payload);
  }, [updateState]);

  const handleConnect = useCallback(() => {
    updateState({
      isConnected: true,
      isConnecting: false,
      error: null,
      lastActivity: new Date()
    });
    reconnectAttempts.current = 0;
    reconnectDelay.current = 1000;
    configRef.current.onConnect?.();
  }, [updateState]);

  const handleDisconnect = useCallback(() => {
    updateState({
      isConnected: false,
      isConnecting: false
    });
    configRef.current.onDisconnect?.();
  }, [updateState]);

  const handleError = useCallback((error: Error | { message?: string }) => {
    const errorMessage = error?.message || 'Real-time connection error';
    updateState({
      error: errorMessage,
      isConnected: false,
      isConnecting: false
    });
    const errorObj = error instanceof Error ? error : new Error(errorMessage);
    configRef.current.onError?.(errorObj);
    console.error('Real-time subscription error:', error);
  }, [updateState]);

  const unsubscribe = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    updateState({
      isConnected: false,
      isConnecting: false,
      error: null
    });
  }, [updateState]);

  const subscribe = useCallback(() => {
    // Clean up existing subscription first
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    updateState({ isConnecting: true, error: null });

    try {
      const currentConfig = configRef.current;
      const channel = supabase.channel(currentConfig.channelName, {
        config: {
          broadcast: { self: true },
          presence: { key: 'user_id' }
        }
      });

      // Add postgres change listeners for each table
      currentConfig.tables.forEach(({ table, filter, event = '*' }) => {
        channel.on('postgres_changes', {
          event,
          schema: 'public',
          table,
          ...(filter && { filter })
        }, handleDataChange);
      });

      // Set up connection state handlers
      channel.on('system', {}, (payload) => {
        switch (payload.type) {
          case 'connected':
            handleConnect();
            break;
          case 'disconnected':
            handleDisconnect();
            break;
          case 'error':
            handleError(payload);
            break;
        }
      });

      // Subscribe to the channel
      channel.subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          handleConnect();
        } else if (status === 'CHANNEL_ERROR') {
          handleError(err);
        } else if (status === 'TIMED_OUT') {
          handleError(new Error('Subscription timed out'));
        } else if (status === 'CLOSED') {
          handleDisconnect();
        }
      });

      channelRef.current = channel;

    } catch (error) {
      handleError(error);
    }
  }, [handleDataChange, handleConnect, handleDisconnect, handleError, updateState]);

  const reconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      handleError(new Error(`Failed to reconnect after ${maxReconnectAttempts} attempts`));
      return;
    }

    reconnectAttempts.current++;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      subscribe();
      // Exponential backoff
      reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000);
    }, reconnectDelay.current);

  }, [subscribe, handleError]);

  // Auto-reconnect on connection loss
  useEffect(() => {
    if (!state.isConnected && !state.isConnecting && state.error && reconnectAttempts.current < maxReconnectAttempts) {
      reconnect();
    }
  }, [state.isConnected, state.isConnecting, state.error, reconnect]);

  // Initial subscription - only when channel name changes
  useEffect(() => {
    if (config.channelName) {
      subscribe();
    }
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [config.channelName, subscribe]); // Subscribe when channel name changes

  return {
    state,
    subscribe,
    unsubscribe,
    reconnect
  };
}