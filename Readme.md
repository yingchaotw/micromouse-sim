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
- **Interactive Editing:** Click to toggle walls. Smart corner-click detection for precise wall placement.
- **Start & Goal:** Customizable start position and multiple goal cells (supports standard 2x2 central goal).
- **🏆 Preset Maps:** Includes classic contest mazes for benchmarking.
- **File Support:** Save (`.json`) and Load map data instantly.

### 🧠 Pathfinding Algorithms
Includes standard algorithms with **Robust Wall Checking** (prevents diagonal wall-clipping):
- **🌊 Flood Fill (BFS):** Finds the guaranteed shortest path. Classic Micromouse algorithm.
- **⭐ A* Search:** Heuristic-based search using Manhattan distance.
- **🔍 Dijkstra:** Uniform cost search.
- **🚀 Manhattan (Greedy):** Fast greedy search.
- **⬅️ / ➡️ Wall Follower:** Left-Hand and Right-Hand rules.

### 📊 Analysis & Visualization
- **🧭 Multi-Route Analysis:** Calculates steps and turns for North, East, South, and West approaches.
- **🥈 Second Best Path:** Automatically calculates and displays an alternative route (dashed line) to compare strategies.
- **🎨 Smart Visualization:** Paths are rendered with smooth SVG Bezier curves and color-coded by direction (North=Red, East=Blue, etc.).
- **Weight Heatmap:** Visualizes distance values on each cell.

### 🎨 UI/UX
- **Dark/Light Theme:** Automatically detects system preference or switch manually.
- **Multi-Language Support:** English (EN), Traditional Chinese (繁體中文), and Japanese (日本語).
- **📱 Responsive Design:** Optimized for both desktop and mobile touch controls.

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

1. **Set Size:** Enter dimensions (e.g., 16x16) and click **Reset**.
2. **Edit Maze:**
* Click **"Edit Wall"** mode to draw walls.
* Use **"Generate"** to create a random maze (Recursive Backtracking).
* Check **"Keep Existing"** to generate a maze around your drawn paths.


3. **Set Points:** Select **Start** (S) and **Goal** (G) modes to place points.
4. **Run Algorithm:**
* Select an algorithm from the dropdown (e.g., Flood Fill).
* Click **Run**.
* View path statistics and route analysis at the bottom.


5. **View Weights:** Check **"Show Weights"** to see the distance values on each cell.

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
