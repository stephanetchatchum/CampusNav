from django.contrib import admin
from django.urls import path, include
from rooms.views import RoomListView, RoomDetailView
from navigation.views import navigate_view

urlpatterns = [
    path('admin/', admin.site.urls),
    # Changed from api/users/ to api/auth/ to match the design document spec
    path('api/auth/', include('users.urls')),
    path('api/rooms/', include('rooms.urls')),
    # Booking endpoints — create, list, mine, approve, cancel
    path('api/bookings/', include('bookings.urls')),
    path('api/navigate/', navigate_view),
]