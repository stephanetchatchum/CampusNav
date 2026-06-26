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