// 取得 DOM 元素
const domGrid = document.getElementById('maze-grid');
const domYAxis = document.getElementById('y-axis');
const domXAxis = document.getElementById('x-axis');
const statusText = document.getElementById('status-text');

let currentSolutionPath = [];

// 初始化
function init() {
    const slider = document.getElementById('zoom-slider');
    if(slider) updateZoom(slider.value);
    
    // 初始化語言
    if(typeof initLanguage === 'function') initLanguage();
    
    // 初始化 UI 狀態
    resizeMaze();
    updateAlgoUI();
}

// 主題切換
function toggleTheme(mode) {
    if (mode === 'auto') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', mode);
    }
}

// 畫面縮放
function updateZoom(val) {
    document.documentElement.style.setProperty('--cell-size', val + 'px');
}

// 核心渲染函數
function renderAll() {
    // 渲染座標軸
    domYAxis.innerHTML = '';
    domXAxis.innerHTML = '';
    for (let y = HEIGHT - 1; y >= 0; y--) {
        const div = document.createElement('div'); div.textContent = y; domYAxis.appendChild(div);
    }
    for (let x = 0; x < WIDTH; x++) {
        const div = document.createElement('div'); div.textContent = x; domXAxis.appendChild(div);
    }
    
    renderGrid();
    updateStatus();
}

function renderGrid() {
    domGrid.innerHTML = '';
    const pathSet = new Set(currentSolutionPath.map(p => `${p.x},${p.y}`));
    
    // 取得 checkbox 狀態
    const showWeights = document.getElementById('chk-show-weights')?.checked;

    // ★★★ 新增這一行：切換容器的 Class ★★★
    // 這行會連動 CSS，自動隱藏 S/G 文字
    if (showWeights) {
        domGrid.classList.add('showing-weights');
    } else {
        domGrid.classList.remove('showing-weights');
    }

    for (let i = 0; i < mazeData.length; i++) {
        const pos = getLogicalPos(i);
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.setAttribute('data-coord', `(${pos.x}, ${pos.y})`);

        const val = mazeData[i];
        if (val & 1) cell.classList.add('wall-n');
        if (val & 8) cell.classList.add('wall-w');
        if ((val & 2) && pos.x === WIDTH - 1) cell.classList.add('wall-e');
        if ((val & 4) && pos.y === 0) cell.classList.add('wall-s');

        if (pos.x === startPos.x && pos.y === startPos.y) cell.classList.add('is-start');
        if (goalPositions.has(`${pos.x},${pos.y}`)) cell.classList.add('is-goal');
        if (pathSet.has(`${pos.x},${pos.y}`)) cell.classList.add('is-path');

        // 繪製權重數字
        if (showWeights && lastFloodDistMap && lastFloodDistMap[i] !== undefined) {
            const dist = lastFloodDistMap[i];
            const span = document.createElement('span');
            span.className = 'cell-weight';
            
            if (val === 15) span.classList.add('on-wall');

            // 顯示數字 (若是 Infinity 則留空)
            span.innerText = (dist === Infinity) ? '' : dist;
            
            cell.appendChild(span);
        }

        cell.onclick = (e) => handleCellClick(i, e);
        domGrid.appendChild(cell);
    }
}

// ★★★ 新增：讀取下拉選單並執行 ★★★
function runSelectedAlgo() {
    const select = document.getElementById('algo-select');
    const type = select.value;
    runAlgo(type);
}

// ★★★ 修改：執行演算法函數 (加入統計數據顯示) ★★★
function runAlgo(type) {
    if (goalPositions.size === 0) return alert(t('msg_no_goal'));
    
    const select = document.getElementById('algo-select');
    const algoNameKey = 'algo_' + type;
    const algoName = t(algoNameKey); 

    statusText.innerText = t('status_calculating');
    
    setTimeout(() => {
        let path = [];
        const startTime = performance.now();

        try {
            switch (type) {
                case 'left': path = solveWallFollower('left'); break;
                case 'right': path = solveWallFollower('right'); break;
                case 'flood': path = solveFloodFill(); break;
                case 'dijkstra': path = solveDijkstra(); break;
                case 'astar': path = solveAStar(); break;
                case 'manhattan': path = solveManhattanGreedy(); break;
            }
        } catch (e) {
            console.error(e);
            path = [];
        }

        const endTime = performance.now();
        currentSolutionPath = path;
        renderGrid();

        if (path.length > 0) {
            // ★★★ 修改這裡：判斷顯示格式 ★★★
            
            // 如果是洪水演算法 (最短路徑)，使用特殊的「多路徑格式」
            if (type === 'flood') {
                const multiStatus = getMultiRouteStatus();
                // 顯示格式： 洪水 (BFS) | 耗時: 0.5ms | 北路徑: 40步10彎, 東路徑...
                statusText.innerText = `${algoName} | ${t('status_result', {
                    algo: '', // 演算法名稱已在前面，這裡留空
                    time: (endTime - startTime).toFixed(2),
                    steps: '', // 清空原本的單一數據
                    turns: '',
                    straight: ''
                }).split('|')[1]} | ${multiStatus}`; 
                
                // 上面 split 用法有點醜，建議直接組字串：
                statusText.innerText = `${algoName} | Time: ${(endTime - startTime).toFixed(2)}ms | ${multiStatus}`;
            
            } else {
                // 其他演算法維持原本的單一路徑顯示
                const stats = analyzePath(path); // 確保這裡呼叫的是 maze_core.js 或 ui_control.js 裡的統計函數
                
                statusText.innerText = t('status_result', {
                    algo: algoName,
                    time: (endTime - startTime).toFixed(2),
                    steps: stats.totalSteps || stats.steps,
                    turns: stats.turns,
                    straight: stats.maxStraight
                });
            }

        } else {
            statusText.innerText = t('status_no_path');
        }
    }, 10);
}

