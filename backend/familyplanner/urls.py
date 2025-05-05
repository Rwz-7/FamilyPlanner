from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from planner.views import (UserViewSet, FamilyViewSet, EventViewSet,
                          TaskViewSet, ShoppingItemViewSet, NoteViewSet, index)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'families', FamilyViewSet, basename='family')
router.register(r'events', EventViewSet, basename='event')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'shopping-items', ShoppingItemViewSet, basename='shopping-item')
router.register(r'notes', NoteViewSet, basename='note')

urlpatterns = [
    path('', index, name='index'),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls')),
]