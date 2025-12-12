import networkx as nx

class FordFulkerson:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.flow_val = 0
        self.history = []

    def build_graph(self, data):
        self.graph.clear()
        self.flow_val = 0
        self.history = []
        for edge in data['edges']:
            # Initialize flow to 0
            self.graph.add_edge(edge['u'], edge['v'], capacity=edge['capacity'], flow=0)
            # Add reverse edge with 0 capacity for residual graph logic
            if not self.graph.has_edge(edge['v'], edge['u']):
                self.graph.add_edge(edge['v'], edge['u'], capacity=0, flow=0)
    
    def get_residual_graph(self):
        R = nx.DiGraph()
        for u, v, d in self.graph.edges(data=True):
            residual = d['capacity'] - d['flow']
            if residual > 0:
                R.add_edge(u, v, capacity=residual)
        return R

    def step(self, source='S', sink='T'):
        """Finds one augmenting path using BFS (Edmonds-Karp)."""
        R = self.get_residual_graph()
        try:
            path = nx.shortest_path(R, source, sink)
            
            # Find bottleneck capacity
            bottleneck = float('inf')
            for i in range(len(path) - 1):
                u, v = path[i], path[i+1]
                bottleneck = min(bottleneck, R[u][v]['capacity'])
            
            # Augment flow
            for i in range(len(path) - 1):
                u, v = path[i], path[i+1]
                if self.graph.has_edge(u, v) and self.graph[u][v]['capacity'] >= self.graph[u][v]['flow'] + bottleneck:
                     self.graph[u][v]['flow'] += bottleneck
                else:
                     # Push back flow on reverse edge
                     self.graph[v][u]['flow'] -= bottleneck
            
            self.flow_val += bottleneck
            return path, bottleneck
        except nx.NetworkXNoPath:
            return None, 0