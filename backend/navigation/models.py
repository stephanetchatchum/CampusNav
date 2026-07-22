from django.db import models
from rooms.models import Room

class Node(models.Model):
    label = models.CharField(max_length=100)
    room = models.OneToOneField(
        Room,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='node'
    )
    x = models.FloatField(default=0)
    y = models.FloatField(default=0)
    z = models.FloatField(default=0)

    def __str__(self):
        return self.label
    
class Edge(models.Model):
    from_node = models.ForeignKey(
        Node, 
        on_delete=models.CASCADE,
        related_name='edges_from'
    )
    to_node = models.ForeignKey(
        Node,
        on_delete=models.CASCADE,
        related_name='edges_to'
    )
    distance = models.FloatField()

    def __str__(self):
        return f"{self.from_node.label} -> {self.to_node.label} ({self.distance}m)"
    
import secrets
import string
from django.db import models


def generate_share_id():
    """Short, URL-safe random ID for shareable location links, e.g.
    campusnav.app/?find=x3k4aive -- 8 lowercase alphanumeric characters,
    over 2.8 trillion possible combinations, more than enough to make
    collisions a non-issue at this app's scale."""
    alphabet = string.ascii_lowercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(8))


class SharedLocation(models.Model):
    """A snapshot of someone's position at the moment they tapped
    'Share my location' -- not live tracking, just a saved point,
    exactly as the design doc describes: 'It does not require real-time
    tracking, the position is captured at the moment of sharing.'
    """
    id = models.CharField(max_length=8, primary_key=True, default=generate_share_id, editable=False)
    node_id = models.CharField(max_length=64)
    building = models.CharField(max_length=64)
    floor = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)