// src/widgets/CalendarWidget.tsx
import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import BaseWidget from './BaseWidget';

interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  location?: string;
  priority: string;
}

interface CalendarWidgetProps {
  widget: {
    id: number;
    title: string;
    widget_type: string;
    config: any;
  };
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ widget }) => {
  const { calendarWs } = useWebSocket();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!calendarWs) return;

    console.log('Setting up calendar WebSocket listeners');

    const handleCalendarEvents = (data: CalendarEvent[]) => {
      console.log('Received calendar events:', data);
      setEvents(data);
      setIsLoading(false);
    };

    calendarWs.on('calendar_events', handleCalendarEvents);

    calendarWs.on('calendar_update', () => {
      console.log('Calendar updated, requesting latest events');
      requestEvents();
    });

    calendarWs.on('connect', () => {
      console.log('Calendar WebSocket connected, requesting events');
      requestEvents();
    });

    calendarWs.on('error', (error: any) => {
      console.error('Calendar WebSocket error:', error);
      setError('Failed to load calendar events');
      setIsLoading(false);
    });

    // Initial request for events
    if (calendarWs.isConnected()) {
      requestEvents();
    }

    function requestEvents() {
      // Request events for the next 7 days
      const now = new Date();
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);

      calendarWs.send('get_events', {
        start_date: now.toISOString(),
        end_date: nextWeek.toISOString()
      });
    }

    return () => {
      calendarWs.off('calendar_events', handleCalendarEvents);
      calendarWs.off('calendar_update');
      calendarWs.off('connect');
      calendarWs.off('error');
    };
  }, [calendarWs]);

  // Group events by day
  const groupEventsByDay = () => {
    const grouped: Record<string, CalendarEvent[]> = {};

    events.forEach(event => {
      const date = new Date(event.start).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });

    return grouped;
  };

  const groupedEvents = groupEventsByDay();

  // Get day labels
  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }
  };

  // Format time
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <BaseWidget widget={widget}>
      <div className="p-3 h-full overflow-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin h-6 w-6 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : events.length === 0 ? (
          <div className="text-gray-500 text-center h-full flex items-center justify-center">
            <p>No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.keys(groupedEvents).map(date => (
              <div key={date} className="mb-3">
                <h3 className="font-medium text-sm text-gray-700 mb-2">{getDayLabel(date)}</h3>
                <ul className="space-y-2">
                  {groupedEvents[date].map(event => (
                    <li key={event.id} className="flex items-start">
                      <div className={`mt-1.5 mr-2 w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(event.priority)}`}></div>
                      <div>
                        <div className="font-medium text-sm">{event.title}</div>
                        <div className="text-xs text-gray-500">
                          {formatTime(event.start)} - {formatTime(event.end)}
                        </div>
                        {event.location && (
                          <div className="text-xs text-gray-500">{event.location}</div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

export default CalendarWidget;