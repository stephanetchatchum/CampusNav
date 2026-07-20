from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Booking
from .serializers import BookingSerializer
from .google_calendar import create_calendar_event


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
            # No manual approval step for now. Any booking that passes the
            # conflict check above is approved immediately on creation.
            booking = serializer.save(user=request.user, status='approved')

            # Add to Google Calendar and invite the booker. This is
            # best-effort — a booking still succeeds even if calendar
            # sync fails, so a Google hiccup never blocks a real booking.
            try:
                create_calendar_event(booking)
            except Exception as e:
                print(f"Calendar sync failed: {e}")

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
# Returns only the bookings that belong to the currently logged-in user
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_bookings(request):
    bookings = Booking.objects.filter(user=request.user).order_by('-created_at')
    serializer = BookingSerializer(bookings, many=True)
    return Response(serializer.data)


# Admin only — approve or cancel a booking by its ID
@api_view(['PATCH'])   # tells Django this function handles API requests
@permission_classes([IsAuthenticated])  #blocks anyone who isn't logged in
def booking_update_status(request, pk):
    # Only admin accounts can approve or cancel bookings
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    try:
        booking = Booking.objects.get(pk=pk)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

    # Update the status (approved or cancelled)
    new_status = request.data.get('status')
    booking.status = new_status
    booking.save()
    return Response(BookingSerializer(booking).data)



# Returns all bookings across all users — for admin panel only
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_bookings(request):
    # Only admin accounts can view all bookings
    if request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    bookings = Booking.objects.all().order_by('-created_at')
    serializer = BookingSerializer(bookings, many=True)
    return Response(serializer.data)