'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface MemoryNotification {
  type: 'memory.created' | 'memory.updated' | 'memory.deleted' | 'system.notification';
  data: {
    memory_id?: string;
    user_id?: string;
    title?: string;
    message?: string;
    timestamp: string;
  };
}

interface UseMemoryNotificationsOptions {
  enabled?: boolean;
  onNotification?: (notification: MemoryNotification) => void;
  showToasts?: boolean;
}

export function useMemoryNotifications({
  enabled = true,
  onNotification,
  showToasts = true
}: UseMemoryNotificationsOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<MemoryNotification | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (!enabled || eventSourceRef.current) return;

    const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001';
    const apiKey = process.env.NEXT_PUBLIC_MEMORY_API_KEY;
    
    if (!apiKey) {
      console.warn('Memory API key not configured, real-time notifications disabled');
      return;
    }

    // Build SSE URL with authentication
    const sseUrl = new URL('/api/sse', gatewayUrl);
    sseUrl.searchParams.set('apiKey', apiKey);
    sseUrl.searchParams.set('userId', 'user_' + Date.now()); // TODO: Get actual user ID

    console.log('Connecting to SSE:', sseUrl.toString());

    try {
      const eventSource = new EventSource(sseUrl.toString());
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('connected', (event) => {
        console.log('SSE connected:', event.data);
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        if (showToasts) {
          toast.success('Real-time notifications connected');
        }
      });

      eventSource.addEventListener('memory.created', (event) => {
        const notification: MemoryNotification = {
          type: 'memory.created',
          data: JSON.parse(event.data)
        };
        
        setLastNotification(notification);
        onNotification?.(notification);
        
        if (showToasts) {
          toast.success(`New memory created: ${notification.data.title || 'Untitled'}`);
        }
      });

      eventSource.addEventListener('memory.updated', (event) => {
        const notification: MemoryNotification = {
          type: 'memory.updated',
          data: JSON.parse(event.data)
        };
        
        setLastNotification(notification);
        onNotification?.(notification);
        
        if (showToasts) {
          toast.info(`Memory updated: ${notification.data.title || 'Untitled'}`);
        }
      });

      eventSource.addEventListener('memory.deleted', (event) => {
        const notification: MemoryNotification = {
          type: 'memory.deleted',
          data: JSON.parse(event.data)
        };
        
        setLastNotification(notification);
        onNotification?.(notification);
        
        if (showToasts) {
          toast.info(`Memory deleted: ${notification.data.title || 'Untitled'}`);
        }
      });

      eventSource.addEventListener('auth_success', (event) => {
        console.log('SSE auth success:', event.data);
      });

      eventSource.addEventListener('heartbeat', () => {
        // Keep connection alive, no action needed
      });

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setIsConnected(false);
        
        if (eventSource.readyState === EventSource.CLOSED) {
          handleReconnect();
        }
      };

    } catch (error) {
      console.error('Failed to connect to SSE:', error);
      handleReconnect();
    }
  };

  const handleReconnect = () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached');
      if (showToasts) {
        toast.error('Real-time notifications disconnected');
      }
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
    reconnectAttempts.current++;

    console.log(`Reconnecting to SSE in ${delay}ms (attempt ${reconnectAttempts.current})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      disconnect();
      connect();
    }, delay);
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
  };

  const sendNotification = async (type: string, data: Record<string, unknown>) => {
    // This would send a notification through the webhook system
    const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001';
    
    try {
      await fetch(`${gatewayUrl}/api/webhooks/memory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: type,
          data,
          timestamp: new Date().toISOString(),
          user_id: 'user_' + Date.now() // TODO: Get actual user ID
        }),
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect]);

  return {
    isConnected,
    lastNotification,
    connect,
    disconnect,
    sendNotification
  };
}