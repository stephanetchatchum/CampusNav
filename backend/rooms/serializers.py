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
        When called from the room list, the view precomputes every
        currently-active room in a single query and passes it in via
        context, avoiding one database round trip per room. Falls back
        to a single per-room query for the room detail view, where only
        one room is ever serialized at a time."""
        active_room_ids = self.context.get('active_room_ids')
        if active_room_ids is not None:
            return obj.id not in active_room_ids

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