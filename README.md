# Familien Planner

A family dashboard application designed to run on a Raspberry Pi 5 with a touchscreen display.

## Overview

Familien Planner is a dashboard application that displays widgets like Weather, Calendar, Notes, Shopping List, Photos, Clock, and more. Users can place and move widgets around, change their size, and save layouts. The application is designed to run on a Raspberry Pi 5 with a touchscreen.

## Features

- **Real-time Updates**: All widgets update automatically using WebSockets
- **Customizable Dashboard**: Move, resize, and arrange widgets
- **Multiple Widgets**: Weather, Calendar, Notes, Shopping List, Photos, Clock, etc.
- **Family Management**: Support for multiple family members
- **Layout Persistence**: Save and load dashboard layouts
- **Admin Interface**: Configure everything through Django Admin

## Technical Stack

### Backend
- Django 5.0+
- Django Channels for WebSockets
- Django REST Framework for APIs
- SQLite database (for simplicity on Raspberry Pi)

### Frontend (to be implemented)
- React with Vite
- TypeScript
- React Grid Layout for widget positioning

## Project Structure

```
familienplanner/
├── backend/                # Django backend
│   ├── core/               # Core functionality
│   ├── dashboard/          # Dashboard and widget management
│   ├── external_services/  # External API integrations (weather, calendar)
│   ├── familienplanner/    # Django project settings
│   ├── planner/            # Family planning features
│   └── manage.py           # Django management script
├── frontend/               # React frontend (to be implemented)
└── README.md               # This file
```

## Getting Started

### Prerequisites

- Python 3.9+
- Redis (for Channels)
- Node.js and npm (for frontend)

### Backend Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd familienplanner
   ```

2. Create a virtual environment and install dependencies:
   ```
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Run migrations:
   ```
   python manage.py migrate
   ```

4. Create a superuser:
   ```
   python manage.py createsuperuser
   ```

5. Start the development server:
   ```
   python manage.py runserver
   ```

6. Access the admin interface at http://localhost:8000/admin/

### Widget Updates

To keep widgets updated with the latest data, you can run the widget update command:

```
python manage.py update_widgets
```

For continuous updates:

```
python manage.py update_widgets --continuous --interval 60
```

## Raspberry Pi Deployment

Instructions for deploying on a Raspberry Pi 5 will be added as the project progresses.

## License

[MIT License](LICENSE)