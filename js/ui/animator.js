// js/ui/animator.js

// 用來儲存當前正在執行的 "下一步" 函式，以便恢復時使用
window.currentStepFunc = null;

// ===========================================
// 1. 核心控制：停止、暫停、恢復
// ===========================================

// 【完全停止】：清除計時器、清除狀態、清除畫面 (按下 Reset 或 Run 時用)
function stopAnimation() {
    if (window.mazeTimer) {
        clearTimeout(window.mazeTimer);
        window.mazeTimer = null;
    }
    window.currentStepFunc = null; // 清空暫存，代表動畫結束

    // 清除畫面上的標記
    document.querySelectorAll('.cell.searching, .cell.current-head, .cell.path-node, .cell.backtracking').forEach(el => {
        el.classList.remove('searching', 'current-head', 'path-node', 'backtracking');
    });
}

// 【暫停】：只清除計時器，保留 currentStepFunc 與畫面狀態 (開啟選單時用)
function pauseAnimation() {
    if (window.mazeTimer) {
        clearTimeout(window.mazeTimer);
        window.mazeTimer = null;
    }
    // 注意：這裡不清除 window.currentStepFunc，這樣 resume 才知道要繼續跑什麼
}

// 【恢復】：如果還有未完成的步進函式，就繼續執行 (關閉選單時用)
function resumeAnimation() {
    // 只有在「有暫存函式」且「目前沒在跑」的時候才恢復
    if (window.currentStepFunc && !window.mazeTimer) {
        window.currentStepFunc(); // 立即執行下一步
    }
}

// ===========================================
// 2. 輔助函式
// ===========================================

function getDelay() {
    const slider = document.getElementById('speed-slider');
    if (!slider) return 30; 
    let val = parseInt(slider.value);
    if (val >= 98) return 0; // 極速模式
    
    // 非線性速度曲線，讓調整更有感
    const maxDelay = 500; 
    const factor = (100 - val) / 99; 
    return Math.floor(maxDelay * factor * factor);
}

function updateCellUI(x, y, textVal) {
    const cell = document.querySelector(`.cell[data-coord="(${x}, ${y})"]`);
    if (!cell) return;
    let span = cell.querySelector('.cell-weight');
    if (!span) {
        span = document.createElement('span');
        span.className = 'cell-weight';
        cell.appendChild(span);
    }
    span.innerText = textVal;
}

// ===========================================
// 3. 動畫入口
// ===========================================

function startAnimation(type) {
    stopAnimation(); // 先完全停止舊的
    
    const delay = getDelay();
    const gridEl = document.getElementById('maze-grid'); // 修正 ID 為 maze-grid
    if (gridEl) {
        if (delay < 10) gridEl.style.setProperty('--cell-transition', 'none');
        else gridEl.style.setProperty('--cell-transition', 'background-color 0.15s ease-out');
    }

    mazeApp.solutionPath = [];
    mazeApp.secondaryPath = [];
    mazeApp.weightMap = new Array(mazeApp.width * mazeApp.height).fill(Infinity);
    renderGrid(); 
    
    statusText.innerText = (typeof t === 'function') ? t('status_simulating') : "Simulating...";

    if (['left', 'right'].includes(type)) animateWallFollower(type);
    else if (['dfs', 'manhattan'].includes(type)) animateSingleAgent(type);
    else {
        const extraText = (typeof t === 'function') ? t('status_map_calc') : " (Map Calculation)";
        statusText.innerText += extraText;
        animateGraphSearch(type);
    }
}

// ===========================================
// 4. 演算法動畫實作 (已支援 Resume)
// ===========================================

