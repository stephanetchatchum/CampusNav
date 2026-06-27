from rest_framework import serializers
from .models import Building, Floor, Room

class RoomSerializer(serializers.ModelSerializer):
    floor = serializers.SerializerMethodField()
    building = serializers.SerializerMethodField()

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