import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import planner.routing
import external_services.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'familyplanner.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            planner.routing.websocket_urlpatterns +
            external_services.routing.websocket_urlpatterns
        )
    ),
})