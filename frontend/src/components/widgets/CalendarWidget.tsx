import { CalendarWidget as CalendarWidgetType } from '../types';
// or if you're using relative path:
// import { CalendarWidget as CalendarWidgetType } from '../../types';

interface CalendarWidgetProps {
  widget: CalendarWidgetType;
  onUpdate?: (widget: CalendarWidgetType) => void;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ widget, onUpdate }) => {
  // Your component implementation
  return (
    <div>
      {/* Your calendar widget content */}
    </div>
  );
};

export default CalendarWidget;
