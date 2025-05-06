// src/components/dashboard/Dashboard.tsx
import { CalendarWidget } from '../widgets/CalendarWidget';

interface DashboardProps {
  isConnected: boolean;
  onMessage: any; // You might want to type this properly
  sendMessage: (message: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ isConnected, onMessage, sendMessage }) => {
  // Add some initial widget data
  const initialWidget = {
    id: "calendar-1",
    type: "calendar",
    title: "My Calendar",
    x: 0,
    y: 0,
    width: 2,
    height: 2,
    data: {
      events: []
    }
  };

  return (
    <div className="p-4">
      {/* Connection status indicator */}
      <div className="mb-4">
        Connection Status: {isConnected ?
          <span className="text-green-500">Connected</span> :
          <span className="text-red-500">Disconnected</span>
        }
      </div>

      {/* Widget area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CalendarWidget widget={initialWidget} />
      </div>
    </div>
  );
};
