import React, { useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Widget, WidgetType } from '../../types';
import { CalendarWidget } from '../widgets/CalendarWidget';
import { WeatherWidget } from '../widgets/WeatherWidget';
import { NotesWidget } from '../widgets/NotesWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardProps {
  isConnected: boolean;
  onMessage: any;
  sendMessage: (message: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  isConnected,
  onMessage,
  sendMessage,
}) => {
  const [widgets, setWidgets] = useState<Widget[]>([
    {
      id: 'calendar-1',
      type: WidgetType.CALENDAR,
      title: 'Calendar',
      settings: {},
      position: { x: 0, y: 0, w: 6, h: 4 },
    },
    {
      id: 'weather-1',
      type: WidgetType.WEATHER,
      title: 'Weather',
      settings: {},
      position: { x: 6, y: 0, w: 3, h: 2 },
    },
    {
      id: 'notes-1',
      type: WidgetType.NOTES,
      title: 'Family Notes',
      settings: {},
      position: { x: 6, y: 2, w: 3, h: 2 },
    },
  ]);

  const handleLayoutChange = (layout: any) => {
    const updatedWidgets = widgets.map((widget) => {
      const newPosition = layout.find((item: any) => item.i === widget.id);
      if (newPosition) {
        return {
          ...widget,
          position: {
            x: newPosition.x,
            y: newPosition.y,
            w: newPosition.w,
            h: newPosition.h,
          },
        };
      }
      return widget;
    });
    setWidgets(updatedWidgets);
    // Send updated layout to backend
    sendMessage({
      type: 'UPDATE_LAYOUT',
      payload: updatedWidgets,
    });
  };

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case WidgetType.CALENDAR:
        return <CalendarWidget widget={widget} />;
      case WidgetType.WEATHER:
        return <WeatherWidget widget={widget} />;
      case WidgetType.NOTES:
        return <NotesWidget widget={widget} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Family Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: widgets.map(w => ({ ...w.position, i: w.id })) }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        onLayoutChange={handleLayoutChange}
        isDraggable
        isResizable
      >
        {widgets.map((widget) => (
          <div key={widget.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            {renderWidget(widget)}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};
