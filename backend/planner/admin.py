from django.contrib import admin
from .models import Family, Event, Task, Note, ShoppingItem

@admin.register(Family)
class FamilyAdmin(admin.ModelAdmin):
    list_display = ('name', 'get_members_count', 'created_at')
    filter_horizontal = ('members',)
    search_fields = ('name',)
    
    def get_members_count(self, obj):
        return obj.members.count()
    get_members_count.short_description = 'Members'

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'start_time', 'end_time', 'family', 'priority', 'created_by')
    list_filter = ('family', 'priority', 'start_time')
    search_fields = ('title', 'description', 'location')
    filter_horizontal = ('assigned_to',)
    date_hierarchy = 'start_time'

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'due_date', 'status', 'family', 'created_by')
    list_filter = ('family', 'status', 'due_date')
    search_fields = ('title', 'description')
    filter_horizontal = ('assigned_to',)
    date_hierarchy = 'due_date'

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'family', 'created_by', 'created_at')
    list_filter = ('family', 'created_at')
    search_fields = ('title', 'content')

@admin.register(ShoppingItem)
class ShoppingItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'quantity', 'purchased', 'family', 'created_by')
    list_filter = ('family', 'purchased', 'created_at')
    search_fields = ('name',)