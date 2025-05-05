// API-Basis-URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// WebSocket-Basis-URL (HTTP -> WS, HTTPS -> WSS)
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

// Andere Konfigurationseinstellungen können hier hinzugefügt werden