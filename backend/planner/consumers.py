import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Event, Task, Family
from .serializers import EventSerializer, TaskSerializer

class EventConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "events",
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "events",
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'create_event':
            # Hier würde die Event-Erstellungslogik stehen
            pass
        elif action == 'update_event':
            # Hier würde die Event-Aktualisierungslogik stehen
            pass
        elif action == 'delete_event':
            # Hier würde die Event-Löschlogik stehen
            pass

    async def event_message(self, event):
        await self.send(text_data=json.dumps(event['content']))

class TaskConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "tasks",
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "tasks",
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'create_task':
            # Hier würde die Task-Erstellungslogik stehen
            pass
        elif action == 'update_task':
            # Hier würde die Task-Aktualisierungslogik stehen
            pass
        elif action == 'delete_task':
            # Hier würde die Task-Löschlogik stehen
            pass

    async def task_message(self, event):
        await self.send(text_data=json.dumps(event['content']))