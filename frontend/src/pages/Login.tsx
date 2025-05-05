import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Box, Typography, TextField, Button, Alert, Paper, Tabs, Tab } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Validierungsschema für Login
const loginSchema = z.object({
  username: z.string().min(1, 'Benutzername ist erforderlich'),
  password: z.string().min(1, 'Passwort ist erforderlich'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Validierungsschema für Registrierung
const registerSchema = z.object({
  username: z.string().min(3, 'Benutzername muss mindestens 3 Zeichen lang sein'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
  confirmPassword: z.string().min(1, 'Passwort-Bestätigung ist erforderlich'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const Login = () => {
  const { login, register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Login Form
  const { control: loginControl, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors } } = 
    useForm<LoginFormData>({
      resolver: zodResolver(loginSchema),
      defaultValues: {
        username: '',
        password: ''
      }
    });

  // Register Form
  const { control: registerControl, handleSubmit: handleRegisterSubmit, formState: { errors: registerErrors } } = 
    useForm<RegisterFormData>({
      resolver: zodResolver(registerSchema),
      defaultValues: {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      }
    });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
  };

  const onLogin = async (data: LoginFormData) => {
    try {
      await login(data.username, data.password);
      navigate('/');
    } catch (err) {
      setError('Login fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.');
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    try {
      await registerUser(data.username, data.email, data.password);
      navigate('/');
    } catch (err) {
      setError('Registrierung fehlgeschlagen. Bitte versuchen Sie es mit anderen Daten.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Familienplaner
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary">
          Organisieren Sie Ihren Familienalltag einfach und effizient
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 3 }}>
          <Tab label="Anmelden" />
          <Tab label="Registrieren" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {tabValue === 0 && (
          <Box component="form" onSubmit={handleLoginSubmit(onLogin)} noValidate>
            <Controller
              name="username"
              control={loginControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Benutzername"
                  autoComplete="username"
                  autoFocus
                  error={!!loginErrors.username}
                  helperText={loginErrors.username?.message}
                />
              )}
            />
            <Controller
              name="password"
              control={loginControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  id="password"
                  label="Passwort"
                  type="password"
                  autoComplete="current-password"
                  error={!!loginErrors.password}
                  helperText={loginErrors.password?.message}
                />
              )}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Anmelden
            </Button>
          </Box>
        )}

        {tabValue === 1 && (
          <Box component="form" onSubmit={handleRegisterSubmit(onRegister)} noValidate>
            <Controller
              name="username"
              control={registerControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  id="register-username"
                  label="Benutzername"
                  autoComplete="username"
                  autoFocus
                  error={!!registerErrors.username}
                  helperText={registerErrors.username?.message}
                />
              )}
            />
            <Controller
              name="email"
              control={registerControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  id="register-email"
                  label="E-Mail-Adresse"
                  autoComplete="email"
                  error={!!registerErrors.email}
                  helperText={registerErrors.email?.message}
                />
              )}
            />
            <Controller
              name="password"
              control={registerControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  id="register-password"
                  label="Passwort"
                  type="password"
                  error={!!registerErrors.password}
                  helperText={registerErrors.password?.message}
                />
              )}
            />
            <Controller
              name="confirmPassword"
              control={registerControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  id="register-confirm-password"
                  label="Passwort bestätigen"
                  type="password"
                  error={!!registerErrors.confirmPassword}
                  helperText={registerErrors.confirmPassword?.message}
                />
              )}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Registrieren
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Login;