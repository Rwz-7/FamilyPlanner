import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/de';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Box, Paper, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Event, eventService } from '../services/api';
import { useFamily } from '../contexts/FamilyContext';
import Layout from '../components/Layout';
import AddIcon from '@mui/icons-material/Add';

// Lokalisierung für den Kalender
moment.locale('de');
const localizer = momentLocalizer(moment);

// Validierungsschema für Events
const eventSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich'),
  description: z.string().optional(),
  start_time: z.string().min(1, 'Startzeit ist erforderlich'),
  end_time: z.string().min(1, 'Endzeit ist erforderlich'),
  location: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  family: z.number().min(1, 'Familie ist erforderlich'),
});

type EventFormData = z.infer<typeof eventSchema>;

const CalendarPage = () => {
  const { currentFamily } = useFamily();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      location: '',
      priority: 'medium',
      family: currentFamily?.id || 0,
    }
  });

  useEffect(() => {
    if (currentFamily) {
      loadEvents();
    }
  }, [currentFamily]);

  const loadEvents = async () => {
    if (!currentFamily) return;
    
    setLoading(true);
    try {
      const loadedEvents = await eventService.getEvents(currentFamily.id);
      setEvents(loadedEvents);
    } catch (error) {
      console.error('Fehler beim Laden der Events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (event?: Event) => {
    if (event) {
      setSelectedEvent(event);
      reset({
        title: event.title,
        description: event.description || '',
        start_time: moment(event.start_time).format('YYYY-MM-DDTHH:mm'),
        end_time: moment(event.end_time).format('YYYY-MM-DDTHH:mm'),
        location: event.location || '',
        priority: event.priority,
        family: event.family,
      });
    } else {
      setSelectedEvent(null);
      reset({
        title: '',
        description: '',
        start_time: moment().format('YYYY-MM-DDTHH:mm'),
        end_time: moment().add(1, 'hour').format('YYYY-MM-DDTHH:mm'),
        location: '',
        priority: 'medium',
        family: currentFamily?.id || 0,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const onSubmit = async (data: EventFormData) => {
    try {
      if (selectedEvent) {
        await eventService.updateEvent(selectedEvent.id, data);
      } else {
        await eventService.createEvent(data);
      }
      handleCloseDialog();
      loadEvents();
    } catch (error) {
      console.error('Fehler beim Speichern des Events:', error);
    }
  };

  const handleEventSelect = (event: Event) => {
    handleOpenDialog(event);
  };

  // Formatiere die Events für den Kalender
  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: new Date(event.start_time),
    end: new Date(event.end_time),
    resource: event
  }));

  return (
    <Layout title="Kalender" loading={loading}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Kalender</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Neuer Termin
        </Button>
      </Box>

      <Paper sx={{ p: 2, height: 'calc(100vh - 200px)' }}>
        <BigCalendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          onSelectEvent={(event) => handleEventSelect(event.resource)}
          messages={{
            next: "Weiter",
            previous: "Zurück",
            today: "Heute",
            month: "Monat",
            week: "Woche",
            day: "Tag",
            agenda: "Agenda",
            date: "Datum",
            time: "Zeit",
            event: "Termin",
            noEventsInRange: "Keine Termine in diesem Zeitraum"
          }}
        />
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedEvent ? 'Termin bearbeiten' : 'Neuer Termin'}</DialogTitle>
        <DialogContent>
          <Box component="form" noValidate sx={{ mt: 1 }}>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  id="title"
                  label="Titel"
                  autoFocus
                  error={!!errors.title}
                  helperText={errors.title?.message}
                />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  fullWidth
                  id="description"
                  label="Beschreibung"
                  multiline
                  rows={4}
                />
              )}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Controller
                name="start_time"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    required
                    fullWidth
                    id="start_time"
                    label="Startzeit"
                    type="datetime-local"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    error={!!errors.start_time}
                    helperText={errors.start_time?.message}
                  />
                )}
              />
              <Controller
                name="end_time"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    required
                    fullWidth
                    id="end_time"
                    label="Endzeit"
                    type="datetime-local"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    error={!!errors.end_time}
                    helperText={errors.end_time?.message}
                  />
                )}
              />
            </Box>
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  fullWidth
                  id="location"
                  label="Ort"
                />
              )}
            />
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth margin="normal">
                  <InputLabel id="priority-label">Priorität</InputLabel>
                  <Select
                    {...field}
                    labelId="priority-label"
                    id="priority"
                    label="Priorität"
                  >
                    <MenuItem value="low">Niedrig</MenuItem>
                    <MenuItem value="medium">Mittel</MenuItem>
                    <MenuItem value="high">Hoch</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
            <Controller
              name="family"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth margin="normal" error={!!errors.family}>
                  <InputLabel id="family-label">Familie</InputLabel>
                  <Select
                    {...field}
                    labelId="family-label"
                    id="family"
                    label="Familie"
                    disabled={true} // Da wir immer die aktuelle Familie verwenden
                  >
                    {currentFamily && (
                      <MenuItem value={currentFamily.id}>{currentFamily.name}</MenuItem>
                    )}
                  </Select>
                  {errors.family && <FormHelperText>{errors.family.message}</FormHelperText>}
                </FormControl>
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
          <Button onClick={handleSubmit(onSubmit)} variant="contained">Speichern</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default CalendarPage;