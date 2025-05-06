from django.db import models
from django.contrib.auth.models import User
from core.models import TimeStampedModel
from planner.models import Family

class Dashboard(TimeStampedModel):
    """
    Dashboard configuration for a family.
    """
    name = models.CharField(max_length=100, default="Default Dashboard")
    family = models.ForeignKey(Family, on_delete=models.CASCADE, related_name='dashboards')
    is_default = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.name} - {self.family.name}"
    
    class Meta:
        unique_together = ('family', 'is_default')


class Widget(TimeStampedModel):
    """
    Widget for a dashboard.
    """
    WIDGET_TYPES = [
        ('weather', 'Weather'),
        ('calendar', 'Calendar'),
        ('notes', 'Notes'),
        ('shopping', 'Shopping List'),
        ('tasks', 'Tasks'),
        ('clock', 'Clock'),
        ('photos', 'Photos'),
    ]
    
    title = models.CharField(max_length=100)
    widget_type = models.CharField(max_length=20, choices=WIDGET_TYPES)
    dashboard = models.ForeignKey(Dashboard, on_delete=models.CASCADE, related_name='widgets')
    x_position = models.IntegerField(default=0)
    y_position = models.IntegerField(default=0)
    width = models.IntegerField(default=2)
    height = models.IntegerField(default=2)
    config = models.JSONField(default=dict, blank=True)
    
    def __str__(self):
        return f"{self.title} ({self.get_widget_type_display()})"
    
    def to_dict(self):
        """
        Convert widget to dictionary for frontend use.
        """
        return {
            'id': self.id,
            'title': self.title,
            'type': self.widget_type,
            'x': self.x_position,
            'y': self.y_position,
            'width': self.width,
            'height': self.height,
            'config': self.config,
        }


class WidgetLayout(TimeStampedModel):
    """
    Saved layout configuration for widgets.
    """
    name = models.CharField(max_length=100)
    family = models.ForeignKey(Family, on_delete=models.CASCADE, related_name='layouts')
    is_active = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.name} - {self.family.name}"
    
    class Meta:
        unique_together = ('name', 'family')


class WidgetPosition(TimeStampedModel):
    """
    Position information for a widget in a specific layout.
    """
    widget = models.ForeignKey(Widget, on_delete=models.CASCADE, related_name='positions')
    layout = models.ForeignKey(WidgetLayout, on_delete=models.CASCADE, related_name='widget_positions')
    x_position = models.IntegerField()
    y_position = models.IntegerField()
    width = models.IntegerField()
    height = models.IntegerField()
    
    class Meta:
        unique_together = ('widget', 'layout')