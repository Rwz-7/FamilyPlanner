import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .services import CalDavService
from .models import CalDavSettings, CalDavCalendar, WeatherSettings
from planner.models import Family, Event

class CalendarConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.family_id = self.scope['url_route']['kwargs']['family_id']
        self.calendar_group_name = f'calendar_{self.family_id}'
        self.sync_task = None

        # Join calendar group
        await self.channel_layer.group_add(
            self.calendar_group_name,
            self.channel_name
        )

        await self.accept()

        # Send initial calendar data
        calendar_data = await self.get_calendar_data()
        if calendar_data:
            await self.send(text_data=json.dumps({
                'type': 'calendar_data',
                'data': calendar_data
            }))

    async def disconnect(self, close_code):
        # Cancel any running sync task
        if self.sync_task:
            self.sync_task.cancel()
            try:
                await self.sync_task
            except asyncio.CancelledError:
                pass

        # Leave calendar group
        await self.channel_layer.group_discard(
            self.calendar_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json.get('action')

        if action == 'get_calendars':
            # Send list of available calendars
            calendars = await self.get_available_calendars()
            await self.send(text_data=json.dumps({
                'type': 'available_calendars',
                'data': calendars
            }))

        elif action == 'get_events':
            # Get events for a specific time range
            start_date = text_data_json.get('start_date')
            end_date = text_data_json.get('end_date')
            calendar_id = text_data_json.get('calendar_id')  # Optional

            events = await self.get_events(start_date, end_date, calendar_id)
            await self.send(text_data=json.dumps({
                'type': 'calendar_events',
                'data': events
            }))

        elif action == 'sync_now':
            # Trigger immediate sync
            calendar_id = text_data_json.get('calendar_id')  # Optional

            # Cancel any existing sync task
            if self.sync_task:
                self.sync_task.cancel()
                try:
                    await self.sync_task
                except asyncio.CancelledError:
                    pass

            # Start new sync task
            self.sync_task = asyncio.create_task(self.sync_calendars(calendar_id))

            await self.send(text_data=json.dumps({
                'type': 'sync_started',
                'data': {
                    'message': 'Calendar sync started',
                    'timestamp': timezone.now().isoformat()
                }
            }))

    async def calendar_update(self, event):
        """
        Handle calendar update event from channel layer
        """
        await self.send(text_data=json.dumps({
            'type': 'calendar_update',
            'data': event['data']
        }))

    async def sync_calendars(self, calendar_id=None):
        """
        Sync calendars and notify about updates
        """
        try:
            if calendar_id:
                # Sync specific calendar
                result = await database_sync_to_async(self.sync_specific_calendar)(calendar_id)
                success = result['success']
                message = result['message']
            else:
                # Sync all calendars for this family
                success = await database_sync_to_async(CalDavService.sync_apple_calendars)(self.family_id)
                message = 'Calendar sync completed' if success else 'Calendar sync failed'

            # Get updated calendar data
            calendar_data = await self.get_calendar_data()

            # Send result to client
            await self.send(text_data=json.dumps({
                'type': 'sync_completed',
                'data': {
                    'success': success,
                    'message': message,
                    'timestamp': timezone.now().isoformat(),
                    'calendar_data': calendar_data
                }
            }))

        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'sync_error',
                'data': {
                    'message': f'Error syncing calendars: {str(e)}',
                    'timestamp': timezone.now().isoformat()
                }
            }))

    def sync_specific_calendar(self, calendar_id):
        """
        Sync a specific calendar
        """
        try:
            calendar = CalDavCalendar.objects.get(id=calendar_id)
            success = CalDavService.sync_calendar_events(calendar)
            return {
                'success': success,
                'message': f'Sync completed for calendar: {calendar.display_name}'
            }
        except CalDavCalendar.DoesNotExist:
            return {
                'success': False,
                'message': f'Calendar not found with ID: {calendar_id}'
            }
        except Exception as e:
            return {
                'success': False,
                'message': f'Error syncing calendar: {str(e)}'
            }

    @database_sync_to_async
    def get_calendar_data(self):
        """
        Get calendar configuration and status data
        """
        try:
            family = Family.objects.get(id=self.family_id)

            # Get CalDAV settings if available
            caldav_data = None
            try:
                settings = CalDavSettings.objects.get(family=family)

                # Get calendars
                calendars = []
                for calendar in settings.calendars.all():
                    calendars.append({
                        'id': calendar.id,
                        'name': calendar.display_name,
                        'color': calendar.color,
                        'is_active': calendar.is_active,
                        'last_sync': calendar.last_sync.isoformat() if calendar.last_sync else None
                    })

                caldav_data = {
                    'provider': settings.provider,
                    'username': settings.username,
                    'last_sync': settings.last_sync.isoformat() if settings.last_sync else None,
                    'sync_frequency': settings.sync_frequency,
                    'calendars': calendars
                }
            except CalDavSettings.DoesNotExist:
                pass

            return {
                'family_id': family.id,
                'family_name': family.name,
                'caldav_settings': caldav_data
            }
        except Family.DoesNotExist:
            return None

    @database_sync_to_async
    def get_available_calendars(self):
        """
        Get list of available calendars
        """
        try:
            family = Family.objects.get(id=self.family_id)
            settings = CalDavSettings.objects.get(family=family)

            # Discover calendars if none exist
            if not settings.calendars.exists():
                discovered = CalDavService.discover_calendars(settings)

                # Create calendar entries for discovered calendars
                for cal_info in discovered:
                    CalDavCalendar.objects.create(
                        settings=settings,
                        calendar_url=cal_info['url'],
                        calendar_id=cal_info['id'],
                        display_name=cal_info['name']
                    )

            # Return all calendars
            calendars = []
            for calendar in settings.calendars.all():
                calendars.append({
                    'id': calendar.id,
                    'name': calendar.display_name,
                    'color': calendar.color,
                    'is_active': calendar.is_active
                })

            return calendars
        except (Family.DoesNotExist, CalDavSettings.DoesNotExist):
            return []

    @database_sync_to_async
    def get_events(self, start_date=None, end_date=None, calendar_id=None):
        """
        Get events for a specific time range
        """
        try:
            family = Family.objects.get(id=self.family_id)

            # Parse date strings to datetime objects
            from datetime import datetime
            import pytz

            if start_date:
                start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            else:
                start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)

            if end_date:
                end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            else:
                # Default to 30 days ahead
                end = start + timezone.timedelta(days=30)

            # Build query
            query = Event.objects.filter(family=family, start_time__gte=start, start_time__lte=end)

            # Filter by calendar if specified
            if calendar_id:
                # We need to find the calendar to get its display name
                try:
                    calendar = CalDavCalendar.objects.get(id=calendar_id)
                    query = query.filter(title__contains=f"({calendar.display_name})")
                except CalDavCalendar.DoesNotExist:
                    pass

            # Get events
            events = []
            for event in query:
                events.append({
                    'id': event.id,
                    'title': event.title,
                    'description': event.description,
                    'start': event.start_time.isoformat(),
                    'end': event.end_time.isoformat(),
                    'location': event.location,
                    'priority': event.priority,
                    'external_source': event.external_source,
                    'is_recurring': event.is_recurring
                })

            return events
        except Family.DoesNotExist:
            return []


class WeatherConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.family_id = self.scope['url_route']['kwargs']['family_id']
        self.weather_group_name = f'weather_{self.family_id}'
        self.update_task = None

        # Join weather group
        await self.channel_layer.group_add(
            self.weather_group_name,
            self.channel_name
        )

        await self.accept()

        # Send initial weather data
        weather_data = await self.get_weather_data(force_update=False)
        if weather_data:
            await self.send(text_data=json.dumps({
                'type': 'weather_data',
                'data': weather_data
            }))

    async def disconnect(self, close_code):
        # Cancel any running update task
        if self.update_task:
            self.update_task.cancel()
            try:
                await self.update_task
            except asyncio.CancelledError:
                pass

        # Leave weather group
        await self.channel_layer.group_discard(
            self.weather_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json.get('action')

        if action == 'get_weather':
            # Force update if requested
            force_update = text_data_json.get('force_update', False)

            # Get weather data
            weather_data = await self.get_weather_data(force_update)
            await self.send(text_data=json.dumps({
                'type': 'weather_data',
                'data': weather_data
            }))

    async def weather_update(self, event):
        """
        Handle weather update event from channel layer
        """
        await self.send(text_data=json.dumps({
            'type': 'weather_update',
            'data': event['data']
        }))

    async def periodic_weather_update(self):
        """
        Periodically update weather data
        """
        try:
            # Get update interval (in minutes)
            interval = await self.get_update_interval()

            while True:
                # Wait for the specified interval
                await asyncio.sleep(interval * 60)

                # Get updated weather data
                weather_data = await self.get_weather_data(force_update=True)

                # Send to client
                if weather_data:
                    await self.send(text_data=json.dumps({
                        'type': 'weather_update',
                        'data': weather_data
                    }))

        except asyncio.CancelledError:
            # Task was cancelled, clean up
            pass
        except Exception as e:
            # Log error
            print(f"Error in periodic weather update: {str(e)}")

    @database_sync_to_async
    def get_update_interval(self):
        """
        Get the update interval from settings
        """
        try:
            family = Family.objects.get(id=self.family_id)
            settings = WeatherSettings.objects.get(family=family)
            return settings.update_interval
        except (Family.DoesNotExist, WeatherSettings.DoesNotExist):
            # Default to 30 minutes
            return 30

    @database_sync_to_async
    def get_weather_data(self, force_update=False):
        """
        Get weather data for the family's location
        """
        try:
            family = Family.objects.get(id=self.family_id)

            try:
                settings = WeatherSettings.objects.get(family=family)

                # For now, return placeholder data
                # In a real implementation, you would call a weather API here
                return {
                    'location': settings.location,
                    'temperature': 22,
                    'condition': 'Sunny',
                    'humidity': 65,
                    'wind_speed': 10,
                    'last_updated': timezone.now().isoformat(),
                    'forecast': [
                        {
                            'date': (timezone.now() + timezone.timedelta(days=i)).date().isoformat(),
                            'temperature': 20 + i,
                            'condition': 'Partly Cloudy' if i % 2 else 'Sunny',
                            'icon': 'partly-cloudy' if i % 2 else 'sunny'
                        } for i in range(1, 6)
                    ]
                }
            except WeatherSettings.DoesNotExist:
                # Default location if no settings
                return {
                    'location': 'Default Location',
                    'temperature': 20,
                    'condition': 'Unknown',
                    'humidity': 60,
                    'wind_speed': 5,
                    'last_updated': timezone.now().isoformat(),
                    'forecast': []
                }
        except Family.DoesNotExist:
            return None