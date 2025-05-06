from rest_framework import serializers
from .models import Dashboard, Widget, WidgetLayout, WidgetPosition
from planner.serializers import FamilySerializer

class WidgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Widget
        fields = [
            'id', 'title', 'widget_type', 'dashboard', 
            'x_position', 'y_position', 'width', 'height', 
            'config', 'created_at', 'updated_at'
        ]
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Add any widget-specific data based on widget_type
        return representation


class WidgetPositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WidgetPosition
        fields = [
            'id', 'widget', 'layout', 'x_position', 
            'y_position', 'width', 'height'
        ]


class WidgetLayoutSerializer(serializers.ModelSerializer):
    widget_positions = WidgetPositionSerializer(many=True, read_only=True)
    
    class Meta:
        model = WidgetLayout
        fields = [
            'id', 'name', 'family', 'is_active', 
            'widget_positions', 'created_at', 'updated_at'
        ]


class DashboardSerializer(serializers.ModelSerializer):
    widgets = WidgetSerializer(many=True, read_only=True)
    family = FamilySerializer(read_only=True)
    
    class Meta:
        model = Dashboard
        fields = [
            'id', 'name', 'family', 'is_default', 
            'widgets', 'created_at', 'updated_at'
        ]