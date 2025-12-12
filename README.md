# 🌊 FlowTerm: Network Flow Cyberdeck

**FlowTerm** is an interactive visualization tool for Network Flow algorithms. Built to accompany CPSC 413, it turns abstract graph theory concepts—like Max-Flow Min-Cut and Bipartite Matching—into playable interfaces.

**Two versions available:**
- 🖥 **Terminal Edition** - Retro cyberdeck TUI experience
- 🌐 **Web Edition** - Modern browser-based visualizer with animations

---

## ⚡ Quick Start

### Terminal Version (TUI)

```bash
# Install dependencies
pip install textual networkx

# Run the app
python tui.py
```

### Web Version (Browser)

```bash
# Option 1: Just open the HTML file directly
open network_flow_visualizer.html

# Option 2: With React
npx create-react-app flow-viz && cd flow-viz
cp NetworkFlowApp.jsx src/App.jsx
npm start
```

---

## 🌐 Web Edition Features

The browser-based visualizer includes **10 algorithms** with animated step-by-step execution:

### Algorithms Included

| Category | Algorithms |
|----------|------------|
| **Max Flow** | Ford-Fulkerson (Edmonds-Karp), Dinic's Algorithm, Push-Relabel, Capacity Scaling |
| **Min Cost** | Min-Cost Max-Flow |
| **Matching** | Bipartite Matching |
| **Applications** | Baseball Elimination, Image Segmentation, Airline Scheduling, Project Selection |

### Visual Features

| Color | Meaning |
|-------|---------|
| 🔵 Blue | Source node |
| 🔴 Red | Sink node / Min-cut edges |
| ⬛ Gray | No flow |
| 🟢 Teal | Partial flow |
| 🟢 Green | Saturated (full capacity) |
| 🟡 Yellow | Currently active path |

### Controls
- **▶ Start / ⏸ Pause** - Run algorithm automatically
- **Step →** - Execute one step manually  
- **↺ Reset** - Reset to initial state
- **Speed slider** - Adjust animation speed

---

## 🖥 Terminal Edition Manual

The TUI interface is divided into two main tabs. Navigate between them by clicking the headers at the top of the screen.

### 🟢 Tab 1: System Core (The Theory)

This tab visualizes the raw algorithms from the "Network Flow I" slides.

* **Load Soviet Rail:**
    * **Action:** Loads the historical graph of the Western Soviet Union rail network (Harris & Ross, 1955).
    * **Expectation:** The log window will confirm the graph is loaded with 7 nodes and 10 edges.
* **Step (Augment):**
    * **Action:** Runs one iteration of the **Ford-Fulkerson** algorithm.
    * **Expectation:**
        * It finds an *augmenting path* (e.g., `S -> A -> C -> D -> T`).
        * It displays the **bottleneck capacity** pushed through that path.
        * **Final State:** When no paths remain, it announces `MAX FLOW REACHED` and displays the total flow value (proving the Min-Cut).
* **Capacity Scaling:**
    * **Action:** Uses the "Scaling" algorithm (Slide I, pg 55) which only looks for paths with large residual capacity (Delta) first.
    * **Expectation:** You will see the `Delta` value decrease (e.g., 16 -> 8 -> 4...) as it refines the flow.

### 🕹 Tab 2: Arcade (The Applications)

This tab solves real-world problems using network flow reductions (Slide II).

* **Run Baseball (Detroit):**
    * **The Problem:** Can the Detroit Tigers still win the league given the current standings?
    * **Expectation:**
        * The system builds a specific flow network (Source → Games → Teams → Sink).
        * **Result:** It will print `ELIMINATED` (Red) or `SAFE` (Green).
        * **Why:** It compares the *Max Flow* achieved vs. the *Total Games Remaining*. If flow < games, elimination is mathematically proven.
* **Run Airline Sched:**
    * **The Problem:** Given a list of flights, what is the minimum number of crews required?
    * **Expectation:**
        * The log displays the optimization result (e.g., "Min Crews Needed: 2").
        * Behind the scenes, it converts flight compatibility into a DAG matching problem.
* **Run Image Seg:**
    * **The Problem:** Separate foreground pixels from background pixels.
    * **Expectation:**
        * The log generates an **ASCII Art** grid.
        * `#` represents Foreground, `.` represents Background.
        * This is calculated using a **Min-Cut** on a grid graph where edge weights represent pixel likelihoods.

---

## 📊 Algorithm Reference

### Complexity Comparison

| Algorithm | Time Complexity | Best For |
|-----------|-----------------|----------|
| Ford-Fulkerson (BFS) | O(VE²) | General max-flow |
| Dinic's Algorithm | O(V²E) | Dense graphs |
| Push-Relabel | O(V²E) or O(V³) | Large networks |
| Capacity Scaling | O(E² log C) | Large capacities |

### How They Work

```
Ford-Fulkerson:
1. BFS to find shortest s-t path
2. Find bottleneck capacity
3. Augment flow along path
4. Repeat until no path exists

Push-Relabel:
1. Initialize: h(s) = n, saturate s edges
2. While active nodes exist:
   - If can push (h(u) = h(v) + 1): push excess
   - Else: relabel (increase height)

Dinic's:
1. Build level graph via BFS
2. Find blocking flow via DFS
3. Repeat until sink unreachable

Capacity Scaling:
1. Start with Δ = largest power of 2 ≤ max_cap
2. Find paths with residual ≥ Δ
3. When stuck, Δ = Δ/2
4. Stop when Δ < 1
```

---

## 📂 Project Structure

```text
FlowTerm/
├── core/                          # Pure Algorithm Implementations
│   ├── ford_fulkerson.py          # Standard Max-Flow (Edmonds-Karp BFS)
│   └── capacity_scaling.py        # Delta-Scaling Max-Flow
├── arcade/                        # Application Logic
│   ├── baseball.py                # Elimination detection logic
│   ├── airline.py                 # Flight scheduling logic
│   └── image_seg.py               # Grid graph construction for segmentation
├── data/                          # JSON Data Files
│   ├── soviet_rail.json           # The map data
│   └── mlb_standings.json         # Baseball team stats
├── tui.py                         # Terminal App Entry Point
├── network_flow_visualizer.html   # Web App (standalone)
└── NetworkFlowApp.jsx             # Web App (React component)
```

---

## 🛠 Troubleshooting

### Terminal Version

* **"NodeNotFound: Source S is not in G"**:
    * This happens if you click **Step** before clicking **Load**. The latest version of `tui.py` auto-loads the graph for you, but it's good practice to click "Load" first.
* **"File Not Found"**:
    * If the `data/` folder is missing, the program will switch to **Embedded Mode** and use hardcoded data so you can still run the demo without crashing.
* **The UI looks broken/scrambled**:
    * Resize your terminal window to be larger. `Textual` apps require a minimum size to render side-by-side panels correctly.

### Web Version

* **Blank screen in browser**:
    * Make sure JavaScript is enabled. The HTML file uses React via CDN.
* **Slow animations**:
    * Use the speed slider to adjust. Move it right for faster execution.
* **Want to modify the code?**:
    * Use the `NetworkFlowApp.jsx` file with a React project for full customization.

---

## 🎓 Course Connection

This tool visualizes concepts from **CPSC 413 - Design and Analysis of Algorithms**:

- **Network Flow I**: Ford-Fulkerson, Capacity Scaling, Max-Flow Min-Cut Theorem
- **Network Flow II**: Bipartite Matching, Baseball Elimination, Image Segmentation, Project Selection

---

Enjoy visualizing network flows! 🌊