import networkx as nx

def solve_segmentation(grid_size=3):
    """
    Simulates Image Segmentation.
    Grid of pixels. High value = likelihood of foreground.
    Graph construction: 
    - Source (Foreground) connected to pixel i with capacity a_i (likelihood fg)
    - Pixel i connected to Sink (Background) with capacity b_i (likelihood bg)
    - Neighbor pixels connected with penalty p_ij (smoothing)
    """
    G = nx.DiGraph()
    source, sink = 'S', 'T'
    
    # Synthetic "Image" Data (3x3)
    # Center pixel is likely foreground (high val), corners likely background
    foreground_prob = [
        [2, 1, 2],
        [1, 9, 1],
        [2, 1, 2]
    ]
    background_prob = [
        [8, 5, 8],
        [5, 1, 5],
        [8, 5, 8]
    ]
    penalty = 2 # Smoothing penalty
    
    rows, cols = 3, 3
    
    for r in range(rows):
        for c in range(cols):
            node = f"{r},{c}"
            
            # Edge S -> i (Capacity = a_i)
            # Edge i -> T (Capacity = b_i)
            # Slide 61 formulation: Maximize a_i (if in A) + b_j (if in B) - penalties
            # Equivalent to Min Cut where capacities are reversed:
            # Cut (S, i) means i is in B. Cost = a_i.
            # Cut (i, T) means i is in A. Cost = b_i.
            
            G.add_edge(source, node, capacity=foreground_prob[r][c])
            G.add_edge(node, sink, capacity=background_prob[r][c])
            
            # Neighbors
            if r + 1 < rows:
                G.add_edge(node, f"{r+1},{c}", capacity=penalty)
                G.add_edge(f"{r+1},{c}", node, capacity=penalty)
            if c + 1 < cols:
                G.add_edge(node, f"{r},{c+1}", capacity=penalty)
                G.add_edge(f"{r},{c+1}", node, capacity=penalty)

    cut_value, partition = nx.minimum_cut(G, source, sink)
    reachable, non_reachable = partition
    
    # Process result for display
    # Nodes reachable from S are "Foreground"
    grid_res = []
    for r in range(rows):
        row_str = ""
        for c in range(cols):
            node = f"{r},{c}"
            if node in reachable:
                row_str += " # " # Foreground
            else:
                row_str += " . " # Background
        grid_res.append(row_str)
        
    return grid_res, cut_value