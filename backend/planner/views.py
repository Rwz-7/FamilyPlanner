from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Family, Event, Task, ShoppingItem, Note
from .serializers import (UserSerializer, FamilySerializer, EventSerializer,
                         TaskSerializer, ShoppingItemSerializer, NoteSerializer)

# Einfache View für die Hauptseite
def index(request):
    return render(request, 'index.html')

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class FamilyViewSet(viewsets.ModelViewSet):
    serializer_class = FamilySerializer

    def get_queryset(self):
        return Family.objects.filter(members=self.request.user)

    def perform_create(self, serializer):
        family = serializer.save()
        family.members.add(self.request.user)

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        family = self.get_object()
        try:
            user_id = request.data.get('user_id')
            user = User.objects.get(id=user_id)
            family.members.add(user)
            return Response({'status': 'member added'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'user not found'}, status=status.HTTP_404_NOT_FOUND)

class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer

    def get_queryset(self):
        return Event.objects.filter(family__members=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer

    def get_queryset(self):
        return Task.objects.filter(family__members=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class ShoppingItemViewSet(viewsets.ModelViewSet):
    serializer_class = ShoppingItemSerializer

    def get_queryset(self):
        return ShoppingItem.objects.filter(family__members=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer

    def get_queryset(self):
        return Note.objects.filter(family__members=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)