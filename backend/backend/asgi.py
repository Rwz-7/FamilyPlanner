# backend/backend/asgi.py
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter
from .routing import application as websocket_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Get the HTTP application
http_application = get_asgi_application()

# Update the protocol router
application = ProtocolTypeRouter({
    "http": http_application,
    "websocket": websocket_application.get('websocket'),
})
