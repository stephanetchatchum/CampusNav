# navigation/pathfinder.py
# A* pathfinding for CampusNav
# Takes a start node ID and destination room code,
# returns the shortest path as a list of node coordinates.

import json
import math
import os
from heapq import heappush, heappop

# Load the navigation graph from campus-data/
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
NODES_PATH = os.path.join(BASE_DIR, 'campus-data', 'nodes.json')
EDGES_PATH = os.path.join(BASE_DIR, 'campus-data', 'edges.json')

def load_graph():
    with open(NODES_PATH) as f:
        nodes_list = json.load(f)
    with open(EDGES_PATH) as f:
        edges_list = json.load(f)

    # nodes dict: id -> node object
    nodes = {n['id']: n for n in nodes_list}

    # adjacency list: node_id -> list of (neighbour_id, distance)
    adjacency = {n['id']: [] for n in nodes_list}
    for edge in edges_list:
        adjacency[edge['from']].append((edge['to'], edge['distance']))
        adjacency[edge['to']].append((edge['from'], edge['distance']))
    
    return nodes, adjacency

def heuristic(node_a, node_b):
    return math.sqrt(
        (node_a['x'] - node_b['x'])**2 + (node_a['y'] - node_b['y'])**2
    ) * 0.1

def find_room_entrance(nodes, room_code):
    """Find the best node to navigate to for a given room code."""
    
    # First try: exact room_code match on entrance nodes
    candidates = [
        n for n in nodes.values()
        if n.get('room_code') == room_code
    ]
    if candidates:
        # Prefer a junction/hallway point over a specific door when both are
        # tagged with this room's code -- e.g. for an open area like Vendors,
        # this walks you to the shared hallway in front of it rather than
        # one particular stall's door. Tag the junction (not just individual
        # doors) with the room's code in the editor to get this behaviour.
        junctions = [n for n in candidates if n['type'] == 'junction']
        pool = junctions if junctions else candidates
        return max(pool, key=lambda n: len(n.get('connects_to', [])))

    # Second try: match by floor and building, pick closest entrance
    parts = room_code.split('-')
    if len(parts) < 3:
        return None

    floor_num = int(parts[1][1])
    building_map = {
        'SC': 'Social Commons',
        'EC': 'Enterprise Commons',
        'LC': 'Learning Commons'
    }
    building = building_map.get(parts[0])

    # Get room position from a hardcoded lookup
    # These are the SVG x/y positions of each room centre from Map2D.jsx
    ROOM_CENTRES = {
        'SC-F2-DJ': (165, 227),
        'SC-F2-SS': (332, 212),
        'SC-F2-BT': (397, 305),
        'SC-F2-FC': (425, 548),
        'SC-F2-WR': (279, 548),
        'SC-F2-VD': (412, 733),
        'SC-F1-ET': (170, 115),
        'SC-F1-MO': (330, 885),
        'SC-F1-AL': (485, 895),
        'SC-F1-FC': (285, 80),
        'SC-F0-EG': (407, 795),
        'SC-F0-FC': (405, 320),
    }

    centre = ROOM_CENTRES.get(room_code)
    if centre:
        # Find the closest node on the same floor regardless of type
        candidates = [
            n for n in nodes.values()
            if n.get('floor') == floor_num
            and n.get('building') == building
            and n['type'] in ('entrance', 'junction', 'staircase')
        ]
        
        if candidates:
            return min(
                candidates,
                key=lambda n: (n['x'] - centre[0])**2 + (n['y'] - centre[1])**2
            )

    # Final fallback: first entrance on the floor
    candidates = [
        n for n in nodes.values()
        if n['type'] == 'entrance'
        and n.get('floor') == floor_num
        and n.get('building') == building
    ]
    return candidates[0] if candidates else None

def find_nearest_node(nodes, x, y, floor, building, types=None):
    """
    Find the node closest to an arbitrary point on a given floor/building.
    Used for 'navigate to wherever I tapped on the map', and can also
    serve as a fallback destination for a room that has no room_code-tagged
    node yet (the caller supplies that room's current centre as x/y).
    """
    candidates = [
        n for n in nodes.values()
        if n.get('floor') == floor and n.get('building') == building
        and (types is None or n['type'] in types)
    ]
    if not candidates:
        return None
    return min(candidates, key=lambda n: (n['x'] - x)**2 + (n['y'] - y)**2)

def astar(start_node_id, end_node_id, nodes, adjacency):
    """
    A* algorithm.
    Returns list of node IDs representing the shortest path,
    or None if no path exists.
    """
    if start_node_id not in nodes or end_node_id not in nodes:
        return None

    start = nodes[start_node_id]
    end   = nodes[end_node_id]

    # Priority queue: (f_score, node_id)
    open_set = []
    heappush(open_set, (0, start_node_id))

    came_from = {}
    g_score = {start_node_id: 0}
    f_score = {start_node_id: heuristic(start, end)}

    while open_set:
        _, current_id = heappop(open_set)

        if current_id == end_node_id:
            # Reconstruct path
            path = []
            while current_id in came_from:
                path.append(current_id)
                current_id = came_from[current_id]
            path.append(start_node_id)
            path.reverse()
            return path

        for neighbour_id, distance in adjacency.get(current_id, []):
            tentative_g = g_score.get(current_id, float('inf')) + distance

            if tentative_g < g_score.get(neighbour_id, float('inf')):
                came_from[neighbour_id] = current_id
                g_score[neighbour_id] = tentative_g
                f = tentative_g + heuristic(nodes[neighbour_id], end)
                f_score[neighbour_id] = f
                heappush(open_set, (f, neighbour_id))

    return None  # no path found

