from django.urls import path
from . import views

urlpatterns = [
    # List and create bookings
    path('', views.booking_list_create, name='booking-list-create'),
    # Get only the logged-in user's own bookings
    path('mine/', views.my_bookings, name='my-bookings'),
    # Admin: approve or cancel a booking
    path('<int:pk>/status/', views.booking_update_status, name='booking-update-status'),
]