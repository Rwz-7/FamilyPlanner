import React, { useState } from 'react';
import { Widget } from '../../types';

interface NotesWidgetProps {
  widget: Widget;
}

export const NotesWidget: React.FC<NotesWidgetProps> = ({ widget }) => {
  const [notes, setNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState('');

  const handleAddNote = () => {
    if (newNote.trim()) {
      setNotes([...notes, newNote.trim()]);
      setNewNote('');
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">{widget.title}</h3>
      <div className="notes-content">
        <div className="mb-4">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Add a new note..."
          />
          <button
            onClick={handleAddNote}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Note
          </button>
        </div>
        <ul className="space-y-2">
          {notes.map((note, index) => (
            <li key={index} className="p-2 bg-gray-50 rounded">
              {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
