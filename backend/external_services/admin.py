from django.contrib import admin
from django.utils.html import format_html
from django.urls import path
from django.http import HttpResponseRedirect
from django.contrib import messages
from .models import WeatherSettings, CalDavSettings, CalDavCalendar, PhotoSource
from .services import CalDavService

class CalDavCalendarInline(admin.TabularInline):
    model = CalDavCalendar
    extra = 0
    fields = ('display_name', 'calendar_id', 'color', 'is_active', 'last_sync')
    readonly_fields = ('last_sync',)

@admin.register(WeatherSettings)
class WeatherSettingsAdmin(admin.ModelAdmin):
    list_display = ('family', 'api_provider', 'default_location', 'units', 'update_interval')
    list_filter = ('api_provider', 'units')
    search_fields = ('family__name', 'default_location')
    fieldsets = (
        (None, {
            'fields': ('family', 'api_provider', 'api_key')
        }),
        ('Configuration', {
            'fields': ('default_location', 'units', 'update_interval')
        }),
    )

@admin.register(CalDavSettings)
class CalDavSettingsAdmin(admin.ModelAdmin):
    list_display = ('family', 'provider', 'username', 'last_sync', 'sync_frequency', 'calendar_count')
    list_filter = ('provider',)
    search_fields = ('family__name', 'username')
    inlines = [CalDavCalendarInline]
    fieldsets = (
        (None, {
            'fields': ('family', 'provider', 'base_url')
        }),
        ('Authentication', {
            'fields': ('username', 'password'),
        }),
        ('Sync Settings', {
            'fields': ('sync_frequency', 'last_sync'),
        }),
    )
    readonly_fields = ('last_sync',)
    
    def calendar_count(self, obj):
        return obj.calendars.count()
    calendar_count.short_description = 'Calendars'
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:caldav_id>/discover/',
                self.admin_site.admin_view(self.discover_calendars),
                name='caldav-discover',
            ),
            path(
                '<int:caldav_id>/sync/',
                self.admin_site.admin_view(self.sync_calendars),
                name='caldav-sync',
            ),
        ]
        return custom_urls + urls
    
    def discover_calendars(self, request, caldav_id):
        """Admin action to discover calendars"""
        try:
            settings = CalDavSettings.objects.get(id=caldav_id)
            discovered = CalDavService.discover_calendars(settings)
            
            # Create calendar entries for discovered calendars
            count = 0
            for cal_info in discovered:
                # Check if calendar already exists
                if not CalDavCalendar.objects.filter(
                    settings=settings,
                    calendar_id=cal_info['id']
                ).exists():
                    CalDavCalendar.objects.create(
                        settings=settings,
                        calendar_url=cal_info['url'],
                        calendar_id=cal_info['id'],
                        display_name=cal_info['name']
                    )
                    count += 1
            
            if count > 0:
                messages.success(request, f'Successfully discovered {count} new calendars.')
            else:
                messages.info(request, 'No new calendars found.')
            
        except CalDavSettings.DoesNotExist:
            messages.error(request, 'Calendar settings not found.')
        except Exception as e:
            messages.error(request, f'Error discovering calendars: {e}')
        
        return HttpResponseRedirect(request.META.get('HTTP_REFERER', '/admin/external_services/caldavsettings/'))
    
    def sync_calendars(self, request, caldav_id):
        """Admin action to sync calendars"""
        try:
            settings = CalDavSettings.objects.get(id=caldav_id)
            success = CalDavService.sync_apple_calendars(settings.family.id)
            
            if success:
                messages.success(request, 'Successfully synced calendars.')
            else:
                messages.error(request, 'Failed to sync calendars.')
            
        except CalDavSettings.DoesNotExist:
            messages.error(request, 'Calendar settings not found.')
        except Exception as e:
            messages.error(request, f'Error syncing calendars: {e}')
        
        return HttpResponseRedirect(request.META.get('HTTP_REFERER', '/admin/external_services/caldavsettings/'))
    
    def change_view(self, request, object_id, form_url='', extra_context=None):
        """Add custom buttons to the change form"""
        extra_context = extra_context or {}
        
        if object_id:
            extra_context['show_sync_button'] = True
            extra_context['show_discover_button'] = True
            extra_context['caldav_id'] = object_id
        
        return super().change_view(request, object_id, form_url, extra_context)

@admin.register(CalDavCalendar)
class CalDavCalendarAdmin(admin.ModelAdmin):
    list_display = ('display_name', 'get_family', 'color_display', 'is_active', 'last_sync')
    list_filter = ('is_active', 'settings__provider')
    search_fields = ('display_name', 'settings__family__name')
    
    def get_family(self, obj):
        return obj.settings.family.name
    get_family.short_description = 'Family'
    get_family.admin_order_field = 'settings__family__name'
    
    def color_display(self, obj):
        return format_html(
            '<span style="color: {}; font-size: 16px;">●</span> {}',
            obj.color,
            obj.color
        )
    color_display.short_description = 'Color'
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                '<int:calendar_id>/sync/',
                self.admin_site.admin_view(self.sync_calendar),
                name='calendar-sync',
            ),
        ]
        return custom_urls + urls
    
    def sync_calendar(self, request, calendar_id):
        """Admin action to sync a specific calendar"""
        try:
            calendar = CalDavCalendar.objects.get(id=calendar_id)
            success = CalDavService.sync_calendar_events(calendar)
            
            if success:
                messages.success(request, f'Successfully synced calendar: {calendar.display_name}')
            else:
                messages.error(request, f'Failed to sync calendar: {calendar.display_name}')
            
        except CalDavCalendar.DoesNotExist:
            messages.error(request, 'Calendar not found.')
        except Exception as e:
            messages.error(request, f'Error syncing calendar: {e}')
        
        return HttpResponseRedirect(request.META.get('HTTP_REFERER', '/admin/external_services/caldavcalendar/'))

@admin.register(PhotoSource)
class PhotoSourceAdmin(admin.ModelAdmin):
    list_display = ('name', 'family', 'source_type', 'is_active')
    list_filter = ('source_type', 'is_active', 'family')
    search_fields = ('name',)
    fieldsets = (
        (None, {
            'fields': ('name', 'family', 'source_type', 'is_active')
        }),
        ('Configuration', {
            'fields': ('configuration',),
            'classes': ('collapse',)
        }),
    )