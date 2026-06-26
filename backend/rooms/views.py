from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Room
from .serializers import RoomSerializer

class RoomListView(APIView):

    def get(self, request):
        rooms = Room.objects.all()

        serializer = RoomSerializer(rooms, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)
    
class RoomDetailView(APIView):
    def get(self, request, code):
        try:
            room = Room.objects.get(code=code)
        except Room.DoesNotExist:
            return Response(
                {"error":"Room not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = RoomSerializer(room)

        return Response(serializer.data, status=status.HTTP_200_OK)