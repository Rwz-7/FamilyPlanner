import { useState, useEffect, useCallback, useRef } from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent, CardHeader, Divider, List, ListItem, ListItemText, ListItemIcon, Chip, IconButton, CircularProgress } from '@mui/material';
import { useFamily } from '../contexts/FamilyContext';
import { Event, Task, ShoppingItem, Note, eventService, taskService, shoppingService, noteService } from '../services/api';
import Layout from '../components/Layout';
import { format, isToday, isTomorrow, addDays, parseISO, isAfter, isBefore } from 'date-fns';
import { de } from 'date-fns/locale';
import EventIcon from '@mui/icons-material/Event';
import TaskIcon from '@mui/icons-material/Task';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import NoteIcon from '@mui/icons-material/Note';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import UmbrellaIcon from '@mui/icons-material/Umbrella';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useNavigate } from 'react-router-dom';
import weatherService, { WeatherData } from '../services/weatherService';

// Wetter-Interface
interface Weather {
  temperature: number;
  description: string;
  icon: string;
  location: string;
  forecast: {
    date: string;
    temperature: number;
    description: string;
    icon: string;
  }[];
}

const Dashboard = () => {
  const { currentFamily } = useFamily();
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Timestamp der letzten Wetteraktualisierung
  const [lastWeatherUpdate, setLastWeatherUpdate] = useState<number>(0);

  // Ref für die Unsubscribe-Funktion des WebSocket
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Dashboard-Daten laden - als useCallback definieren, damit wir es in useEffect verwenden können
  const loadDashboardData = useCallback(async () => {
    if (!currentFamily) return;

    setLoading(true);
    try {
      // Lade alle Daten parallel
      const [eventsData, tasksData, shoppingData, notesData] = await Promise.all([
        eventService.getEvents(currentFamily.id),
        taskService.getTasks(currentFamily.id),
        shoppingService.getItems(currentFamily.id),
        noteService.getNotes(currentFamily.id)
      ]);

      setEvents(eventsData);
      setTasks(tasksData);
      setShoppingItems(shoppingData);
      setNotes(notesData);
    } catch (error) {
      console.error('Fehler beim Laden der Dashboard-Daten:', error);
    } finally {
      setLoading(false);
    }
  }, [currentFamily]);

  // Manuelles Laden der Wetterdaten (jetzt nur noch als Fallback oder für initiale Daten)
  const loadWeatherData = useCallback(async () => {
    if (!currentFamily) return;

    try {
      console.log('Fordere Wetter-Update über WebSocket an...');
      // Manuelles Update über WebSocket anfordern
      weatherService.requestUpdate();

      // Fallback: Falls WebSocket nicht funktioniert, verwenden wir die alte Methode
      if (!weather && lastWeatherUpdate === 0) {
        console.log('Fallback: Lade Wetterdaten über getForecast...');
        const weatherData = await weatherService.getForecast();
        if (weatherData) {
          setWeather(weatherData);
          setLastWeatherUpdate(Date.now());
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Wetterdaten:', error);
    }
  }, [currentFamily, weather, lastWeatherUpdate]);

  // Verbindung zum WebSocket herstellen, wenn sich die Familie ändert
  useEffect(() => {
    if (currentFamily) {
      console.log('Stelle WebSocket-Verbindung für Wetter her...');

      // WebSocket-Verbindung herstellen
      weatherService.connect(currentFamily.id);

      // Auf Wetter-Updates abonnieren
      const unsubscribe = weatherService.subscribe((weatherData) => {
        console.log('Wetter-Update über WebSocket erhalten', weatherData);
        setWeather(weatherData);
        setLastWeatherUpdate(Date.now());
      });

      // Unsubscribe-Funktion speichern
      unsubscribeRef.current = unsubscribe;

      return () => {
        // Beim Aufräumen abmelden und Verbindung trennen
        console.log('Trenne WebSocket-Verbindung für Wetter...');
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
        weatherService.disconnect();
      };
    }
  }, [currentFamily]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (currentFamily && isMounted) {
        await loadDashboardData();
        await loadWeatherData(); // Jetzt hauptsächlich als Fallback
      }
    };

    fetchData();

    // Wir brauchen keine regelmäßigen API-Aufrufe mehr für Wetter,
    // da wir Updates über WebSocket bekommen
    const intervalId = setInterval(() => {
      if (currentFamily && isMounted) {
        loadDashboardData();
        // Kein loadWeatherData hier, da wir WebSockets verwenden
      }
    }, 10 * 60 * 1000); // Alle 10 Minuten andere Daten aktualisieren

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [currentFamily, loadDashboardData, loadWeatherData]);

  // Filtere Ereignisse für heute und morgen
  const upcomingEvents = events
    .filter(event => {
      const eventDate = parseISO(event.start_time);
      return isAfter(eventDate, new Date()) &&
             isBefore(eventDate, addDays(new Date(), 7));
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 5);

  // Filtere unerledigte Aufgaben
  const pendingTasks = tasks
    .filter(task => task.status !== 'completed')
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    })
    .slice(0, 5);

  // Filtere nicht gekaufte Einkaufsartikel
  const unpurchasedItems = shoppingItems
    .filter(item => !item.purchased)
    .slice(0, 5);

  // Neueste Notizen
  const recentNotes = notes
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 3);

  // Wetter-Icon basierend auf Beschreibung
  const getWeatherIcon = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('sonnig') || desc.includes('klar')) {
      return <WbSunnyIcon sx={{ color: '#FFD700' }} />;
    } else if (desc.includes('regen') || desc.includes('schauer')) {
      return <UmbrellaIcon sx={{ color: '#4682B4' }} />;
    } else if (desc.includes('schnee')) {
      return <AcUnitIcon sx={{ color: '#ADD8E6' }} />;
    } else {
      return <CloudIcon sx={{ color: '#A9A9A9' }} />;
    }
  };

  // Formatiere das Datum für Ereignisse
  const formatEventDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return `Heute, ${format(date, 'HH:mm')}`;
    } else if (isTomorrow(date)) {
      return `Morgen, ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'EEE, d. MMM, HH:mm', { locale: de });
    }
  };

  // Prioritätsfarbe für Ereignisse
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  // Handler für manuelles Wetter-Update
  const handleWeatherRefresh = () => {
    weatherService.requestUpdate();
  };

  return (
    <Layout title="Dashboard" loading={loading}>
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={3}>
          {/* Wetter-Widget */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardHeader
                title="Wetter"
                action={
                  <IconButton aria-label="aktualisieren" onClick={handleWeatherRefresh}>
                    <MoreVertIcon />
                  </IconButton>
                }
              />
              <CardContent>
                {weather ? (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ mr: 2, fontSize: '3rem' }}>
                        {getWeatherIcon(weather.description)}
                      </Box>
                      <Box>
                        <Typography variant="h4">{weather.temperature}°C</Typography>
                        <Typography variant="subtitle1">{weather.description}</Typography>
                        <Typography variant="body2">{weather.location}</Typography>
                      </Box>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      {weather.forecast.map((day, index) => (
                        <Box key={index} sx={{ textAlign: 'center' }}>
                          <Typography variant="body2">
                            {format(parseISO(day.date), 'EEE', { locale: de })}
                          </Typography>
                          {getWeatherIcon(day.description)}
                          <Typography variant="body2">{day.temperature}°C</Typography>
                        </Box>
                      ))}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'right' }}>
                      Aktualisiert: {format(new Date(lastWeatherUpdate), 'HH:mm')}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Anstehende Termine */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardHeader
                title="Anstehende Termine"
                action={
                  <IconButton aria-label="mehr" onClick={() => navigate('/calendar')}>
                    <MoreVertIcon />
                  </IconButton>
                }
              />
              <CardContent>
                {upcomingEvents.length > 0 ? (
                  <List>
                    {upcomingEvents.map((event) => (
                      <ListItem key={event.id} sx={{ px: 0 }}>
                        <ListItemIcon>
                          <EventIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={event.title}
                          secondary={formatEventDate(event.start_time)}
                        />
                        <Chip
                          label={event.priority}
                          size="small"
                          color={getPriorityColor(event.priority) as any}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography>Keine anstehenden Termine</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Aufgaben */}
          <Grid item xs={12} sm={6}>
            <Card elevation={3}>
              <CardHeader
                title="Aufgaben"
                action={
                  <IconButton aria-label="mehr" onClick={() => navigate('/tasks')}>
                    <MoreVertIcon />
                  </IconButton>
                }
              />
              <CardContent>
                {pendingTasks.length > 0 ? (
                  <List>
                    {pendingTasks.map((task) => (
                      <ListItem key={task.id} sx={{ px: 0 }}>
                        <ListItemIcon>
                          {task.status === 'completed' ? <CheckCircleIcon color="success" /> : <TaskIcon />}
                        </ListItemIcon>
                        <ListItemText
                          primary={task.title}
                          secondary={task.due_date ? format(parseISO(task.due_date), 'P', { locale: de }) : 'Kein Fälligkeitsdatum'}
                        />
                        <Chip
                          label={task.status === 'completed' ? 'Erledigt' : task.status === 'in_progress' ? 'In Bearbeitung' : 'Offen'}
                          size="small"
                          color={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'info' : 'default'}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography>Keine ausstehenden Aufgaben</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Einkaufsliste */}
          <Grid item xs={12} sm={6}>
            <Card elevation={3}>
              <CardHeader
                title="Einkaufsliste"
                action={
                  <IconButton aria-label="mehr" onClick={() => navigate('/shopping')}>
                    <MoreVertIcon />
                  </IconButton>
                }
              />
              <CardContent>
                {unpurchasedItems.length > 0 ? (
                  <List>
                    {unpurchasedItems.map((item) => (
                      <ListItem key={item.id} sx={{ px: 0 }}>
                        <ListItemIcon>
                          {item.purchased ? <CheckCircleIcon color="success" /> : <RadioButtonUncheckedIcon />}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.name}
                          secondary={item.quantity}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography>Keine Einkäufe ausstehend</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Notizen */}
          <Grid item xs={12}>
            <Card elevation={3}>
              <CardHeader
                title="Notizen"
                action={
                  <IconButton aria-label="mehr" onClick={() => navigate('/notes')}>
                    <MoreVertIcon />
                  </IconButton>
                }
              />
              <CardContent>
                {recentNotes.length > 0 ? (
                  <Grid container spacing={2}>
                    {recentNotes.map((note) => (
                      <Grid item xs={12} md={4} key={note.id}>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 2,
                            height: '100%',
                            backgroundColor: '#fffde7',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          <Typography variant="h6" gutterBottom>{note.title}</Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              mb: 1,
                              flexGrow: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {note.content}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(parseISO(note.updated_at), 'PPp', { locale: de })}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography>Keine Notizen vorhanden</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
};

export default Dashboard;