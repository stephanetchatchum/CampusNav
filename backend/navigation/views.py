from rest_framework.decorators import api_view
from rest_framework.response import Response
from .pathfinder import navigate

@api_view(['POST'])
def navigate_view(request):
    from_node  = request.data.get('from_node')
    from_point = request.data.get('from_point')
    to_room    = request.data.get('to_room')
    to_point   = request.data.get('to_point')

    if not (from_node or from_point):
        return Response(
            {'error': 'from_node or from_point is required, along with either to_room or to_point'},
            status=400
        )
    if not (to_room or to_point):
        return Response(
            {'error': 'from_node or from_point is required, along with either to_room or to_point'},
            status=400
        )

    result = navigate(
        start_node_id=from_node,
        start_point=from_point,
        destination_room_code=to_room,
        destination_point=to_point,
    )
    if 'error' in result:
        return Response(result, status=404)
    return Response(result, status=200)