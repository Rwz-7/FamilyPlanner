from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers
from planner.views import FamilyViewSet, EventViewSet, TaskViewSet, NoteViewSet, ShoppingItemViewSet, UserViewSet

# Create a router for our API views
router = routers.DefaultRouter()
router.register(r'families', FamilyViewSet)
router.register(r'events', EventViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'notes', NoteViewSet)
router.register(r'shopping-items', ShoppingItemViewSet)
router.register(r'users', UserViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)