import time
from django.core.management.base import BaseCommand
from django.utils import timezone
from dashboard.models import Widget
from dashboard.services import (
    WeatherWidgetService, CalendarWidgetService,
    TasksWidgetService, ShoppingWidgetService
)

class Command(BaseCommand):
    help = 'Updates all widgets with the latest data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--continuous',
            action='store_true',
            help='Run continuously with periodic updates',
        )
        parser.add_argument(
            '--interval',
            type=int,
            default=60,
            help='Update interval in seconds (default: 60)',
        )

    def handle(self, *args, **options):
        continuous = options['continuous']
        interval = options['interval']
        
        if continuous:
            self.stdout.write(self.style.SUCCESS(f'Starting continuous widget updates every {interval} seconds'))
            try:
                while True:
                    start_time = time.time()
                    self.update_widgets()
                    elapsed_time = time.time() - start_time
                    
                    # Sleep for the remaining time in the interval
                    sleep_time = max(0, interval - elapsed_time)
                    if sleep_time > 0:
                        time.sleep(sleep_time)
            except KeyboardInterrupt:
                self.stdout.write(self.style.SUCCESS('Widget update service stopped'))
        else:
            self.update_widgets()
            self.stdout.write(self.style.SUCCESS('Widget update completed'))
    
    def update_widgets(self):
        """Update all widgets with the latest data"""
        self.stdout.write(f'Updating widgets at {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}')
        
        # Update weather widgets
        weather_widgets = Widget.objects.filter(widget_type='weather')
        for widget in weather_widgets:
            try:
                WeatherWidgetService.update_weather_data(widget.id)
                self.stdout.write(f'  Updated weather widget {widget.id}')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  Error updating weather widget {widget.id}: {e}'))
        
        # Update calendar widgets
        calendar_widgets = Widget.objects.filter(widget_type='calendar')
        for widget in calendar_widgets:
            try:
                CalendarWidgetService.update_calendar_events(widget.id)
                self.stdout.write(f'  Updated calendar widget {widget.id}')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  Error updating calendar widget {widget.id}: {e}'))
        
        # Update tasks widgets
        tasks_widgets = Widget.objects.filter(widget_type='tasks')
        for widget in tasks_widgets:
            try:
                TasksWidgetService.update_tasks(widget.id)
                self.stdout.write(f'  Updated tasks widget {widget.id}')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  Error updating tasks widget {widget.id}: {e}'))
        
        # Update shopping widgets
        shopping_widgets = Widget.objects.filter(widget_type='shopping')
        for widget in shopping_widgets:
            try:
                ShoppingWidgetService.update_shopping_items(widget.id)
                self.stdout.write(f'  Updated shopping widget {widget.id}')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  Error updating shopping widget {widget.id}: {e}'))