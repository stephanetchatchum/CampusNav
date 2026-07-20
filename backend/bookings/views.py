from datetime import datetime
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Booking
from .serializers import BookingSerializer
from rooms.models import Room
from .google_calendar import create_calendar_event, delete_calendar_event

# Rooms confirmed NOT bookable by students — mirrors
# frontend/src/data/nonBookableRooms.js. Enforced here too, so this can
# never be bypassed by calling the API directly.
NOT_STUDENT_BOOKABLE = {
    'Administration', 'Bibi Titi', 'Congo', 'Elevator', 'Fab Lab Gallery',
    'Food Court', 'Gabon', 'Guinea', 'Leadership Center', 'POD',
    'Prayer Room', 'Reception', 'Resource Center', 'Sahel', 'Staff Work Hive',
    'Vendors', 'Washrooms', 'Wellness Center', 'Gambia & Liberia',
    'Mozambique & Malawi', 'Fab Lab',
}


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
        # Only ALU student and staff accounts can book rooms. Guests can
        # still browse and navigate, just not book.
        email = request.user.email
        if not (email.endswith('@alustudent.com') or email.endswith('@alueducation.com')):
            return Response({'error': 'Only ALU students and staff can book rooms'}, status=status.HTTP_403_FORBIDDEN)

        # Look up the room once — reused below for the bookability check
        # and again later instead of querying twice.
        try:
            room_obj = Room.objects.get(pk=request.data.get('room'))
        except (Room.DoesNotExist, ValueError, TypeError):
            return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

        # Enforced here too, not just on the frontend — a direct API call
        # can never book a room students aren't allowed to book.
        if room_obj.name in NOT_STUDENT_BOOKABLE:
            return Response({'error': 'This room is not available for student booking'}, status=status.HTTP_403_FORBIDDEN)

        # Reject anything in the past, regardless of what the frontend sent.
        date_str = request.data.get('date')
        start_time_str = request.data.get('start_time')
        try:
            naive_start = datetime.strptime(f"{date_str} {start_time_str}", "%Y-%m-%d %H:%M")
        except (ValueError, TypeError):
            return Response({'error': 'Invalid date or time'}, status=status.HTTP_400_BAD_REQUEST)

        if timezone.make_aware(naive_start) < timezone.now():
            return Response({'error': 'Cannot book a time slot in the past'}, status=status.HTTP_400_BAD_REQUEST)

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
                event_id = create_calendar_event(booking)
                booking.google_event_id = event_id
                booking.save()
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
    try:
        booking = Booking.objects.get(pk=pk)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    is_admin = request.user.role == 'admin'
    is_owner = booking.user_id == request.user.id

    # Admins can set any status on any booking. A regular user can only
    # cancel their own booking — never approve, never touch someone else's.
    if is_admin:
        pass
    elif is_owner and new_status == 'cancelled':
        pass
    else:
        return Response({'error': 'You do not have permission to update this booking'}, status=status.HTTP_403_FORBIDDEN)

    booking.status = new_status
    booking.save()

    # If this booking is being cancelled and it has a Google Calendar
    # event, remove it too. Best-effort, same as creation — a cancel
    # still succeeds in our system even if the calendar delete fails.
    if new_status == 'cancelled' and booking.google_event_id:
        try:
            delete_calendar_event(booking.google_event_id)
        except Exception as e:
            print(f"Calendar delete failed: {e}")

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


# Returns the booked time ranges for one room on one date — used by the
# room availability page. Never exposes who made each booking.
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def room_availability(request, code):
    date = request.query_params.get('date')
    if not date:
        return Response({'error': 'date query parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        room = Room.objects.get(code=code)
    except Room.DoesNotExist:
        return Response({'error': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

    bookings = Booking.objects.filter(room=room, date=date, status='approved')
    slots = [
        {
            'start_time': str(b.start_time),
            'end_time': str(b.end_time),
            # Only ever reveals ownership to the person who made the
            # booking. Everyone else just sees the time is taken.
            'is_mine': b.user_id == request.user.id,
            'booking_id': b.id if b.user_id == request.user.id else None,
        }
        for b in bookings
    ]
    return Response({'room': room.name, 'code': room.code, 'date': date, 'booked_slots': slots})