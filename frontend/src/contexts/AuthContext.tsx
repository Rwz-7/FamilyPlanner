// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../api/api';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  error: null,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Not authenticated', error);
        // For development, could set a mock user here
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    // DEVELOPMENT MODE: Mock authentication
    if (process.env.NODE_ENV === 'development') {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock successful login with any username/password
        // In a real app, you'd validate these
        if (username && password) {
          setUser({
            id: 1,
            username,
            email: `${username}@example.com`,
            first_name: 'Test',
            last_name: 'User'
          });
          return;
        } else {
          setError('Username and password are required');
          throw new Error('Invalid credentials');
        }
      } finally {
        setIsLoading(false);
      }
    }

    // PRODUCTION MODE: Real authentication (not used during development)
    try {
      await authAPI.login(username, password);
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
    } catch (error) {
      setError('Invalid credentials');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);

    // DEVELOPMENT MODE: Mock logout
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 300));
      setUser(null);
      setIsLoading(false);
      return;
    }

    // PRODUCTION MODE: Real logout
    try {
      await authAPI.logout();
      setUser(null);
    } catch (error) {
      setError('Error logging out');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);