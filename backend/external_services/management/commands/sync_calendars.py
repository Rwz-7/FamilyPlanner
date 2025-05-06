import time
import logging
from django.core.management.base import BaseCommand
from django.utils import timezone
from external_services.models import CalDavSettings
from external_services.services import CalDavService
from planner.models import Family

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Syncs calendar events from external calendar services'

    def add_arguments(self, parser):
        parser.add_argument(
            '--family',
            type=int,
            help='Sync calendars for a specific family ID',
        )
        parser.add_argument(
            '--continuous',
            action='store_true',
            help='Run continuously with periodic syncs',
        )

    def handle(self, *args, **options):
        family_id = options.get('family')
        continuous = options.get('continuous', False)
        
        if continuous:
            self.stdout.write(self.style.SUCCESS('Starting continuous calendar sync'))
            try:
                while True:
                    self.sync_calendars(family_id)
                    
                    # Get the shortest sync frequency from settings
                    min_frequency = self.get_min_sync_frequency()
                    
                    self.stdout.write(f'Waiting {min_frequency} minutes until next sync...')
                    time.sleep(min_frequency * 60)
            except KeyboardInterrupt:
                self.stdout.write(self.style.SUCCESS('Calendar sync service stopped'))
        else:
            self.sync_calendars(family_id)
            self.stdout.write(self.style.SUCCESS('Calendar sync completed'))
    
    def sync_calendars(self, family_id=None):
        """Sync calendars for all families or a specific family"""
        start_time = timezone.now()
        self.stdout.write(f'Starting calendar sync at {start_time.strftime("%Y-%m-%d %H:%M:%S")}')
        
        if family_id:
            # Sync for specific family
            try:
                family = Family.objects.get(id=family_id)
                self.sync_family_calendars(family)
            except Family.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Family with ID {family_id} not found'))
        else:
            # Sync for all families
            for settings in CalDavSettings.objects.all():
                self.sync_family_calendars(settings.family)
        
        end_time = timezone.now()
        duration = (end_time - start_time).total_seconds()
        self.stdout.write(f'Calendar sync completed in {duration:.2f} seconds')
    
    def sync_family_calendars(self, family):
        """Sync calendars for a specific family"""
        self.stdout.write(f'Syncing calendars for family: {family.name}')
        
        try:
            # Check for Apple Calendar settings
            settings = CalDavSettings.objects.filter(family=family, provider='apple').first()
            if settings:
                self.stdout.write(f'  Found Apple Calendar settings for {family.name}')
                success = CalDavService.sync_apple_calendars(family.id)
                if success:
                    self.stdout.write(self.style.SUCCESS(f'  Successfully synced Apple Calendar for {family.name}'))
                else:
                    self.stdout.write(self.style.ERROR(f'  Failed to sync Apple Calendar for {family.name}'))
            else:
                self.stdout.write(f'  No Apple Calendar settings found for {family.name}')
            
            # Add support for other calendar providers here
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'  Error syncing calendars for {family.name}: {e}'))
    
    def get_min_sync_frequency(self):
        """Get the minimum sync frequency from all calendar settings"""
        try:
            min_freq = CalDavSettings.objects.all().order_by('sync_frequency').first()
            if min_freq:
                return max(5, min_freq.sync_frequency)  # At least 5 minutes
            return 15  # Default to 15 minutes
        except Exception:
            return 15  # Default to 15 minutes