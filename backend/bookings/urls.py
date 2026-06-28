from django.urls import path
from . import views

# Routes for booking endpoints
urlpatterns = [
    path('', views.booking_list_create, name='booking-list-create'),
    path('<int:pk>/status/', views.booking_update_status, name='booking-update-status'),
]