def navigate(start_node_id=None, start_point=None, destination_room_code=None, destination_point=None, destination_node_id=None):
    """
    Main entry point for pathfinding.

    start_node_id: e.g. 'SC-F2-J-16' -- the usual way to specify where
        you're starting from. Unchanged behaviour from before.
    start_point: optional. A dict {'x', 'y', 'floor', 'building'} -- an
        alternative to start_node_id, for 'recalculate from wherever I
        actually am' (e.g. a correction tap mid-navigation). Resolves to
        the nearest node the same way destination_point already does.
    destination_room_code: e.g. 'SC-F2-VD' -- navigate to a named room.
        Unchanged behaviour from before if this is all you pass.
    destination_point: optional. A dict {'x', 'y', 'floor', 'building'}
        -- navigate to an arbitrary point instead of (or as a fallback for)
        a room. Pass this alone for 'navigate to wherever was tapped on the
        map'. Pass both together and destination_point is only used if the
        room_code lookup comes up empty.
    destination_node_id: e.g. 'SC-F2-J-27' -- navigate directly to a known
        node, no lookup needed. This is what location sharing uses: the
        sharer's exact current node, not an approximate point near it, so
        the recipient ends up at precisely where the link was shared from.
        Checked first if present, since it's the most exact of the three
        destination options.
    """
    nodes, adjacency = load_graph()

    actual_start_id = start_node_id
    if not actual_start_id and start_point:
        start_candidate = find_nearest_node(
            nodes,
            start_point['x'], start_point['y'],
            start_point['floor'], start_point['building'],
        )
        if start_candidate:
            actual_start_id = start_candidate['id']

    if not actual_start_id:
        return {'error': 'No starting point provided or found'}

    dest_node = None
    if destination_node_id and destination_node_id in nodes:
        dest_node = nodes[destination_node_id]

    if not dest_node and destination_room_code:
        dest_node = find_room_entrance(nodes, destination_room_code)

    if not dest_node and destination_point:
        dest_node = find_nearest_node(
            nodes,
            destination_point['x'], destination_point['y'],
            destination_point['floor'], destination_point['building'],
        )

    if not dest_node:
        if destination_node_id:
            return {'error': f'Shared location node {destination_node_id} no longer exists'}
        if destination_room_code:
            return {'error': f'No entrance node found for room {destination_room_code}'}
        return {'error': 'No navigable point found near that location'}

    if actual_start_id not in nodes:
        return {'error': f'Start node {actual_start_id} not found'}

    # Run A*
    path_ids = astar(actual_start_id, dest_node['id'], nodes, adjacency)
    if not path_ids:
        return {'error': 'No path found between these points'}

    # Build response with full node info for each step
    path_nodes = [nodes[nid] for nid in path_ids]

    # Detect floor changes in the path
    floor_changes = []
    for i in range(1, len(path_nodes)):
        prev_floor = path_nodes[i-1].get('floor')
        curr_floor = path_nodes[i].get('floor')
        if prev_floor != curr_floor:
            floor_changes.append({
                'at_node': path_nodes[i]['id'],
                'from_floor': prev_floor,
                'to_floor': curr_floor,
                'type': path_nodes[i]['type']  # staircase or elevator
            })

    # Per-step distances -- how far from each step to the next one. Built
    # once as a from/to lookup rather than re-scanning the whole edge list
    # per step. Used by the frontend to pace the "you are here" dot
    # automatically (roughly how long each leg should take at a normal
    # walking pace), not just to total up the full route length.
    edges_list = json.load(open(EDGES_PATH))
    edge_lookup = {}
    for e in edges_list:
        edge_lookup[(e['from'], e['to'])] = e['distance']
        edge_lookup[(e['to'], e['from'])] = e['distance']

    step_distances = []
    for i in range(len(path_ids) - 1):
        step_distances.append(edge_lookup.get((path_ids[i], path_ids[i + 1]), 0))

    total_distance = sum(step_distances)

    return {
        'start': actual_start_id,
        'destination_room': destination_room_code,
        'destination_node': dest_node['id'],
        'path': [
            {
                'id': n['id'],
                'x': n['x'],
                'y': n['y'],
                'floor': n['floor'],
                'type': n['type'],
                'label': n.get('label', ''),
                'distance_to_next': step_distances[i] if i < len(step_distances) else 0,
            }
            for i, n in enumerate(path_nodes)
        ],
        'floor_changes': floor_changes,
        'total_distance': total_distance,
        'step_count': len(path_nodes)
    }