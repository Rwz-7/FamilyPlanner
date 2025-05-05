import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FamilyProvider } from './contexts/FamilyContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard'; // Neue Dashboard-Komponente
import Calendar from './pages/Calendar';
import Tasks from './pages/Tasks';
import ShoppingList from './pages/ShoppingList';
import Notes from './pages/Notes';
import Settings from './pages/Settings';

// Erstelle einen QueryClient
const queryClient = new QueryClient();

// Erstelle ein Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#4a6fa5',
    },
    secondary: {
      main: '#166088',
    },
  },
});

// PrivateRoute-Komponente für geschützte Routen
const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Laden...</div>;
  }

  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <PrivateRoute>
                  <FamilyProvider>
                    <Dashboard /> {/* Verwenden Sie das Dashboard als Startseite */}
                  </FamilyProvider>
                </PrivateRoute>
              } />
              <Route path="/calendar" element={
                <PrivateRoute>
                  <FamilyProvider>
                    <Calendar />
                  </FamilyProvider>
                </PrivateRoute>
              } />
              <Route path="/tasks" element={
                <PrivateRoute>
                  <FamilyProvider>
                    <Tasks />
                  </FamilyProvider>
                </PrivateRoute>
              } />
              <Route path="/shopping" element={
                <PrivateRoute>
                  <FamilyProvider>
                    <ShoppingList />
                  </FamilyProvider>
                </PrivateRoute>
              } />
              <Route path="/notes" element={
                <PrivateRoute>
                  <FamilyProvider>
                    <Notes />
                  </FamilyProvider>
                </PrivateRoute>
              } />
              <Route path="/settings" element={
                <PrivateRoute>
                  <FamilyProvider>
                    <Settings />
                  </FamilyProvider>
                </PrivateRoute>
              } />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;