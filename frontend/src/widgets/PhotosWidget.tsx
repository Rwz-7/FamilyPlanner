import React, { useState, useEffect } from 'react';
import BaseWidget from './BaseWidget';
import { Widget as WidgetType } from '../contexts/DashboardContext';

interface PhotosWidgetProps {
  widget: WidgetType;
}

// Placeholder images (in a real app, these would come from a photo API or gallery)
const placeholderImages = [
  'https://via.placeholder.com/300x200/3498db/ffffff?text=Family+Photo+1',
  'https://via.placeholder.com/300x200/e74c3c/ffffff?text=Family+Photo+2',
  'https://via.placeholder.com/300x200/2ecc71/ffffff?text=Family+Photo+3',
  'https://via.placeholder.com/300x200/f39c12/ffffff?text=Family+Photo+4',
  'https://via.placeholder.com/300x200/9b59b6/ffffff?text=Family+Photo+5',
];

const PhotosWidget: React.FC<PhotosWidgetProps> = ({ widget }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-rotate images every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(prevIndex =>
        (prevIndex + 1) % placeholderImages.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <BaseWidget widget={widget}>
      <div className="h-full flex flex-col">
        <div className="flex-grow relative">
          <img
            src={placeholderImages[currentImageIndex]}
            alt={`Family photo ${currentImageIndex + 1}`}
            className="absolute inset-0 w-full h-full object-cover rounded"
          />
        </div>

        <div className="flex justify-center mt-2 space-x-1">
          {placeholderImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full ${
                index === currentImageIndex ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            ></button>
          ))}
        </div>
      </div>
    </BaseWidget>
  );
};

export default PhotosWidget;