import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useFamily } from '../contexts/FamilyContext';
import { Note, noteService } from '../services/api';
import AddIcon from '@mui/icons-material/Add';

const Notes = () => {
  const { currentFamily } = useFamily();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentFamily) {
      loadNotes();
    }
  }, [currentFamily]);

  const loadNotes = async () => {
    if (!currentFamily) return;
    
    setLoading(true);
    try {
      const loadedNotes = await noteService.getNotes(currentFamily.id);
      setNotes(loadedNotes);
    } catch (error) {
      console.error('Fehler beim Laden der Notizen:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Notizen" loading={loading}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Notizen</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
        >
          Neue Notiz
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        {notes.length === 0 ? (
          <Typography>Keine Notizen vorhanden</Typography>
        ) : (
          <Typography>Hier werden die Notizen angezeigt...</Typography>
          // Hier würde die eigentliche Notizenliste kommen
        )}
      </Paper>
    </Layout>
  );
};

export default Notes;