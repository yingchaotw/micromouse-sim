// js/setup.js

// === 1. 核心實例與 Worker ===
// 這些變數需要最先被建立，這樣後面的 renderer.js 和 interactions.js 才能使用
const mazeApp = new MazeCore(16, 16); 
const mazeWorker = new Worker('js/maze_worker.js');
const REAL_CELL_SIZE_MM = 180;

// === 2. DOM 元素參照 ===
// 這裡先把 HTML 元素抓好，讓後面的程式直接用
const domGrid = document.getElementById('maze-grid');
const domYAxis = document.getElementById('y-axis');
const domXAxis = document.getElementById('x-axis');
const statusText = document.getElementById('status-text');

// === 3. 全域狀態變數 ===
let isDrawing = false;      // 供 interactions.js 使用
let lastWallKey = null;     // 供 interactions.js 使用
let currentMode = 'start';  // 供 interactions.js 使用

// === 4. 常數定義 ===
const DIR_COLORS = {
    'n': '#E91E63', 'e': '#2196F3', 's': '#4CAF50', 'w': '#FF9800'
};
