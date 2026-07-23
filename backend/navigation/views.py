from rest_framework.decorators import api_view
from rest_framework.response import Response
from .pathfinder import navigate, load_graph
from .models import SharedLocation

@api_view(['POST'])
def navigate_view(request):
    from_node  = request.data.get('from_node')
    from_point = request.data.get('from_point')
    to_room    = request.data.get('to_room')
    to_point   = request.data.get('to_point')
    to_node    = request.data.get('to_node')

    if not (from_node or from_point):
        return Response(
            {'error': 'from_node or from_point is required, along with one of to_room, to_point, or to_node'},
            status=400
        )
    if not (to_room or to_point or to_node):
        return Response(
            {'error': 'from_node or from_point is required, along with one of to_room, to_point, or to_node'},
            status=400
        )

    result = navigate(
        start_node_id=from_node,
        start_point=from_point,
        destination_room_code=to_room,
        destination_point=to_point,
        destination_node_id=to_node,
    )
    if 'error' in result:
        return Response(result, status=404)
    return Response(result, status=200)


@api_view(['POST'])
def share_location_view(request):
    """Saves the sharer's current node as a short-lived shareable record.
    Called when someone taps 'Share my location' while currentNode is set.
    Only needs node_id -- building/floor are looked up from the existing
    node data here rather than requiring the frontend to separately track
    and send them, since Home.jsx currently only holds currentNode as a
    plain ID string."""
    node_id = request.data.get('node_id')
    if not node_id:
        return Response({'error': 'node_id is required'}, status=400)

    nodes, _ = load_graph()
    node = nodes.get(node_id)
    if not node:
        return Response({'error': f'Unknown node {node_id}'}, status=400)

    shared = SharedLocation.objects.create(
        node_id=node_id,
        building=node['building'],
        floor=node['floor'],
    )
    return Response({'id': shared.id}, status=201)


@api_view(['GET'])
def get_shared_location_view(request, share_id):
    """Resolves a share link back to the node it points at. The frontend
    calls this on load when it sees a ?find=<id> parameter, then feeds
    the returned node_id straight into the existing navigate() pipeline
    as destination_node_id -- no new navigation logic needed, this only
    ever supplies a destination for the pipeline that already exists."""
    try:
        shared = SharedLocation.objects.get(id=share_id)
    except SharedLocation.DoesNotExist:
        return Response({'error': 'This share link is invalid or has expired'}, status=404)

    return Response({
        'node_id': shared.node_id,
        'building': shared.building,
        'floor': shared.floor,
    }, status=200)