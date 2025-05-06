from django.contrib import admin
from .models import Dashboard, Widget, WidgetLayout, WidgetPosition

class WidgetInline(admin.TabularInline):
    model = Widget
    extra = 0
    fields = ('title', 'widget_type', 'x_position', 'y_position', 'width', 'height')

@admin.register(Dashboard)
class DashboardAdmin(admin.ModelAdmin):
    list_display = ('name', 'family', 'is_default', 'created_at')
    list_filter = ('family', 'is_default')
    search_fields = ('name',)
    inlines = [WidgetInline]

class WidgetPositionInline(admin.TabularInline):
    model = WidgetPosition
    extra = 0
    fields = ('widget', 'x_position', 'y_position', 'width', 'height')

@admin.register(WidgetLayout)
class WidgetLayoutAdmin(admin.ModelAdmin):
    list_display = ('name', 'family', 'is_active', 'created_at')
    list_filter = ('family', 'is_active')
    search_fields = ('name',)
    inlines = [WidgetPositionInline]

@admin.register(Widget)
class WidgetAdmin(admin.ModelAdmin):
    list_display = ('title', 'widget_type', 'dashboard', 'x_position', 'y_position', 'width', 'height')
    list_filter = ('widget_type', 'dashboard__family')
    search_fields = ('title',)
    fieldsets = (
        (None, {
            'fields': ('title', 'widget_type', 'dashboard')
        }),
        ('Position & Size', {
            'fields': ('x_position', 'y_position', 'width', 'height')
        }),
        ('Configuration', {
            'fields': ('config',),
            'classes': ('collapse',)
        }),
    )