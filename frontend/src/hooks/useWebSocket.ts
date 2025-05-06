// src/hooks/useWebSocket.ts
import { useState, useEffect, useCallback } from 'react';

export const useWebSocket = (url: string) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    console.log('Attempting to connect to WebSocket...'); // Debug log
    const websocket = new WebSocket(url);

    websocket.onopen = () => {
      console.log('WebSocket connected!'); // Debug log
      setIsConnected(true);
    };

    websocket.onclose = (event) => {
      console.log('WebSocket disconnected:', event); // Debug log
      setIsConnected(false);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error); // Debug log
    };

    websocket.onmessage = (event) => {
      console.log('Received message:', event.data); // Debug log
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [url]);

  const sendMessage = useCallback((message: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log('Sending message:', message); // Debug log
      ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected'); // Debug log
    }
  }, [ws]);

  return { isConnected, lastMessage, sendMessage };
};
