from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/rooms/', include('rooms.urls')),
]

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/rooms/', include('rooms.urls')),
    # Booking endpoints — create, list, approve, cancel
    path('api/bookings/', include('bookings.urls')),
]