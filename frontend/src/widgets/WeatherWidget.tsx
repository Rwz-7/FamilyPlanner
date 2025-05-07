// src/widgets/WeatherWidget.tsx
import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import BaseWidget from './BaseWidget';
import { Widget as WidgetType } from '../contexts/DashboardContext';

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  wind_speed: number;
  last_updated: string;
  forecast: Array<{
    date: string;
    temperature: number;
    condition: string;
    icon: string;
  }>;
}

interface WeatherWidgetProps {
  widget: WidgetType;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ widget }) => {
  const { weatherWs } = useWebSocket();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!weatherWs) return;

    weatherWs.on('weather_data', (data: WeatherData) => {
      setWeatherData(data);
      setIsLoading(false);
    });

    weatherWs.on('weather_update', (data: WeatherData) => {
      setWeatherData(data);
    });

    weatherWs.on('connect', () => {
      weatherWs.send('get_weather', { force_update: true });
    });

    weatherWs.on('error', (error: any) => {
      setError('Failed to load weather data');
      setIsLoading(false);
    });

    return () => {
      weatherWs.off('weather_data');
      weatherWs.off('weather_update');
      weatherWs.off('connect');
      weatherWs.off('error');
    };
  }, [weatherWs]);

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
        return (
          <svg className="h-12 w-12 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2a7 7 0 1 1 0-14 7 7 0 0 1 0 14zM12 5a1 1 0 0 1-1-1V2a1 1 0 0 1 2 0v2a1 1 0 0 1-1 1zM12 23a1 1 0 0 1-1-1v-2a1 1 0 0 1 2 0v2a1 1 0 0 1-1 1zM23 12a1 1 0 0 1-1 1h-2a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1zM4 12a1 1 0 0 1-1 1H1a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1zM19.7 5.7a1 1 0 0 1-1.4-1.4l1.4-1.4a1 1 0 0 1 1.4 1.4l-1.4 1.4zM5.7 19.7a1 1 0 0 1-1.4-1.4l1.4-1.4a1 1 0 0 1 1.4 1.4l-1.4 1.4zM19.7 19.7a1 1 0 0 1-1.4 0l-1.4-1.4a1 1 0 0 1 1.4-1.4l1.4 1.4a1 1 0 0 1 0 1.4zM5.7 5.7a1 1 0 0 1-1.4 0L2.9 4.3a1 1 0 0 1 1.4-1.4l1.4 1.4a1 1 0 0 1 0 1.4z" />
          </svg>
        );
      case 'partly cloudy':
        return (
          <svg className="h-12 w-12 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 4a6 6 0 0 1 6 6c0 .61-.11 1.21-.31 1.76C18.9 12.5 20 14.14 20 16a4 4 0 0 1-4 4H8a5 5 0 0 1-5-5c0-2.76 2.24-5 5-5 .36 0 .71.04 1.05.11A6.08 6.08 0 0 1 12 4m0 2a4 4 0 0 0-4 4c0 .28.06.55.16.8l.35.92-.93.11C7.05 11.93 6.55 12 6 12a3 3 0 0 0-3 3c0 1.65 1.35 3 3 3h8c1.1 0 2-.9 2-2 0-1.1-.9-2-2-2h-.5l-.6-1.1c-.59-1.05-.9-2.23-.9-3.9 0-1.1.9-2 2-2z" />
          </svg>
        );
      case 'cloudy':
        return (
          <svg className="h-12 w-12 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
          </svg>
        );
      case 'rainy':
        return (
          <svg className="h-12 w-12 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19a1 1 0 0 1-2 0v-4a1 1 0 0 1 2 0v4zm5 0a1 1 0 0 1-2 0v-8a1 1 0 0 1 2 0v8zm5 0a1 1 0 0 1-2 0v-4a1 1 0 0 1 2 0v4zm4-12a7 7 0 0 0-13-3 5 5 0 0 0-6 6h19a4 4 0 0 0-0-3z" />
          </svg>
        );
      default:
        return (
          <svg className="h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
          </svg>
        );
    }
  };

  return (
    <BaseWidget widget={widget}>
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center p-4">{error}</div>
      ) : weatherData ? (
        <div className="text-center p-4">
          <h3 className="text-xl font-semibold text-gray-800">{weatherData.location}</h3>

          <div className="flex items-center justify-center my-4">
            {getWeatherIcon(weatherData.condition)}
            <div className="ml-4 text-4xl font-bold text-gray-700">{weatherData.temperature}°</div>
          </div>

          <div className="text-gray-600 mb-4">{weatherData.condition}</div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500">Humidity</div>
              <div className="font-medium">{weatherData.humidity}%</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-xs text-gray-500">Wind</div>
              <div className="font-medium">{weatherData.wind_speed} km/h</div>
            </div>
          </div>

          {weatherData.forecast && weatherData.forecast.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Forecast</h4>
              <div className="flex justify-between text-sm">
                {weatherData.forecast.slice(0, 5).map((day, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xs text-gray-500">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="font-medium mt-1">{day.temperature}°</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-400 mt-4">
            Last updated: {new Date(weatherData.last_updated).toLocaleTimeString()}
          </div>
        </div>
      ) : (
        <div className="text-center p-4 text-gray-500">No weather data available</div>
      )}
    </BaseWidget>
  );
};

export default WeatherWidget;