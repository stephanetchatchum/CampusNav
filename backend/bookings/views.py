from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Booking
from .serializers import BookingSerializer

# Only logged in users can create or view bookings
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def booking_list_create(request):
    
    if request.method == 'GET':
        # Get only the bookings that belong to the logged in user
        bookings = Booking.objects.filter(user=request.user)
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        # Check if the room is already booked at that time (conflict detection)
        conflicting = Booking.objects.filter(
            room=request.data.get('room'),
            date=request.data.get('date'),
            status='approved'
        ).filter(
            start_time__lt=request.data.get('end_time'),
            end_time__gt=request.data.get('start_time')
        )
        if conflicting.exists():
            return Response({'error': 'Room already booked at this time'}, status=status.HTTP_400_BAD_REQUEST)

        # Save the booking and automatically assign it to the logged in user
        serializer = BookingSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Admin only — approve or cancel a booking by its ID
@api_view(['PATCH'])   # tells Django this function handles API requests
@permission_classes([IsAuthenticated])  #blocks anyone who isn't logged in
def booking_update_status(request, pk):
    try:
        booking = Booking.objects.get(pk=pk)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

    # Update the status (approved or cancelled)
    new_status = request.data.get('status')
    booking.status = new_status
    booking.save()
    return Response(BookingSerializer(booking).data)