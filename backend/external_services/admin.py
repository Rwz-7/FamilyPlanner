from django.contrib import admin
from .models import WeatherSettings, CalDavSettings, CalDavCalendar

class CalDavCalendarInline(admin.TabularInline):
    model = CalDavCalendar
    extra = 0

@admin.register(WeatherSettings)
class WeatherSettingsAdmin(admin.ModelAdmin):
    list_display = ('family', 'location', 'enabled', 'last_update')
    list_filter = ('enabled',)
    search_fields = ('family__name', 'location')
    readonly_fields = ('last_update', 'last_weather_data')

@admin.register(CalDavSettings)
class CalDavSettingsAdmin(admin.ModelAdmin):
    list_display = ('family', 'server_url', 'username', 'enabled', 'last_sync')
    list_filter = ('enabled',)
    search_fields = ('family__name', 'server_url', 'username')
    readonly_fields = ('last_sync', 'available_calendars')
    inlines = [CalDavCalendarInline]

@admin.register(CalDavCalendar)
class CalDavCalendarAdmin(admin.ModelAdmin):
    list_display = ('calendar_name', 'caldav_settings', 'enabled')
    list_filter = ('enabled', 'caldav_settings__family')
    search_fields = ('calendar_name', 'caldav_settings__family__name')