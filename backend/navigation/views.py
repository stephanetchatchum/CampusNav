from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .pathfinder import navigate

@api_view(['POST'])
def navigate_view(request):
    """
    POST /api/navigate/
    Body: { "from_node": "SC-F2-J-16", "to_room": "SC-F2-DJ" }
    OR:   { "from_node": "SC-F2-J-16", "to_point": {"x": 320, "y": 480, "floor": 2, "building": "Social Commons"} }
    Send either to_room or to_point (to_point is new -- for "navigate to
    wherever was tapped on the map" instead of a named room).
    Returns: path array with coordinates, floor changes, total distance
    """
    from_node = request.data.get('from_node')
    to_room   = request.data.get('to_room')
    to_point  = request.data.get('to_point')

    if not from_node or not (to_room or to_point):
        return Response(
            {'error': 'from_node is required, along with either to_room or to_point'},
            status=status.HTTP_400_BAD_REQUEST
        )

    result = navigate(from_node, destination_room_code=to_room, destination_point=to_point)

    if 'error' in result:
        return Response(result, status=status.HTTP_404_NOT_FOUND)

    return Response(result, status=status.HTTP_200_OK)