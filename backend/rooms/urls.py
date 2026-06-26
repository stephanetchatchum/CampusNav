from django.urls import path
from .views import RoomListView, RoomDetailView

urlpatterns = [
    path('', RoomListView.as_view(), name='room-list'),
    path('<str:code>/', RoomDetailView.as_view(), name='room-detail'),
]