function clearPath() {
    currentSolutionPath = [];
    renderGrid();
    statusText.innerText = t('status_path_cleared');
}

function updateStatus() {
    const realW = (WIDTH * REAL_CELL_SIZE_MM / 1000).toFixed(2);
    const realH = (HEIGHT * REAL_CELL_SIZE_MM / 1000).toFixed(2);
    
    // 使用 t() 函數與參數替換
    statusText.innerText = t('status_info', {
        w: WIDTH, h: HEIGHT,
        rw: realW, rh: realH,
        sx: startPos.x, sy: startPos.y,
        gcount: goalPositions.size
    });
}

// 互動事件處理
function handleCellClick(index, e) {
    const pos = getLogicalPos(index);
    const key = `${pos.x},${pos.y}`;

    if (currentMode === 'start') {
        startPos = pos;
        if (goalPositions.has(key)) goalPositions.delete(key);
        enforceStartRule();
    } 
    else if (currentMode === 'goal') {
        if (goalPositions.has(key)) goalPositions.delete(key);
        else {
            goalPositions.add(key);
            if (startPos.x === pos.x && startPos.y === pos.y) startPos = {x:-1, y:-1};
        }
    }
    else if (currentMode === 'wall') {
        const rect = e.target.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const w = rect.width;
        const h = rect.height;
        const isTopRight = clickY < (h/w) * clickX;
        const isTopLeft = clickY < h - (h/w) * clickX;
        let wallBit = 0; 
        let neighborDir = null;
        if (isTopRight && isTopLeft) { wallBit = 1; neighborDir = [0, 1, 4]; } 
        else if (isTopRight && !isTopLeft) { wallBit = 2; neighborDir = [1, 0, 8]; }
        else if (!isTopRight && !isTopLeft) { wallBit = 4; neighborDir = [0, -1, 1]; }
        else { wallBit = 8; neighborDir = [-1, 0, 2]; }
        toggleWall(pos.x, pos.y, wallBit, neighborDir);
        return;
    }
    renderGrid();
    updateStatus();
}

function toggleWall(x, y, bit, neighborInfo) {
    const idx = getIndex(x, y);
    mazeData[idx] ^= bit;
    const nx = x + neighborInfo[0];
    const ny = y + neighborInfo[1];
    if (nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT) {
        const nIdx = getIndex(nx, ny);
        mazeData[nIdx] ^= neighborInfo[2];
    }
    renderGrid();
}

function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`mode-${mode}`).classList.add('active');
}

// 按鈕功能：重置與清空
function resizeMaze() {
    const wInput = parseInt(document.getElementById('input-w').value);
    const hInput = parseInt(document.getElementById('input-h').value);
    if(wInput < 2 || hInput < 2) return alert("尺寸太小！");
    WIDTH = wInput;
    HEIGHT = hInput;
    document.documentElement.style.setProperty('--cols', WIDTH);
    document.documentElement.style.setProperty('--rows', HEIGHT);
    
    mazeData = new Array(WIDTH * HEIGHT).fill(15);
    startPos = {x: 0, y: 0};
    goalPositions.clear();
    currentSolutionPath = []; // ★ 新增這一行：清空路徑
    lastFloodDistMap = []; // ★ 清空權重表
    
    // 設定中心終點
    const midX = Math.floor(WIDTH / 2);
    const midY = Math.floor(HEIGHT / 2);
    const xRange = (WIDTH % 2 === 0) ? [midX - 1, midX] : [midX];
    const yRange = (HEIGHT % 2 === 0) ? [midY - 1, midY] : [midY];
    for (let x of xRange) for (let y of yRange) goalPositions.add(`${x},${y}`);
    
    enforceStartRule();
    renderAll();
}

