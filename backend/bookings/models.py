from django.db import models
from django.conf import settings

class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    room = models.ForeignKey('rooms.Room', on_delete=models.CASCADE)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    # The Google Calendar event ID for this booking, so it can be deleted
    # if the booking is later cancelled. Blank if calendar sync failed.
    google_event_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        indexes = [
            # Speeds up "which rooms are booked right now" across all rooms
            models.Index(fields=['date', 'status']),
            # Speeds up per-room checks: conflict detection, availability,
            # the room detail page — all filter by exactly this combination
            models.Index(fields=['room', 'date', 'status']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.room.code} - {self.date}"