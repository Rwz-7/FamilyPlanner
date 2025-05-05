import { useState } from 'react';
import Layout from '../components/Layout';
import { Box, Typography, Paper, TextField, Button, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useFamily } from '../contexts/FamilyContext';
import { User, userService, familyService } from '../services/api';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const Settings = () => {
  const { currentFamily, families, createFamily, refreshFamilies } = useFamily();
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [openDialog, setOpenDialog] = useState(false);

  const handleCreateFamily = async () => {
    if (!newFamilyName) return;
    
    try {
      await createFamily(newFamilyName);
      setNewFamilyName('');
    } catch (error) {
      console.error('Fehler beim Erstellen der Familie:', error);
    }
  };

  const handleOpenDialog = async () => {
    try {
      const allUsers = await userService.getAllUsers();
      setUsers(allUsers);
      setOpenDialog(true);
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleAddMember = async (userId: number) => {
    if (!currentFamily) return;
    
    try {
      await familyService.addMember(currentFamily.id, userId);
      await refreshFamilies();
      handleCloseDialog();
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Mitglieds:', error);
    }
  };

  return (
    <Layout title="Einstellungen">
      <Typography variant="h5" gutterBottom>Einstellungen</Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Neue Familie erstellen</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Familienname"
            value={newFamilyName}
            onChange={(e) => setNewFamilyName(e.target.value)}
            fullWidth
          />
          <Button 
            variant="contained" 
            onClick={handleCreateFamily}
          >
            Erstellen
          </Button>
        </Box>
      </Paper>

      {currentFamily && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Familienmitglieder</Typography>
          <List>
            {currentFamily.members.map((member) => (
              <ListItem key={member.id}>
                <ListItemText
                  primary={member.username}
                  secondary={member.email}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" aria-label="delete">
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          <Button 
            variant="outlined" 
            startIcon={<PersonAddIcon />}
            onClick={handleOpenDialog}
            sx={{ mt: 2 }}
          >
            Mitglied hinzufügen
          </Button>
        </Paper>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Mitglied hinzufügen</DialogTitle>
        <DialogContent>
          <List>
            {users.map((user) => (
              <ListItem 
                button 
                key={user.id}
                onClick={() => handleAddMember(user.id)}
              >
                <ListItemText
                  primary={user.username}
                  secondary={user.email}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Abbrechen</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Settings;