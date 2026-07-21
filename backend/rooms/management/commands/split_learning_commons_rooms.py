from django.core.management.base import BaseCommand
from rooms.models import Room

class Command(BaseCommand):
    help = "Split combined Gambia & Liberia and Mozambique & Malawi rooms into four individual rooms"

    def handle(self, *args, **options):
        gl = Room.objects.get(code="LC-F1-GL")
        mm = Room.objects.get(code="LC-F1-MM")

        new_rooms = [
            {"name": "Gambia", "code": "LC-F1-GM", "capacity": 30, "floor": gl.floor, "room_type": "lecture"},
            {"name": "Liberia", "code": "LC-F1-LI", "capacity": 30, "floor": gl.floor, "room_type": "lecture"},
            {"name": "Mozambique", "code": "LC-F1-MZ", "capacity": 30, "floor": mm.floor, "room_type": "lecture"},
            {"name": "Malawi", "code": "LC-F1-MW", "capacity": 30, "floor": mm.floor, "room_type": "lecture"},
        ]

        for data in new_rooms:
            room, created = Room.objects.get_or_create(code=data["code"], defaults=data)
            status = "Created" if created else "Already exists"
            self.stdout.write(f"{status}: {room.name} ({room.code})")
