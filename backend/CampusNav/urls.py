from django.contrib import admin
from django.urls import path, include
from rooms.views import RoomListView, RoomDetailView
from navigation.views import navigate_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/rooms/', include('rooms.urls')),
    path('api/navigate/', navigate_view), 
]