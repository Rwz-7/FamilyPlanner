import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Family, familyService } from '../services/api';
import { useAuth } from './AuthContext';

interface FamilyContextType {
  families: Family[];
  currentFamily: Family | null;
  loading: boolean;
  error: string | null;
  setCurrentFamily: (family: Family) => void;
  createFamily: (name: string) => Promise<Family>;
  addMember: (familyId: number, userId: number) => Promise<void>;
  refreshFamilies: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [families, setFamilies] = useState<Family[]>([]);
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Familien laden, wenn der Benutzer angemeldet ist
  useEffect(() => {
    if (user) {
      loadFamilies();
    } else {
      setFamilies([]);
      setCurrentFamily(null);
      setLoading(false);
    }
  }, [user]);

  const loadFamilies = async () => {
    setLoading(true);
    setError(null);
    try {
      const loadedFamilies = await familyService.getFamilies();
      setFamilies(loadedFamilies);
      
      // Erste Familie als aktuelle Familie setzen, wenn keine ausgewählt ist
      if (loadedFamilies.length > 0 && !currentFamily) {
        setCurrentFamily(loadedFamilies[0]);
      }
    } catch (err) {
      setError('Fehler beim Laden der Familien.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createFamily = async (name: string): Promise<Family> => {
    try {
      const newFamily = await familyService.createFamily(name);
      setFamilies([...families, newFamily]);
      return newFamily;
    } catch (err) {
      setError('Fehler beim Erstellen der Familie.');
      throw err;
    }
  };

  const addMember = async (familyId: number, userId: number): Promise<void> => {
    try {
      await familyService.addMember(familyId, userId);
      // Familien neu laden, um die aktualisierten Mitglieder zu erhalten
      await loadFamilies();
    } catch (err) {
      setError('Fehler beim Hinzufügen des Familienmitglieds.');
      throw err;
    }
  };

  const refreshFamilies = async (): Promise<void> => {
    await loadFamilies();
  };

  return (
    <FamilyContext.Provider 
      value={{ 
        families, 
        currentFamily, 
        loading, 
        error, 
        setCurrentFamily, 
        createFamily, 
        addMember,
        refreshFamilies
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
};

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
};