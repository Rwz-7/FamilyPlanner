import React, { useEffect, useState } from 'react';
import { shoppingAPI } from '../api/api';
import { useFamily } from '../contexts/FamilyContext';
import BaseWidget from './BaseWidget';
import { Widget as WidgetType } from '../contexts/DashboardContext';

interface ShoppingItem {
  id: number;
  name: string;
  quantity: string | null;
  purchased: boolean;
}

interface ShoppingWidgetProps {
  widget: WidgetType;
}

const ShoppingWidget: React.FC<ShoppingWidgetProps> = ({ widget }) => {
  const { currentFamily } = useFamily();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');

  const loadItems = async () => {
    if (!currentFamily) return;

    try {
      setIsLoading(true);
      const itemsData = await shoppingAPI.getItems(currentFamily.id);
      setItems(itemsData);
    } catch (error) {
      setError('Failed to load shopping items');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [currentFamily]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFamily || !newItemName.trim()) return;

    try {
      await shoppingAPI.createItem({
        name: newItemName,
        quantity: newItemQuantity || null,
        family: currentFamily.id,
        purchased: false
      });
      setNewItemName('');
      setNewItemQuantity('');
      loadItems();
    } catch (error) {
      setError('Failed to add item');
      console.error(error);
    }
  };

  const handleTogglePurchased = async (itemId: number, purchased: boolean) => {
    try {
      await shoppingAPI.updateItem(itemId, { purchased });
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, purchased } : item
        )
      );
    } catch (error) {
      setError('Failed to update item');
      console.error(error);
    }
  };

  const unpurchasedItems = items.filter(item => !item.purchased);
  const purchasedItems = items.filter(item => item.purchased);

  return (
    <BaseWidget widget={widget}>
      <div className="space-y-4">
        <form onSubmit={handleAddItem} className="space-y-2">
          <div className="flex space-x-2">
            <input
              type="text"
              className="input py-1 text-sm flex-grow"
              placeholder="Item name..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
            />
            <input
              type="text"
              className="input py-1 text-sm w-24"
              placeholder="Qty"
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary py-1 w-full text-sm">Add to List</button>
        </form>

        {isLoading ? (
          <div className="text-center py-4">Loading shopping list...</div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : (
          <div className="space-y-4">
            {unpurchasedItems.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Shopping List</h3>
                <ul className="space-y-2">
                  {unpurchasedItems.map(item => (
                    <li key={item.id} className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={item.purchased}
                        onChange={() => handleTogglePurchased(item.id, true)}
                      />
                      <span className="flex-grow">{item.name}</span>
                      {item.quantity && (
                        <span className="text-sm text-gray-500">{item.quantity}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {purchasedItems.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Purchased</h3>
                <ul className="space-y-2">
                  {purchasedItems.map(item => (
                    <li key={item.id} className="flex items-center text-gray-500">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={item.purchased}
                        onChange={() => handleTogglePurchased(item.id, false)}
                      />
                      <span className="flex-grow line-through">{item.name}</span>
                      {item.quantity && (
                        <span className="text-sm text-gray-400 line-through">{item.quantity}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {items.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                Your shopping list is empty. Add items above.
              </div>
            )}
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

export default ShoppingWidget;