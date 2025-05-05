import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import WeatherSettings
from django.utils import timezone
import requests
from datetime import datetime, timedelta

class WeatherConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.family_id = self.scope['url_route']['kwargs']['family_id']
        self.weather_group_name = f'weather_{self.family_id}'

        # Gruppe beitreten
        await self.channel_layer.group_add(
            self.weather_group_name,
            self.channel_name
        )

        await self.accept()

        # Sofort aktuelle Wetterdaten senden
        weather_data = await self.get_weather_data()
        if weather_data:
            await self.send(text_data=json.dumps({
                'type': 'weather_update',
                'data': weather_data
            }))

        # Hintergrundaufgabe für regelmäßige Updates starten
        self.weather_update_task = asyncio.create_task(self.periodic_weather_update())

    async def disconnect(self, close_code):
        # Gruppe verlassen
        await self.channel_layer.group_discard(
            self.weather_group_name,
            self.channel_name
        )

        # Hintergrundaufgabe stoppen
        if hasattr(self, 'weather_update_task'):
            self.weather_update_task.cancel()
            try:
                await self.weather_update_task
            except asyncio.CancelledError:
                pass

    async def receive(self, text_data):
        # Empfangen von Nachrichten vom WebSocket
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')

        if message_type == 'request_weather_update':
            # Manuelles Update anfordern
            weather_data = await self.get_weather_data(force_update=True)
            if weather_data:
                await self.send(text_data=json.dumps({
                    'type': 'weather_update',
                    'data': weather_data
                }))

    async def weather_update(self, event):
        # Wetterdaten an den WebSocket senden
        await self.send(text_data=json.dumps({
            'type': 'weather_update',
            'data': event['data']
        }))

    async def periodic_weather_update(self):
        # Regelmäßige Wetter-Updates
        try:
            while True:
                # Intervall aus den Einstellungen holen
                update_interval = await self.get_update_interval()

                # Warten bis zum nächsten Update
                await asyncio.sleep(update_interval * 60)  # Minuten in Sekunden umwandeln

                # Wetterdaten abrufen und an alle Clients in der Gruppe senden
                weather_data = await self.get_weather_data()
                if weather_data:
                    await self.channel_layer.group_send(
                        self.weather_group_name,
                        {
                            'type': 'weather_update',
                            'data': weather_data
                        }
                    )
        except asyncio.CancelledError:
            # Aufgabe wurde abgebrochen
            pass

    @database_sync_to_async
    def get_update_interval(self):
        # Standard-Intervall: 10 Minuten
        default_interval = 10

        try:
            settings = WeatherSettings.objects.get(family_id=self.family_id)
            return settings.update_interval
        except WeatherSettings.DoesNotExist:
            return default_interval

    @database_sync_to_async
    def get_weather_data(self, force_update=False):
        try:
            # Einstellungen abrufen oder erstellen
            settings, created = WeatherSettings.objects.get_or_create(
                family_id=self.family_id,
                defaults={'location': 'Dornbirn', 'update_interval': 10}
            )

            # Prüfen, ob eine Aktualisierung erforderlich ist
            update_needed = force_update or created
            if not update_needed and settings.last_update and settings.last_weather_data:
                time_diff = timezone.now() - settings.last_update
                if time_diff.total_seconds() < settings.update_interval * 60:
                    # Verwende gespeicherte Daten
                    return settings.last_weather_data
                else:
                    update_needed = True

            if update_needed:
                # Wetterdaten von der API abrufen
                from django.conf import settings as django_settings

                api_key = django_settings.OPENWEATHERMAP_API_KEY
                location = settings.location

                # Aktuelle Wetterdaten abrufen
                current_url = f"https://api.openweathermap.org/data/2.5/weather?q={location}&appid={api_key}&units=metric&lang=de"
                current_response = requests.get(current_url)
                current_data = current_response.json()

                # 5-Tage-Vorhersage abrufen
                forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?q={location}&appid={api_key}&units=metric&lang=de"
                forecast_response = requests.get(forecast_url)
                forecast_data = forecast_response.json()

                # Daten formatieren
                weather_data = {
                    "temperature": round(current_data["main"]["temp"]),
                    "description": current_data["weather"][0]["description"],
                    "icon": current_data["weather"][0]["icon"],
                    "location": current_data["name"],
                    "forecast": []
                }

                # Mittags-Vorhersagen für die nächsten 5 Tage extrahieren
                noon_forecasts = []
                for item in forecast_data["list"]:
                    dt_txt = item["dt_txt"]
                    if "12:00:00" in dt_txt:
                        noon_forecasts.append({
                            "date": dt_txt.split(" ")[0],
                            "temperature": round(item["main"]["temp"]),
                            "description": item["weather"][0]["description"],
                            "icon": item["weather"][0]["icon"]
                        })
                        if len(noon_forecasts) >= 5:
                            break

                weather_data["forecast"] = noon_forecasts

                # Daten speichern
                settings.last_weather_data = weather_data
                settings.last_update = timezone.now()
                settings.save()

                return weather_data
            else:
                # Verwende gespeicherte Daten
                return settings.last_weather_data

        except Exception as e:
            print(f"Fehler beim Abrufen der Wetterdaten: {e}")

            # Fallback zu Mock-Daten
            from datetime import datetime, timedelta
            from django.utils import timezone

            mock_weather = {
                "temperature": 18,
                "description": "Teilweise bewölkt",
                "icon": "partly_cloudy",
                "location": "Dornbirn",
                "forecast": []
            }

            # Mock-Vorhersage für die nächsten 5 Tage
            for i in range(1, 6):
                day = (timezone.now() + timedelta(days=i)).strftime('%Y-%m-%d')
                mock_weather["forecast"].append({
                    "date": day,
                    "temperature": 20 - i,
                    "description": "Sonnig" if i % 2 == 0 else "Bewölkt",
                    "icon": "sunny" if i % 2 == 0 else "cloudy"
                })

            return mock_weather