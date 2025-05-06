# consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
import json

class DashboardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("WebSocket connected!")  # Add this for debugging
        await self.accept()

    async def disconnect(self, close_code):
        print(f"WebSocket disconnected with code: {close_code}")  # Add this for debugging
        pass

    async def receive(self, text_data):
        print(f"Received message: {text_data}")  # Add this for debugging
        try:
            text_data_json = json.loads(text_data)
            # Handle the message
            await self.send(text_data=json.dumps({
                'type': 'response',
                'message': 'Message received!'
            }))
        except json.JSONDecodeError:
            print("Invalid JSON received")
