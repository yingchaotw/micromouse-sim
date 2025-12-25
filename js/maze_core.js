// 全域變數 (Global Variables)
const REAL_CELL_SIZE_MM = 180;
let WIDTH = 16;
let HEIGHT = 16;
let mazeData = [];
let startPos = {x: 0, y: 0};
let goalPositions = new Set();
let lastFloodDistMap = []; // 讓所有演算法都可以更新這張表來顯示權重

// ==========================================
// ★★★ 電腦鼠演算法核心實作區 ★★★
// ==========================================

// 定義方向常數 (順序重要：北、東、南、西)
const DIRS = [
    { dx: 0, dy: 1, bit: 1 }, // N (Index 0)
    { dx: 1, dy: 0, bit: 2 }, // E (Index 1)
    { dx: 0, dy: -1, bit: 4 }, // S (Index 2)
    { dx: -1, dy: 0, bit: 8 }  // W (Index 3)
];


// 輔助函數：檢查某個位置的某個方向是否有牆
function isWall(x, y, dirIndex) {
    // 邊界檢查
    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return true;
    const idx = getIndex(x, y);
    return (mazeData[idx] & DIRS[dirIndex].bit) !== 0;
}

// 輔助函數 (Helper Functions)
function getIndex(lx, ly) { 
    return (HEIGHT - 1 - ly) * WIDTH + lx; 
}

function getLogicalPos(index) {
    return { x: index % WIDTH, y: HEIGHT - 1 - Math.floor(index / WIDTH) };
}

// 核心規則：強制起點朝北 (Core Rules)
function enforceStartRule() {
    const idx = getIndex(startPos.x, startPos.y);
    mazeData[idx] = 14; 
    if (startPos.y < HEIGHT - 1) { 
        const northNeighborIdx = getIndex(startPos.x, startPos.y + 1);
        mazeData[northNeighborIdx] &= ~4; 
    }
}

// 演算法：隨機迷宮生成 (Algorithm)
function generateRandomMaze() {

    if (typeof currentSolutionPath !== 'undefined') {
        currentSolutionPath = []; 
    }

    const keep = document.getElementById('chk-keep').checked;
    
    // 1. 預處理
    if (keep) {
        let changedCount = 0;
        for(let i=0; i<mazeData.length; i++) {
            if (mazeData[i] === 0) { mazeData[i] = 15; changedCount++; }
        }
        if (changedCount === 0 && mazeData.every(v => v === 0)) mazeData.fill(15);
    } else {
        mazeData.fill(15);
    }
    
    enforceStartRule();



    // 2. 初始化 Stack 與 Visited
    const stack = []; 
    const visited = new Set();
    let seeds = [];

    // 標記既有路徑
    for(let i=0; i<mazeData.length; i++) {
        if (mazeData[i] !== 15) {
            const p = getLogicalPos(i);
            visited.add(`${p.x},${p.y}`);
            seeds.push(p);
        }
    }

    if (seeds.length === 0) {
        stack.push(startPos);
        visited.add(`${startPos.x},${startPos.y}`);
    } else {
        seeds.sort(() => Math.random() - 0.5);
        seeds.forEach(s => stack.push(s));
    }

    // 3. 執行 Backtracking
    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const x = current.x;
        const y = current.y;
        const idx = getIndex(x, y);

        let dirs = [[0, 1, 1, 4], [1, 0, 2, 8], [0, -1, 4, 1], [-1, 0, 8, 2]];

        // 起點保護機制
        if (x === startPos.x && y === startPos.y) dirs = dirs.filter(d => d[1] === 1);

        for (let i = dirs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
        }

        let carved = false;
        for (let [dx, dy, bit, opBit] of dirs) {
            const nx = x + dx; const ny = y + dy;
            const key = `${nx},${ny}`;
            if (nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT) {
                const nIdx = getIndex(nx, ny);
                if (!visited.has(key) && mazeData[nIdx] === 15) {
                    mazeData[idx] &= ~bit;
                    mazeData[nIdx] &= ~opBit;
                    visited.add(key);
                    stack.push({x: nx, y: ny});
                    carved = true;
                    break; 
                }
            }
        }
        if (!carved) stack.pop();
    }
    
    enforceStartRule();

    // 更新 UI
    if (typeof renderGrid === 'function') renderGrid();
    const statusText = document.getElementById('status-text');
    
    // ▼▼▼ 修正：使用翻譯函數 t() ▼▼▼
    // 注意：確保 i18n.js 有被載入，且 runtime 時 t() 函式已存在
    if (statusText && typeof t === 'function') {
        statusText.innerText = t('status_generated');
    }
    
}
