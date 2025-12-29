# Micromouse Maze Simulator & Editor

A lightweight, high-performance web-based simulator for **Micromouse** maze design and algorithm testing. Built with modular Vanilla JavaScript, HTML, and CSS.

## 🚀 Live Demo

**[Click here to try the Simulator](https://yingchaotw.github.io/micromouse-sim/)**
*(Replace with your actual GitHub Pages link)*

---

## ✨ Key Features

### 🛠 Advanced Maze Editing

* **🖱️ Drag-to-Draw:** Click and drag to quickly draw or erase walls (supports touch and mouse).
* **Dynamic Sizing:** Support for standard 16x16 mazes or custom sizes (up to **128x128**).
* **⚡ Quick Presets:** Instant switch between **Classic (16x16)** and **Half-Size (32x32)**.
* **Start & Goal:** Customizable start position and multiple goal cells (supports 2x2 central goals).
* **💾 Optimized Storage:** Maps are saved as **Hexadecimal Strings** in `.json` format to reduce file size by ~60%.

### ⚡ High Performance & Architecture

* **Web Worker Support:** Heavy algorithm calculations run in a background thread, ensuring the UI never freezes, even on large maps.
* **Modular Design:** Codebase split into logical modules (Renderer, Interactions, Animator) for easy maintenance.

### 🧠 Pathfinding & Simulation

Includes standard algorithms with **Visual Animations**:

* **🎬 Dual Animation Modes:**
* **Map Calculation:** Visualizes the "search wave" propagation (Flood Fill, BFS, Dijkstra).
* **Physical Simulation:** Simulates a single mouse agent moving and backtracking (DFS, Wall Follower).


* **🚀 Speed Control:** Adjust animation speed in real-time with a slider.
* **Supported Algorithms:**
* **🌊 Flood Fill:** The classic Micromouse algorithm (guaranteed shortest path).
* **⭐ A* Search:** Heuristic-based search (Manhattan distance).
* **🔍 Dijkstra:** Uniform cost search.
* **🌀 DFS:** Depth-First Search with backtracking visualization.
* **⬅️ / ➡️ Wall Follower:** Left/Right-Hand rules simulation.



### 🎨 UI/UX

* **Dark/Light Theme:** Auto-detects system preference.
* **🖱️ Mouse Wheel Zoom:** Smooth zooming logic centered on the maze.
* **🌍 Multi-Language:** English, Traditional Chinese (繁體中文), and Japanese (日本語).
* **📊 Path Analysis:** Real-time stats for Steps, Turns, and Straightaways.

---

## 📂 Project Structure

The project follows a modular architecture:

```text
micromouse-sim/
├── index.html           # Main entry point
├── style.css            # Styling and CSS variables
├── maps/                # Pre-loaded map files
├── js/
│   ├── setup.js         # Global variables & DOM initialization
│   ├── ui_control.js    # Main controller & Worker communication
│   ├── maze_core.js     # Data model & Hex compression logic
│   ├── maze_worker.js   # Background thread for heavy algorithms
│   ├── i18n.js          # Internationalization
│   ├── maps_index.js    # Map file registry
│   │
│   ├── ui/              # UI Modules
│   │   ├── animator.js      # Animation logic (Step/Time-based)
│   │   ├── interactions.js  # Mouse/Touch events (Drag-to-draw)
│   │   └── renderer.js      # SVG & Grid rendering
│   │
│   ├── utils/           # Utility functions
│   │   └── path_analyzer.js # Path statistics calculation
│   │
│   └── algos/           # Algorithm implementations
│       ├── astar.js
│       ├── bfs.js
│       ├── dfs.js
│       ├── dijkstra.js
│       ├── flood_fill.js
│       ├── manhattan.js
│       └── wall_follower.js

```

---

## 🚀 Getting Started

### Prerequisites

You only need a modern web browser (Chrome, Firefox, Edge, Safari). No `npm` or backend required.

> **Note:** Due to browser security policies (CORS) regarding Web Workers, this project **cannot** be run directly by opening the `index.html` file path (file://) in some browsers.

### Local Installation

1. Clone the repository:
```bash
git clone https://github.com/yingchaotw/micromouse-sim.git

```


2. Run a local server (Recommended):
* **VS Code:** Install "Live Server" extension and click "Go Live".
* **Python:** `python -m http.server`
* **Node:** `npx serve`


3. Open `http://localhost:5500` (or your port) in the browser.

---

## 🕹 How to Use

1. **Setup:** Select a size preset (16x16 / 32x32) or enter custom dimensions.
2. **Draw Walls:**
* Select **"Edit Wall"** mode.
* **Drag** your mouse across grid lines to draw walls continuously.


3. **Configure:** Set **Start (S)** and **Goal (G)** points.
4. **Simulate:**
* Choose an algorithm.
* Check **"🎬 Animate"** for visualization.
* Adjust the **Speed Slider** to control playback.
* Click **Run**.


5. **Analyze:** View path steps and turns at the bottom status bar.

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/NewFeature`).
3. Commit your changes.
4. Push to the branch.
5. Open a Pull Request.

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🙏 Acknowledgements

* Inspired by standard Micromouse competition rules.
* Algorithms based on Graph Theory and Maze Solving techniques.