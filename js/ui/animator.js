// js/ui/animator.js

// 停止並清除當前的動畫計時器
function stopAnimation() {
    if (window.mazeTimer) {
        clearInterval(window.mazeTimer);
        window.mazeTimer = null;
    }
    // 清除搜尋過程中的顏色標記
    document.querySelectorAll('.cell.searching, .cell.current-head, .cell.path-node, .cell.backtracking').forEach(el => {
        el.classList.remove('searching', 'current-head', 'path-node', 'backtracking');
    });
}

function getDelay() {
    const slider = document.getElementById('speed-slider');
    if (!slider) return 30; 

    // 取得數值 1 (慢) ~ 100 (快)
    let val = parseInt(slider.value);
    
    // 如果拉到最底，直接 0ms (極速)
    if (val >= 98) return 0;

    // 平滑公式：使用平方曲線讓速度感更自然
    // 當 val = 1 時，(99/99)^2 * 500 = 500ms
    // 當 val = 50 時，(50/99)^2 * 500 ≈ 127ms (原本的斷層消失了)
    // 當 val = 90 時，(10/99)^2 * 500 ≈ 5ms
    
    const maxDelay = 500; // 最慢速度 (毫秒)
    const factor = (100 - val) / 99; // 轉成 1.0 ~ 0.0 的比例
    
    return Math.floor(maxDelay * factor * factor);
}

// 統一入口：啟動動畫
function startAnimation(type) {
    stopAnimation();
    
    // ★ 新增：根據速度決定是否開啟平滑動畫
    const delay = getDelay();
    const gridEl = document.getElementById('grid-container'); // 假設你的迷宮容器 ID
    if (gridEl) {
        if (delay < 10) {
            // 速度太快時，移除 CSS transition 以免畫面殘影
            gridEl.style.setProperty('--cell-transition', 'none');
        } else {
            // 速度適中時，啟用平滑過渡
            gridEl.style.setProperty('--cell-transition', 'background-color 0.15s ease-out');
        }
    }

    mazeApp.solutionPath = [];
    mazeApp.secondaryPath = [];
    mazeApp.weightMap = new Array(mazeApp.width * mazeApp.height).fill(Infinity);
    renderGrid(); 
    
    // ★ 修改：使用翻譯字串
    statusText.innerText = (typeof t === 'function') ? t('status_simulating') : "Simulating...";

    if (['left', 'right'].includes(type)) {
        animateWallFollower(type);
    } 
    else if (['dfs', 'manhattan'].includes(type)) {
        animateSingleAgent(type);
    } 
    else {
        // ★ 修改：使用翻譯字串
        const extraText = (typeof t === 'function') ? t('status_map_calc') : " (Map Calculation)";
        statusText.innerText += extraText;
        animateGraphSearch(type);
    }
}

// ★★★ 新增：輔助函式 - 即時更新格子上的權重文字 ★★★
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

// --------------------------------------------------------
// 以下函式全部改為「遞迴 setTimeout」模式
// --------------------------------------------------------

// 1. 單一老鼠實體搜尋 (DFS/Manhattan)
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

// ★ 定義單步執行的函式
    function step() {
        if (stack.length === 0) {
            // ★ 修改：翻譯
            const msg = (typeof t === 'function') ? t('msg_no_path') : "No Path Found.";
            finishAnimation([], msg, null);
            return;
        }

        const current = stack[stack.length - 1]; 
        const { x, y } = current;

        document.querySelectorAll('.current-head').forEach(el => el.classList.remove('current-head'));
        const cell = document.querySelector(`.cell[data-coord="(${x}, ${y})"]`);
        if (cell) {
            cell.classList.remove('backtracking');
            cell.classList.add('searching', 'current-head');
        }

        if (mazeApp.goalPositions.has(`${x},${y}`)) {
            const path = stack.map(node => ({x: node.x, y: node.y}));
            // ★ 修改：翻譯
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
                const h = getHeuristic(nx, ny);
                neighbors.push({ x: nx, y: ny, h: h, dirIdx: i });
            }
        }

        if (neighbors.length > 0) {
            if (algoType === 'manhattan') {
                neighbors.sort((a, b) => a.h - b.h);
            }
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

        // ★★★ 關鍵：遞迴呼叫 setTimeout ★★★
        window.mazeTimer = setTimeout(step, getDelay());
    }

    // 啟動第一步
    step();
}

// 2. 左/右手法則
function animateWallFollower(algoType) {
    if (mazeApp.goalPositions.size === 0) return alert("Please set a Goal first!");
    
    let x = mazeApp.startPos.x;
    let y = mazeApp.startPos.y;
    let dir = 0; 
    
    if (mazeApp.isWall(x, y, dir)) {
        if (!mazeApp.isWall(x, y, 1)) dir = 1;
        else if (!mazeApp.isWall(x, y, 2)) dir = 2;
        else dir = 3;
    }

    let path = [{x, y}];
    let steps = 0;
    const maxSteps = mazeApp.width * mazeApp.height * 4;

    function step() {
        if (mazeApp.goalPositions.has(`${x},${y}`)) {
            // ★ 修改：翻譯
            const msg = (typeof t === 'function') ? t('msg_goal_reached') : "Goal Reached!";
            finishAnimation(path, msg, null); 
            return;
        }
        
        if (steps++ > maxSteps) {
            // ★ 修改：翻譯
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
            // ★ 修改：翻譯
            const msg = (typeof t === 'function') ? t('msg_trapped') : "Trapped!";
            finishAnimation(path, msg, null);
            return;
        }

        // ★★★ 遞迴呼叫 ★★★
        window.mazeTimer = setTimeout(step, getDelay());
    }

    step();
}

// 3. 通用圖搜尋 (擴散式)
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
        if (openSet.length === 0) {
            // ★ 修改：翻譯
            const msg = (typeof t === 'function') ? t('msg_no_path') : "No Path Found.";
            finishAnimation([], msg, gScore);
            return;
        }

        let current;
        if (['astar', 'dijkstra'].includes(algoType)) {
            openSet.sort((a, b) => {
                if (algoType === 'astar') return a.f - b.f;
                return a.g - b.g;
            });
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
                const newNode = { x: nx, y: ny, g: newG, f: newG + h };
                
                openSet.push(newNode);
                cameFrom[nKey] = current;
                updateCellUI(nx, ny, newG);
            }
        }

        // ★★★ 遞迴呼叫 ★★★
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
    clearTimeout(window.mazeTimer); // ★ 改用 clearTimeout
    window.mazeTimer = null;
    
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