// --- 單一老鼠 (DFS/Manhattan) ---
function animateSingleAgent(algoType) {
    if (mazeApp.goalPositions.size === 0) return alert("Please set a Goal first!");

    let stack = [];
    let visited = new Set();
    const startNode = { x: mazeApp.startPos.x, y: mazeApp.startPos.y };
    stack.push(startNode);
    visited.add(`${startNode.x},${startNode.y}`);
    updateCellUI(startNode.x, startNode.y, 0);
    let stepCount = 0;

    const getHeuristic = (x, y) => {
        let minH = Infinity;
        mazeApp.goalPositions.forEach(posStr => {
            const [gx, gy] = posStr.split(',').map(Number);
            const h = Math.abs(x - gx) + Math.abs(y - gy);
            if (h < minH) minH = h;
        });
        return minH;
    };

    function step() {
        // ★ 關鍵：將自己存起來，以便 Resume 時呼叫
        window.currentStepFunc = step;

        if (stack.length === 0) {
            const msg = (typeof t === 'function') ? t('msg_no_path') : "No Path Found.";
            finishAnimation([], msg, null);
            return;
        }

        const current = stack[stack.length - 1]; 
        const { x, y } = current;

        // 更新 Current Head 樣式
        document.querySelectorAll('.current-head').forEach(el => el.classList.remove('current-head'));
        const cell = document.querySelector(`.cell[data-coord="(${x}, ${y})"]`);
        if (cell) {
            cell.classList.remove('backtracking');
            cell.classList.add('searching', 'current-head');
        }

        if (mazeApp.goalPositions.has(`${x},${y}`)) {
            const path = stack.map(node => ({x: node.x, y: node.y}));
            const msg = (typeof t === 'function') ? t('msg_goal_reached') : "Goal Reached!";
            finishAnimation(path, msg, null);
            return;
        }

        let neighbors = [];
        for (let i = 0; i < 4; i++) {
            if (mazeApp.isWall(x, y, i)) continue;
            const nx = x + DIRS[i].dx;
            const ny = y + DIRS[i].dy;
            const key = `${nx},${ny}`;
            if (!visited.has(key)) {
                neighbors.push({ x: nx, y: ny, h: getHeuristic(nx, ny), dirIdx: i });
            }
        }

        if (neighbors.length > 0) {
            if (algoType === 'manhattan') neighbors.sort((a, b) => a.h - b.h);
            const next = neighbors[0];
            visited.add(`${next.x},${next.y}`);
            stack.push(next);
            stepCount++;
            updateCellUI(next.x, next.y, algoType === 'manhattan' ? next.h : stepCount);
        } else {
            if (cell) {
                cell.classList.remove('current-head');
                cell.classList.add('backtracking');
            }
            stack.pop();
        }

        window.mazeTimer = setTimeout(step, getDelay());
    }
    step();
}

// --- 牆壁跟隨 (Wall Follower) ---
function animateWallFollower(algoType) {
    if (mazeApp.goalPositions.size === 0) return alert("Please set a Goal first!");
    
    let x = mazeApp.startPos.x;
    let y = mazeApp.startPos.y;
    let dir = 0; 
    // 簡單初始化方向
    if (mazeApp.isWall(x, y, dir)) {
        if (!mazeApp.isWall(x, y, 1)) dir = 1;
        else if (!mazeApp.isWall(x, y, 2)) dir = 2;
        else dir = 3;
    }
    let path = [{x, y}];
    let steps = 0;
    const maxSteps = mazeApp.width * mazeApp.height * 4;

    function step() {
        window.currentStepFunc = step; // ★ 儲存狀態

        if (mazeApp.goalPositions.has(`${x},${y}`)) {
            const msg = (typeof t === 'function') ? t('msg_goal_reached') : "Goal Reached!";
            finishAnimation(path, msg, null); 
            return;
        }
        if (steps++ > maxSteps) {
            const msg = (typeof t === 'function') ? t('msg_stuck') : "Stuck in loop";
            finishAnimation(path, msg, null);
            return;
        }

        const cell = document.querySelector(`.cell[data-coord="(${x}, ${y})"]`);
        if (cell) {
            cell.classList.add('searching');
            document.querySelectorAll('.current-head').forEach(el => el.classList.remove('current-head'));
            cell.classList.add('current-head');
        }

        const turnOrder = (algoType === 'left') ? [3, 0, 1, 2] : [1, 0, 3, 2];
        let moved = false;
        for (let turn of turnOrder) {
            const tryDir = (dir + turn) % 4; 
            if (!mazeApp.isWall(x, y, tryDir)) {
                dir = tryDir;
                x += DIRS[dir].dx;
                y += DIRS[dir].dy;
                path.push({x, y});
                moved = true;
                break;
            }
        }
        if (!moved) {
            const msg = (typeof t === 'function') ? t('msg_trapped') : "Trapped!";
            finishAnimation(path, msg, null);
            return;
        }
        window.mazeTimer = setTimeout(step, getDelay());
    }
    step();
}

