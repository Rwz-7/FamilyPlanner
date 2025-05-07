import React, { createContext, useState, useEffect, useContext } from 'react';
import { familyAPI } from '../api/api';
import { useAuth } from './AuthContext';

interface FamilyMember {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Family {
  id: number;
  name: string;
  members: FamilyMember[];
  created_at: string;
}

interface FamilyContextType {
  families: Family[];
  currentFamily: Family | null;
  isLoading: boolean;
  error: string | null;
  setCurrentFamily: (family: Family) => void;
  refreshFamilies: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType>({
  families: [],
  currentFamily: null,
  isLoading: false,
  error: null,
  setCurrentFamily: () => {},
  refreshFamilies: async () => {},
});

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [families, setFamilies] = useState<Family[]>([]);
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshFamilies = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      const familiesData = await familyAPI.getFamilies();
      setFamilies(familiesData);

      // Set current family to the first one if none is selected
      if (!currentFamily && familiesData.length > 0) {
        setCurrentFamily(familiesData[0]);
      }
    } catch (error) {
      setError('Failed to load families');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load families when user changes
  useEffect(() => {
    if (user) {
      refreshFamilies();
    } else {
      setFamilies([]);
      setCurrentFamily(null);
    }
  }, [user]);

  return (
    <FamilyContext.Provider
      value={{
        families,
        currentFamily,
        isLoading,
        error,
        setCurrentFamily,
        refreshFamilies
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
};

export const useFamily = () => useContext(FamilyContext);