from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Family, Event, Task, Note, ShoppingItem
from .serializers import (
    FamilySerializer, EventSerializer, TaskSerializer,
    NoteSerializer, ShoppingItemSerializer, UserSerializer
)

def index(request):
    """Simple view to check if the backend is running"""
    return render(request, 'planner/index.html', {
        'title': 'Familien Planner'
    })

class FamilyViewSet(viewsets.ModelViewSet):
    """API endpoint for families"""
    queryset = Family.objects.all()
    serializer_class = FamilySerializer
    
    def get_queryset(self):
        """Filter families to those the user is a member of"""
        user = self.request.user
        if user.is_staff:
            return Family.objects.all()
        return user.families.all()
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Add a member to a family"""
        family = self.get_object()
        user_id = request.data.get('user_id')
        
        try:
            user = User.objects.get(id=user_id)
            family.members.add(user)
            return Response({'status': 'member added'})
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class EventViewSet(viewsets.ModelViewSet):
    """API endpoint for events"""
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    
    def get_queryset(self):
        """Filter events to those belonging to the user's families"""
        user = self.request.user
        if user.is_staff:
            return Event.objects.all()
        return Event.objects.filter(family__in=user.families.all())
    
    def perform_create(self, serializer):
        """Set the created_by field to the current user"""
        serializer.save(created_by=self.request.user)


class TaskViewSet(viewsets.ModelViewSet):
    """API endpoint for tasks"""
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    
    def get_queryset(self):
        """Filter tasks to those belonging to the user's families"""
        user = self.request.user
        if user.is_staff:
            return Task.objects.all()
        return Task.objects.filter(family__in=user.families.all())
    
    def perform_create(self, serializer):
        """Set the created_by field to the current user"""
        serializer.save(created_by=self.request.user)


class NoteViewSet(viewsets.ModelViewSet):
    """API endpoint for notes"""
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    
    def get_queryset(self):
        """Filter notes to those belonging to the user's families"""
        user = self.request.user
        if user.is_staff:
            return Note.objects.all()
        return Note.objects.filter(family__in=user.families.all())
    
    def perform_create(self, serializer):
        """Set the created_by field to the current user"""
        serializer.save(created_by=self.request.user)


class ShoppingItemViewSet(viewsets.ModelViewSet):
    """API endpoint for shopping items"""
    queryset = ShoppingItem.objects.all()
    serializer_class = ShoppingItemSerializer
    
    def get_queryset(self):
        """Filter shopping items to those belonging to the user's families"""
        user = self.request.user
        if user.is_staff:
            return ShoppingItem.objects.all()
        return ShoppingItem.objects.filter(family__in=user.families.all())
    
    def perform_create(self, serializer):
        """Set the created_by field to the current user"""
        serializer.save(created_by=self.request.user)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for users (read-only)"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    @action(detail=False)
    def me(self, request):
        """Get the current user"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)