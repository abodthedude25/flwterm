import networkx as nx

class CapacityScaling:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.delta = 0
        
    def build_graph(self, data):
        self.graph.clear()
        max_cap = 0
        for edge in data['edges']:
            self.graph.add_edge(edge['u'], edge['v'], capacity=edge['capacity'], flow=0)
            max_cap = max(max_cap, edge['capacity'])
            if not self.graph.has_edge(edge['v'], edge['u']):
                self.graph.add_edge(edge['v'], edge['u'], capacity=0, flow=0)
        
        # Initialize delta to largest power of 2 <= max_cap
        self.delta = 1
        while self.delta * 2 <= max_cap:
            self.delta *= 2

    def step(self, source='S', sink='T'):
        """Runs one phase of scaling or finds path in current delta-residual graph."""
        if self.delta < 1:
            return None, 0, "Algorithm Complete"

        # Build Delta-Residual Graph
        R_delta = nx.DiGraph()
        for u, v, d in self.graph.edges(data=True):
            residual = d['capacity'] - d['flow']
            if residual >= self.delta:
                R_delta.add_edge(u, v, capacity=residual)

        try:
            path = nx.shortest_path(R_delta, source, sink)
            bottleneck = float('inf')
            for i in range(len(path) - 1):
                u, v = path[i], path[i+1]
                bottleneck = min(bottleneck, R_delta[u][v]['capacity'])
            
            # Augment
            for i in range(len(path) - 1):
                u, v = path[i], path[i+1]
                if self.graph.has_edge(u, v) and self.graph[u][v]['capacity'] >= self.graph[u][v]['flow'] + bottleneck:
                     self.graph[u][v]['flow'] += bottleneck
                else:
                     self.graph[v][u]['flow'] -= bottleneck
            
            return path, bottleneck, f"Augmented at Delta={self.delta}"
            
        except nx.NetworkXNoPath:
            old_delta = self.delta
            self.delta //= 2
            return [], 0, f"No path at Delta={old_delta}. Reducing Delta to {self.delta}"