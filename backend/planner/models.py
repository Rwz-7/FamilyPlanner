from django.db import models
from django.contrib.auth.models import User
from core.models import TimeStampedModel

class Family(TimeStampedModel):
    """
    A family group that users can belong to.
    """
    name = models.CharField(max_length=100)
    members = models.ManyToManyField(User, related_name='families')
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Families"


class Event(TimeStampedModel):
    """
    Calendar events for a family.
    """
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    EXTERNAL_SOURCE_CHOICES = [
        ('manual', 'Manual Entry'),
        ('apple_calendar', 'Apple Calendar'),
        ('google_calendar', 'Google Calendar'),
        ('caldav', 'Other CalDAV'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    location = models.CharField(max_length=200, blank=True, null=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    family = models.ForeignKey(Family, on_delete=models.CASCADE, related_name='events')
    assigned_to = models.ManyToManyField(User, related_name='assigned_events', blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_events')
    
    # Fields for external calendar integration
    external_id = models.CharField(max_length=255, blank=True, null=True, help_text='ID from external calendar system')
    external_source = models.CharField(max_length=20, choices=EXTERNAL_SOURCE_CHOICES, default='manual')
    is_recurring = models.BooleanField(default=False)
    recurrence_rule = models.CharField(max_length=255, blank=True, null=True, help_text='iCalendar RRULE string')
    last_synced = models.DateTimeField(blank=True, null=True)
    
    def __str__(self):
        return self.title
    
    class Meta:
        indexes = [
            models.Index(fields=['external_id']),
            models.Index(fields=['start_time']),
            models.Index(fields=['family', 'start_time']),
        ]


class Task(TimeStampedModel):
    """
    Tasks for a family.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    due_date = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    family = models.ForeignKey(Family, on_delete=models.CASCADE, related_name='tasks')
    assigned_to = models.ManyToManyField(User, related_name='assigned_tasks', blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')
    
    def __str__(self):
        return self.title


class Note(TimeStampedModel):
    """
    Notes for a family.
    """
    title = models.CharField(max_length=200)
    content = models.TextField()
    color = models.CharField(max_length=20, default='yellow')
    family = models.ForeignKey(Family, on_delete=models.CASCADE, related_name='notes')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_notes')
    
    def __str__(self):
        return self.title


class ShoppingItem(TimeStampedModel):
    """
    Shopping list items for a family.
    """
    name = models.CharField(max_length=200)
    quantity = models.CharField(max_length=50, blank=True, null=True)
    purchased = models.BooleanField(default=False)
    family = models.ForeignKey(Family, on_delete=models.CASCADE, related_name='shopping_items')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_shopping_items')
    
    def __str__(self):
        return self.name