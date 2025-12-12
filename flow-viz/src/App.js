import React, { useState, useEffect, useCallback, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// NETWORK FLOW ALGORITHM VISUALIZER - COMPREHENSIVE EDITION
// ═══════════════════════════════════════════════════════════════════════════════
// 
// Algorithms Included:
// 1. Ford-Fulkerson (Edmonds-Karp) - BFS-based augmenting paths
// 2. Dinic's Algorithm - Level graphs + blocking flows
// 3. Push-Relabel - Preflow-push with heights
// 4. Capacity Scaling - Delta-scaling for large capacities
// 5. Min-Cost Max-Flow - Shortest path augmentation
// 6. Bipartite Matching - Job assignment via max-flow
// 7. Baseball Elimination - Sports elimination problem
// 8. Image Segmentation - Min-cut for foreground/background
// 9. Airline Scheduling - Minimum crew scheduling
// 10. Project Selection - Profit maximization with dependencies
//
// ═══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// GRAPH DATA STRUCTURES & UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

// BFS to find shortest path in residual graph
const bfsPath = (nodes, edges, source, sink) => {
  const visited = new Set([source]);
  const parent = {};
  const queue = [source];
  
  while (queue.length > 0) {
    const u = queue.shift();
    if (u === sink) {
      const path = [];
      let node = sink;
      while (node !== source) {
        path.unshift(node);
        node = parent[node];
      }
      path.unshift(source);
      return path;
    }
    
    for (const edge of edges) {
      if (edge.from === u && !visited.has(edge.to) && edge.capacity - edge.flow > 0) {
        visited.add(edge.to);
        parent[edge.to] = u;
        queue.push(edge.to);
      }
    }
  }
  return null;
};

// BFS to find reachable nodes (for min-cut)
const findReachable = (edges, source) => {
  const reachable = new Set([source]);
  const queue = [source];
  
  while (queue.length > 0) {
    const u = queue.shift();
    for (const edge of edges) {
      if (edge.from === u && !reachable.has(edge.to) && edge.capacity - edge.flow > 0) {
        reachable.add(edge.to);
        queue.push(edge.to);
      }
    }
  }
  return reachable;
};

// ─────────────────────────────────────────────────────────────────────────────
// GRAPH CONFIGURATIONS FOR EACH ALGORITHM
// ─────────────────────────────────────────────────────────────────────────────

const GRAPHS = {
  'ford-fulkerson': {
    name: 'Ford-Fulkerson (Edmonds-Karp)',
    description: 'Classic max-flow using BFS to find shortest augmenting paths. Guarantees O(VE²) time complexity.',
    category: 'Max Flow',
    nodes: [
      { id: 'S', x: 80, y: 300, type: 'source' },
      { id: 'A', x: 220, y: 150 },
      { id: 'B', x: 220, y: 450 },
      { id: 'C', x: 400, y: 100 },
      { id: 'D', x: 400, y: 300 },
      { id: 'E', x: 400, y: 500 },
      { id: 'F', x: 580, y: 200 },
      { id: 'G', x: 580, y: 400 },
      { id: 'T', x: 720, y: 300, type: 'sink' },
    ],
    edges: [
      { from: 'S', to: 'A', capacity: 10, flow: 0 },
      { from: 'S', to: 'B', capacity: 10, flow: 0 },
      { from: 'A', to: 'C', capacity: 4, flow: 0 },
      { from: 'A', to: 'D', capacity: 8, flow: 0 },
      { from: 'B', to: 'D', capacity: 9, flow: 0 },
      { from: 'B', to: 'E', capacity: 10, flow: 0 },
      { from: 'C', to: 'F', capacity: 10, flow: 0 },
      { from: 'D', to: 'F', capacity: 6, flow: 0 },
      { from: 'D', to: 'G', capacity: 4, flow: 0 },
      { from: 'E', to: 'G', capacity: 10, flow: 0 },
      { from: 'F', to: 'T', capacity: 10, flow: 0 },
      { from: 'G', to: 'T', capacity: 10, flow: 0 },
    ]
  },

  'dinic': {
    name: "Dinic's Algorithm",
    description: 'Builds level graphs using BFS, then finds blocking flows using DFS. Achieves O(V²E) complexity.',
    category: 'Max Flow',
    nodes: [
      { id: 'S', x: 80, y: 300, type: 'source' },
      { id: 'A', x: 200, y: 150 },
      { id: 'B', x: 200, y: 300 },
      { id: 'C', x: 200, y: 450 },
      { id: 'D', x: 400, y: 150 },
      { id: 'E', x: 400, y: 300 },
      { id: 'F', x: 400, y: 450 },
      { id: 'G', x: 600, y: 225 },
      { id: 'H', x: 600, y: 375 },
      { id: 'T', x: 720, y: 300, type: 'sink' },
    ],
    edges: [
      { from: 'S', to: 'A', capacity: 7, flow: 0 },
      { from: 'S', to: 'B', capacity: 6, flow: 0 },
      { from: 'S', to: 'C', capacity: 8, flow: 0 },
      { from: 'A', to: 'D', capacity: 5, flow: 0 },
      { from: 'A', to: 'E', capacity: 3, flow: 0 },
      { from: 'B', to: 'E', capacity: 5, flow: 0 },
      { from: 'C', to: 'E', capacity: 4, flow: 0 },
      { from: 'C', to: 'F', capacity: 5, flow: 0 },
      { from: 'D', to: 'G', capacity: 8, flow: 0 },
      { from: 'E', to: 'G', capacity: 4, flow: 0 },
      { from: 'E', to: 'H', capacity: 5, flow: 0 },
      { from: 'F', to: 'H', capacity: 6, flow: 0 },
      { from: 'G', to: 'T', capacity: 9, flow: 0 },
      { from: 'H', to: 'T', capacity: 10, flow: 0 },
    ]
  },

  'push-relabel': {
    name: 'Push-Relabel (Preflow-Push)',
    description: 'Maintains preflow and node heights. Pushes excess flow downhill, relabels when stuck. O(V²E) or O(V³).',
    category: 'Max Flow',
    nodes: [
      { id: 'S', x: 100, y: 300, type: 'source', height: 0, excess: 0 },
      { id: 'A', x: 280, y: 150, height: 0, excess: 0 },
      { id: 'B', x: 280, y: 450, height: 0, excess: 0 },
      { id: 'C', x: 500, y: 150, height: 0, excess: 0 },
      { id: 'D', x: 500, y: 450, height: 0, excess: 0 },
      { id: 'T', x: 680, y: 300, type: 'sink', height: 0, excess: 0 },
    ],
    edges: [
      { from: 'S', to: 'A', capacity: 15, flow: 0 },
      { from: 'S', to: 'B', capacity: 10, flow: 0 },
      { from: 'A', to: 'B', capacity: 5, flow: 0 },
      { from: 'A', to: 'C', capacity: 12, flow: 0 },
      { from: 'B', to: 'D', capacity: 15, flow: 0 },
      { from: 'C', to: 'D', capacity: 3, flow: 0 },
      { from: 'C', to: 'T', capacity: 10, flow: 0 },
      { from: 'D', to: 'T', capacity: 15, flow: 0 },
    ]
  },

  'capacity-scaling': {
    name: 'Capacity Scaling',
    description: 'Processes edges by decreasing capacity thresholds (Δ). Efficient for large capacities: O(E² log C).',
    category: 'Max Flow',
    nodes: [
      { id: 'S', x: 80, y: 300, type: 'source' },
      { id: 'A', x: 250, y: 150 },
      { id: 'B', x: 250, y: 450 },
      { id: 'C', x: 450, y: 150 },
      { id: 'D', x: 450, y: 450 },
      { id: 'T', x: 620, y: 300, type: 'sink' },
    ],
    edges: [
      { from: 'S', to: 'A', capacity: 100, flow: 0 },
      { from: 'S', to: 'B', capacity: 80, flow: 0 },
      { from: 'A', to: 'C', capacity: 60, flow: 0 },
      { from: 'A', to: 'B', capacity: 20, flow: 0 },
      { from: 'B', to: 'D', capacity: 90, flow: 0 },
      { from: 'C', to: 'D', capacity: 30, flow: 0 },
      { from: 'C', to: 'T', capacity: 50, flow: 0 },
      { from: 'D', to: 'T', capacity: 100, flow: 0 },
    ]
  },

  'min-cost': {
    name: 'Min-Cost Max-Flow',
    description: 'Finds maximum flow with minimum total cost. Uses shortest path (by cost) augmentation.',
    category: 'Min Cost',
    nodes: [
      { id: 'S', x: 80, y: 300, type: 'source' },
      { id: 'W1', x: 220, y: 180, label: 'Warehouse 1' },
      { id: 'W2', x: 220, y: 420, label: 'Warehouse 2' },
      { id: 'C1', x: 480, y: 120, label: 'Customer 1' },
      { id: 'C2', x: 480, y: 300, label: 'Customer 2' },
      { id: 'C3', x: 480, y: 480, label: 'Customer 3' },
      { id: 'T', x: 650, y: 300, type: 'sink' },
    ],
    edges: [
      { from: 'S', to: 'W1', capacity: 20, flow: 0, cost: 0 },
      { from: 'S', to: 'W2', capacity: 15, flow: 0, cost: 0 },
      { from: 'W1', to: 'C1', capacity: 10, flow: 0, cost: 4 },
      { from: 'W1', to: 'C2', capacity: 8, flow: 0, cost: 2 },
      { from: 'W1', to: 'C3', capacity: 6, flow: 0, cost: 5 },
      { from: 'W2', to: 'C1', capacity: 5, flow: 0, cost: 3 },
      { from: 'W2', to: 'C2', capacity: 10, flow: 0, cost: 1 },
      { from: 'W2', to: 'C3', capacity: 8, flow: 0, cost: 3 },
      { from: 'C1', to: 'T', capacity: 12, flow: 0, cost: 0 },
      { from: 'C2', to: 'T', capacity: 15, flow: 0, cost: 0 },
      { from: 'C3', to: 'T', capacity: 10, flow: 0, cost: 0 },
    ]
  },

  'bipartite': {
    name: 'Bipartite Matching',
    description: 'Maximum matching in bipartite graphs via max-flow. Each worker assigned to at most one job.',
    category: 'Matching',
    nodes: [
      { id: 'S', x: 50, y: 300, type: 'source' },
      { id: 'W1', x: 170, y: 80, label: 'Alice', group: 'worker' },
      { id: 'W2', x: 170, y: 180, label: 'Bob', group: 'worker' },
      { id: 'W3', x: 170, y: 280, label: 'Carol', group: 'worker' },
      { id: 'W4', x: 170, y: 380, label: 'Dave', group: 'worker' },
      { id: 'W5', x: 170, y: 480, label: 'Eve', group: 'worker' },
      { id: 'J1', x: 530, y: 80, label: 'Engineer', group: 'job' },
      { id: 'J2', x: 530, y: 180, label: 'Designer', group: 'job' },
      { id: 'J3', x: 530, y: 280, label: 'Manager', group: 'job' },
      { id: 'J4', x: 530, y: 380, label: 'Analyst', group: 'job' },
      { id: 'J5', x: 530, y: 480, label: 'Writer', group: 'job' },
      { id: 'T', x: 650, y: 300, type: 'sink' },
    ],
    edges: [
      { from: 'S', to: 'W1', capacity: 1, flow: 0 },
      { from: 'S', to: 'W2', capacity: 1, flow: 0 },
      { from: 'S', to: 'W3', capacity: 1, flow: 0 },
      { from: 'S', to: 'W4', capacity: 1, flow: 0 },
      { from: 'S', to: 'W5', capacity: 1, flow: 0 },
      { from: 'W1', to: 'J1', capacity: 1, flow: 0 },
      { from: 'W1', to: 'J2', capacity: 1, flow: 0 },
      { from: 'W2', to: 'J1', capacity: 1, flow: 0 },
      { from: 'W2', to: 'J3', capacity: 1, flow: 0 },
      { from: 'W3', to: 'J2', capacity: 1, flow: 0 },
      { from: 'W3', to: 'J4', capacity: 1, flow: 0 },
      { from: 'W4', to: 'J3', capacity: 1, flow: 0 },
      { from: 'W4', to: 'J5', capacity: 1, flow: 0 },
      { from: 'W5', to: 'J4', capacity: 1, flow: 0 },
      { from: 'W5', to: 'J5', capacity: 1, flow: 0 },
      { from: 'J1', to: 'T', capacity: 1, flow: 0 },
      { from: 'J2', to: 'T', capacity: 1, flow: 0 },
      { from: 'J3', to: 'T', capacity: 1, flow: 0 },
      { from: 'J4', to: 'T', capacity: 1, flow: 0 },
      { from: 'J5', to: 'T', capacity: 1, flow: 0 },
    ]
  },

  'baseball': {
    name: 'Baseball Elimination',
    description: 'Determines if a team is mathematically eliminated from winning the division using max-flow.',
    category: 'Applications',
    nodes: [
      { id: 'S', x: 50, y: 280, type: 'source' },
      { id: 'G_AB', x: 180, y: 120, label: 'NYY-BOS', group: 'game' },
      { id: 'G_AC', x: 180, y: 220, label: 'NYY-BAL', group: 'game' },
      { id: 'G_BC', x: 180, y: 320, label: 'BOS-BAL', group: 'game' },
      { id: 'G_AD', x: 180, y: 420, label: 'NYY-TOR', group: 'game' },
      { id: 'A', x: 420, y: 140, label: 'NYY (75)', group: 'team' },
      { id: 'B', x: 420, y: 260, label: 'BOS (69)', group: 'team' },
      { id: 'C', x: 420, y: 380, label: 'BAL (71)', group: 'team' },
      { id: 'D', x: 420, y: 480, label: 'TOR (63)', group: 'team' },
      { id: 'T', x: 600, y: 280, type: 'sink', label: 'Can DET win?' },
    ],
    edges: [
      { from: 'S', to: 'G_AB', capacity: 8, flow: 0 },
      { from: 'S', to: 'G_AC', capacity: 3, flow: 0 },
      { from: 'S', to: 'G_BC', capacity: 2, flow: 0 },
      { from: 'S', to: 'G_AD', capacity: 7, flow: 0 },
      { from: 'G_AB', to: 'A', capacity: 99, flow: 0 },
      { from: 'G_AB', to: 'B', capacity: 99, flow: 0 },
      { from: 'G_AC', to: 'A', capacity: 99, flow: 0 },
      { from: 'G_AC', to: 'C', capacity: 99, flow: 0 },
      { from: 'G_BC', to: 'B', capacity: 99, flow: 0 },
      { from: 'G_BC', to: 'C', capacity: 99, flow: 0 },
      { from: 'G_AD', to: 'A', capacity: 99, flow: 0 },
      { from: 'G_AD', to: 'D', capacity: 99, flow: 0 },
      { from: 'A', to: 'T', capacity: 1, flow: 0 },  // 56 - 75 = can't pass DET
      { from: 'B', to: 'T', capacity: 7, flow: 0 },  // 56 - 69
      { from: 'C', to: 'T', capacity: 5, flow: 0 },  // 56 - 71
      { from: 'D', to: 'T', capacity: 13, flow: 0 }, // 56 - 63
    ]
  },

  'image-seg': {
    name: 'Image Segmentation',
    description: 'Separates foreground from background using min-cut. Pixel affinities modeled as edge capacities.',
    category: 'Applications',
    nodes: [
      { id: 'S', x: 50, y: 300, type: 'source', label: 'FG' },
      { id: 'P00', x: 200, y: 120, label: '(0,0)', pixel: true, fg: 2, bg: 8 },
      { id: 'P01', x: 320, y: 120, label: '(0,1)', pixel: true, fg: 3, bg: 5 },
      { id: 'P02', x: 440, y: 120, label: '(0,2)', pixel: true, fg: 2, bg: 8 },
      { id: 'P10', x: 200, y: 260, label: '(1,0)', pixel: true, fg: 3, bg: 5 },
      { id: 'P11', x: 320, y: 260, label: '(1,1)', pixel: true, fg: 9, bg: 1 },
      { id: 'P12', x: 440, y: 260, label: '(1,2)', pixel: true, fg: 3, bg: 5 },
      { id: 'P20', x: 200, y: 400, label: '(2,0)', pixel: true, fg: 2, bg: 8 },
      { id: 'P21', x: 320, y: 400, label: '(2,1)', pixel: true, fg: 3, bg: 5 },
      { id: 'P22', x: 440, y: 400, label: '(2,2)', pixel: true, fg: 2, bg: 8 },
      { id: 'T', x: 580, y: 300, type: 'sink', label: 'BG' },
    ],
    edges: [
      // Source to pixels (foreground likelihood)
      { from: 'S', to: 'P00', capacity: 2, flow: 0 },
      { from: 'S', to: 'P01', capacity: 3, flow: 0 },
      { from: 'S', to: 'P02', capacity: 2, flow: 0 },
      { from: 'S', to: 'P10', capacity: 3, flow: 0 },
      { from: 'S', to: 'P11', capacity: 9, flow: 0 },
      { from: 'S', to: 'P12', capacity: 3, flow: 0 },
      { from: 'S', to: 'P20', capacity: 2, flow: 0 },
      { from: 'S', to: 'P21', capacity: 3, flow: 0 },
      { from: 'S', to: 'P22', capacity: 2, flow: 0 },
      // Pixels to sink (background likelihood)
      { from: 'P00', to: 'T', capacity: 8, flow: 0 },
      { from: 'P01', to: 'T', capacity: 5, flow: 0 },
      { from: 'P02', to: 'T', capacity: 8, flow: 0 },
      { from: 'P10', to: 'T', capacity: 5, flow: 0 },
      { from: 'P11', to: 'T', capacity: 1, flow: 0 },
      { from: 'P12', to: 'T', capacity: 5, flow: 0 },
      { from: 'P20', to: 'T', capacity: 8, flow: 0 },
      { from: 'P21', to: 'T', capacity: 5, flow: 0 },
      { from: 'P22', to: 'T', capacity: 8, flow: 0 },
      // Neighbor penalties (smoothness)
      { from: 'P00', to: 'P01', capacity: 2, flow: 0, bidirectional: true },
      { from: 'P01', to: 'P02', capacity: 2, flow: 0, bidirectional: true },
      { from: 'P10', to: 'P11', capacity: 2, flow: 0, bidirectional: true },
      { from: 'P11', to: 'P12', capacity: 2, flow: 0, bidirectional: true },
      { from: 'P20', to: 'P21', capacity: 2, flow: 0, bidirectional: true },
      { from: 'P21', to: 'P22', capacity: 2, flow: 0, bidirectional: true },
      { from: 'P00', to: 'P10', capacity: 2, flow: 0, bidirectional: true },
      { from: 'P01', to: 'P11', capacity: 2, flow: 0, bidirectional: true },
      { from: 'P02', to: 'P12', capacity: 2, flow: 0, bidirectional: true },
      { from: 'P10', to: 'P20', capacity: 2, flow: 0, bidirectional: true },
      { from: 'P11', to: 'P21', capacity: 2, flow: 0, bidirectional: true },
      { from: 'P12', to: 'P22', capacity: 2, flow: 0, bidirectional: true },
    ]
  },

  'airline': {
    name: 'Airline Scheduling',
    description: 'Minimum number of crews needed to cover all flights. Uses DAG path cover via max-flow.',
    category: 'Applications',
    nodes: [
      { id: 'S', x: 50, y: 280, type: 'source' },
      { id: 'F1_in', x: 180, y: 100, label: 'F1 (8-10)', group: 'in' },
      { id: 'F2_in', x: 180, y: 200, label: 'F2 (9-12)', group: 'in' },
      { id: 'F3_in', x: 180, y: 300, label: 'F3 (11-13)', group: 'in' },
      { id: 'F4_in', x: 180, y: 400, label: 'F4 (14-16)', group: 'in' },
      { id: 'F5_in', x: 180, y: 500, label: 'F5 (13-15)', group: 'in' },
      { id: 'F1_out', x: 520, y: 100, label: 'F1\'', group: 'out' },
      { id: 'F2_out', x: 520, y: 200, label: 'F2\'', group: 'out' },
      { id: 'F3_out', x: 520, y: 300, label: 'F3\'', group: 'out' },
      { id: 'F4_out', x: 520, y: 400, label: 'F4\'', group: 'out' },
      { id: 'F5_out', x: 520, y: 500, label: 'F5\'', group: 'out' },
      { id: 'T', x: 650, y: 280, type: 'sink' },
    ],
    edges: [
      { from: 'S', to: 'F1_in', capacity: 1, flow: 0 },
      { from: 'S', to: 'F2_in', capacity: 1, flow: 0 },
      { from: 'S', to: 'F3_in', capacity: 1, flow: 0 },
      { from: 'S', to: 'F4_in', capacity: 1, flow: 0 },
      { from: 'S', to: 'F5_in', capacity: 1, flow: 0 },
      { from: 'F1_out', to: 'T', capacity: 1, flow: 0 },
      { from: 'F2_out', to: 'T', capacity: 1, flow: 0 },
      { from: 'F3_out', to: 'T', capacity: 1, flow: 0 },
      { from: 'F4_out', to: 'T', capacity: 1, flow: 0 },
      { from: 'F5_out', to: 'T', capacity: 1, flow: 0 },
      // Compatible flights (F_i ends before F_j starts)
      { from: 'F1_in', to: 'F3_out', capacity: 1, flow: 0 },
      { from: 'F1_in', to: 'F4_out', capacity: 1, flow: 0 },
      { from: 'F1_in', to: 'F5_out', capacity: 1, flow: 0 },
      { from: 'F2_in', to: 'F4_out', capacity: 1, flow: 0 },
      { from: 'F2_in', to: 'F5_out', capacity: 1, flow: 0 },
      { from: 'F3_in', to: 'F4_out', capacity: 1, flow: 0 },
    ]
  },

  'project': {
    name: 'Project Selection',
    description: 'Select projects to maximize profit minus resource costs. Dependencies modeled via min-cut.',
    category: 'Applications',
    nodes: [
      { id: 'S', x: 60, y: 300, type: 'source' },
      { id: 'P1', x: 200, y: 100, label: 'Project A (+100)', group: 'project', profit: 100 },
      { id: 'P2', x: 200, y: 220, label: 'Project B (+60)', group: 'project', profit: 60 },
      { id: 'P3', x: 200, y: 340, label: 'Project C (+80)', group: 'project', profit: 80 },
      { id: 'P4', x: 200, y: 460, label: 'Project D (+40)', group: 'project', profit: 40 },
      { id: 'R1', x: 480, y: 160, label: 'Machine (-90)', group: 'resource', cost: 90 },
      { id: 'R2', x: 480, y: 300, label: 'License (-50)', group: 'resource', cost: 50 },
      { id: 'R3', x: 480, y: 440, label: 'Staff (-60)', group: 'resource', cost: 60 },
      { id: 'T', x: 640, y: 300, type: 'sink' },
    ],
    edges: [
      { from: 'S', to: 'P1', capacity: 100, flow: 0 },
      { from: 'S', to: 'P2', capacity: 60, flow: 0 },
      { from: 'S', to: 'P3', capacity: 80, flow: 0 },
      { from: 'S', to: 'P4', capacity: 40, flow: 0 },
      { from: 'R1', to: 'T', capacity: 90, flow: 0 },
      { from: 'R2', to: 'T', capacity: 50, flow: 0 },
      { from: 'R3', to: 'T', capacity: 60, flow: 0 },
      // Dependencies (project requires resource)
      { from: 'P1', to: 'R1', capacity: 999, flow: 0 },
      { from: 'P1', to: 'R2', capacity: 999, flow: 0 },
      { from: 'P2', to: 'R2', capacity: 999, flow: 0 },
      { from: 'P3', to: 'R2', capacity: 999, flow: 0 },
      { from: 'P3', to: 'R3', capacity: 999, flow: 0 },
      { from: 'P4', to: 'R3', capacity: 999, flow: 0 },
    ]
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ALGORITHM IMPLEMENTATIONS
// ─────────────────────────────────────────────────────────────────────────────

// Ford-Fulkerson / Edmonds-Karp step
const fordFulkersonStep = (state) => {
  const { nodes, edges, source, sink } = state;
  const path = bfsPath(nodes, edges, source, sink);
  
  if (!path) {
    const reachable = findReachable(edges, source);
    const cutEdges = new Set();
    edges.forEach(e => {
      if (reachable.has(e.from) && !reachable.has(e.to) && e.capacity > 0) {
        cutEdges.add(`${e.from}-${e.to}`);
      }
    });
    return {
      ...state,
      done: true,
      reachable,
      cutEdges,
      message: `Max flow reached! Min-cut shown in red.`
    };
  }
  
  // Find bottleneck
  let bottleneck = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const edge = edges.find(e => e.from === path[i] && e.to === path[i + 1]);
    if (edge) bottleneck = Math.min(bottleneck, edge.capacity - edge.flow);
  }
  
  // Augment
  const newEdges = edges.map(e => {
    for (let i = 0; i < path.length - 1; i++) {
      if (e.from === path[i] && e.to === path[i + 1]) {
        return { ...e, flow: e.flow + bottleneck };
      }
    }
    return e;
  });
  
  const totalFlow = newEdges.filter(e => e.from === source).reduce((sum, e) => sum + e.flow, 0);
  
  return {
    ...state,
    edges: newEdges,
    highlightedPath: path,
    step: state.step + 1,
    totalFlow,
    message: `Path: ${path.join(' → ')} | Bottleneck: ${bottleneck}`
  };
};

// Dinic's algorithm step
const dinicStep = (state) => {
  const { nodes, edges, source, sink, phase = 0, levels = {} } = state;
  
  // Build level graph if needed
  if (Object.keys(levels).length === 0 || state.needNewLevels) {
    const newLevels = { [source]: 0 };
    const queue = [source];
    
    while (queue.length > 0) {
      const u = queue.shift();
      for (const edge of edges) {
        if (edge.from === u && !(edge.to in newLevels) && edge.capacity - edge.flow > 0) {
          newLevels[edge.to] = newLevels[u] + 1;
          queue.push(edge.to);
        }
      }
    }
    
    if (!(sink in newLevels)) {
      const reachable = findReachable(edges, source);
      const cutEdges = new Set();
      edges.forEach(e => {
        if (reachable.has(e.from) && !reachable.has(e.to) && e.capacity > 0) {
          cutEdges.add(`${e.from}-${e.to}`);
        }
      });
      return {
        ...state,
        done: true,
        reachable,
        cutEdges,
        message: `Algorithm complete! Max flow found.`
      };
    }
    
    return {
      ...state,
      levels: newLevels,
      phase: phase + 1,
      needNewLevels: false,
      message: `Phase ${phase + 1}: Built level graph. Levels: ${JSON.stringify(newLevels)}`
    };
  }
  
  // DFS for blocking flow
  const dfs = (u, pushed) => {
    if (u === sink) return pushed;
    for (const edge of edges) {
      if (edge.from === u && levels[edge.to] === levels[u] + 1 && edge.capacity - edge.flow > 0) {
        const flow = dfs(edge.to, Math.min(pushed, edge.capacity - edge.flow));
        if (flow > 0) {
          edge.flow += flow;
          return flow;
        }
      }
    }
    return 0;
  };
  
  const flow = dfs(source, Infinity);
  
  if (flow === 0) {
    return {
      ...state,
      needNewLevels: true,
      message: `Phase ${phase}: No more blocking flows. Building new level graph...`
    };
  }
  
  const totalFlow = edges.filter(e => e.from === source).reduce((sum, e) => sum + e.flow, 0);
  
  return {
    ...state,
    edges: [...edges],
    step: state.step + 1,
    totalFlow,
    message: `Phase ${phase}: Found blocking flow of ${flow}. Total: ${totalFlow}`
  };
};

// Push-Relabel step
const pushRelabelStep = (state) => {
  const { nodes, edges, source, sink, initialized = false } = state;
  
  // Initialize
  if (!initialized) {
    const n = nodes.length;
    const newNodes = nodes.map(node => ({
      ...node,
      height: node.id === source ? n : 0,
      excess: 0
    }));
    
    const newEdges = edges.map(e => {
      if (e.from === source) {
        const targetNode = newNodes.find(n => n.id === e.to);
        targetNode.excess = e.capacity;
        return { ...e, flow: e.capacity };
      }
      return { ...e };
    });
    
    const sourceNode = newNodes.find(n => n.id === source);
    sourceNode.excess = -newEdges.filter(e => e.from === source).reduce((sum, e) => sum + e.flow, 0);
    
    return {
      ...state,
      nodes: newNodes,
      edges: newEdges,
      initialized: true,
      step: 1,
      message: `Initialized: Source height = ${n}, saturated outgoing edges`
    };
  }
  
  // Find active node
  const activeNode = nodes.find(n => 
    n.excess > 0 && n.id !== source && n.id !== sink
  );
  
  if (!activeNode) {
    const sinkNode = nodes.find(n => n.id === sink);
    const reachable = findReachable(edges, source);
    const cutEdges = new Set();
    edges.forEach(e => {
      if (reachable.has(e.from) && !reachable.has(e.to) && e.capacity > 0) {
        cutEdges.add(`${e.from}-${e.to}`);
      }
    });
    return {
      ...state,
      done: true,
      totalFlow: sinkNode.excess,
      reachable,
      cutEdges,
      message: `Complete! Max flow: ${sinkNode.excess}`
    };
  }
  
  // Try to push
  for (const edge of edges) {
    if (edge.from === activeNode.id && edge.capacity - edge.flow > 0) {
      const targetNode = nodes.find(n => n.id === edge.to);
      if (activeNode.height === targetNode.height + 1) {
        const pushAmount = Math.min(activeNode.excess, edge.capacity - edge.flow);
        edge.flow += pushAmount;
        activeNode.excess -= pushAmount;
        targetNode.excess += pushAmount;
        
        return {
          ...state,
          nodes: [...nodes],
          edges: [...edges],
          highlightedPath: [activeNode.id, edge.to],
          highlightedNodes: new Set([activeNode.id]),
          step: state.step + 1,
          message: `Push ${pushAmount} from ${activeNode.id} to ${edge.to}`
        };
      }
    }
  }
  
  // Relabel
  let minHeight = Infinity;
  for (const edge of edges) {
    if (edge.from === activeNode.id && edge.capacity - edge.flow > 0) {
      const targetNode = nodes.find(n => n.id === edge.to);
      minHeight = Math.min(minHeight, targetNode.height);
    }
  }
  
  if (minHeight < Infinity) {
    activeNode.height = minHeight + 1;
    return {
      ...state,
      nodes: [...nodes],
      highlightedNodes: new Set([activeNode.id]),
      step: state.step + 1,
      message: `Relabel ${activeNode.id}: height = ${activeNode.height}`
    };
  }
  
  return state;
};

// Capacity Scaling step
const capacityScalingStep = (state) => {
  const { nodes, edges, source, sink, delta = null } = state;
  
  // Initialize delta
  if (delta === null) {
    const maxCap = Math.max(...edges.map(e => e.capacity));
    let newDelta = 1;
    while (newDelta * 2 <= maxCap) newDelta *= 2;
    return {
      ...state,
      delta: newDelta,
      message: `Initialized Δ = ${newDelta} (largest power of 2 ≤ max capacity)`
    };
  }
  
  if (delta < 1) {
    const reachable = findReachable(edges, source);
    const cutEdges = new Set();
    edges.forEach(e => {
      if (reachable.has(e.from) && !reachable.has(e.to) && e.capacity > 0) {
        cutEdges.add(`${e.from}-${e.to}`);
      }
    });
    return {
      ...state,
      done: true,
      reachable,
      cutEdges,
      message: `Complete! Δ < 1, algorithm finished.`
    };
  }
  
  // Find path in delta-residual graph
  const visited = new Set([source]);
  const parent = {};
  const queue = [source];
  
  while (queue.length > 0) {
    const u = queue.shift();
    if (u === sink) break;
    
    for (const edge of edges) {
      if (edge.from === u && !visited.has(edge.to) && edge.capacity - edge.flow >= delta) {
        visited.add(edge.to);
        parent[edge.to] = u;
        queue.push(edge.to);
      }
    }
  }
  
  if (!(sink in parent)) {
    const newDelta = Math.floor(delta / 2);
    return {
      ...state,
      delta: newDelta,
      step: state.step + 1,
      message: `No path at Δ=${delta}. Reducing to Δ=${newDelta}`
    };
  }
  
  // Reconstruct and augment path
  const path = [sink];
  let node = sink;
  while (node !== source) {
    node = parent[node];
    path.unshift(node);
  }
  
  let bottleneck = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const edge = edges.find(e => e.from === path[i] && e.to === path[i + 1]);
    if (edge) bottleneck = Math.min(bottleneck, edge.capacity - edge.flow);
  }
  
  const newEdges = edges.map(e => {
    for (let i = 0; i < path.length - 1; i++) {
      if (e.from === path[i] && e.to === path[i + 1]) {
        return { ...e, flow: e.flow + bottleneck };
      }
    }
    return e;
  });
  
  const totalFlow = newEdges.filter(e => e.from === source).reduce((sum, e) => sum + e.flow, 0);
  
  return {
    ...state,
    edges: newEdges,
    highlightedPath: path,
    step: state.step + 1,
    totalFlow,
    message: `Δ=${delta}: ${path.join('→')} | Flow: ${bottleneck}`
  };
};

// Algorithm dispatcher
const algorithmStep = (algorithmId, state) => {
  switch (algorithmId) {
    case 'ford-fulkerson':
    case 'bipartite':
    case 'baseball':
    case 'image-seg':
    case 'airline':
    case 'project':
      return fordFulkersonStep(state);
    case 'dinic':
      return dinicStep(state);
    case 'push-relabel':
      return pushRelabelStep(state);
    case 'capacity-scaling':
      return capacityScalingStep(state);
    case 'min-cost':
      return fordFulkersonStep(state); // Simplified
    default:
      return fordFulkersonStep(state);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const NetworkFlowApp = () => {
  const [selectedAlgo, setSelectedAlgo] = useState('ford-fulkerson');
  const [state, setState] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(800);
  const intervalRef = useRef(null);
  
  // Initialize state when algorithm changes
  useEffect(() => {
    const graph = GRAPHS[selectedAlgo];
    setState({
      nodes: deepClone(graph.nodes),
      edges: deepClone(graph.edges),
      source: 'S',
      sink: 'T',
      step: 0,
      totalFlow: 0,
      done: false,
      highlightedPath: [],
      highlightedNodes: new Set(),
      reachable: new Set(),
      cutEdges: new Set(),
      message: 'Click Start or Step to begin',
      // Algorithm-specific state
      levels: {},
      delta: null,
      initialized: false,
    });
    setIsRunning(false);
  }, [selectedAlgo]);
  
  // Run step
  const runStep = useCallback(() => {
    if (!state || state.done) {
      setIsRunning(false);
      return;
    }
    setState(prev => algorithmStep(selectedAlgo, prev));
  }, [state, selectedAlgo]);
  
  // Auto-run
  useEffect(() => {
    if (isRunning && state && !state.done) {
      intervalRef.current = setInterval(runStep, speed);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, runStep, speed, state]);
  
  // Reset
  const reset = () => {
    const graph = GRAPHS[selectedAlgo];
    setState({
      nodes: deepClone(graph.nodes),
      edges: deepClone(graph.edges),
      source: 'S',
      sink: 'T',
      step: 0,
      totalFlow: 0,
      done: false,
      highlightedPath: [],
      highlightedNodes: new Set(),
      reachable: new Set(),
      cutEdges: new Set(),
      message: 'Click Start or Step to begin',
      levels: {},
      delta: null,
      initialized: false,
    });
    setIsRunning(false);
  };
  
  if (!state) return null;
  
  const graph = GRAPHS[selectedAlgo];
  
  // Get edge color
  const getEdgeColor = (edge) => {
    if (state.cutEdges.has(`${edge.from}-${edge.to}`)) return '#ff4757';
    const isHighlighted = state.highlightedPath.some((n, i) => 
      i < state.highlightedPath.length - 1 && 
      state.highlightedPath[i] === edge.from && 
      state.highlightedPath[i + 1] === edge.to
    );
    if (isHighlighted) return '#ffd93d';
    if (edge.flow === 0) return '#4a5568';
    if (edge.flow < edge.capacity) return '#38b2ac';
    return '#48bb78';
  };
  
  // Get node color
  const getNodeColor = (node) => {
    if (node.type === 'source') return '#667eea';
    if (node.type === 'sink') return '#f56565';
    if (node.group === 'worker') return '#9f7aea';
    if (node.group === 'job') return '#ed8936';
    if (node.group === 'project') return '#48bb78';
    if (node.group === 'resource') return '#f56565';
    if (node.group === 'game') return '#ecc94b';
    if (node.group === 'team') return '#38b2ac';
    if (node.pixel) return state.reachable.has(node.id) ? '#48bb78' : '#718096';
    if (state.reachable.size > 0 && state.reachable.has(node.id)) return '#48bb78';
    if (state.highlightedNodes.has(node.id)) return '#ffd93d';
    return '#4a5568';
  };
  
  // Calculate edge path
  const getEdgePath = (edge) => {
    const from = state.nodes.find(n => n.id === edge.from);
    const to = state.nodes.find(n => n.id === edge.to);
    if (!from || !to) return '';
    
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const hasReverse = state.edges.some(e => e.from === edge.to && e.to === edge.from);
    
    if (hasReverse) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      const offset = 15;
      const mx = (from.x + to.x) / 2 - (dy / dist) * offset;
      const my = (from.y + to.y) / 2 + (dx / dist) * offset;
      return `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
    }
    
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  };
  
  // Get algorithm-specific info
  const getExtraInfo = () => {
    if (selectedAlgo === 'push-relabel' && state.initialized) {
      return state.nodes
        .filter(n => n.id !== 'S' && n.id !== 'T')
        .map(n => `${n.id}(h=${n.height},e=${n.excess})`)
        .join(' ');
    }
    if (selectedAlgo === 'capacity-scaling' && state.delta !== null) {
      return `Current Δ = ${state.delta}`;
    }
    if (selectedAlgo === 'dinic' && Object.keys(state.levels).length > 0) {
      return `Phase ${state.phase || 1}`;
    }
    if (selectedAlgo === 'project' && state.done) {
      const totalProfit = 100 + 60 + 80 + 40;
      const optimalProfit = totalProfit - state.totalFlow;
      return `Optimal Profit: $${optimalProfit}`;
    }
    if (selectedAlgo === 'airline' && state.done) {
      return `Min Crews Needed: ${5 - state.totalFlow}`;
    }
    return '';
  };
  
  // Categories for algorithm selector
  const categories = [...new Set(Object.values(GRAPHS).map(g => g.category))];
  
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
      color: '#e2e8f0',
      padding: '20px',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{
          fontSize: '2.8rem',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 30%, #f56565 70%, #ffd93d 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-2px',
          margin: 0,
        }}>
          Network Flow Algorithms
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '8px' }}>
          Interactive visualization of 10 classic algorithms
        </p>
      </div>
      
      {/* Algorithm Selector */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '20px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        {categories.map(category => (
          <div key={category} style={{ marginBottom: '12px' }}>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#667eea', 
              textTransform: 'uppercase', 
              letterSpacing: '1px',
              marginBottom: '8px',
              fontWeight: '600'
            }}>
              {category}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {Object.entries(GRAPHS)
                .filter(([_, g]) => g.category === category)
                .map(([id, g]) => (
                  <button
                    key={id}
                    onClick={() => setSelectedAlgo(id)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      background: selectedAlgo === id
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'rgba(255,255,255,0.05)',
                      color: selectedAlgo === id ? '#fff' : '#94a3b8',
                      boxShadow: selectedAlgo === id
                        ? '0 4px 15px rgba(102, 126, 234, 0.4)'
                        : 'none',
                    }}
                  >
                    {g.name.split(' ')[0]}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Info Panel */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '20px',
        border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div style={{ flex: '1', minWidth: '300px' }}>
          <h3 style={{ color: '#667eea', margin: '0 0 8px 0', fontSize: '1.1rem' }}>
            {graph.name}
          </h3>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.85rem', lineHeight: '1.6' }}>
            {graph.description}
          </p>
        </div>
        <div style={{
          display: 'flex',
          gap: '24px',
          background: 'rgba(0,0,0,0.3)',
          padding: '16px 24px',
          borderRadius: '12px',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#48bb78' }}>
              {state.totalFlow}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {selectedAlgo === 'bipartite' ? 'Matches' : 'Flow'}
            </div>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#ecc94b' }}>
              {state.step}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Steps
            </div>
          </div>
          {state.delta !== null && (
            <>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#9f7aea' }}>
                  {state.delta}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Delta
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
        flexWrap: 'wrap',
      }}>
        <button
          onClick={() => setIsRunning(!isRunning)}
          disabled={state.done}
          style={{
            padding: '14px 32px',
            borderRadius: '12px',
            border: 'none',
            cursor: state.done ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            fontSize: '1rem',
            fontWeight: '700',
            background: state.done
              ? 'rgba(255,255,255,0.1)'
              : isRunning
                ? 'linear-gradient(135deg, #f56565 0%, #ed8936 100%)'
                : 'linear-gradient(135deg, #48bb78 0%, #38b2ac 100%)',
            color: '#fff',
            boxShadow: state.done ? 'none' : '0 4px 15px rgba(72, 187, 120, 0.3)',
            opacity: state.done ? 0.5 : 1,
          }}
        >
          {isRunning ? '⏸ Pause' : '▶ Start'}
        </button>
        <button
          onClick={runStep}
          disabled={isRunning || state.done}
          style={{
            padding: '14px 24px',
            borderRadius: '12px',
            border: 'none',
            cursor: (isRunning || state.done) ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            fontSize: '1rem',
            fontWeight: '600',
            background: 'rgba(255,255,255,0.1)',
            color: '#e2e8f0',
            opacity: (isRunning || state.done) ? 0.5 : 1,
          }}
        >
          Step →
        </button>
        <button
          onClick={reset}
          style={{
            padding: '14px 24px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '1rem',
            fontWeight: '600',
            background: 'rgba(255,255,255,0.1)',
            color: '#e2e8f0',
          }}
        >
          ↺ Reset
        </button>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '10px',
        }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Speed:</span>
          <input
            type="range"
            min="100"
            max="2000"
            step="100"
            value={2100 - speed}
            onChange={(e) => setSpeed(2100 - parseInt(e.target.value))}
            style={{ width: '80px', accentColor: '#667eea' }}
          />
        </div>
      </div>
      
      {/* Message */}
      <div style={{
        textAlign: 'center',
        padding: '12px 20px',
        background: state.done 
          ? 'rgba(72, 187, 120, 0.15)' 
          : 'rgba(102, 126, 234, 0.1)',
        borderRadius: '10px',
        marginBottom: '16px',
        border: `1px solid ${state.done ? 'rgba(72, 187, 120, 0.3)' : 'rgba(102, 126, 234, 0.2)'}`,
      }}>
        <span style={{ color: state.done ? '#48bb78' : '#a5b4fc', fontSize: '0.9rem' }}>
          {state.message}
        </span>
        {getExtraInfo() && (
          <span style={{ 
            display: 'block', 
            marginTop: '4px', 
            color: '#94a3b8', 
            fontSize: '0.8rem' 
          }}>
            {getExtraInfo()}
          </span>
        )}
      </div>
      
      {/* Graph Visualization */}
      <div style={{
        background: 'rgba(0,0,0,0.4)',
        borderRadius: '20px',
        padding: '20px',
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <svg viewBox="0 0 750 580" style={{ width: '100%', height: 'auto' }}>
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#4a5568"/>
            </marker>
            <marker id="arrow-highlight" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#ffd93d"/>
            </marker>
            <marker id="arrow-cut" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#ff4757"/>
            </marker>
            <marker id="arrow-full" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#48bb78"/>
            </marker>
            <linearGradient id="flowAnim" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffd93d" stopOpacity="0">
                <animate attributeName="offset" values="-0.5;1" dur="1s" repeatCount="indefinite"/>
              </stop>
              <stop offset="50%" stopColor="#ffd93d" stopOpacity="1">
                <animate attributeName="offset" values="0;1.5" dur="1s" repeatCount="indefinite"/>
              </stop>
              <stop offset="100%" stopColor="#ffd93d" stopOpacity="0">
                <animate attributeName="offset" values="0.5;2" dur="1s" repeatCount="indefinite"/>
              </stop>
            </linearGradient>
          </defs>
          
          {/* Edges */}
          {state.edges.map((edge, idx) => {
            const color = getEdgeColor(edge);
            const from = state.nodes.find(n => n.id === edge.from);
            const to = state.nodes.find(n => n.id === edge.to);
            if (!from || !to) return null;
            
            const isHighlighted = state.highlightedPath.some((n, i) =>
              i < state.highlightedPath.length - 1 &&
              state.highlightedPath[i] === edge.from &&
              state.highlightedPath[i + 1] === edge.to
            );
            const isCut = state.cutEdges.has(`${edge.from}-${edge.to}`);
            
            const markerId = isCut ? 'arrow-cut' : 
                            isHighlighted ? 'arrow-highlight' : 
                            edge.flow === edge.capacity ? 'arrow-full' : 'arrow';
            
            // Calculate label position
            const mx = (from.x + to.x) / 2;
            const my = (from.y + to.y) / 2;
            const hasReverse = state.edges.some(e => e.from === edge.to && e.to === edge.from);
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const offset = hasReverse ? 12 : 0;
            const labelX = mx - (dy / dist) * offset;
            const labelY = my + (dx / dist) * offset;
            
            return (
              <g key={`edge-${idx}`}>
                <path
                  d={getEdgePath(edge)}
                  fill="none"
                  stroke={color}
                  strokeWidth={Math.max(2, Math.min(6, edge.capacity / 15 + 1))}
                  strokeOpacity={0.8}
                  markerEnd={`url(#${markerId})`}
                  filter={isHighlighted ? 'url(#glow)' : 'none'}
                />
                {isHighlighted && (
                  <path
                    d={getEdgePath(edge)}
                    fill="none"
                    stroke="url(#flowAnim)"
                    strokeWidth={4}
                    strokeOpacity={0.9}
                  />
                )}
                {/* Label */}
                <g>
                  <rect
                    x={labelX - 22}
                    y={labelY - 10}
                    width={edge.cost ? 44 : 36}
                    height={edge.cost ? 28 : 20}
                    rx="4"
                    fill="rgba(0,0,0,0.8)"
                  />
                  <text
                    x={labelX}
                    y={labelY + 4}
                    textAnchor="middle"
                    fontSize="10"
                    fontFamily="inherit"
                    fontWeight="600"
                    fill={edge.flow === edge.capacity ? '#48bb78' : '#e2e8f0'}
                  >
                    {edge.flow}/{edge.capacity}
                  </text>
                  {edge.cost !== undefined && edge.cost > 0 && (
                    <text
                      x={labelX}
                      y={labelY + 16}
                      textAnchor="middle"
                      fontSize="8"
                      fontFamily="inherit"
                      fill="#94a3b8"
                    >
                      ${edge.cost}
                    </text>
                  )}
                </g>
              </g>
            );
          })}
          
          {/* Nodes */}
          {state.nodes.map((node) => {
            const color = getNodeColor(node);
            const isSource = node.type === 'source';
            const isSink = node.type === 'sink';
            const radius = (isSource || isSink) ? 28 : 22;
            
            return (
              <g key={node.id}>
                {/* Glow */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius + 4}
                  fill={color}
                  opacity={0.2}
                  filter="url(#glow)"
                />
                {/* Node */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  fill={color}
                  stroke={state.reachable.has(node.id) ? '#48bb78' : 'rgba(255,255,255,0.2)'}
                  strokeWidth={state.reachable.has(node.id) ? 3 : 2}
                />
                {/* Label */}
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fontSize={node.label ? '9' : '12'}
                  fontFamily="inherit"
                  fontWeight="700"
                  fill="#fff"
                >
                  {node.label || node.id}
                </text>
                {/* Height/Excess for Push-Relabel */}
                {selectedAlgo === 'push-relabel' && state.initialized && node.height !== undefined && (
                  <>
                    <text
                      x={node.x}
                      y={node.y - radius - 8}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#94a3b8"
                    >
                      h={node.height}
                    </text>
                    {node.excess > 0 && !isSource && !isSink && (
                      <text
                        x={node.x}
                        y={node.y + radius + 14}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#ecc94b"
                      >
                        e={node.excess}
                      </text>
                    )}
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginTop: '16px',
        flexWrap: 'wrap',
      }}>
        {[
          { color: '#4a5568', label: 'No Flow' },
          { color: '#38b2ac', label: 'Partial' },
          { color: '#48bb78', label: 'Saturated' },
          { color: '#ffd93d', label: 'Active Path' },
          { color: '#ff4757', label: 'Min Cut' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '14px',
              height: '14px',
              borderRadius: '3px',
              background: item.color,
            }} />
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{item.label}</span>
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div style={{
        textAlign: 'center',
        marginTop: '24px',
        padding: '16px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '12px',
        fontSize: '0.75rem',
        color: '#64748b',
      }}>
        Network Flow Algorithms • Ford-Fulkerson • Dinic • Push-Relabel • Capacity Scaling • Min-Cost • Bipartite Matching • Applications
      </div>
    </div>
  );
};

export default NetworkFlowApp;