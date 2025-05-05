import { API_BASE_URL } from '../config';
import axios from 'axios';

// WebSocket-Basis-URL (HTTP -> WS, HTTPS -> WSS)
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

export interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
  location: string;
  forecast: {
    date: string;
    temperature: number;
    description: string;
    icon: string;
  }[];
}

// Callback-Typ für Wetter-Updates
type WeatherUpdateCallback = (data: WeatherData) => void;

class WeatherService {
  private socket: WebSocket | null = null;
  private callbacks: WeatherUpdateCallback[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private familyId: string | null = null;
  private lastWeatherData: WeatherData | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  // Verbindung zum WebSocket herstellen
  connect(familyId: string) {
    this.familyId = familyId;
    this.reconnectAttempts = 0;

    if (this.socket) {
      this.disconnect();
    }

    try {
      this.socket = new WebSocket(`${WS_BASE_URL}/ws/weather/${familyId}/`);

      this.socket.onopen = () => {
        console.log('WebSocket-Verbindung für Wetter hergestellt');
        this.reconnectAttempts = 0;
        // Beim Verbindungsaufbau sofort Wetterdaten anfordern
        this.requestUpdate();
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'weather_update') {
            this.lastWeatherData = message.data;

            // Alle registrierten Callbacks aufrufen
            this.callbacks.forEach(callback => {
              callback(message.data);
            });
          }
        } catch (error) {
          console.error('Fehler beim Verarbeiten der WebSocket-Nachricht:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket-Verbindung für Wetter geschlossen:', event.code, event.reason);

        // Automatische Wiederverbindung nach exponentiell wachsender Verzögerung
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts));
          console.log(`Versuche Wiederverbindung in ${delay}ms (Versuch ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

          this.reconnectTimer = setTimeout(() => {
            if (this.familyId) {
              this.reconnectAttempts++;
              this.connect(this.familyId);
            }
          }, delay);
        } else {
          console.log('Maximale Anzahl an Wiederverbindungsversuchen erreicht');
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket-Fehler:', error);
      };
    } catch (error) {
      console.error('Fehler beim Erstellen der WebSocket-Verbindung:', error);
    }
  }

  // Verbindung trennen
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Callback für Wetter-Updates registrieren
  subscribe(callback: WeatherUpdateCallback) {
    this.callbacks.push(callback);

    // Sofort die letzten bekannten Daten senden, falls vorhanden
    if (this.lastWeatherData) {
      callback(this.lastWeatherData);
    }

    // Rückgabefunktion zum Abmelden
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  // Manuelles Update anfordern
  requestUpdate() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'request_weather_update'
      }));
    } else {
      console.warn('WebSocket nicht verbunden, kann kein Update anfordern');
    }
  }

  // Wetterdaten abrufen (für die Abwärtskompatibilität und Fallback)
  async getForecast(location: string = 'Dornbirn'): Promise<WeatherData> {
    // Falls WebSocket aktiv ist und Daten vorhanden sind, diese verwenden
    if (this.lastWeatherData) {
      return this.lastWeatherData;
    }

    try {
      // Fallback: REST-API verwenden, falls WebSocket nicht funktioniert
      if (this.familyId) {
        const response = await axios.get(`${API_BASE_URL}/api/external/weather/forecast/`, {
          params: { family_id: this.familyId }
        });

        this.lastWeatherData = response.data;
        return response.data;
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Wetterdaten über REST-API:', error);
    }

    // Fallback zu Mock-Daten als letzter Ausweg
    const mockWeather: WeatherData = {
      temperature: 18,
      description: 'Teilweise bewölkt',
      icon: 'partly_cloudy',
      location: 'Dornbirn',
      forecast: [
        {
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          temperature: 20,
          description: 'Sonnig',
          icon: 'sunny'
        },
        {
          date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
          temperature: 16,
          description: 'Regnerisch',
          icon: 'rainy'
        },
        {
          date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
          temperature: 15,
          description: 'Bewölkt',
          icon: 'cloudy'
        }
      ]
    };

    return mockWeather;
  }
}

// Singleton-Instanz exportieren
export const weatherService = new WeatherService();
export default weatherService;