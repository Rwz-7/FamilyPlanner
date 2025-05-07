import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Check, ShoppingCart, List, Sun, CloudRain, CloudSnow } from 'lucide-react';

const FamilyDashboard = () => {
  // State for all dashboard data
  const [family, setFamily] = useState(null);
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [shoppingItems, setShoppingItems] = useState([]);
  const [weather, setWeather] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  // Family ID would typically come from authentication or URL params
  const familyId = '1';

  // WebSocket connections
  useEffect(() => {
    // Function to establish dashboard WebSocket
    const connectDashboard = () => {
      const dashboardSocket = new WebSocket(`ws://localhost:8000/ws/dashboard/${familyId}/`);

      dashboardSocket.onopen = () => {
        console.log('Dashboard WebSocket connected');
        setConnected(true);
        setError(null);
      };

      dashboardSocket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        console.log('Dashboard data received:', data);

        if (data.type === 'dashboard_data') {
          // Initial data load
          setFamily(data.data.family);
        } else if (data.type === 'widget_update') {
          // Handle widget updates based on widget type
          if (data.data.type === 'calendar') {
            setEvents(data.data.config.events || []);
          } else if (data.data.type === 'tasks') {
            setTasks(data.data.config.tasks || []);
          } else if (data.data.type === 'notes') {
            setNotes(data.data.config.notes || []);
          } else if (data.data.type === 'shopping') {
            setShoppingItems(data.data.config.items || []);
          }
        }
      };

      dashboardSocket.onclose = (e) => {
        console.log('Dashboard WebSocket disconnected');
        setConnected(false);
        // Try to reconnect after 2 seconds
        setTimeout(connectDashboard, 2000);
      };

      dashboardSocket.onerror = (err) => {
        console.error('Dashboard WebSocket error:', err);
        setError('Failed to connect to dashboard service');
      };

      return dashboardSocket;
    };

    // Function to establish weather WebSocket
    const connectWeather = () => {
      const weatherSocket = new WebSocket(`ws://localhost:8000/ws/weather/${familyId}/`);

      weatherSocket.onopen = () => {
        console.log('Weather WebSocket connected');
      };

      weatherSocket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        console.log('Weather data received:', data);

        if (data.type === 'weather_data' || data.type === 'weather_update') {
          setWeather(data.data);
        }
      };

      weatherSocket.onclose = (e) => {
        console.log('Weather WebSocket disconnected');
        // Try to reconnect after 2 seconds
        setTimeout(connectWeather, 2000);
      };

      weatherSocket.onerror = (err) => {
        console.error('Weather WebSocket error:', err);
      };

      return weatherSocket;
    };

    // Function to establish calendar WebSocket
    const connectCalendar = () => {
      const calendarSocket = new WebSocket(`ws://localhost:8000/ws/calendar/${familyId}/`);

      calendarSocket.onopen = () => {
        console.log('Calendar WebSocket connected');
        // Request events for next 7 days
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);

        calendarSocket.send(JSON.stringify({
          action: 'get_events',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        }));
      };

      calendarSocket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        console.log('Calendar data received:', data);

        if (data.type === 'calendar_events') {
          setEvents(data.data || []);
        }
      };

      calendarSocket.onclose = (e) => {
        console.log('Calendar WebSocket disconnected');
        // Try to reconnect after 2 seconds
        setTimeout(connectCalendar, 2000);
      };

      calendarSocket.onerror = (err) => {
        console.error('Calendar WebSocket error:', err);
      };

      return calendarSocket;
    };

    // Connect to all WebSockets
    const dashboardSocket = connectDashboard();
    const weatherSocket = connectWeather();
    const calendarSocket = connectCalendar();

    // Initial REST API data load
    const loadInitialData = async () => {
      try {
        // This would typically use authentication tokens
        const headers = {
          'Content-Type': 'application/json',
        };

        // Fetch tasks
        const tasksResponse = await fetch(`http://localhost:8000/api/tasks/?family=${familyId}`, { headers });
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          setTasks(tasksData.results || []);
        }

        // Fetch notes
        const notesResponse = await fetch(`http://localhost:8000/api/notes/?family=${familyId}`, { headers });
        if (notesResponse.ok) {
          const notesData = await notesResponse.json();
          setNotes(notesData.results || []);
        }

        // Fetch shopping items
        const shoppingResponse = await fetch(`http://localhost:8000/api/shopping-items/?family=${familyId}&purchased=false`, { headers });
        if (shoppingResponse.ok) {
          const shoppingData = await shoppingResponse.json();
          setShoppingItems(shoppingData.results || []);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError('Failed to load initial data');
      }
    };

    loadInitialData();

    // Cleanup WebSocket connections on unmount
    return () => {
      dashboardSocket.close();
      weatherSocket.close();
      calendarSocket.close();
    };
  }, [familyId]);

  // Format date to display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Format time to display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  // Get weather icon based on condition
  const getWeatherIcon = (condition) => {
    if (!condition) return <Sun size={28} />;

    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
      return <CloudRain size={28} />;
    } else if (conditionLower.includes('snow')) {
      return <CloudSnow size={28} />;
    } else {
      return <Sun size={28} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white rounded-lg shadow p-4 mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Family Planner {family && `- ${family.name}`}</h1>
          <div className="flex items-center space-x-2">
            {connected ? (
              <span className="text-green-500 text-sm flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Connected
              </span>
            ) : (
              <span className="text-red-500 text-sm flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                Disconnected
              </span>
            )}
          </div>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 py-2 px-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Calendar Widget */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 bg-blue-500 text-white flex items-center justify-between">
              <h2 className="font-bold flex items-center">
                <Calendar size={18} className="mr-2" />
                Upcoming Events
              </h2>
            </div>
            <div className="p-4">
              {events.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {events.slice(0, 5).map((event) => (
                    <li key={event.id} className="py-3">
                      <p className="font-semibold text-gray-800">{event.title}</p>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <span className="mr-3">{formatDate(event.start)}</span>
                        <span>{formatTime(event.start)}</span>
                      </div>
                      {event.location && (
                        <p className="text-sm text-gray-500 mt-1">{event.location}</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-center py-4">No upcoming events</p>
              )}
            </div>
          </div>

          {/* Weather Widget */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 bg-yellow-500 text-white flex items-center justify-between">
              <h2 className="font-bold flex items-center">
                <Sun size={18} className="mr-2" />
                Weather
              </h2>
            </div>
            <div className="p-4">
              {weather ? (
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {getWeatherIcon(weather.condition)}
                    <span className="text-4xl ml-2">{weather.temperature}°</span>
                  </div>
                  <p className="text-xl text-gray-800">{weather.condition}</p>
                  <p className="text-gray-600">{weather.location}</p>
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-gray-600">
                    <div>
                      <p className="font-semibold">Humidity</p>
                      <p>{weather.humidity}%</p>
                    </div>
                    <div>
                      <p className="font-semibold">Wind</p>
                      <p>{weather.wind_speed} km/h</p>
                    </div>
                  </div>

                  {weather.forecast && weather.forecast.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="font-semibold mb-2 text-gray-700">Forecast</p>
                      <div className="flex justify-between">
                        {weather.forecast.slice(0, 3).map((day, index) => (
                          <div key={index} className="text-center">
                            <p className="text-xs text-gray-600">
                              {formatDate(day.date).split(',')[0]}
                            </p>
                            <p className="text-sm font-semibold">{day.temperature}°</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Loading weather data...</p>
              )}
            </div>
          </div>

          {/* Tasks Widget */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 bg-green-500 text-white flex items-center justify-between">
              <h2 className="font-bold flex items-center">
                <Check size={18} className="mr-2" />
                Tasks
              </h2>
            </div>
            <div className="p-4">
              {tasks.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {tasks.filter(task => task.status !== 'completed').slice(0, 5).map((task) => (
                    <li key={task.id} className="py-2">
                      <div className="flex items-start">
                        <span className={`w-3 h-3 mt-1.5 rounded-full mr-3 ${
                          task.status === 'in_progress' ? 'bg-yellow-400' : 'bg-blue-400'
                        }`}></span>
                        <div>
                          <p className="text-gray-800">{task.title}</p>
                          {task.due_date && (
                            <p className="text-xs text-gray-500">
                              Due: {formatDate(task.due_date)}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-center py-4">No pending tasks</p>
              )}
            </div>
          </div>

          {/* Notes Widget */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 bg-purple-500 text-white flex items-center justify-between">
              <h2 className="font-bold flex items-center">
                <List size={18} className="mr-2" />
                Notes
              </h2>
            </div>
            <div className="p-4">
              {notes.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {notes.slice(0, 3).map((note) => (
                    <li key={note.id} className="py-3">
                      <p className="font-semibold text-gray-800">{note.title}</p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{note.content}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-center py-4">No notes</p>
              )}
            </div>
          </div>

          {/* Shopping List Widget */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 bg-red-500 text-white flex items-center justify-between">
              <h2 className="font-bold flex items-center">
                <ShoppingCart size={18} className="mr-2" />
                Shopping List
              </h2>
            </div>
            <div className="p-4">
              {shoppingItems.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {shoppingItems.filter(item => !item.purchased).slice(0, 6).map((item) => (
                    <li key={item.id} className="py-2 flex items-center">
                      <div className="w-5 h-5 border border-gray-300 rounded-md mr-3"></div>
                      <span className="text-gray-800">
                        {item.name}
                        {item.quantity && (
                          <span className="text-gray-500 text-sm ml-1">({item.quantity})</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-center py-4">No items in shopping list</p>
              )}
            </div>
          </div>

          {/* Family Activity Widget */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 bg-indigo-500 text-white flex items-center justify-between">
              <h2 className="font-bold flex items-center">
                <Bell size={18} className="mr-2" />
                Recent Activity
              </h2>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 mr-3">
                    <Calendar size={14} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-800">New event added: Family Dinner</p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-500 mr-3">
                    <Check size={14} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-800">Task completed: Mow the lawn</p>
                    <p className="text-xs text-gray-500">3 hours ago</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-500 mr-3">
                    <ShoppingCart size={14} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-800">Item added to shopping list: Milk</p>
                    <p className="text-xs text-gray-500">Yesterday</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyDashboard;
