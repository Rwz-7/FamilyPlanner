import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useFamily } from '../contexts/FamilyContext';
import { Task, taskService } from '../services/api';
import AddIcon from '@mui/icons-material/Add';

const Tasks = () => {
  const { currentFamily } = useFamily();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentFamily) {
      loadTasks();
    }
  }, [currentFamily]);

  const loadTasks = async () => {
    if (!currentFamily) return;
    
    setLoading(true);
    try {
      const loadedTasks = await taskService.getTasks(currentFamily.id);
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Fehler beim Laden der Aufgaben:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Aufgaben" loading={loading}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Aufgaben</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
        >
          Neue Aufgabe
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        {tasks.length === 0 ? (
          <Typography>Keine Aufgaben vorhanden</Typography>
        ) : (
          <Typography>Hier werden die Aufgaben angezeigt...</Typography>
          // Hier würde die eigentliche Aufgabenliste kommen
        )}
      </Paper>
    </Layout>
  );
};

export default Tasks;