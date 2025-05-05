from django.db import models
from django.contrib.auth.models import User

class Family(models.Model):
    name = models.CharField(max_length=100)
    members = models.ManyToManyField(User, related_name='families')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Familie"
        verbose_name_plural = "Familien"

class Event(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Niedrig'),
        ('medium', 'Mittel'),
        ('high', 'Hoch'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    location = models.CharField(max_length=200, blank=True, null=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    family = models.ForeignKey(Family, on_delete=models.CASCADE, related_name='events')
    assigned_to = models.ManyToManyField(User, related_name='assigned_events', blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_events')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "Termin"
        verbose_name_plural = "Termine"

class Task(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Ausstehend'),
        ('in_progress', 'In Bearbeitung'),
        ('completed', 'Abgeschlossen'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    due_date = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    family = models.ForeignKey(Family, on_delete=models.CASCADE, related_name='tasks')
    assigned_to = models.ManyToManyField(User, related_name='assigned_tasks', blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "Aufgabe"
        verbose_name_plural = "Aufgaben"

class ShoppingItem(models.Model):
    name = models.CharField(max_length=200)
    quantity = models.CharField(max_length=50, blank=True, null=True)
    purchased = models.BooleanField(default=False)
    family = models.ForeignKey(Family, on_delete=models.CASCADE, related_name='shopping_items')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_shopping_items')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Einkaufsartikel"
        verbose_name_plural = "Einkaufsartikel"

class Note(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    family = models.ForeignKey(Family, on_delete=models.CASCADE, related_name='notes')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_notes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "Notiz"
        verbose_name_plural = "Notizen"