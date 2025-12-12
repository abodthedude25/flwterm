import networkx as nx

def solve_baseball(teams_data, target_team):
    """
    Constructs the max flow network to check elimination.
    Nodes: Source -> Game Nodes -> Team Nodes -> Sink
    """
    if target_team not in teams_data:
        return False, "Team not found"
        
    target_stats = teams_data[target_team]
    # Max possible wins for target team
    max_wins = target_stats['wins'] + sum(target_stats['remaining'].values())
    
    G = nx.DiGraph()
    source, sink = 'S', 'T'
    
    total_games_capacity = 0
    other_teams = [t for t in teams_data if t != target_team]
    
    # 1. Team Nodes -> Sink
    for team in other_teams:
        cap = max_wins - teams_data[team]['wins']
        if cap < 0:
            return True, f"Trivial Elimination: {team} already has more wins."
        G.add_edge(team, sink, capacity=cap)
        
    # 2. Source -> Game Nodes -> Team Nodes
    # We iterate pairs of other teams to add game nodes
    added_games = set()
    for i in range(len(other_teams)):
        for j in range(i+1, len(other_teams)):
            t1 = other_teams[i]
            t2 = other_teams[j]
            
            # Use data from t1's remaining schedule
            games_left = teams_data[t1]['remaining'].get(t2, 0)
            
            if games_left > 0:
                game_node = f"G_{t1}_{t2}"
                G.add_edge(source, game_node, capacity=games_left)
                G.add_edge(game_node, t1, capacity=float('inf'))
                G.add_edge(game_node, t2, capacity=float('inf'))
                total_games_capacity += games_left

    # 3. Calculate Flow
    flow_val, _ = nx.maximum_flow(G, source, sink)
    
    # If flow < total_games_capacity, some games "cannot be played" without
    # someone exceeding target's max wins.
    eliminated = flow_val < total_games_capacity
    
    return eliminated, f"Flow: {flow_val}/{total_games_capacity}. Max Wins Possible: {max_wins}"