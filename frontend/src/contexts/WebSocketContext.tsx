// src/contexts/WebSocketContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createDashboardWebSocket, createWeatherWebSocket, createCalendarWebSocket } from '../utils/websocket';
import { useFamily } from './FamilyContext';

interface WebSocketContextType {
  dashboardWs: any;
  weatherWs: any;
  calendarWs: any;
  isConnected: boolean;
  reconnect: () => void; // Add a manual reconnect function
}

const WebSocketContext = createContext<WebSocketContextType>({
  dashboardWs: null,
  weatherWs: null,
  calendarWs: null,
  isConnected: false,
  reconnect: () => {},
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentFamily } = useFamily();
  const [dashboardWs, setDashboardWs] = useState<any>(null);
  const [weatherWs, setWeatherWs] = useState<any>(null);
  const [calendarWs, setCalendarWs] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Create a function to establish all WebSocket connections
  const setupWebSockets = useCallback(() => {
    if (!currentFamily) return;

    console.log('Setting up WebSocket connections...');

    try {
      // Create WebSocket connections
      const dWs = createDashboardWebSocket(currentFamily.id.toString());
      const wWs = createWeatherWebSocket(currentFamily.id.toString());
      const cWs = createCalendarWebSocket(currentFamily.id.toString());

      // Set up connection status tracking
      dWs.on('connect', () => {
        console.log('Dashboard WebSocket connected');
        setIsConnected(true);
      });

      dWs.on('disconnect', () => {
        console.log('Dashboard WebSocket disconnected');
        setIsConnected(false);
      });

      // Connect
      dWs.connect();
      wWs.connect();
      cWs.connect();

      // Store WebSocket instances
      setDashboardWs(dWs);
      setWeatherWs(wWs);
      setCalendarWs(cWs);
    } catch (error) {
      console.error('Failed to set up WebSocket connections:', error);
      setIsConnected(false);
    }
  }, [currentFamily]);

  // Set up WebSockets when family changes
  useEffect(() => {
    setupWebSockets();

    // Cleanup on unmount or when family changes
    return () => {
      if (dashboardWs) dashboardWs.disconnect();
      if (weatherWs) weatherWs.disconnect();
      if (calendarWs) calendarWs.disconnect();
    };
  }, [currentFamily, setupWebSockets]);

  // Add a manual reconnect function
  const reconnect = useCallback(() => {
    console.log('Manually reconnecting WebSockets...');

    // Disconnect existing connections
    if (dashboardWs) dashboardWs.disconnect();
    if (weatherWs) weatherWs.disconnect();
    if (calendarWs) calendarWs.disconnect();

    // Reset state
    setDashboardWs(null);
    setWeatherWs(null);
    setCalendarWs(null);
    setIsConnected(false);

    // Set up new connections
    setupWebSockets();
  }, [dashboardWs, weatherWs, calendarWs, setupWebSockets]);

  return (
    <WebSocketContext.Provider value={{ dashboardWs, weatherWs, calendarWs, isConnected, reconnect }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);