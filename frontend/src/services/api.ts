import axios from 'axios';

// Typen für API-Responses
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Family {
  id: number;
  name: string;
  members: User[];
  created_at: string;
}

export interface Event {
  id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  priority: 'low' | 'medium' | 'high';
  family: number;
  assigned_to: User[];
  created_by: User;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  family: number;
  assigned_to: User[];
  created_by: User;
  created_at: string;
  updated_at: string;
}

export interface ShoppingItem {
  id: number;
  name: string;
  quantity: string | null;
  purchased: boolean;
  family: number;
  created_by: User;
  created_at: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  family: number;
  created_by: User;
  created_at: string;
  updated_at: string;
}

// Axios-Instanz mit Basis-Konfiguration
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Wichtig für CSRF-Token und Session-Cookies
});

// CSRF-Token aus Cookies extrahieren
const getCsrfToken = (): string => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrftoken') {
      return value;
    }
  }
  return '';
};

// Request-Interceptor für CSRF-Token
api.interceptors.request.use((config) => {
  // Füge CSRF-Token zu nicht-GET-Anfragen hinzu
  if (config.method !== 'get') {
    config.headers['X-CSRFToken'] = getCsrfToken();
  }
  return config;
});

// Auth-Services
export const authService = {
  login: async (username: string, password: string): Promise<User> => {
    await axios.post('/api-auth/login/',
      new URLSearchParams({ username, password }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRFToken': getCsrfToken()
        },
        withCredentials: true
      }
    );
    return userService.getCurrentUser();
  },

  logout: async (): Promise<void> => {
    await axios.post('/api-auth/logout/', {}, {
      headers: { 'X-CSRFToken': getCsrfToken() },
      withCredentials: true
    });
  },

  register: async (username: string, email: string, password: string): Promise<User> => {
    await api.post('/users/', { username, email, password });
    return authService.login(username, password);
  }
};

// User-Services
export const userService = {
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/users/me/');
    return response.data;
  },

  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users/');
    return response.data;
  }
};

// Family-Services
export const familyService = {
  getFamilies: async (): Promise<Family[]> => {
    const response = await api.get<Family[]>('/families/');
    return response.data;
  },

  getFamily: async (id: number): Promise<Family> => {
    const response = await api.get<Family>(`/families/${id}/`);
    return response.data;
  },

  createFamily: async (name: string): Promise<Family> => {
    const response = await api.post<Family>('/families/', { name });
    return response.data;
  },

  addMember: async (familyId: number, userId: number): Promise<void> => {
    await api.post(`/families/${familyId}/add_member/`, { user_id: userId });
  }
};

// Event-Services
export const eventService = {
  getEvents: async (familyId?: number): Promise<Event[]> => {
    const params = familyId ? { family: familyId } : {};
    const response = await api.get<Event[]>('/events/', { params });
    return response.data;
  },

  getEvent: async (id: number): Promise<Event> => {
    const response = await api.get<Event>(`/events/${id}/`);
    return response.data;
  },

  createEvent: async (eventData: Omit<Event, 'id' | 'created_by' | 'created_at' | 'updated_at'>): Promise<Event> => {
    const response = await api.post<Event>('/events/', eventData);
    return response.data;
  },

  updateEvent: async (id: number, eventData: Partial<Event>): Promise<Event> => {
    const response = await api.put<Event>(`/events/${id}/`, eventData);
    return response.data;
  },

  deleteEvent: async (id: number): Promise<void> => {
    await api.delete(`/events/${id}/`);
  }
};

// Task-Services
export const taskService = {
  getTasks: async (familyId?: number): Promise<Task[]> => {
    const params = familyId ? { family: familyId } : {};
    const response = await api.get<Task[]>('/tasks/', { params });
    return response.data;
  },

  getTask: async (id: number): Promise<Task> => {
    const response = await api.get<Task>(`/tasks/${id}/`);
    return response.data;
  },

  createTask: async (taskData: Omit<Task, 'id' | 'created_by' | 'created_at' | 'updated_at'>): Promise<Task> => {
    const response = await api.post<Task>('/tasks/', taskData);
    return response.data;
  },

  updateTask: async (id: number, taskData: Partial<Task>): Promise<Task> => {
    const response = await api.put<Task>(`/tasks/${id}/`, taskData);
    return response.data;
  },

  deleteTask: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}/`);
  }
};

// ShoppingItem-Services
export const shoppingService = {
  getItems: async (familyId?: number): Promise<ShoppingItem[]> => {
    const params = familyId ? { family: familyId } : {};
    const response = await api.get<ShoppingItem[]>('/shopping-items/', { params });
    return response.data;
  },

  createItem: async (itemData: Omit<ShoppingItem, 'id' | 'created_by' | 'created_at'>): Promise<ShoppingItem> => {
    const response = await api.post<ShoppingItem>('/shopping-items/', itemData);
    return response.data;
  },

  updateItem: async (id: number, itemData: Partial<ShoppingItem>): Promise<ShoppingItem> => {
    const response = await api.put<ShoppingItem>(`/shopping-items/${id}/`, itemData);
    return response.data;
  },

  deleteItem: async (id: number): Promise<void> => {
    await api.delete(`/shopping-items/${id}/`);
  }
};

// Note-Services
export const noteService = {
  getNotes: async (familyId?: number): Promise<Note[]> => {
    const params = familyId ? { family: familyId } : {};
    const response = await api.get<Note[]>('/notes/', { params });
    return response.data;
  },

  getNote: async (id: number): Promise<Note> => {
    const response = await api.get<Note>(`/notes/${id}/`);
    return response.data;
  },

  createNote: async (noteData: Omit<Note, 'id' | 'created_by' | 'created_at' | 'updated_at'>): Promise<Note> => {
    const response = await api.post<Note>('/notes/', noteData);
    return response.data;
  },

  updateNote: async (id: number, noteData: Partial<Note>): Promise<Note> => {
    const response = await api.put<Note>(`/notes/${id}/`, noteData);
    return response.data;
  },

  deleteNote: async (id: number): Promise<void> => {
    await api.delete(`/notes/${id}/`);
  }
};

export default api;