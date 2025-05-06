import json
import requests
import datetime
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Widget
from planner.models import Event, Task, Note, ShoppingItem
from external_services.models import WeatherSettings, CalDavSettings, CalDavCalendar

class WidgetService:
    """Base service class for widget operations"""
    
    @classmethod
    def update_widget_data(cls, widget, data):
        """Update widget data and notify clients"""
        widget.config.update(data)
        widget.save()
        
        # Notify clients about the update
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'dashboard_{widget.dashboard.family.id}',
            {
                'type': 'widget_update',
                'data': {
                    'id': widget.id,
                    'type': widget.widget_type,
                    'config': widget.config
                }
            }
        )


class WeatherWidgetService(WidgetService):
    """Service for weather widget operations"""
    
    @classmethod
    def update_weather_data(cls, widget_id, location=None):
        """Update weather data for a widget"""
        try:
            widget = Widget.objects.get(id=widget_id, widget_type='weather')
            family = widget.dashboard.family
            
            try:
                settings = WeatherSettings.objects.get(family=family)
            except WeatherSettings.DoesNotExist:
                return False
            
            # Use provided location or default from widget config or settings
            location = location or widget.config.get('location') or settings.default_location
            
            # Store the location in widget config
            if 'location' not in widget.config or widget.config['location'] != location:
                widget.config['location'] = location
                widget.save()
            
            # In a real implementation, this would call the weather API
            # For now, we'll just update the timestamp
            data = {
                'lastUpdated': timezone.now().isoformat()
            }
            
            cls.update_widget_data(widget, data)
            return True
            
        except Widget.DoesNotExist:
            return False


class CalendarWidgetService(WidgetService):
    """Service for calendar widget operations"""
    
    @classmethod
    def update_calendar_events(cls, widget_id):
        """Update calendar events for a widget"""
        try:
            widget = Widget.objects.get(id=widget_id, widget_type='calendar')
            family = widget.dashboard.family
            
            # Get events for the family
            now = timezone.now()
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + datetime.timedelta(days=7)  # Get events for the next 7 days
            
            events = Event.objects.filter(
                family=family,
                start_time__gte=start_date,
                start_time__lte=end_date
            ).order_by('start_time')
            
            # Format events for the widget
            formatted_events = []
            for event in events:
                formatted_events.append({
                    'id': event.id,
                    'title': event.title,
                    'start': event.start_time.isoformat(),
                    'end': event.end_time.isoformat(),
                    'location': event.location,
                    'priority': event.priority
                })
            
            # Update widget data
            data = {
                'events': formatted_events,
                'lastUpdated': timezone.now().isoformat()
            }
            
            cls.update_widget_data(widget, data)
            return True
            
        except Widget.DoesNotExist:
            return False


class TasksWidgetService(WidgetService):
    """Service for tasks widget operations"""
    
    @classmethod
    def update_tasks(cls, widget_id):
        """Update tasks for a widget"""
        try:
            widget = Widget.objects.get(id=widget_id, widget_type='tasks')
            family = widget.dashboard.family
            
            # Get tasks for the family
            tasks = Task.objects.filter(
                family=family,
                status__in=['pending', 'in_progress']
            ).order_by('due_date')
            
            # Format tasks for the widget
            formatted_tasks = []
            for task in tasks:
                formatted_tasks.append({
                    'id': task.id,
                    'title': task.title,
                    'status': task.status,
                    'due_date': task.due_date.isoformat() if task.due_date else None,
                    'assigned_to': [
                        {'id': user.id, 'name': f"{user.first_name} {user.last_name}".strip() or user.username}
                        for user in task.assigned_to.all()
                    ]
                })
            
            # Update widget data
            data = {
                'tasks': formatted_tasks,
                'lastUpdated': timezone.now().isoformat()
            }
            
            cls.update_widget_data(widget, data)
            return True
            
        except Widget.DoesNotExist:
            return False


class NotesWidgetService(WidgetService):
    """Service for notes widget operations"""
    
    @classmethod
    def update_note_content(cls, widget_id, content, color=None):
        """Update note content for a widget"""
        try:
            widget = Widget.objects.get(id=widget_id, widget_type='notes')
            
            # Update widget data
            data = {
                'content': content,
                'lastUpdated': timezone.now().isoformat()
            }
            
            if color:
                data['color'] = color
            
            cls.update_widget_data(widget, data)
            return True
            
        except Widget.DoesNotExist:
            return False


class ShoppingWidgetService(WidgetService):
    """Service for shopping list widget operations"""
    
    @classmethod
    def update_shopping_items(cls, widget_id):
        """Update shopping items for a widget"""
        try:
            widget = Widget.objects.get(id=widget_id, widget_type='shopping')
            family = widget.dashboard.family
            
            # Get shopping items for the family
            items = ShoppingItem.objects.filter(
                family=family,
                purchased=False
            ).order_by('created_at')
            
            # Format items for the widget
            formatted_items = []
            for item in items:
                formatted_items.append({
                    'id': item.id,
                    'name': item.name,
                    'quantity': item.quantity,
                    'purchased': item.purchased
                })
            
            # Update widget data
            data = {
                'items': formatted_items,
                'lastUpdated': timezone.now().isoformat()
            }
            
            cls.update_widget_data(widget, data)
            return True
            
        except Widget.DoesNotExist:
            return False