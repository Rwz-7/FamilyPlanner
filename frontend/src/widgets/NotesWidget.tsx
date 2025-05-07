// src/widgets/NotesWidget.tsx
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import BaseWidget from './BaseWidget';
import { Widget as WidgetType } from '../contexts/DashboardContext';

interface NotesWidgetProps {
  widget: WidgetType;
}

const NotesWidget: React.FC<NotesWidgetProps> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const [content, setContent] = useState(widget.config?.content || '');
  const [color, setColor] = useState(widget.config?.color || 'yellow');

  // Update widget config when content or color changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      updateWidget(widget.id, {
        config: {
          ...widget.config,
          content,
          color
        }
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [content, color, widget.id, widget.config, updateWidget]);

  const colorOptions = [
    { id: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-800' },
    { id: 'blue', bg: 'bg-blue-100', text: 'text-blue-800' },
    { id: 'green', bg: 'bg-green-100', text: 'text-green-800' },
    { id: 'pink', bg: 'bg-pink-100', text: 'text-pink-800' },
    { id: 'purple', bg: 'bg-purple-100', text: 'text-purple-800' },
  ];

  const currentColorClasses = colorOptions.find(c => c.id === color) || colorOptions[0];

  return (
    <BaseWidget widget={widget}>
      <div className="h-full flex flex-col p-2">
        <div className="flex space-x-2 mb-2">
          {colorOptions.map(option => (
            <button
              key={option.id}
              onClick={() => setColor(option.id)}
              className={`w-5 h-5 rounded-full ${option.bg} border ${
                color === option.id ? 'border-gray-800 ring-2 ring-gray-400' : 'border-gray-300'
              }`}
              aria-label={`Set note color to ${option.id}`}
            ></button>
          ))}
        </div>

        <textarea
          className={`flex-grow p-3 ${currentColorClasses.bg} ${currentColorClasses.text} w-full rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-400`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note here..."
        ></textarea>
      </div>
    </BaseWidget>
  );
};

export default NotesWidget;