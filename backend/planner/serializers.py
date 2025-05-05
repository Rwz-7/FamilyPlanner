from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Family, Event, Task, ShoppingItem, Note

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']

class FamilySerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)
    
    class Meta:
        model = Family
        fields = ['id', 'name', 'members', 'created_at']
        read_only_fields = ['id', 'created_at']

class EventSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(many=True, read_only=True)
    
    class Meta:
        model = Event
        fields = ['id', 'title', 'description', 'start_time', 'end_time', 
                 'location', 'priority', 'family', 'assigned_to', 
                 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

class TaskSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    assigned_to = UserSerializer(many=True, read_only=True)
    
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'due_date', 'status', 
                 'family', 'assigned_to', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

class ShoppingItemSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = ShoppingItem
        fields = ['id', 'name', 'quantity', 'purchased', 'family', 
                 'created_by', 'created_at']
        read_only_fields = ['id', 'created_by', 'created_at']

class NoteSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Note
        fields = ['id', 'title', 'content', 'family', 'created_by', 
                 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']