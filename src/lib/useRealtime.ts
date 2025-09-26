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

  const updateState = useCallback((updates: Partial<RealtimeState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleDataChange = useCallback((payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
    updateState({ lastActivity: new Date(), error: null });
    onDataChange(payload);
  }, [onDataChange, updateState]);

  const handleConnect = useCallback(() => {
    updateState({
      isConnected: true,
      isConnecting: false,
      error: null,
      lastActivity: new Date()
    });
    reconnectAttempts.current = 0;
    reconnectDelay.current = 1000;
    config.onConnect?.();
  }, [config, updateState]);

  const handleDisconnect = useCallback(() => {
    updateState({
      isConnected: false,
      isConnecting: false
    });
    config.onDisconnect?.();
  }, [config, updateState]);

  const handleError = useCallback((error: Error | { message?: string }) => {
    const errorMessage = error?.message || 'Real-time connection error';
    updateState({
      error: errorMessage,
      isConnected: false,
      isConnecting: false
    });
    const errorObj = error instanceof Error ? error : new Error(errorMessage);
    config.onError?.(errorObj);
    console.error('Real-time subscription error:', error);
  }, [config, updateState]);

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
    // Clean up existing subscription
    unsubscribe();

    updateState({ isConnecting: true, error: null });

    try {
      const channel = supabase.channel(config.channelName, {
        config: {
          broadcast: { self: true },
          presence: { key: 'user_id' }
        }
      });

      // Add postgres change listeners for each table
      config.tables.forEach(({ table, filter, event = '*' }) => {
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
  }, [config, handleDataChange, handleConnect, handleDisconnect, handleError, unsubscribe, updateState]);

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

  // Initial subscription
  useEffect(() => {
    subscribe();
    return () => unsubscribe();
  }, [subscribe, unsubscribe, ...deps]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    state,
    subscribe,
    unsubscribe,
    reconnect
  };
}