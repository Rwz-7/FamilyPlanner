import React, { useState, useEffect } from 'react';
import BaseWidget from './BaseWidget';
import { Widget as WidgetType } from '../contexts/DashboardContext';

interface ClockWidgetProps {
  widget: WidgetType;
}

const ClockWidget: React.FC<ClockWidgetProps> = ({ widget }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <BaseWidget widget={widget}>
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-5xl font-bold">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="text-xl mt-2 text-gray-500">
          {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>
    </BaseWidget>
  );
};

export default ClockWidget;