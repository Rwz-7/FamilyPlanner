from django.db import models
from django.contrib.auth.models import User
from core.models import TimeStampedModel
from planner.models import Family

class WeatherSettings(TimeStampedModel):
    """
    Settings for weather service integration.
    """
    API_PROVIDER_CHOICES = [
        ('openweathermap', 'OpenWeatherMap'),
        ('weatherapi', 'WeatherAPI'),
        ('accuweather', 'AccuWeather'),
    ]
    
    family = models.OneToOneField(Family, on_delete=models.CASCADE, related_name='weather_settings')
    api_provider = models.CharField(max_length=50, choices=API_PROVIDER_CHOICES, default='openweathermap')
    api_key = models.CharField(max_length=255)
    default_location = models.CharField(max_length=100, default='Dornbirn')
    units = models.CharField(max_length=10, choices=[('metric', 'Celsius'), ('imperial', 'Fahrenheit')], default='metric')
    update_interval = models.IntegerField(default=30, help_text='Update interval in minutes')
    
    def __str__(self):
        return f"Weather Settings for {self.family.name}"
    
    class Meta:
        verbose_name_plural = "Weather Settings"


class CalDavSettings(TimeStampedModel):
    """
    Settings for CalDAV calendar integration.
    """
    PROVIDER_CHOICES = [
        ('apple', 'Apple Calendar'),
        ('google', 'Google Calendar'),
        ('nextcloud', 'Nextcloud'),
        ('generic', 'Generic CalDAV'),
    ]
    
    family = models.OneToOneField(Family, on_delete=models.CASCADE, related_name='caldav_settings')
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, default='apple')
    username = models.CharField(max_length=100, help_text='For Apple Calendar, use your Apple ID')
    password = models.CharField(max_length=255, help_text='For Apple Calendar, use an app-specific password')
    base_url = models.CharField(
        max_length=255, 
        default='https://caldav.icloud.com', 
        help_text='For Apple Calendar, use https://caldav.icloud.com'
    )
    sync_frequency = models.IntegerField(default=15, help_text='Sync frequency in minutes')
    last_sync = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"CalDAV Settings for {self.family.name}"
    
    class Meta:
        verbose_name_plural = "CalDAV Settings"


class CalDavCalendar(TimeStampedModel):
    """
    Individual CalDAV calendar configuration.
    """
    settings = models.ForeignKey(CalDavSettings, on_delete=models.CASCADE, related_name='calendars')
    calendar_url = models.CharField(max_length=255, blank=True)
    calendar_id = models.CharField(max_length=255, blank=True, help_text='Calendar ID or path')
    display_name = models.CharField(max_length=100)
    color = models.CharField(max_length=20, default='#3498db')
    is_active = models.BooleanField(default=True)
    last_sync = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return self.display_name
        
    class Meta:
        verbose_name_plural = "CalDAV Calendars"


class PhotoSource(TimeStampedModel):
    """
    Source configuration for photo widgets.
    """
    SOURCE_TYPE_CHOICES = [
        ('local', 'Local Directory'),
        ('google_photos', 'Google Photos'),
        ('nextcloud', 'Nextcloud'),
    ]
    
    family = models.ForeignKey(Family, on_delete=models.CASCADE, related_name='photo_sources')
    name = models.CharField(max_length=100)
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPE_CHOICES)
    configuration = models.JSONField(default=dict, help_text='Configuration details in JSON format')
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_source_type_display()})"