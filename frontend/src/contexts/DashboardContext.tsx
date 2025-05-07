// src/contexts/DashboardContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useFamily } from './FamilyContext';
import { useWebSocket } from './WebSocketContext';

interface Widget {
  id: number;
  title: string;
  widget_type: string;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  config: any;
}

interface Dashboard {
  id: number;
  name: string;
  widgets: Widget[];
  family: any;
  is_default: boolean;
}

interface DashboardContextType {
  dashboard: Dashboard | null;
  isLoading: boolean;
  error: string | null;
  updateWidget: (widgetId: number, data: any) => Promise<void>;
  addWidget: (data: any) => Promise<void>;
  deleteWidget: (widgetId: number) => Promise<void>;
  refreshDashboard: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType>({
  dashboard: null,
  isLoading: false,
  error: null,
  updateWidget: async () => {},
  addWidget: async () => {},
  deleteWidget: async () => {},
  refreshDashboard: async () => {},
});

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentFamily } = useFamily();
  const { dashboardWs } = useWebSocket();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dashboardWs) return;

    // Listen for dashboard data and updates
    dashboardWs.on('dashboard_data', (data: Dashboard) => {
      setDashboard(data);
      setIsLoading(false);
    });

    dashboardWs.on('dashboard_update', (data: any) => {
      setDashboard(prevDashboard => {
        if (!prevDashboard) return data;
        return { ...prevDashboard, ...data };
      });
    });

    dashboardWs.on('widget_update', (data: any) => {
      setDashboard(prevDashboard => {
        if (!prevDashboard) return null;

        // Handle widget deletion
        if (data.deleted) {
          return {
            ...prevDashboard,
            widgets: prevDashboard.widgets.filter(w => w.id !== data.id)
          };
        }

        // Handle widget addition or update
        const widgetIndex = prevDashboard.widgets.findIndex(w => w.id === data.id);
        if (widgetIndex === -1) {
          // New widget
          return {
            ...prevDashboard,
            widgets: [...prevDashboard.widgets, data]
          };
        } else {
          // Update existing widget
          const updatedWidgets = [...prevDashboard.widgets];
          updatedWidgets[widgetIndex] = {
            ...updatedWidgets[widgetIndex],
            ...data
          };
          return {
            ...prevDashboard,
            widgets: updatedWidgets
          };
        }
      });
    });

    // Request dashboard data when WebSocket is connected
    dashboardWs.on('connect', () => {
      dashboardWs.send('get_dashboard');
    });

    // Handle errors
    dashboardWs.on('error', (error: any) => {
      setError('Failed to connect to dashboard service');
      setIsLoading(false);
    });

    return () => {
      // Clean up listeners
      dashboardWs.off('dashboard_data');
      dashboardWs.off('dashboard_update');
      dashboardWs.off('widget_update');
      dashboardWs.off('connect');
      dashboardWs.off('error');
    };
  }, [dashboardWs]);

  const updateWidget = async (widgetId: number, data: any) => {
    if (!dashboardWs) {
      setError('WebSocket not connected');
      return;
    }

    try {
      dashboardWs.send('update_widget', { widget: { id: widgetId, ...data } });
    } catch (error) {
      setError('Failed to update widget');
      console.error('Error updating widget:', error);
    }
  };

  const addWidget = async (data: any) => {
    if (!dashboardWs || !dashboard) {
      setError('WebSocket not connected or dashboard not loaded');
      return;
    }

    try {
      dashboardWs.send('add_widget', {
        widget: {
          ...data,
          dashboard: dashboard.id
        }
      });
    } catch (error) {
      setError('Failed to add widget');
      console.error('Error adding widget:', error);
    }
  };

  const deleteWidget = async (widgetId: number) => {
    if (!dashboardWs) {
      setError('WebSocket not connected');
      return;
    }

    try {
      dashboardWs.send('delete_widget', { widget_id: widgetId });
    } catch (error) {
      setError('Failed to delete widget');
      console.error('Error deleting widget:', error);
    }
  };

  const refreshDashboard = async () => {
    if (!dashboardWs) {
      setError('WebSocket not connected');
      return;
    }

    setIsLoading(true);
    try {
      dashboardWs.send('get_dashboard');
    } catch (error) {
      setError('Failed to refresh dashboard');
      console.error('Error refreshing dashboard:', error);
      setIsLoading(false);
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        dashboard,
        isLoading,
        error,
        updateWidget,
        addWidget,
        deleteWidget,
        refreshDashboard
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);