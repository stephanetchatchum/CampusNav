from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import Room
from .serializers import RoomSerializer


class RoomListView(APIView):

    def get(self, request):
        # select_related fetches Room, Floor, and Building together in one
        # single query (a SQL join), instead of separate queries every time
        # obj.floor or obj.floor.building gets accessed later. With 58 rooms
        # over a remote database, that was the real cause of the multi-minute
        # load time, not just the availability check we fixed earlier.
        rooms = Room.objects.select_related('floor', 'floor__building').all()

        # One single query for every currently-active booking, instead of
        # one query per room. With 58 rooms and a remote database, doing
        # this per-room was 58+ separate network round trips, which is
        # exactly what caused the multi-minute load time.
        from bookings.models import Booking
        now = timezone.localtime(timezone.now())
        today = now.date()
        current_time = now.time()
        active_room_ids = set(
            Booking.objects.filter(
                date=today,
                status='approved',
                start_time__lte=current_time,
                end_time__gte=current_time,
            ).values_list('room_id', flat=True)
        )

        serializer = RoomSerializer(rooms, many=True, context={'active_room_ids': active_room_ids})
        return Response(serializer.data, status=status.HTTP_200_OK)


class RoomDetailView(APIView):
    def get(self, request, code):
        try:
            room = Room.objects.select_related('floor', 'floor__building').get(code=code)
        except Room.DoesNotExist:
            return Response(
                {"error": "Room not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = RoomSerializer(room)
        return Response(serializer.data, status=status.HTTP_200_OK)