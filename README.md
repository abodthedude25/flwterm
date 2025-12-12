# 🌊 FlowTerm: Network Flow Cyberdeck

**FlowTerm** is an interactive, terminal-based visualization tool for Network Flow algorithms. Built to accompany CPSC 413, it turns abstract graph theory concepts—like Max-Flow Min-Cut and Bipartite Matching—into a playable "cyberdeck" interface.

  

## ⚡ Quick Start

### 1\. Prerequisites

You need **Python 3.8+** installed.

### 2\. Installation

Install the required TUI framework (`Textual`) and graph library (`NetworkX`):

```bash
pip install textual networkx
```

### 3\. Running the App

Launch the interface from your terminal:

```bash
python tui.py
```

-----

## 🖥 Interface Manual: What to Expect

The interface is divided into two main tabs. Navigate between them by clicking the headers at the top of the screen.

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
      * **Expectation:** You will see the `Delta` value decrease (e.g., 16 -\> 8 -\> 4...) as it refines the flow.

### 🕹 Tab 2: Arcade (The Applications)

This tab solves real-world problems using network flow reductions (Slide II).

  * **Run Baseball (Detroit):**
      * **The Problem:** Can the Detroit Tigers still win the league given the current standings?
      * **Expectation:**
          * The system builds a specific flow network (Source → Games → Teams → Sink).
          * **Result:** It will print `ELIMINATED` (Red) or `SAFE` (Green).
          * **Why:** It compares the *Max Flow* achieved vs. the *Total Games Remaining*. If flow \< games, elimination is mathematically proven.
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

-----

## 📂 Project Structure

```text
FlowTerm/
├── core/                   # Pure Algorithm Implementations
│   ├── ford_fulkerson.py   # Standard Max-Flow (Edmonds-Karp BFS)
│   └── capacity_scaling.py # Delta-Scaling Max-Flow
├── arcade/                 # Application Logic
│   ├── baseball.py         # Elimination detection logic
│   ├── airline.py          # Flight scheduling logic
│   └── image_seg.py        # Grid graph construction for segmentation
├── data/                   # JSON Data Files
│   ├── soviet_rail.json    # The map data
│   └── mlb_standings.json  # Baseball team stats
└── tui.py                  # The Main Application Entry Point
```

## 🛠 Troubleshooting

  * **"NodeNotFound: Source S is not in G"**:
      * This happens if you click **Step** before clicking **Load**. The latest version of `tui.py` auto-loads the graph for you, but it's good practice to click "Load" first.
  * **"File Not Found"**:
      * If the `data/` folder is missing, the program will switch to **Embedded Mode** and use hardcoded data so you can still run the demo without crashing.
  * **The UI looks broken/scrambled**:
      * Resize your terminal window to be larger. `Textual` apps require a minimum size to render side-by-side panels correctly.
