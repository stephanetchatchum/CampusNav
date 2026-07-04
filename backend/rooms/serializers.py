from rest_framework import serializers
from .models import Building, Floor, Room
from django.utils import timezone

class RoomSerializer(serializers.ModelSerializer):
    floor = serializers.SerializerMethodField()
    building = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()

    class Meta:
        model = Room

        fields = [
            'id',
            'name',
            'code',
            'floor',
            'building',
            'capacity',
            'room_type',
            'is_available',
        ]

    def get_floor(self, obj):
        return obj.floor.number
    
    def get_building(self, obj):
        return obj.floor.building.name
    
    def get_is_available(self, obj):
        """Compute availability live based on current approved bookings.
        A room is unavailable if there is an approved booking for today
        whose time slot overlaps with right now."""
        from bookings.models import Booking
        from django.utils import timezone

        now = timezone.localtime(timezone.now())
        today = now.date()
        current_time = now.time()

        active_booking = Booking.objects.filter(
            room=obj,
            date=today,
            status='approved',
            start_time__lte=current_time,
            end_time__gte=current_time,
        ).first()

        return active_booking is None