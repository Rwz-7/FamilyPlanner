// src/types.ts
export interface Widget {
    id: number;
    title: string;
    widget_type: string;
    x_position: number;
    y_position: number;
    width: number;
    height: number;
    config: any;
  }

  export interface Dashboard {
    id: number;
    name: string;
    widgets: Widget[];
    family: any;
    is_default: boolean;
  }