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

// 核心規則：強制起點規則 (強化版：同步修正鄰居牆壁)
function enforceStartRule() {
    if (!startPos) return;
    
    const x = startPos.x;
    const y = startPos.y;
    const idx = getIndex(x, y);

    // 1. 強制起點本身為 U 型 (只留北方開口) -> 數值 14 (西8 + 南4 + 東2)
    mazeData[idx] = 14; 

    // 2. 修正北方鄰居 (必須打通)
    // 起點北方沒牆(0)，所以鄰居的南方也不能有牆
    if (y < HEIGHT - 1) {
        const nIdx = getIndex(x, y + 1);
        mazeData[nIdx] &= ~4; // 移除鄰居的南牆 (Bit 4)
    }

    // 3. 修正東方鄰居 (必須有牆)
    // 起點東方有牆(2)，所以鄰居的西方也必須有牆
    if (x < WIDTH - 1) {
        const eIdx = getIndex(x + 1, y);
        mazeData[eIdx] |= 8; // 強制加上鄰居的西牆 (Bit 8)
    }

    // 4. 修正西方鄰居 (必須有牆)
    // 起點西方有牆(8)，所以鄰居的東方也必須有牆
    if (x > 0) {
        const wIdx = getIndex(x - 1, y);
        mazeData[wIdx] |= 2; // 強制加上鄰居的東牆 (Bit 2)
    }

    // 5. 修正南方鄰居 (必須有牆)
    // 起點南方有牆(4)，所以鄰居的北方也必須有牆
    if (y > 0) {
        const sIdx = getIndex(x, y - 1);
        mazeData[sIdx] |= 1; // 強制加上鄰居的北牆 (Bit 1)
    }
}

// 演算法：隨機迷宮生成 (Algorithm)
function generateRandomMaze() {

    if (typeof currentSolutionPath !== 'undefined') {
        currentSolutionPath = []; 
    }

    const keep = document.getElementById('chk-keep') ? document.getElementById('chk-keep').checked : false;
    // ★ 取得使用者是否想要多路徑
    const allowLoops = document.getElementById('chk-loops') ? document.getElementById('chk-loops').checked : false;
    
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

    // 3. 執行 Backtracking (生成主幹)
    while (stack.length > 0) {
        const current = stack[stack.length - 1];
        const x = current.x;
        const y = current.y;
        const idx = getIndex(x, y);

        let dirs = [[0, 1, 1, 4], [1, 0, 2, 8], [0, -1, 4, 1], [-1, 0, 8, 2]];

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
    
    // ★★★ 4. 新增：如果是多路徑模式，執行「去除死路」邏輯 ★★★
    if (allowLoops) {
        // 參數 0.5 代表去除 50% 的死路 (可以自己調整 0.1 ~ 1.0)
        // 這樣就會產生很多迴圈
        removeDeadEnds(0.5);
    }

    // ★★★ 加入這兩行規則強制執行 ★★★
    enforceStartRule(); // 強制起點 U 型且打通鄰居
    enforceGoalRule();  // ★ 新增：強制終點內部無牆 (打通成房間)

    // 更新 UI
    if (typeof renderGrid === 'function') renderGrid();
    const statusText = document.getElementById('status-text');
    
    if (statusText && typeof t === 'function') {
        statusText.innerText = t('status_generated');
    }
}


// 核心規則：強制終點內部沒有牆壁 (形成一個大房間)
function enforceGoalRule() {
    if (goalPositions.size === 0) return;

    // 遍歷每一個終點格子
    goalPositions.forEach(posStr => {
        const [x, y] = posStr.split(',').map(Number);
        const idx = getIndex(x, y);

        // 檢查四周的鄰居：如果鄰居也是終點的一部分，就打通牆壁
        
        // 北方鄰居
        if (y < HEIGHT - 1 && goalPositions.has(`${x},${y+1}`)) {
            mazeData[idx] &= ~1; // 拆掉自己的北牆
            const nIdx = getIndex(x, y + 1);
            mazeData[nIdx] &= ~4; // 拆掉鄰居的南牆
        }
        
        // 東方鄰居
        if (x < WIDTH - 1 && goalPositions.has(`${x+1},${y}`)) {
            mazeData[idx] &= ~2; // 拆掉自己的東牆
            const eIdx = getIndex(x + 1, y);
            mazeData[eIdx] &= ~8; // 拆掉鄰居的西牆
        }
        
        // 南方鄰居
        if (y > 0 && goalPositions.has(`${x},${y-1}`)) {
            mazeData[idx] &= ~4; // 拆掉自己的南牆
            const sIdx = getIndex(x, y - 1);
            mazeData[sIdx] &= ~1; // 拆掉鄰居的北牆
        }
        
        // 西方鄰居
        if (x > 0 && goalPositions.has(`${x-1},${y}`)) {
            mazeData[idx] &= ~8; // 拆掉自己的西牆
            const wIdx = getIndex(x - 1, y);
            mazeData[wIdx] &= ~2; // 拆掉鄰居的東牆
        }
    });

    // 確保至少有一個入口：
    // 隨機生成演算法本身就會保證迷宮連通，所以一定會有路徑通往終點區域。
    // 如果你有開啟「多路徑 (迴圈)」模式，入口甚至會不只一個。
    // 這個函數主要負責把終點區域內部的牆壁清空，形成一個開放空間。
}


// ★★★ 輔助函數：去除死路 (製造迴圈) ★★★
function removeDeadEnds(percentage) {
    // 找出所有的死路 (只有 3 面牆壁的格子)
    let deadEnds = [];
    for (let i = 0; i < WIDTH * HEIGHT; i++) {
        // 計算牆壁數量 (檢查 1, 2, 4, 8 bits)
        let wallCount = 0;
        if (mazeData[i] & 1) wallCount++;
        if (mazeData[i] & 2) wallCount++;
        if (mazeData[i] & 4) wallCount++;
        if (mazeData[i] & 8) wallCount++;

        // 3 面牆 = 死路 (Dead End)。排除起點，避免起點被打通
        const pos = getLogicalPos(i);
        if (wallCount === 3 && !(pos.x === startPos.x && pos.y === startPos.y)) {
            deadEnds.push(i);
        }
    }

    // 隨機打通其中一部分
    deadEnds.forEach(idx => {
        if (Math.random() > percentage) return; // 依照機率跳過

        const pos = getLogicalPos(idx);
        const x = pos.x; 
        const y = pos.y;

        // 尋找可以打通的鄰居 (原本有牆，且鄰居在邊界內)
        const candidates = [];
        // 北
        if ((mazeData[idx] & 1) && y + 1 < HEIGHT) candidates.push({ bit: 1, opBit: 4, nx: x, ny: y+1 });
        // 東
        if ((mazeData[idx] & 2) && x + 1 < WIDTH)  candidates.push({ bit: 2, opBit: 8, nx: x+1, ny: y });
        // 南
        if ((mazeData[idx] & 4) && y - 1 >= 0)     candidates.push({ bit: 4, opBit: 1, nx: x, ny: y-1 });
        // 西
        if ((mazeData[idx] & 8) && x - 1 >= 0)     candidates.push({ bit: 8, opBit: 2, nx: x-1, ny: y });

        if (candidates.length > 0) {
            // 隨機選一道牆打掉
            const target = candidates[Math.floor(Math.random() * candidates.length)];
            
            // 拆牆
            mazeData[idx] &= ~target.bit;
            
            // 拆鄰居的牆
            const nIdx = getIndex(target.nx, target.ny);
            mazeData[nIdx] &= ~target.opBit;
        }
    });
}