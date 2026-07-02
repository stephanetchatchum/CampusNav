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

def find_entrance_node(nodes, room_code):
    """Find the entrance node for a given room code.
    Entrance nodes are named like SC-F2-DOOR-1 and have room_code stored,
    OR we match by the room_code prefix in the node id."""
    # First try: node has explicitly room_code field
    for node in nodes.values():
        if node.get('room_code') == room_code:
            return node
        
    floor = None
    building = None
    if room_code.startswith('SC-F'):
        parts = room_code.split('-')
        floor = int(parts[1][1])
        building = 'Social Commons'
    elif room_code.startswith('EC-F'):
        parts = room_code.split('-')
        floor = int(parts[1][1])
        building = 'Enterprise Commons'
    elif room_code.startswith('LC-F'):
        parts = room_code.split('-')
        floor = int(parts[1][1])
        building = 'Learning Commons'

    # FInd all entrance node on the same floor
    candidates = [
        n for n in nodes.values() if n['type'] == 'entrance' and n.get('floor') == floor and n.get('building') == building
    ]

    return candidates[0] if candidates else None

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

def navigate(start_node_id, destination_room_code):
    """
    Main entry point for pathfinding.
    Returns a dict with path coordinates and metadata.
    """
    nodes, adjacency = load_graph()

    # Find the destination entrance node for the room
    dest_node = find_entrance_node(nodes, destination_room_code)
    if not dest_node:
        return {'error': f'No entrance node found for room {destination_room_code}'}

    if start_node_id not in nodes:
        return {'error': f'Start node {start_node_id} not found'}

    # Run A*
    path_ids = astar(start_node_id, dest_node['id'], nodes, adjacency)
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

    # Calculate total distance
    total_distance = sum(
        e['distance'] for e in json.load(open(EDGES_PATH))
        if path_ids.count(e['from']) and e['from'] in path_ids
        and e['to'] in path_ids
        and abs(path_ids.index(e['from']) - path_ids.index(e['to'])) == 1
    )

    return {
        'start': start_node_id,
        'destination_room': destination_room_code,
        'destination_node': dest_node['id'],
        'path': [
            {
                'id': n['id'],
                'x': n['x'],
                'y': n['y'],
                'floor': n['floor'],
                'type': n['type'],
                'label': n.get('label', '')
            }
            for n in path_nodes
        ],
        'floor_changes': floor_changes,
        'total_distance': total_distance,
        'step_count': len(path_nodes)
    }  