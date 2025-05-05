from django.db import models
from django.conf import settings
from planner.models import Family

class WeatherSettings(models.Model):
    """Einstellungen für den Wetterdienst pro Familie"""
    family = models.OneToOneField(Family, on_delete=models.CASCADE, related_name='weather_settings')
    api_key = models.CharField(max_length=255, blank=True, null=True, help_text="API-Schlüssel für den Wetterdienst")
    location = models.CharField(max_length=255, default="Dornbirn", help_text="Standardort für Wetterabfragen")
    enabled = models.BooleanField(default=True, help_text="Wetterdienst aktivieren/deaktivieren")
    update_interval = models.IntegerField(default=10, help_text="Aktualisierungsintervall in Minuten")

    # Speichern der letzten Wetterdaten als JSON
    last_weather_data = models.JSONField(blank=True, null=True)
    last_update = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = "Wetter-Einstellung"
        verbose_name_plural = "Wetter-Einstellungen"

    def __str__(self):
        return f"Wetter-Einstellungen für {self.family.name}"

class CalDavSettings(models.Model):
    """Einstellungen für CalDAV-Integration pro Familie"""
    family = models.OneToOneField(Family, on_delete=models.CASCADE, related_name='caldav_settings')
    server_url = models.URLField(help_text="URL des CalDAV-Servers")
    username = models.CharField(max_length=255)
    password = models.CharField(max_length=255)
    enabled = models.BooleanField(default=True, help_text="CalDAV-Integration aktivieren/deaktivieren")
    sync_interval = models.IntegerField(default=30, help_text="Synchronisationsintervall in Minuten")
    last_sync = models.DateTimeField(blank=True, null=True)

    # Speichern der verfügbaren Kalender
    available_calendars = models.JSONField(blank=True, null=True)

    class Meta:
        verbose_name = "CalDAV-Einstellung"
        verbose_name_plural = "CalDAV-Einstellungen"

    def __str__(self):
        return f"CalDAV-Einstellungen für {self.family.name}"

class CalDavCalendar(models.Model):
    """Konfiguration für einzelne CalDAV-Kalender"""
    caldav_settings = models.ForeignKey(CalDavSettings, on_delete=models.CASCADE, related_name='calendars')
    calendar_url = models.URLField()
    calendar_name = models.CharField(max_length=255)
    color = models.CharField(max_length=7, default="#3788d8", help_text="Farbe des Kalenders in HEX-Format")
    enabled = models.BooleanField(default=True)

    class Meta:
        verbose_name = "CalDAV-Kalender"
        verbose_name_plural = "CalDAV-Kalender"

    def __str__(self):
        return f"{self.calendar_name} ({self.caldav_settings.family.name})"