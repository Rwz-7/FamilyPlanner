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
from django.contrib.auth import authenticate, login
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

# planner/views.py
from django.shortcuts import render
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from .models import Family, Event
from dashboard.models import Dashboard, Widget
from external_services.models import CalDavSettings, WeatherSettings
from external_services.services import CalDavService
import datetime

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

@api_view(['POST'])
@permission_classes([AllowAny])
def api_login(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)

    if user is not None:
        login(request, user)
        # Return user data
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        })
    else:
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@login_required
def dashboard_view(request, family_id=None):
    # Get user's families
    user = request.user
    user_families = user.families.all()

    # If no family_id specified, use the first family or redirect to family creation
    if not family_id and user_families.exists():
        family = user_families.first()
    elif family_id:
        family = Family.objects.get(id=family_id)
    else:
        # Handle case with no families
        return render(request, 'planner/no_family.html')

    # Get or create dashboard for this family
    dashboard, created = Dashboard.objects.get_or_create(
        family=family,
        is_default=True,
        defaults={'name': f"{family.name}'s Dashboard"}
    )

    # Get calendar events for the next month
    today = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = today + datetime.timedelta(days=31)

    events = Event.objects.filter(
        family=family,
        start_time__gte=today,
        start_time__lte=end_date
    ).order_by('start_time')

    # Organize events by day for the calendar view
    calendar_days = {}
    current_date = today
    while current_date <= end_date:
        day_events = [e for e in events if e.start_time.date() == current_date.date()]
        calendar_days[current_date.date()] = day_events
        current_date += datetime.timedelta(days=1)

    # Get widgets
    widgets = dashboard.widgets.all()

    # Check if CalDAV is configured
    has_caldav = CalDavSettings.objects.filter(family=family).exists()

    # Check if weather is configured
    has_weather = WeatherSettings.objects.filter(family=family).exists()

    context = {
        'family': family,
        'families': user_families,
        'dashboard': dashboard,
        'today': today,
        'current_time': timezone.now(),
        'events': events,
        'calendar_days': calendar_days,
        'widgets': widgets,
        'has_caldav': has_caldav,
        'has_weather': has_weather,
    }

    return render(request, 'planner/dashboard.html', context)