// 2. 修改 fillMazeWalls (重置為牆時清空)
function fillMazeWalls() {
    mazeData.fill(15); 
    enforceStartRule();
    currentSolutionPath = []; // ★ 新增這一行
    lastFloodDistMap = []; // ★ 清空權重表
    renderGrid();
    statusText.innerText = t('status_reset_wall'); // 順便更新狀態
}

// 3. 修改 clearMazeEmpty (全部拆除時清空)
function clearMazeEmpty() {
    mazeData.fill(0);
    currentSolutionPath = []; // ★ 新增這一行
    lastFloodDistMap = []; // ★ 清空權重表
    renderGrid();
    statusText.innerText = t('status_cleared');
}


// 4. ★ 重要：修改按鈕呼叫的生成函數
// 由於 generateRandomMaze 在 core 裡，我們在 ui_control 寫一個 wrapper 來處理清空
// 請把 HTML 中原本的 <button onclick="generateRandomMaze()"> 改成 onclick="handleGenerate()"
// 然後在這裡新增這個函數：

function handleGenerate() {
    currentSolutionPath = []; // 先清空舊路徑
    lastFloodDistMap = []; // ★ 清空權重表
    generateRandomMaze();     // 再呼叫 Core 的生成演算法
    // generateRandomMaze 裡面最後會呼叫 renderGrid，所以不用再寫
}


