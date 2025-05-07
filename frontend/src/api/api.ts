// src/api/api.ts
import axios from 'axios';

const API_URL = 'http://localhost:8000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for authentication
});

// Authentication API
export const authAPI = {
  login: async (username: string, password: string) => {
    try {
      // Assuming you have a token-based auth or session-based auth
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await apiClient.post('/api-auth/login/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  logout: async () => {
    try {
      const response = await apiClient.post('/api-auth/logout/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/api/users/me/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Family API - adjust to use your actual API endpoints
export const familyAPI = {
  getFamilies: async () => {
    try {
      const response = await apiClient.get('/api/families/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getFamily: async (id: number) => {
    try {
      // Use the correct endpoint from your Django REST Framework router
      const response = await apiClient.get(`/api/families/${id}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Dashboard API
export const dashboardAPI = {
  getDashboard: async (familyId: number) => {
    try {
      // This would depend on your API structure, adjust as needed
      const response = await apiClient.get(`/api/families/${familyId}/dashboards/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  updateWidget: async (widgetId: number, data: any) => {
    try {
      const response = await apiClient.patch(`/api/widgets/${widgetId}/`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  createWidget: async (data: any) => {
    try {
      const response = await apiClient.post('/api/widgets/', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  deleteWidget: async (widgetId: number) => {
    try {
      const response = await apiClient.delete(`/api/widgets/${widgetId}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default apiClient;