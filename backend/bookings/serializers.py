from rest_framework import serializers
from .models import Booking

#convert booking model to JSON so that React can read it then convert it back to booking object that Djago can save.
class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['id', 'user', 'room', 'date', 'start_time', 'end_time', 'status', 'created_at']
        read_only_fields = ['user', 'status', 'created_at']