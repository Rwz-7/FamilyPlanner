import { Dashboard } from './components/dashboard/Dashboard';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  const { isConnected, lastMessage, sendMessage } = useWebSocket('ws://localhost:8000/ws/dashboard/');

  return (
    <div className="min-h-screen bg-gray-100">
      <Dashboard
        isConnected={isConnected}
        onMessage={lastMessage}
        sendMessage={sendMessage}
      />
    </div>
  );
}

export default App;
