import networkx as nx

def solve_airline(flights):
    """
    flights: list of dicts {'id': '101', 'start': 10, 'end': 12}
    Goal: Min crews needed. 
    Modeled as circulation with demands or max flow in DAG.
    Here we build the DAG of compatible flights.
    """
    # Create a bipartite matching setup or DAG path cover
    # If Flight i ends before Flight j starts (plus transit time), add edge i -> j
    
    G = nx.DiGraph()
    source, sink = 'S', 'T'
    n = len(flights)
    
    # Bipartite Matching construction to find max compatible pairings
    # If we match i -> j, it means same crew does i then j.
    # Min Crews = Total Flights - Max Matching
    
    for f in flights:
        G.add_edge(source, f"{f['id']}_in", capacity=1)
        G.add_edge(f"{f['id']}_out", sink, capacity=1)
    
    for f1 in flights:
        for f2 in flights:
            if f1 == f2: continue
            # If f1 compatible with f2 (f1 finishes before f2 starts)
            if f1['end'] <= f2['start']:
                G.add_edge(f"{f1['id']}_in", f"{f2['id']}_out", capacity=1)

    # Max Flow corresponds to Max Matching in this bipartite graph
    flow_val, _ = nx.maximum_flow(G, source, sink)
    
    min_crews = n - flow_val
    return min_crews, f"Flights: {n}, Compatible Pairs Matched: {flow_val}"