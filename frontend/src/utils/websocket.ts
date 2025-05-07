// src/utils/websocket.ts
export class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private connected: boolean = false;
  private reconnectTimeout: number = 2000; // Start with 2 seconds
  private maxReconnectTimeout: number = 30000; // Max 30 seconds
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private callbacks: { [key: string]: Function[] } = {};
  private automaticReconnect: boolean = true;

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    if (this.socket) {
      this.disconnect();
    }

    console.log(`Connecting to WebSocket: ${this.url}`);

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log(`WebSocket connected: ${this.url}`);
        this.connected = true;
        this.reconnectTimeout = 2000; // Reset reconnect timeout
        this.reconnectAttempts = 0;
        this.trigger('connect', {});
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`WebSocket message received from ${this.url}:`, data);
          this.trigger(data.type, data.data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log(`WebSocket connection closed: ${this.url}`, event.code, event.reason);
        this.connected = false;
        this.trigger('disconnect', {});

        if (this.automaticReconnect) {
          this.reconnect();
        }
      };

      this.socket.onerror = (error) => {
        console.error(`WebSocket error on ${this.url}:`, error);
        this.trigger('error', { error });
      };
    } catch (e) {
      console.error(`Failed to create WebSocket connection to ${this.url}:`, e);
      this.trigger('error', { error: e });
    }
  }

  disconnect() {
    if (this.socket) {
      // Disable automatic reconnect during intentional disconnect
      this.automaticReconnect = false;
      this.socket.close();
      this.socket = null;
      this.connected = false;
      // Re-enable automatic reconnect for future connections
      this.automaticReconnect = true;
    }
  }

  send(action: string, data: any = {}) {
    if (this.socket && this.connected) {
      const message = JSON.stringify({
        action,
        ...data,
      });
      console.log(`Sending WebSocket message to ${this.url}:`, action, data);
      this.socket.send(message);
    } else {
      console.error(`Cannot send message, WebSocket not connected: ${this.url}`);
      // Attempt to reconnect
      if (!this.connected && this.automaticReconnect) {
        console.log('Attempting to reconnect before sending message...');
        this.connect();
      }
    }
  }

  on(event: string, callback: Function) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  off(event: string, callback?: Function) {
    if (!callback) {
      delete this.callbacks[event];
    } else if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
  }

  private trigger(event: string, data: any) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error(`Error in WebSocket callback for event '${event}':`, e);
        }
      });
    }
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log(`Max reconnect attempts (${this.maxReconnectAttempts}) reached for ${this.url}, giving up`);
      return;
    }

    const timeout = Math.min(
      this.reconnectTimeout * Math.pow(1.5, this.reconnectAttempts),
      this.maxReconnectTimeout
    );

    console.log(`Attempting to reconnect to ${this.url} in ${timeout}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, timeout);
  }

  isConnected() {
    return this.connected;
  }
}

export const createDashboardWebSocket = (familyId: string) => {
  return new WebSocketService(`ws://localhost:8000/ws/dashboard/${familyId}/`);
};

export const createWeatherWebSocket = (familyId: string) => {
  return new WebSocketService(`ws://localhost:8000/ws/weather/${familyId}/`);
};

export const createCalendarWebSocket = (familyId: string) => {
  return new WebSocketService(`ws://localhost:8000/ws/calendar/${familyId}/`);
};