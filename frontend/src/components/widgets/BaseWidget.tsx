import React from 'react';
import { Widget } from '../../types';

interface BaseWidgetProps {
  widget: Widget;
  onSettingsChange?: (settings: Record<string, any>) => void;
}

export const BaseWidget: React.FC<BaseWidgetProps> = ({ widget, onSettingsChange }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{widget.title}</h3>
        <button
          onClick={() => {/* Add settings modal logic */}}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          {/* Add settings icon */}
        </button>
      </div>
      {/* Widget content will be rendered here */}
    </div>
  );
};
