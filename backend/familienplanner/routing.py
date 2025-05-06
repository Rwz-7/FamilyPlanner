from django.urls import path

from dashboard.consumers import DashboardConsumer
from external_services.consumers import WeatherConsumer, CalendarConsumer

websocket_urlpatterns = [
    path('ws/dashboard/<str:family_id>/', DashboardConsumer.as_asgi()),
    path('ws/weather/<str:family_id>/', WeatherConsumer.as_asgi()),
    path('ws/calendar/<str:family_id>/', CalendarConsumer.as_asgi()),
    # We'll add more consumers as we develop them
    # path('ws/tasks/<str:family_id>/', TaskConsumer.as_asgi()),
]