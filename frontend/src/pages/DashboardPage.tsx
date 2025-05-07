// src/pages/DashboardPage.tsx
import React from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import BaseWidget from '../widgets/BaseWidget';
import CalendarWidget from '../widgets/CalendarWidget';

const DashboardPage: React.FC = () => {
  const { dashboard, isLoading, error } = useDashboard();

  const renderWidget = (widget: any) => {
    switch (widget.widget_type) {
      case 'calendar':
        return <CalendarWidget widget={widget} />;
      // Add cases for other widget types
      default:
        return (
          <BaseWidget widget={widget}>
            <div className="p-4 text-center">
              <p>Widget Type: {widget.widget_type}</p>
            </div>
          </BaseWidget>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        Error loading dashboard: {error}
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-xl mb-4">No dashboard found.</p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Create Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{dashboard.name}</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Add Widget
        </button>
      </div>

      {dashboard.widgets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-xl mb-4">No widgets added yet.</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Add Your First Widget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboard.widgets.map(widget => (
            <div key={widget.id} className="h-64">
              {renderWidget(widget)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;