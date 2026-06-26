from django.db import models


class Building(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Floor(models.Model):
    building = models.ForeignKey(
        Building,
        on_delete=models.CASCADE,
        related_name='floors'
    )
    number = models.IntegerField()  # 0 = ground floor, 1 = first floor, etc.

    def __str__(self):
        return f"{self.building.name} - Floor {self.number}"


class Room(models.Model):
    ROOM_TYPES = [
        ('lecture', 'Lecture Hall'),
        ('lab', 'Computer Lab'),
        ('office', 'Office'),
        ('bathroom', 'Bathroom'),
        ('corridor', 'Corridor'),
        ('common', 'Common Area'),
        ('other', 'Other'),
    ]

    floor = models.ForeignKey(
        Floor,
        on_delete=models.CASCADE,
        related_name='rooms'
    )
    name = models.CharField(max_length=100)        # "Innovation Lab"
    code = models.CharField(max_length=20, unique=True)  # "IH-GF-01"
    capacity = models.IntegerField(default=0)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPES, default='other')
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.code} - {self.name}"