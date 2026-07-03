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
    Returns: path array with coordinates, floor changes, total distance
    """
    from_node = request.data.get('from_node')
    to_room   = request.data.get('to_room')

    if not from_node or not to_room:
        return Response(
            {'error': 'Both from_node and to_room are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    result = navigate(from_node, to_room)

    if 'error' in result:
        return Response(result, status=status.HTTP_404_NOT_FOUND)

    return Response(result, status=status.HTTP_200_OK)