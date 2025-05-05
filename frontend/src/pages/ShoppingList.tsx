import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useFamily } from '../contexts/FamilyContext';
import { ShoppingItem, shoppingService } from '../services/api';
import AddIcon from '@mui/icons-material/Add';

const ShoppingList = () => {
  const { currentFamily } = useFamily();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentFamily) {
      loadItems();
    }
  }, [currentFamily]);

  const loadItems = async () => {
    if (!currentFamily) return;
    
    setLoading(true);
    try {
      const loadedItems = await shoppingService.getItems(currentFamily.id);
      setItems(loadedItems);
    } catch (error) {
      console.error('Fehler beim Laden der Einkaufsliste:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Einkaufsliste" loading={loading}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Einkaufsliste</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
        >
          Neuer Artikel
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        {items.length === 0 ? (
          <Typography>Keine Artikel vorhanden</Typography>
        ) : (
          <Typography>Hier werden die Einkaufsartikel angezeigt...</Typography>
          // Hier würde die eigentliche Einkaufsliste kommen
        )}
      </Paper>
    </Layout>
  );
};

export default ShoppingList;