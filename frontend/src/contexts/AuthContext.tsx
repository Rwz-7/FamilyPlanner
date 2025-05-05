import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, authService, userService } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Beim Laden der App prüfen, ob der Benutzer bereits angemeldet ist
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await userService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        // Benutzer ist nicht angemeldet - das ist okay
        console.log('Benutzer nicht angemeldet');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const user = await authService.login(username, password);
      setUser(user);
    } catch (err) {
      setError('Login fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const user = await authService.register(username, email, password);
      setUser(user);
    } catch (err) {
      setError('Registrierung fehlgeschlagen. Bitte versuchen Sie es mit anderen Daten.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      setError('Logout fehlgeschlagen.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};