// 檔案存取功能
function downloadMap() {
    const mapObj = {
        version: 1,
        width: WIDTH,
        height: HEIGHT,
        data: mazeData,
        start: startPos,
        goals: Array.from(goalPositions)
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mapObj));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `maze_${WIDTH}x${HEIGHT}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function loadMap(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const mapObj = JSON.parse(e.target.result);
            WIDTH = mapObj.width;
            HEIGHT = mapObj.height;
            mazeData = mapObj.data;
            startPos = mapObj.start;
            goalPositions = new Set(mapObj.goals);
            document.getElementById('input-w').value = WIDTH;
            document.getElementById('input-h').value = HEIGHT;
            document.documentElement.style.setProperty('--cols', WIDTH);
            document.documentElement.style.setProperty('--rows', HEIGHT);
            renderAll();
            statusText.innerText = `t('msg_load_success') (${file.name})`;
        } catch (err) {
            alert(t('msg_file_error'))
        }
    };
    reader.readAsText(file);
    input.value = '';
}

// --- 路徑分析工具 ---
function analyzePath(path) {
    if (path.length < 2) return { turns: 0, maxStraight: 0, totalStraight: 0 };

    let turns = 0;
    let maxStraight = 0;
    let currentStraight = 1; // 當前直線長度 (包含起始格)
    
    // 算出第一步的方向
    let lastDx = path[1].x - path[0].x;
    let lastDy = path[1].y - path[0].y;

    for (let i = 2; i < path.length; i++) {
        const curr = path[i];
        const prev = path[i-1];
        
        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;

        // 判斷方向是否改變
        if (dx !== lastDx || dy !== lastDy) {
            turns++; // 轉彎了
            
            // 結算上一段直線
            if (currentStraight > maxStraight) maxStraight = currentStraight;
            currentStraight = 1; // 重置 (轉彎後的第一格算新的直線起點)
            
            // 更新方向
            lastDx = dx;
            lastDy = dy;
        } else {
            // 方向一樣，直線長度 +1
            currentStraight++;
        }
    }
    
    // 結算最後一段
    if (currentStraight > maxStraight) maxStraight = currentStraight;

    return { turns, maxStraight };
}


function analyzePath(path) {
    // 1. 防呆
    if (!path || path.length < 2) {
        return { steps: 0, turns: 0, maxStraight: 0 };
    }

    // 2. 計算步數
    let steps = path.length - 1; 

    // 3. 計算轉彎與直線
    let turns = 0;
    let maxStraight = 0;
    
    let currentRun = 0; // 目前連續步數
    let lastDir = null; // 上一步的方向字串 "dx,dy"

    for (let i = 0; i < steps; i++) {
        const p1 = path[i];
        const p2 = path[i+1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const currDir = `${dx},${dy}`;

        if (lastDir !== null) {
            if (currDir !== lastDir) {
                turns++; // 方向改變 = 轉彎
                
                // 結算上一段直線 (包含起始格，所以是 currentRun + 1)
                if (currentRun + 1 > maxStraight) maxStraight = currentRun + 1;
                
                currentRun = 1; // 重置
            } else {
                currentRun++; // 方向相同，累加
            }
        } else {
            currentRun = 1; // 第一步
        }
        lastDir = currDir;
    }

    // 迴圈結束後，結算最後一段
    if (currentRun + 1 > maxStraight) maxStraight = currentRun + 1;

    // 回傳整合的物件
    return { steps, turns, maxStraight };
}

function updateAlgoUI() {
    const select = document.getElementById('algo-select');
    const chkWeights = document.getElementById('chk-show-weights');
    const type = select.value;

    // 定義哪些演算法有「全域權重」可以顯示
    // 左手(left) 和 右手(right) 是沒有全域權重表的
    const hasWeights = ['flood', 'astar', 'dijkstra', 'manhattan'];

    if (hasWeights.includes(type)) {
        // 如果是全域演算法：解鎖勾選框
        chkWeights.disabled = false;
        // 保持原本的 label 顏色 (移除灰色樣式)
        chkWeights.parentElement.style.color = ''; 
    } else {
        // 如果是左右手：
        // 1. 取消勾選
        chkWeights.checked = false;
        // 2. 鎖定 (變灰且無法點擊)
        chkWeights.disabled = true;
        // 3. 讓文字也變灰 (視覺提示)
        chkWeights.parentElement.style.color = '#ccc';
        
        // 4. 強制重繪 (把原本顯示在畫面上的數字清除掉)
        renderGrid();
    }
}

// ★★★ 新增：根據優先順序回推路徑 (用於產生多路徑分析) ★★★
function tracePathWithPriority(distMap, priorityIndices) {
    if (!distMap || distMap.length === 0) return [];
    
    // 從起點開始
    let curr = { x: startPos.x, y: startPos.y };
    const path = [{...curr}];
    
    // 如果起點無法到達
    if (distMap[getIndex(curr.x, curr.y)] === Infinity) return [];

    // 開始回推
    while (distMap[getIndex(curr.x, curr.y)] !== 0) {
        const currentDist = distMap[getIndex(curr.x, curr.y)];
        let moved = false;

        // 依照 priorityIndices 指定的順序檢查鄰居 (例如 [0,1,2,3] 代表 北東南西)
        for (let i = 0; i < 4; i++) {
            const dirIdx = priorityIndices[i]; // 取出優先方向
            
            // 檢查牆壁 (注意：isWall 定義在 maze_core.js，需要確保變數可存取)
            // 這裡假設 maze_core.js 的 DIRS 和 isWall 是全域可用的
            if (isWall(curr.x, curr.y, dirIdx)) continue;
            
            const nx = curr.x + DIRS[dirIdx].dx;
            const ny = curr.y + DIRS[dirIdx].dy;
            const nIdx = getIndex(nx, ny);
            
            // 只要找到數值更小的鄰居，馬上移動 (這就是優先權的作用)
            if (distMap[nIdx] < currentDist) {
                curr = { x: nx, y: ny };
                path.push({...curr});
                moved = true;
                break; 
            }
        }
        if (!moved) break; // 死路 (理論上洪水法不會發生)
    }
    return path;
}

// ★★★ 新增：產生多路徑分析字串 ★★★
function getMultiRouteStatus() {
    // 確保有洪水法的距離表
    if (!lastFloodDistMap || lastFloodDistMap.length === 0) return "";

    // 定義四個方向的優先順序 indices (對應 DIRS: 0:N, 1:E, 2:S, 3:W)
    // 北回り: 北優先 (N, E, W, S) -> 0, 1, 3, 2 (順序可調整，這裡用常見邏輯)
    // 這裡我們用簡單的輪轉：
    const priorities = {
        'n': [0, 1, 3, 2], // 北優先
        'e': [1, 2, 0, 3], // 東優先
        's': [2, 3, 1, 0], // 南優先
        'w': [3, 0, 2, 1]  // 西優先
    };

    // 判斷迷宮尺寸規則
    // 規則：20x20 以下顯示 (西, 南)，20x20 以上顯示 (北, 東, 西, 南)
    let targets = [];
    if (WIDTH <= 20 && HEIGHT <= 20) {
        targets = ['w', 's']; // 小迷宮：西、南
    } else {
        targets = ['n', 'e', 'w', 's']; // 大迷宮：全顯
    }

    let statusParts = [];

    // 對每個目標方向計算路徑與統計
    targets.forEach(dirKey => {
        const path = tracePathWithPriority(lastFloodDistMap, priorities[dirKey]);
        const stats = analyzePath(path); // 使用之前寫好的 analyzePath (或 calculatePathStats)
        
        // 組合字串： "西回り：146歩57折"
        // 使用 t() 翻譯
        const label = t('dir_' + dirKey);
        const steps = stats.totalSteps || stats.steps; // 相容不同的命名
        const turns = stats.turns;
        const unitS = t('unit_step');
        const unitT = t('unit_turn');

        // 如果路徑無效 (0步)，顯示 "-"
        if (steps === 0) {
            statusParts.push(`${label}: -`);
        } else {
            statusParts.push(`${label}: ${steps}${unitS}${turns}${unitT}`);
        }
    });

    return statusParts.join(",  "); // 用逗號分隔
}

// 啟動程式
init();