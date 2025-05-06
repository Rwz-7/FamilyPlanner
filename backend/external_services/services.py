import caldav
import datetime
import logging
import requests
from urllib.parse import urlparse
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import CalDavSettings, CalDavCalendar
from planner.models import Event, Family

logger = logging.getLogger(__name__)

class CalDavService:
    """Service for CalDAV calendar operations"""
    
    @classmethod
    def get_client(cls, settings):
        """
        Create a CalDAV client based on settings
        """
        try:
            # Create the client with the base URL
            client = caldav.DAVClient(
                url=settings.base_url,
                username=settings.username,
                password=settings.password
            )
            return client
        except Exception as e:
            logger.error(f"Error creating CalDAV client: {e}")
            return None
    
    @classmethod
    def discover_calendars(cls, settings):
        """
        Discover available calendars for the given settings
        """
        client = cls.get_client(settings)
        if not client:
            return []
        
        try:
            # Get the principal
            principal = client.principal()
            
            # Get all calendars
            calendars = principal.calendars()
            
            discovered = []
            for calendar in calendars:
                # Extract calendar information
                cal_info = {
                    'url': str(calendar.url),  # Convert to string to ensure it's serializable
                    'id': calendar.id,
                    'name': getattr(calendar, 'name', calendar.id),
                }
                discovered.append(cal_info)
            
            return discovered
        except Exception as e:
            logger.error(f"Error discovering calendars: {e}")
            return []
    
    @classmethod
    def sync_apple_calendars(cls, family_id):
        """
        Sync Apple calendars for a family
        """
        try:
            family = Family.objects.get(id=family_id)
            settings = CalDavSettings.objects.get(family=family, provider='apple')
            
            # If no calendars are configured, try to discover them
            if not settings.calendars.exists():
                discovered = cls.discover_calendars(settings)
                
                # Create calendar entries for discovered calendars
                for cal_info in discovered:
                    CalDavCalendar.objects.create(
                        settings=settings,
                        calendar_url=cal_info['url'],
                        calendar_id=cal_info['id'],
                        display_name=cal_info['name']
                    )
            
            # Sync each active calendar
            for calendar_config in settings.calendars.filter(is_active=True):
                cls.sync_calendar_events(calendar_config)
            
            # Update last sync time
            settings.last_sync = timezone.now()
            settings.save()
            
            return True
        except (Family.DoesNotExist, CalDavSettings.DoesNotExist) as e:
            logger.error(f"Error finding CalDAV settings: {e}")
            return False
        except Exception as e:
            logger.error(f"Error syncing Apple calendars: {e}")
            return False
    
    @classmethod
    def sync_calendar_events(cls, calendar_config):
        """
        Sync events from a specific calendar
        """
        client = cls.get_client(calendar_config.settings)
        if not client:
            return False
        
        try:
            # For Apple Calendar, we need to handle the redirected URL
            if calendar_config.settings.provider == 'apple':
                # Use the full calendar URL directly instead of trying to join it
                if calendar_config.calendar_url:
                    # Create a new client specifically for this calendar URL
                    calendar_client = caldav.DAVClient(
                        url=calendar_config.calendar_url,
                        username=calendar_config.settings.username,
                        password=calendar_config.settings.password
                    )
                    calendar = caldav.Calendar(client=calendar_client, url=calendar_config.calendar_url)
                else:
                    # If we don't have a direct URL, try the normal approach
                    principal = client.principal()
                    calendars = principal.calendars()
                    calendar = next((cal for cal in calendars if cal.id == calendar_config.calendar_id), None)
            else:
                # For non-Apple calendars, use the standard approach
                principal = client.principal()
                if calendar_config.calendar_url:
                    calendar = caldav.Calendar(client=client, url=calendar_config.calendar_url)
                else:
                    calendars = principal.calendars()
                    calendar = next((cal for cal in calendars if cal.id == calendar_config.calendar_id), None)
            
            if not calendar:
                logger.error(f"Calendar not found: {calendar_config.display_name}")
                return False
            
            # Define time range for events (2 weeks back to 3 months ahead)
            start_date = datetime.datetime.now() - datetime.timedelta(days=14)
            end_date = datetime.datetime.now() + datetime.timedelta(days=90)
            
            # Get events in the time range
            events = calendar.date_search(
                start=start_date,
                end=end_date,
                expand=True  # Expand recurring events
            )
            
            # Process each event
            for caldav_event in events:
                # Parse the event data
                ical_data = caldav_event.data
                event_data = cls._parse_ical_event(ical_data)
                
                if not event_data:
                    continue
                
                # Create or update event in our database
                cls._create_or_update_event(
                    event_data=event_data,
                    caldav_uid=event_data.get('uid', ''),
                    family=calendar_config.settings.family,
                    calendar_name=calendar_config.display_name
                )
            
            # Update last sync time
            calendar_config.last_sync = timezone.now()
            calendar_config.save()
            
            # Notify clients about the calendar update
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'dashboard_{calendar_config.settings.family.id}',
                {
                    'type': 'calendar_update',
                    'data': {
                        'calendar_id': calendar_config.id,
                        'calendar_name': calendar_config.display_name,
                        'last_sync': calendar_config.last_sync.isoformat() if calendar_config.last_sync else None
                    }
                }
            )
            
            return True
        except Exception as e:
            logger.error(f"Error syncing calendar events: {e}")
            return False
    
    @classmethod
    def _parse_ical_event(cls, ical_data):
        """
        Parse iCalendar event data
        """
        try:
            from icalendar import Calendar
            
            cal = Calendar.from_ical(ical_data)
            
            for component in cal.walk():
                if component.name == "VEVENT":
                    # Extract event information
                    summary = str(component.get('summary', 'No Title'))
                    description = str(component.get('description', ''))
                    location = str(component.get('location', ''))
                    uid = str(component.get('uid', ''))
                    
                    # Get start and end times
                    dtstart = component.get('dtstart').dt
                    dtend = component.get('dtend').dt if component.get('dtend') else dtstart
                    
                    # Convert to datetime if it's a date
                    if isinstance(dtstart, datetime.date) and not isinstance(dtstart, datetime.datetime):
                        dtstart = datetime.datetime.combine(dtstart, datetime.time.min)
                    if isinstance(dtend, datetime.date) and not isinstance(dtend, datetime.datetime):
                        dtend = datetime.datetime.combine(dtend, datetime.time.max)
                    
                    # Make timezone-aware if naive
                    if dtstart.tzinfo is None:
                        dtstart = timezone.make_aware(dtstart)
                    if dtend.tzinfo is None:
                        dtend = timezone.make_aware(dtend)
                    
                    return {
                        'title': summary,
                        'description': description,
                        'location': location,
                        'start_time': dtstart,
                        'end_time': dtend,
                        'uid': uid
                    }
            
            return None
        except Exception as e:
            logger.error(f"Error parsing iCalendar event: {e}")
            return None
    
    @classmethod
    def _create_or_update_event(cls, event_data, caldav_uid, family, calendar_name):
        """
        Create or update an event in our database
        """
        try:
            # Try to find an existing event with this UID
            existing_event = Event.objects.filter(
                family=family,
                external_id=caldav_uid
            ).first()
            
            if existing_event:
                # Update existing event
                existing_event.title = event_data['title']
                existing_event.description = event_data['description']
                existing_event.location = event_data['location']
                existing_event.start_time = event_data['start_time']
                existing_event.end_time = event_data['end_time']
                existing_event.save()
                return existing_event
            else:
                # Create new event
                # Get the first family member as the creator
                created_by = family.members.first()
                if not created_by:
                    logger.error(f"No members in family {family.name}, cannot create event")
                    return None
                
                event = Event.objects.create(
                    title=f"{event_data['title']} ({calendar_name})",
                    description=event_data['description'],
                    location=event_data['location'],
                    start_time=event_data['start_time'],
                    end_time=event_data['end_time'],
                    family=family,
                    created_by=created_by,
                    external_id=caldav_uid,
                    external_source='apple_calendar'
                )
                return event
        except Exception as e:
            logger.error(f"Error creating/updating event: {e}")
            return None