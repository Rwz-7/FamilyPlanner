import React, { useState } from 'react';
import { useDashboard } from '../contexts/DashboardContext';

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WIDGET_TYPES = [
  { id: 'weather', name: 'Weather', description: 'Shows weather information for your location' },
  { id: 'calendar', name: 'Calendar', description: 'Displays upcoming events from your calendar' },
  { id: 'tasks', name: 'Tasks', description: 'Manage your family tasks and to-dos' },
  { id: 'notes', name: 'Notes', description: 'Keep quick notes and reminders' },
  { id: 'shopping', name: 'Shopping List', description: 'Create and manage shopping lists' },
  { id: 'clock', name: 'Clock', description: 'Shows the current time and date' },
  { id: 'photos', name: 'Photos', description: 'Display family photos' },
];

const AddWidgetModal: React.FC<AddWidgetModalProps> = ({ isOpen, onClose }) => {
  const { addWidget } = useDashboard();
  const [selectedType, setSelectedType] = useState('');
  const [title, setTitle] = useState('');

  const handleAddWidget = async () => {
    if (!selectedType || !title.trim()) return;

    try {
      await addWidget({
        title,
        widget_type: selectedType,
        x_position: 0,  // These will be adjusted by react-grid-layout
        y_position: 0,
        width: 4,
        height: 4,
        config: {}
      });

      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding widget:', error);
    }
  };

  const resetForm = () => {
    setSelectedType('');
    setTitle('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Add New Widget</h2>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Widget Type
            </label>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {WIDGET_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`p-3 border rounded text-left transition duration-200 ${
                    selectedType === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{type.name}</div>
                  <div className="text-xs text-gray-500">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
              Widget Title
            </label>
            <input
              id="title"
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your widget"
            />
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            className="btn btn-secondary"
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleAddWidget}
            disabled={!selectedType || !title.trim()}
          >
            Add Widget
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWidgetModal;