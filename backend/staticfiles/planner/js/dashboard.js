// static/js/dashboard.js
document.addEventListener('DOMContentLoaded', function() {
    // Update the time every second
    function updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        document.getElementById('time').innerHTML =
            `${hours}:${minutes}<sup>${seconds}</sup>`;

        // Update date once a day
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        document.getElementById('date').textContent = now.toLocaleDateString('en-US', options);

        setTimeout(updateTime, 1000);
    }

    updateTime();

    // Connect to WebSocket for real-time updates
    const familyId = document.body.dataset.familyId;

    // Weather WebSocket
    const weatherWidget = document.getElementById('weather-widget');
    if (weatherWidget) {
        const weatherSocket = new WebSocket(
            `ws://${window.location.host}/ws/weather/${familyId}/`
        );

        weatherSocket.onmessage = function(e) {
            const data = JSON.parse(e.data);

            if (data.type === 'weather_data' || data.type === 'weather_update') {
                updateWeatherDisplay(data.data);
            }
        };

        weatherSocket.onclose = function(e) {
            console.log('Weather socket closed');
        };
    }

    // Calendar WebSocket
    const calendarSocket = new WebSocket(
        `ws://${window.location.host}/ws/calendar/${familyId}/`
    );

    calendarSocket.onmessage = function(e) {
        const data = JSON.parse(e.data);

        if (data.type === 'calendar_events' || data.type === 'calendar_update') {
            // This would reload the page to show updated events
            // For a production app, you'd want to update DOM elements instead
            window.location.reload();
        }
    };

    calendarSocket.onclose = function(e) {
        console.log('Calendar socket closed');
    };

    // Weather display update function
    function updateWeatherDisplay(data) {
        if (!data) return;

        // Update current temperature
        const currentTemp = document.getElementById('current-temp');
        if (currentTemp && data.temperature) {
            currentTemp.textContent = Math.round(data.temperature);
        }

        // Update weather icon
        const weatherIcon = document.getElementById('weather-icon');
        if (weatherIcon && data.condition) {
            // Map condition to emoji
            const iconMap = {
                'Sunny': '☀️',
                'Clear': '☀️',
                'Partly Cloudy': '⛅',
                'Cloudy': '☁️',
                'Overcast': '☁️',
                'Rain': '🌧️',
                'Showers': '🌦️',
                'Snow': '❄️'
            };

            weatherIcon.textContent = iconMap[data.condition] || '☀️';
        }

        // Update forecast
        const forecastContainer = document.getElementById('forecast');
        if (forecastContainer && data.forecast && data.forecast.length > 0) {
            forecastContainer.innerHTML = '';

            // Display up to 4 forecast days
            const daysToShow = Math.min(4, data.forecast.length);

            for (let i = 0; i < daysToShow; i++) {
                const day = data.forecast[i];
                const dayElement = document.createElement('div');
                dayElement.className = 'forecast-day';

                // Create day name
                const dayName = document.createElement('div');
                const date = new Date(day.date);
                dayName.textContent = date.toLocaleDateString('en-US', { weekday: 'short' });

                // Create icon
                const icon = document.createElement('div');
                icon.className = 'forecast-icon';
                icon.textContent = getWeatherEmoji(day.condition);

                // Create temperatures
                const highTemp = document.createElement('div');
                highTemp.textContent = `${Math.round(day.temperature)}°`;

                // Append elements
                dayElement.appendChild(dayName);
                dayElement.appendChild(icon);
                dayElement.appendChild(highTemp);

                forecastContainer.appendChild(dayElement);
            }
        }
    }

    function getWeatherEmoji(condition) {
        const iconMap = {
            'Sunny': '☀️',
            'Clear': '☀️',
            'Partly Cloudy': '⛅',
            'Cloudy': '☁️',
            'Overcast': '☁️',
            'Rain': '🌧️',
            'Showers': '🌦️',
            'Snow': '❄️'
        };

        return iconMap[condition] || '☀️';
    }
});