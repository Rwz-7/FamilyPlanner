import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import Dashboard, Widget, WidgetLayout, WidgetPosition
from planner.models import Family
from .serializers import DashboardSerializer, WidgetSerializer

class DashboardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.family_id = self.scope['url_route']['kwargs']['family_id']
        self.dashboard_group_name = f'dashboard_{self.family_id}'
        
        # Join dashboard group
        await self.channel_layer.group_add(
            self.dashboard_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send initial dashboard data
        dashboard_data = await self.get_dashboard_data(self.family_id)
        if dashboard_data:
            await self.send(text_data=json.dumps({
                'type': 'dashboard_data',
                'data': dashboard_data
            }))
    
    async def disconnect(self, close_code):
        # Leave dashboard group
        await self.channel_layer.group_discard(
            self.dashboard_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json.get('action')
        
        if action == 'update_widget':
            widget_data = text_data_json.get('widget')
            await self.update_widget(widget_data)
            
        elif action == 'add_widget':
            widget_data = text_data_json.get('widget')
            await self.add_widget(widget_data)
            
        elif action == 'delete_widget':
            widget_id = text_data_json.get('widget_id')
            await self.delete_widget(widget_id)
            
        elif action == 'update_dashboard':
            dashboard_data = text_data_json.get('dashboard')
            await self.update_dashboard(dashboard_data)
            
        elif action == 'get_dashboard':
            dashboard_data = await self.get_dashboard_data(self.family_id)
            await self.send(text_data=json.dumps({
                'type': 'dashboard_data',
                'data': dashboard_data
            }))
    
    async def dashboard_update(self, event):
        """
        Handle dashboard update event from channel layer
        """
        await self.send(text_data=json.dumps({
            'type': 'dashboard_update',
            'data': event['data']
        }))
    
    async def widget_update(self, event):
        """
        Handle widget update event from channel layer
        """
        await self.send(text_data=json.dumps({
            'type': 'widget_update',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def get_dashboard_data(self, family_id):
        """
        Get dashboard data for a family
        """
        try:
            family = Family.objects.get(id=family_id)
            dashboard = Dashboard.objects.filter(family=family, is_default=True).first()
            
            if not dashboard:
                # Create default dashboard if it doesn't exist
                dashboard = Dashboard.objects.create(
                    name="Default Dashboard",
                    family=family,
                    is_default=True
                )
            
            serializer = DashboardSerializer(dashboard)
            return serializer.data
        except Family.DoesNotExist:
            return None
    
    @database_sync_to_async
    def update_widget(self, widget_data):
        """
        Update a widget
        """
        try:
            widget = Widget.objects.get(id=widget_data['id'])
            
            # Update position and size
            if 'x' in widget_data:
                widget.x_position = widget_data['x']
            if 'y' in widget_data:
                widget.y_position = widget_data['y']
            if 'width' in widget_data:
                widget.width = widget_data['width']
            if 'height' in widget_data:
                widget.height = widget_data['height']
            
            # Update config if provided
            if 'config' in widget_data:
                widget.config = widget_data['config']
            
            # Update title if provided
            if 'title' in widget_data:
                widget.title = widget_data['title']
            
            widget.save()
            
            # Notify group about the update
            serializer = WidgetSerializer(widget)
            self.channel_layer.group_send(
                self.dashboard_group_name,
                {
                    'type': 'widget_update',
                    'data': serializer.data
                }
            )
            
            return serializer.data
        except Widget.DoesNotExist:
            return None
    
    @database_sync_to_async
    def add_widget(self, widget_data):
        """
        Add a new widget
        """
        try:
            dashboard = Dashboard.objects.get(id=widget_data['dashboard'])
            
            widget = Widget.objects.create(
                title=widget_data['title'],
                widget_type=widget_data['widget_type'],
                dashboard=dashboard,
                x_position=widget_data.get('x', 0),
                y_position=widget_data.get('y', 0),
                width=widget_data.get('width', 2),
                height=widget_data.get('height', 2),
                config=widget_data.get('config', {})
            )
            
            # Notify group about the new widget
            serializer = WidgetSerializer(widget)
            self.channel_layer.group_send(
                self.dashboard_group_name,
                {
                    'type': 'widget_update',
                    'data': serializer.data
                }
            )
            
            return serializer.data
        except Dashboard.DoesNotExist:
            return None
    
    @database_sync_to_async
    def delete_widget(self, widget_id):
        """
        Delete a widget
        """
        try:
            widget = Widget.objects.get(id=widget_id)
            widget.delete()
            
            # Notify group about the deletion
            self.channel_layer.group_send(
                self.dashboard_group_name,
                {
                    'type': 'widget_update',
                    'data': {'id': widget_id, 'deleted': True}
                }
            )
            
            return True
        except Widget.DoesNotExist:
            return False
    
    @database_sync_to_async
    def update_dashboard(self, dashboard_data):
        """
        Update dashboard settings
        """
        try:
            dashboard = Dashboard.objects.get(id=dashboard_data['id'])
            
            # Update name if provided
            if 'name' in dashboard_data:
                dashboard.name = dashboard_data['name']
            
            dashboard.save()
            
            # Notify group about the update
            serializer = DashboardSerializer(dashboard)
            self.channel_layer.group_send(
                self.dashboard_group_name,
                {
                    'type': 'dashboard_update',
                    'data': serializer.data
                }
            )
            
            return serializer.data
        except Dashboard.DoesNotExist:
            return None
    
    @database_sync_to_async
    def is_family_member(self, user_id, family_id):
        """
        Check if a user is a member of a family
        """
        try:
            user = User.objects.get(id=user_id)
            family = Family.objects.get(id=family_id)
            return family.members.filter(id=user.id).exists()
        except (User.DoesNotExist, Family.DoesNotExist):
            return False