import json
import networkx as nx
from textual.app import App, ComposeResult
from textual.containers import Horizontal, Vertical, VerticalScroll
from textual.widgets import Header, Footer, Button, Static, Label, TabbedContent, TabPane
from textual.reactive import reactive
from rich.text import Text

# Imports from your structure
# Ensure you have the core/ and arcade/ folders with the files I gave you previously!
from core.ford_fulkerson import FordFulkerson
from core.capacity_scaling import CapacityScaling
from arcade.baseball import solve_baseball
from arcade.airline import solve_airline
from arcade.image_seg import solve_segmentation

# --- FALLBACK DATA (Works even if you don't have the data/ folder) ---
DEFAULT_RAIL_DATA = {
  "nodes": ["S", "A", "B", "C", "D", "E", "T"],
  "edges": [
    {"u": "S", "v": "A", "capacity": 10}, {"u": "S", "v": "B", "capacity": 10},
    {"u": "A", "v": "C", "capacity": 8}, {"u": "B", "v": "C", "capacity": 6},
    {"u": "A", "v": "D", "capacity": 4}, {"u": "B", "v": "E", "capacity": 8},
    {"u": "C", "v": "E", "capacity": 6}, {"u": "D", "v": "T", "capacity": 10},
    {"u": "E", "v": "T", "capacity": 10}, {"u": "C", "v": "D", "capacity": 5}
  ]
}

DEFAULT_MLB_DATA = {
  "teams": {
    "NYY": {"wins": 75, "remaining": {"BAL":3, "BOS":8, "TOR":7, "DET":3}},
    "BAL": {"wins": 71, "remaining": {"NYY":3, "BOS":2, "TOR":7, "DET":4}},
    "BOS": {"wins": 69, "remaining": {"NYY":8, "BAL":2, "TOR":0, "DET":0}},
    "TOR": {"wins": 63, "remaining": {"NYY":7, "BAL":7, "BOS":0, "DET":0}},
    "DET": {"wins": 49, "remaining": {"NYY":3, "BAL":4, "BOS":0, "TOR":0}}
  }
}

class FlowTermApp(App):
    CSS = """
    Screen { background: #111; color: #0f0; }
    Header { background: #002200; color: #0f0; }
    Button { width: 100%; margin: 1; background: #222; border: solid #0f0; }
    Button:hover { background: #0f0; color: #000; }
    .box { border: solid #0f0; padding: 1; margin: 1; }
    .sidebar { width: 25%; }
    #log { height: 100%; background: #000; color: #0f0; }
    #arcade_log { height: 100%; background: #000; color: #0f0; }
    """

    def __init__(self):
        super().__init__()
        self.ff_engine = FordFulkerson()
        self.cs_engine = CapacityScaling()
        
        # Try loading files, fall back to embedded data if missing
        try:
            with open("data/soviet_rail.json") as f:
                self.rail_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            self.rail_data = DEFAULT_RAIL_DATA

        try:
            with open("data/mlb_standings.json") as f:
                self.mlb_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            self.mlb_data = DEFAULT_MLB_DATA

    def compose(self) -> ComposeResult:
        yield Header(show_clock=True)
        
        with TabbedContent():
            # --- Tab 1: Core Algos ---
            with TabPane("Core: Max Flow"):
                yield Horizontal(
                    Vertical(
                        Label("Ford-Fulkerson"),
                        Button("Load Soviet Rail", id="btn_ff_load"),
                        Button("Step (Augment)", id="btn_ff_step"),
                        Label("Capacity Scaling"),
                        Button("Load Soviet Rail (Scaled)", id="btn_cs_load"),
                        Button("Step (Scale)", id="btn_cs_step"),
                        classes="sidebar box"
                    ),
                    VerticalScroll(Static(id="log"), classes="box")
                )

            # --- Tab 2: Arcade ---
            with TabPane("Arcade: Applications"):
                yield Horizontal(
                    Vertical(
                        Label("Simulations"),
                        Button("Run Baseball (Detroit)", id="btn_base"),
                        Button("Run Airline Sched", id="btn_air"),
                        Button("Run Image Seg", id="btn_img"),
                        classes="sidebar box"
                    ),
                    VerticalScroll(Static(id="arcade_log"), classes="box")
                )

        yield Footer()

    def _safe_log(self, widget_id, message):
        """Helper to append text to a log widget safely."""
        try:
            widget = self.query_one(widget_id, Static)
            current = str(widget.renderable) if hasattr(widget, 'renderable') else ""
            widget.update(current + str(message))
        except Exception:
            pass

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "btn_ff_load":
            self.ff_engine.build_graph(self.rail_data)
            self._safe_log("#log", "Ford-Fulkerson: Graph Loaded.\n")

        elif event.button.id == "btn_ff_step":
            try:
                # Auto-load if empty
                if not self.ff_engine.graph.nodes:
                    self.ff_engine.build_graph(self.rail_data)
                    self._safe_log("#log", "[Auto-Loaded Graph]\n")
                
                res = self.ff_engine.step()
                if res and res[0]:
                    self._safe_log("#log", f"Path: {res[0]}, Flow Added: {res[1]}\n")
                else:
                    self._safe_log("#log", f"Max Flow Reached: {self.ff_engine.flow_val}\n")
            except nx.NetworkXError as e:
                self._safe_log("#log", f"[bold red]Error:[/] {e} (Graph might be empty)\n")
            except Exception as e:
                self._safe_log("#log", f"[bold red]System Error:[/] {e}\n")

        elif event.button.id == "btn_cs_load":
            self.cs_engine.build_graph(self.rail_data)
            self._safe_log("#log", f"Capacity Scaling: Graph Loaded. Initial Delta: {self.cs_engine.delta}\n")

        elif event.button.id == "btn_cs_step":
            try:
                # Auto-load if empty
                if not self.cs_engine.graph.nodes:
                    self.cs_engine.build_graph(self.rail_data)
                    self._safe_log("#log", "[Auto-Loaded Graph]\n")

                path, val, msg = self.cs_engine.step()
                self._safe_log("#log", f"{msg} | Path: {path} | Flow: {val}\n")
            except Exception as e:
                self._safe_log("#log", f"[bold red]Error:[/] {e}\n")

        elif event.button.id == "btn_base":
            elim, msg = solve_baseball(self.mlb_data.get('teams', {}), "DET")
            status = "[bold red]ELIMINATED[/]" if elim else "[green]SAFE[/]"
            self._safe_log("#arcade_log", f"\nAnalysis for Detroit:\nStatus: {status}\nDetails: {msg}\n")

        elif event.button.id == "btn_air":
            flights = [
                {'id': 'A1', 'start': 0, 'end': 4},
                {'id': 'A2', 'start': 5, 'end': 9}, 
                {'id': 'B1', 'start': 2, 'end': 6}, 
            ]
            crews, msg = solve_airline(flights)
            self._safe_log("#arcade_log", f"\nAirline Schedule Optimization:\nMin Crews Needed: {crews}\n{msg}\n")

        elif event.button.id == "btn_img":
            grid, cut = solve_segmentation()
            ascii_art = "\n".join(grid)
            self._safe_log("#arcade_log", f"\nImage Segmentation (Min-Cut: {cut}):\n\n{ascii_art}\n\n(#=Foreground, .=Background)\n")

if __name__ == "__main__":
    app = FlowTermApp()
    app.run()