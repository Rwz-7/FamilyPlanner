// src/widgets/BaseWidget.tsx
import React, { useState } from 'react';
import { useDashboard } from '../contexts/DashboardContext';

// Define the props interface for this component
interface BaseWidgetProps {
  widget: {
    id: number;
    title: string;
    widget_type: string;
    x_position: number;
    y_position: number;
    width: number;
    height: number;
    config: any;
  };
  children: React.ReactNode;
}

const BaseWidget: React.FC<BaseWidgetProps> = ({ widget, children }) => {
  const { updateWidget, deleteWidget } = useDashboard();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(widget.title);

  const handleTitleChange = (e: React.FormEvent) => {
    e.preventDefault();
    updateWidget(widget.id, { title });
    setIsEditingTitle(false);
  };

  const handleDeleteWidget = () => {
    if (window.confirm('Are you sure you want to delete this widget?')) {
      deleteWidget(widget.id);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white rounded-lg shadow-md border border-gray-200">
      <div className="widget-handle p-3 border-b flex justify-between items-center cursor-move bg-gray-50 rounded-t-lg">
        {isEditingTitle ? (
          <form onSubmit={handleTitleChange} className="flex-grow">
            <input
              type="text"
              className="border border-gray-300 rounded py-1 px-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              onBlur={handleTitleChange}
            />
          </form>
        ) : (
          <h3
            className="font-medium text-gray-700 truncate flex-grow"
            onDoubleClick={() => setIsEditingTitle(true)}
          >
            {widget.title}
          </h3>
        )}

        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-500 hover:text-gray-700 ml-2 p-1 rounded hover:bg-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border rounded shadow-lg z-10 w-40">
              <button
                onClick={() => {
                  setIsEditingTitle(true);
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Edit Title
              </button>
              <button
                onClick={handleDeleteWidget}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
              >
                Delete Widget
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-grow overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default BaseWidget;