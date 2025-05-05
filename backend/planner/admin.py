from django.contrib import admin
from .models import Family, Event, Task, ShoppingItem, Note

@admin.register(Family)
class FamilyAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at', 'get_members_count')
    search_fields = ('name',)
    filter_horizontal = ('members',)

    def get_members_count(self, obj):
        return obj.members.count()
    get_members_count.short_description = 'Anzahl Mitglieder'

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'start_time', 'end_time', 'priority', 'family', 'created_by')
    list_filter = ('priority', 'family', 'created_by')
    search_fields = ('title', 'description', 'location')
    date_hierarchy = 'start_time'
    filter_horizontal = ('assigned_to',)

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'due_date', 'family', 'created_by')
    list_filter = ('status', 'family', 'created_by')
    search_fields = ('title', 'description')
    date_hierarchy = 'due_date'
    filter_horizontal = ('assigned_to',)

@admin.register(ShoppingItem)
class ShoppingItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'quantity', 'purchased', 'family', 'created_by', 'created_at')
    list_filter = ('purchased', 'family', 'created_by')
    search_fields = ('name',)
    date_hierarchy = 'created_at'

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'family', 'created_by', 'created_at', 'updated_at')
    list_filter = ('family', 'created_by')
    search_fields = ('title', 'content')
    date_hierarchy = 'created_at'