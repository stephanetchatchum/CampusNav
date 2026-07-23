from rest_framework import serializers
from .models import Booking

#convert booking model to JSON so that React can read it then convert it back to booking object that Djago can save.
class BookingSerializer(serializers.ModelSerializer):
    # Pull the actual room name and user email through the foreign keys,
    # so the frontend can display real names instead of raw IDs
    room_name = serializers.CharField(source='room.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'user', 'user_email', 'room', 'room_name', 'date', 'start_time', 'end_time', 'status', 'created_at']
        read_only_fields = ['user', 'status', 'created_at']