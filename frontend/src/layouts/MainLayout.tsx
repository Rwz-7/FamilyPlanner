import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFamily } from '../contexts/FamilyContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { families, currentFamily, setCurrentFamily } = useFamily();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const familyId = parseInt(e.target.value);
    const selectedFamily = families.find(f => f.id === familyId);
    if (selectedFamily) {
      setCurrentFamily(selectedFamily);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-600 text-white">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">Familien Planner</Link>

          {user && (
            <div className="flex items-center space-x-4">
              {families.length > 0 && (
                <select
                  className="bg-blue-700 text-white rounded px-2 py-1"
                  value={currentFamily?.id || ''}
                  onChange={handleFamilyChange}
                >
                  {families.map(family => (
                    <option key={family.id} value={family.id}>
                      {family.name}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex items-center">
                <span className="mr-2">{user.first_name || user.username}</span>
                <button
                  onClick={handleLogout}
                  className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="bg-gray-100 border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© {new Date().getFullYear()} Familien Planner</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;