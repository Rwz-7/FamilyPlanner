import React from 'react';
import { Widget } from '../../types';

interface WeatherWidgetProps {
  widget: Widget;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ widget }) => {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">{widget.title}</h3>
      <div className="weather-content">
        {/* Weather implementation will go here */}
        <p>Weather Widget (Coming Soon)</p>
      </div>
    </div>
  );
};