// --- 圖搜尋 (Graph Search) ---
function animateGraphSearch(algoType) {
    if (mazeApp.goalPositions.size === 0) return alert("Please set a Goal first!");

    let openSet = [];
    let visited = new Set();
    let cameFrom = {}; 
    let gScore = new Array(mazeApp.width * mazeApp.height).fill(Infinity);

    const startIdx = mazeApp.getIndex(mazeApp.startPos.x, mazeApp.startPos.y);
    const startNode = { x: mazeApp.startPos.x, y: mazeApp.startPos.y, g: 0, f: 0 };
    gScore[startIdx] = 0;
    openSet.push(startNode);
    updateCellUI(startNode.x, startNode.y, 0);

    const getHeuristic = (x, y) => {
        let minH = Infinity;
        mazeApp.goalPositions.forEach(posStr => {
            const [gx, gy] = posStr.split(',').map(Number);
            const h = Math.abs(x - gx) + Math.abs(y - gy);
            if (h < minH) minH = h;
        });
        return minH;
    };

    function step() {
        window.currentStepFunc = step; // ★ 儲存狀態

        if (openSet.length === 0) {
            const msg = (typeof t === 'function') ? t('msg_no_path') : "No Path Found.";
            finishAnimation([], msg, gScore);
            return;
        }

        let current;
        if (['astar', 'dijkstra'].includes(algoType)) {
            openSet.sort((a, b) => (algoType === 'astar') ? a.f - b.f : a.g - b.g);
        }
        current = openSet.shift(); 

        const currentKey = `${current.x},${current.y}`;
        const cell = document.querySelector(`.cell[data-coord="(${current.x}, ${current.y})"]`);
        if (cell) cell.classList.add('searching');

        if (mazeApp.goalPositions.has(currentKey)) {
            reconstructPathAnim(cameFrom, current, gScore);
            return;
        }
        visited.add(currentKey);

        for (let i = 0; i < 4; i++) {
            if (mazeApp.isWall(current.x, current.y, i)) continue;
            const nx = current.x + DIRS[i].dx;
            const ny = current.y + DIRS[i].dy;
            const nKey = `${nx},${ny}`;
            const nIdx = mazeApp.getIndex(nx, ny);
            if (visited.has(nKey)) continue;
            
            const isQueued = openSet.some(n => n.x === nx && n.y === ny);
            const newG = current.g + 1;
            
            if (!isQueued || newG < gScore[nIdx]) {
                gScore[nIdx] = newG;
                const h = getHeuristic(nx, ny);
                openSet.push({ x: nx, y: ny, g: newG, f: newG + h });
                cameFrom[nKey] = current;
                updateCellUI(nx, ny, newG);
            }
        }
        window.mazeTimer = setTimeout(step, getDelay());
    }
    step();
}

function reconstructPathAnim(cameFrom, current, finalWeightMap) {
    let path = [];
    let currKey = `${current.x},${current.y}`;
    while (currKey) {
        const [cx, cy] = currKey.split(',').map(Number);
        path.push({x: cx, y: cy});
        const parent = cameFrom[currKey];
        currKey = parent ? `${parent.x},${parent.y}` : null;
    }
    path.reverse();
    const msg = (typeof t === 'function') ? t('msg_goal_reached') : "Goal Reached!";
    finishAnimation(path, msg, finalWeightMap);
}

function finishAnimation(path, msg, finalWeightMap) {
    clearTimeout(window.mazeTimer);
    window.mazeTimer = null;
    window.currentStepFunc = null; // ★ 清除步進函式，代表已結束
    
    mazeApp.solutionPath = path;
    if (finalWeightMap) mazeApp.weightMap = finalWeightMap;

    renderGrid(); 
    setTimeout(() => {
        document.querySelectorAll('.cell.searching, .cell.backtracking').forEach(el => {
            el.classList.remove('searching', 'current-head', 'backtracking');
        });
    }, 1500);
    const stats = analyzePath(path);
    statusText.innerHTML = `${msg} | Steps: <b>${stats.steps}</b>`;
}