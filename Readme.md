# Micromouse Maze Simulator & Editor

A lightweight, web-based simulator for **Micromouse** maze design and algorithm testing. Built with vanilla JavaScript, HTML, and CSS. No backend or build tools required.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Language](https://img.shields.io/badge/language-JavaScript-yellow.svg)
![Status](https://img.shields.io/badge/status-Active-success.svg)

## 🚀 Live Demo

[**Click here to try the Simulator**](https://yingchaotw.github.io/micromouse-sim/)
*(Replace the link above after you deploy to GitHub Pages)*

---

## ✨ Key Features

### 🛠 Maze Editing
- **Dynamic Sizing:** Support for standard 16x16 mazes or custom sizes (up to 64x64).
- **⚡ Quick Presets:** One-click switch between **Classic (16x16)** and **Half-Size (32x32)** modes with auto-zoom.
- **Interactive Editing:** Click to toggle walls. Smart corner-click detection for precise wall placement.
- **Start & Goal:** Customizable start position and multiple goal cells (supports standard 2x2 central goal).
- **File Support:** Save (`.json`) and Load map data instantly.

### 🧠 Pathfinding Algorithms
Includes standard algorithms with **Robust Wall Checking** and **Visual Animations**:
- **🎬 Step-by-Step Animation:** Watch algorithms explore the maze in real-time (BFS waves, A* heuristics, or mouse movement).
- **🌊 Flood Fill (BFS):** Finds the guaranteed shortest path. Classic Micromouse algorithm.
- **⭐ A* Search:** Heuristic-based search using Manhattan distance.
- **🔍 Dijkstra:** Uniform cost search.
- **🚀 Manhattan (Greedy):** Fast greedy search.
- **⬅️ / ➡️ Wall Follower:** Left-Hand and Right-Hand rules with movement simulation.

### 🎨 UI/UX
- **Dark/Light Theme:** Automatically detects system preference or switch manually.
- **🖱️ Mouse Wheel Zoom:** Zoom in/out of the maze grid simply by scrolling.
- **📂 Clean Interface:** Collapsible "File" and "Settings" panels to keep the workspace focused.
- **Multi-Language Support:** English (EN), Traditional Chinese (繁體中文), and Japanese (日本語).
---

## 📂 Project Structure

The project follows a modular structure for easy maintenance:

```text
micromouse-sim/
├── index.html           # Main entry point
├── style.css            # Styling and CSS variables (Theming)
├── README.md            # Documentation
└── js/
    ├── i18n.js          # Internationalization (EN/ZH/JA)
    ├── maze_core.js     # Core logic, variables, and helper functions
    ├── ui_control.js    # DOM manipulation and event handling
    └── algos/           # Algorithm implementations
        ├── astar.js
        ├── dijkstra.js
        ├── flood_fill.js
        ├── manhattan.js
        └── wall_follower.js

```

---

## 🚀 Getting Started

### Prerequisites

You only need a modern web browser (Chrome, Firefox, Edge, Safari). No `npm` or `node` required.

### Local Installation

1. Clone the repository:
```bash
git clone [https://github.com/yingchaotw/micromouse-sim.git](https://github.com/yingchaotw/micromouse-sim.git)

```


2. Open `index.html` in your browser.

### Deployment (GitHub Pages)

1. Push the code to your GitHub repository.
2. Go to **Settings** > **Pages**.
3. Select the `main` branch as the source.
4. Your simulator will be live at `https://<user>.github.io/<repo>/`.

---

## 🕹 How to Use

1. **Set Size:** * Use the dropdown to select **Classic (16x16)** or **Half-Size (32x32)**.
   * Or enter custom dimensions and click **Reset**.
2. **Edit Maze:**
   * Click **"Edit Wall"** mode to draw walls.
   * Use **"Generate"** to create a random maze.
   * Use **Mouse Wheel** to zoom in/out for better precision.
3. **Set Points:** Select **Start** (S) and **Goal** (G) modes to place points.
4. **Run Algorithm:**
   * Select an algorithm from the dropdown.
   * Check **"🎬 Animation"** to visualize the search process.
   * Click **Run**.
5. **Analyze:**
   * View path statistics (Steps, Turns) at the bottom.
   * Check **"Show Weights"** to see the distance values on each cell.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🙏 Acknowledgements

* Inspired by the classic Micromouse competition rules.
* Algorithms implemented based on standard graph theory.
