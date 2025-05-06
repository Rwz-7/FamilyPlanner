import type { CalendarWidget as ICalendarWidget } from "../../types";

interface CalendarWidgetProps {
  widget: ICalendarWidget;
  onUpdate?: (widget: ICalendarWidget) => void;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ widget, onUpdate }) => {
  return (
    <div style={{
      border: '2px solid red',
      padding: '20px',
      backgroundColor: '#f0f0f0',
      minHeight: '200px',
      minWidth: '200px'
    }}>
      <h1 style={{ color: 'blue', fontSize: '24px' }}>Calendar Widget Test</h1>
      <p style={{ color: 'black' }}>Widget ID: {widget?.id || 'No ID'}</p>
      <p style={{ color: 'black' }}>Widget Title: {widget?.title || 'No Title'}</p>
      <button
        onClick={() => console.log('Widget props:', widget)}
        style={{
          backgroundColor: 'blue',
          color: 'white',
          padding: '10px',
          margin: '10px 0'
        }}
      >
        Log Widget Data
      </button>
    </div>
  );
};

export default CalendarWidget;
