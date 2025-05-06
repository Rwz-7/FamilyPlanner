// Basic widget interface
export interface Widget {
    id: string;
    type: string;
    title: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }

  // Calendar specific widget interface
  export interface CalendarWidget extends Widget {
    type: 'calendar';
    data: {
      events?: Array<{
        id: string;
        title: string;
        start: string;
        end: string;
      }>;
      selectedDate?: string;
      viewType?: 'month' | 'week' | 'day';
    };
  }

  // Weather specific widget interface
  export interface WeatherWidget extends Widget {
    type: 'weather';
    data: {
      location: string;
      temperature?: number;
      condition?: string;
      unit?: 'C' | 'F';
    };
  }

  // Notes specific widget interface
  export interface NotesWidget extends Widget {
    type: 'notes';
    data: {
      content: string;
      color?: string;
    };
  }

  // Union type for all widget types
  export type WidgetType = CalendarWidget | WeatherWidget | NotesWidget;
