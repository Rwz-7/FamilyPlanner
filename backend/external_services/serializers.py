from rest_framework import serializers
from .models import WeatherSettings, CalDavSettings, CalDavCalendar, PhotoSource
from planner.serializers import FamilySerializer

class WeatherSettingsSerializer(serializers.ModelSerializer):
    family = FamilySerializer(read_only=True)
    
    class Meta:
        model = WeatherSettings
        fields = [
            'id', 'family', 'api_provider', 'default_location', 
            'units', 'update_interval', 'created_at', 'updated_at'
        ]
        # Exclude api_key for security
        extra_kwargs = {
            'api_key': {'write_only': True}
        }


class CalDavCalendarSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalDavCalendar
        fields = [
            'id', 'settings', 'display_name', 'calendar_url', 
            'color', 'is_active', 'created_at', 'updated_at'
        ]


class CalDavSettingsSerializer(serializers.ModelSerializer):
    family = FamilySerializer(read_only=True)
    calendars = CalDavCalendarSerializer(many=True, read_only=True)
    
    class Meta:
        model = CalDavSettings
        fields = [
            'id', 'family', 'base_url', 'username', 
            'calendars', 'created_at', 'updated_at'
        ]
        # Exclude password for security
        extra_kwargs = {
            'password': {'write_only': True}
        }


class PhotoSourceSerializer(serializers.ModelSerializer):
    family = FamilySerializer(read_only=True)
    
    class Meta:
        model = PhotoSource
        fields = [
            'id', 'family', 'name', 'source_type', 
            'configuration', 'is_active', 'created_at', 'updated_at'
        ]