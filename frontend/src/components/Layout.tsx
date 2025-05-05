import { ReactNode } from 'react';
import { Box, AppBar, Toolbar, Typography, Button, Container, CircularProgress, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFamily } from '../contexts/FamilyContext';
import { useState } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard'; // Neues Icon
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TaskIcon from '@mui/icons-material/Task';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import NoteIcon from '@mui/icons-material/Note';
import SettingsIcon from '@mui/icons-material/Settings';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  loading?: boolean;
}

const Layout = ({ children, title = 'Familienplaner', loading = false }: LayoutProps) => {
  const { user, logout } = useAuth();
  const { currentFamily } = useFamily();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout fehlgeschlagen', error);
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' }, // Neues Dashboard-Element
    { text: 'Kalender', icon: <CalendarMonthIcon />, path: '/calendar' }, // Pfad geändert
    { text: 'Aufgaben', icon: <TaskIcon />, path: '/tasks' },
    { text: 'Einkaufsliste', icon: <ShoppingCartIcon />, path: '/shopping' },
    { text: 'Notizen', icon: <NoteIcon />, path: '/notes' },
    { text: 'Einstellungen', icon: <SettingsIcon />, path: '/settings' },
  ];

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          {user && (
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={toggleDrawer}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
            {currentFamily && ` - ${currentFamily.name}`}
          </Typography>
          {user && (
            <>
              <Typography variant="body1" sx={{ mr: 2 }}>
                {user.username}
              </Typography>
              <Button color="inherit" onClick={handleLogout}>
                Abmelden
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      {user && (
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={toggleDrawer}
        >
          <Box
            sx={{ width: 250 }}
            role="presentation"
            onClick={toggleDrawer}
          >
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
              <FamilyRestroomIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Familienplaner</Typography>
            </Box>
            <Divider />
            <List>
              {menuItems.map((item) => (
                <ListItem
                  key={item.text}
                  onClick={() => navigate(item.path)}
                  selected={location.pathname === item.path}
                  sx={{ cursor: 'pointer' }} // Statt button-Attribut
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>
      )}

      <Container
        component="main"
        maxWidth="lg"
        sx={{
          flexGrow: 1,
          py: 3,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          children
        )}
      </Container>

      <Box
        component="footer"
        sx={{
          py: 2,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) => theme.palette.grey[200]
        }}
      >
        <Typography variant="body2" color="text.secondary" align="center">
          © {new Date().getFullYear()} Familienplaner
        </Typography>
      </Box>
    </Box>
  );
};

export default Layout;