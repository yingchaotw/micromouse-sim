// 取得 DOM 元素
const domGrid = document.getElementById('maze-grid');
const domYAxis = document.getElementById('y-axis');
const domXAxis = document.getElementById('x-axis');
const statusText = document.getElementById('status-text');

let currentSolutionPath = [];
let secondaryPath = []; // ★ 新增：儲存第二路徑
let currentMode = 'start';

// ★★★ 定義方向顏色 (與 CSS 對應) ★★★
const DIR_COLORS = {
    'n': '#E91E63', // North: Pink/Red
    'e': '#2196F3', // East: Blue
    's': '#4CAF50', // South: Green
    'w': '#FF9800'  // West: Orange
};

// 初始化
function init() {
    const slider = document.getElementById('zoom-slider');
    if(slider) updateZoom(slider.value);
    
    // 初始化語言
    if(typeof initLanguage === 'function') initLanguage();
    
    // 初始化地圖選單
    initMapList();

    resizeMaze();
    clearMazeEmpty();

    if (statusText && typeof t === 'function') {
        statusText.innerText = t('status_ready');
    }
    
    updateAlgoUI();

    // ★★★ 新增這一行：啟動滾輪縮放功能 ★★★
    initWheelZoom(); 
}

// ★★★ 判斷路徑主要方向與資訊 ★★★
function getPathAnalysisInfo(path) {
    // 預設回傳值
    if (!path || path.length === 0) return { dir: 'n', label: 'Path', color: '#333' };

    // A. 計算「終點」的重心 (Goal Centroid)
    let goalSumX = 0, goalSumY = 0, goalCount = 0;
    
    // 確保 goalPositions 存在
    if (typeof goalPositions !== 'undefined' && goalPositions.size > 0) {
        goalPositions.forEach(posStr => {
            const parts = posStr.split(',');
            const gx = parseInt(parts[0], 10);
            const gy = parseInt(parts[1], 10);
            if (!isNaN(gx) && !isNaN(gy)) {
                goalSumX += gx;
                goalSumY += gy;
                goalCount++;
            }
        });
    }

    // 如果沒有終點，退回使用迷宮中心，避免計算錯誤
    let centerRefX = (goalCount > 0) ? (goalSumX / goalCount) : ((WIDTH - 1) / 2);
    let centerRefY = (goalCount > 0) ? (goalSumY / goalCount) : ((HEIGHT - 1) / 2);

    // B. 計算「路徑」的重心 (Path Centroid)
    let pathSumX = 0, pathSumY = 0;
    path.forEach(p => {
        pathSumX += p.x;
        pathSumY += p.y;
    });
    const pathAvgX = pathSumX / path.length;
    const pathAvgY = pathSumY / path.length;

    // C. 比較偏移量 (路徑 - 終點)
    const diffX = pathAvgX - centerRefX;
    const diffY = pathAvgY - centerRefY;

    // D. 判斷主要方位
    let dir = 'n';
    // 如果 X 軸差距比 Y 軸大，歸類為東西迴
    if (Math.abs(diffX) > Math.abs(diffY)) {
        dir = diffX > 0 ? 'e' : 'w'; 
    } 
    // 否則歸類為南北迴
    else {
        dir = diffY > 0 ? 'n' : 's'; 
    }

    // E. 取得翻譯與顏色 (防呆)
    const label = (typeof t === 'function') ? t('dir_' + dir) : dir;
    const color = (typeof DIR_COLORS !== 'undefined') ? DIR_COLORS[dir] : '#333';

    return { dir, label, color };
}

// 1. 修改初始化清單函數
function initMapList() {
    const select = document.getElementById('map-select');
    if (!select || typeof MAP_LIST === 'undefined') return;

    // 記住使用者當前選到的值 (以免切換語言時跳回預設值)
    const currentVal = select.value;

    select.innerHTML = '';
    MAP_LIST.forEach(map => {
        const option = document.createElement('option');
        option.value = map.file;
        
        // ★★★ 關鍵修改：使用 t() 翻譯名稱 ★★★
        // 如果 i18n 裡找不到這個 key (例如 "Japan 2023 Final")，t() 會直接回傳原字串，這樣剛好。
        option.textContent = typeof t === 'function' ? t(map.name) : map.name;
        
        select.appendChild(option);
    });

    // 還原選取狀態
    if (currentVal) {
        select.value = currentVal;
    }
}

// 2. 修改語言切換函數 (找到 changeLanguage 並加入 initMapList)
function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('mm_lang', lang);
    applyTranslations();
    
    // ★★★ 新增這行：語言改變時，地圖選單也要重繪 ★★★
    initMapList();
    
    if(typeof updateStatus === 'function') updateStatus();
}

// ★★★ 3. 補上缺失的載入地圖函數 ★★★
function loadSelectedMap() {
    const select = document.getElementById('map-select');
    const filename = select.value;

    if (!filename) {
        alert(typeof t === 'function' ? t('msg_select_map') : "Please select a map!");
        return;
    }

    const filePath = `maps/${filename}`; 

    statusText.innerText = typeof t === 'function' ? t('status_loading') : "Loading...";

    fetch(filePath)
        .then(response => {
            // ★★★ 修改：如果是 404 (找不到檔案)，明確丟出錯誤 ★★★
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} - File not found: ${filename}`);
            }
            return response.json();
        })
        .then(data => {
            applyMapData(data); 
            statusText.innerText = (typeof t === 'function' ? t('msg_map_loaded') : "Loaded") + ` (${filename})`;
        })
        .catch(err => {
            console.error(err);
            // ★★★ 修改：顯示具體錯誤訊息 ★★★
            alert((typeof t === 'function' ? t('msg_map_error') : "Load Failed") + "\n" + err.message);
            statusText.innerText = "Error: " + err.message;
        });
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


// ★★★ 輔助函數：把畫線邏輯抽離出來共用 ★★★
// 請把原本 renderGrid 裡面畫 path 的那一大段邏輯搬到這裡
// ★★★ 修改：畫線函數支援顏色與虛線 ★★★
function drawSvgPath(svg, pathData, color, isDashed) {
    const svgNS = "http://www.w3.org/2000/svg";
    const pathElem = document.createElementNS(svgNS, "path");
    
    // 設定樣式類別 (決定粗細與濾鏡)
    pathElem.setAttribute("class", isDashed ? "path-dashed" : "path-line");
    
    // ★ 設定顏色
    pathElem.style.stroke = color;
    
    let d = "";
    const points = pathData.map(p => ({
        x: p.x + 0.5,
        y: (HEIGHT - 1 - p.y) + 0.5
    }));

    if (points.length > 0) {
        d += `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i+1];
            const xc = (p1.x + p2.x) / 2;
            const yc = (p1.y + p2.y) / 2;
            d += ` Q ${p1.x} ${p1.y} ${xc} ${yc}`;
        }
        if (points.length > 1) {
            d += ` L ${points[points.length-1].x} ${points[points.length-1].y}`;
        }
    }
    pathElem.setAttribute("d", d);
    svg.appendChild(pathElem);
}


function renderGrid() {
    domGrid.innerHTML = '';
    
    // 1. 為了讓 SVG 能絕對定位，迷宮容器需要 relative
    domGrid.style.position = 'relative';

    // 2. 建立 SVG 層
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "maze-svg-layer");
    // 設定 SVG 視窗座標系統，對應迷宮的像素大小
    // 因為 css grid 是用 % 或 fr，這裡我們需要取得實際像素比較準，
    // 但簡單做法是直接用 100% 寬高，座標用相對計算。
    // 為了畫圖方便，我們這裡假設每個格子就是 cell-size 的像素值
    // 但因為 cell-size 是 css 變數，JS 不好直接抓。
    // 變通：我們用 viewBox 對應格數，例如 16x16，這樣畫圖座標就是 0.5, 1.5...
    svg.setAttribute("viewBox", `0 0 ${WIDTH} ${HEIGHT}`);
    svg.setAttribute("preserveAspectRatio", "none"); // 拉伸填滿
    
    // ★★★ 1. 畫次佳路徑 (如果有) ★★★
    if (secondaryPath && secondaryPath.length > 0) {
        const info = getPathAnalysisInfo(secondaryPath);
        // 傳入 true 代表是虛線 (dashed)
        drawSvgPath(svg, secondaryPath, info.color, true); 
    }

    // ★★★ 2. 畫最佳路徑 ★★★
    if (currentSolutionPath && currentSolutionPath.length > 0) {
        const info = getPathAnalysisInfo(currentSolutionPath);
        // 傳入 false 代表是實線
        drawSvgPath(svg, currentSolutionPath, info.color, false);
    }
    
    domGrid.appendChild(svg);


    // --- 以下是原本的格子繪製邏輯 (保持不變) ---
    
    const pathSet = new Set(currentSolutionPath.map(p => `${p.x},${p.y}`));
    const showWeights = document.getElementById('chk-show-weights')?.checked;

    if (showWeights) {
        domGrid.classList.add('showing-weights');
    } else {
        domGrid.classList.remove('showing-weights');
    }

    // ★★★ 新增：判斷某個座標是否為特殊格子 (起點或終點) 的輔助函式 ★★★
    const isSpecialCell = (tx, ty) => {
        if (tx === startPos.x && ty === startPos.y) return true;
        return goalPositions.has(`${tx},${ty}`);
    };
    
    for (let i = 0; i < mazeData.length; i++) {
        const pos = getLogicalPos(i);
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.setAttribute('data-coord', `(${pos.x}, ${pos.y})`);

        const val = mazeData[i];
        
        // 判斷自己是不是特殊格子
        const amISpecial = isSpecialCell(pos.x, pos.y);

        // ★★★ 修改重點：牆壁繪製邏輯 (禮讓機制) ★★★
        
        // 1. 北牆 (Wall-N)
        // 規則：如果有牆，且「北方鄰居」不是特殊格子，才由我畫。
        // (如果北方鄰居是特殊格子，它會強制畫南牆，所以我這邊就隱藏，避免重疊)
        if ((val & 1) && !isSpecialCell(pos.x, pos.y + 1)) {
            cell.classList.add('wall-n');
        }

        // 2. 西牆 (Wall-W)
        // 規則：如果有牆，且「西方鄰居」不是特殊格子，才由我畫。
        // (如果西方鄰居是特殊格子，它會強制畫東牆，所以我這邊就隱藏)
        if ((val & 8) && !isSpecialCell(pos.x - 1, pos.y)) {
            cell.classList.add('wall-w');
        }

        // 3. 東牆 (Wall-E)
        // 規則：一般情況只有邊界才畫。但如果你是特殊格子，強制畫出來(變黃色)。
        if ((val & 2) && (pos.x === WIDTH - 1 || amISpecial)) {
            cell.classList.add('wall-e');
        }

        // 4. 南牆 (Wall-S)
        // 規則：一般情況只有邊界才畫。但如果你是特殊格子，強制畫出來(變黃色)。
        if ((val & 4) && (pos.y === 0 || amISpecial)) {
            cell.classList.add('wall-s');
        }


        // --- 以下樣式設定保持不變 ---
        if (amISpecial && pos.x === startPos.x && pos.y === startPos.y) cell.classList.add('is-start');
        if (amISpecial && goalPositions.has(`${pos.x},${pos.y}`)) cell.classList.add('is-goal');
        
        if (pathSet.has(`${pos.x},${pos.y}`)) {
             cell.classList.add('is-path'); 
        }

        if (showWeights && lastFloodDistMap && lastFloodDistMap[i] !== undefined) {
            const dist = lastFloodDistMap[i];
            const span = document.createElement('span');
            span.className = 'cell-weight';
            if (val === 15) span.classList.add('on-wall');
            span.innerText = (dist === Infinity) ? '' : dist;
            cell.appendChild(span);
        }

        cell.onclick = (e) => handleCellClick(i, e);
        domGrid.appendChild(cell);
    }
}

// ★★★ 新增：讀取下拉選單並執行 ★★★
function runSelectedAlgo() {
    clearPath();
    if (window.mazeTimer) {
        clearInterval(window.mazeTimer);
        window.mazeTimer = null;
    }
    // 清除舊的搜尋顏色
    document.querySelectorAll('.cell.searching, .cell.current-head').forEach(el => {
        el.classList.remove('searching', 'current-head');
    });

    const select = document.getElementById('algo-select');
    const type = select.value;
    const useAnim = document.getElementById('chk-animate') && document.getElementById('chk-animate').checked;

    // ★★★ 判斷動畫邏輯 ★★★
    if (useAnim) {
        if (['left', 'right'].includes(type)) {
            // 1. 左/右手法則：使用「模擬行走」動畫
            animateWallFollower(type);
        } else {
            // 2. 洪水, A*, Dijkstra, Greedy：使用「通用搜尋」動畫
            animateGraphSearch(type);
        }
        return; // 結束，不跑原本的快速運算
    }
    
    // 原本的快速計算
    runAlgo(type);
}


function animateWallFollower(algoType) {
    if (goalPositions.size === 0) return alert("請先設定終點！");
    if (!startPos) startPos = {x:0, y:0};

    statusText.innerText = `🎬 Simulating ${algoType === 'left' ? 'Left' : 'Right'} Hand Rule...`;

    // 初始化機器人狀態
    // 假設一開始面向「北方」(0)，如果北方有牆則需要順時針轉
    let x = startPos.x;
    let y = startPos.y;
    let dir = 0; // 0:N, 1:E, 2:S, 3:W
    
    // 如果起點北方有牆，就先轉向直到找到開口 (避免一開始就撞牆)
    // 但標準迷宮起點通常北方是開的，這裡簡單處理
    if (isWall(x, y, dir)) {
        if (!isWall(x, y, 1)) dir = 1;
        else if (!isWall(x, y, 2)) dir = 2;
        else dir = 3;
    }

    let path = [{x, y}];
    let steps = 0;
    const maxSteps = WIDTH * HEIGHT * 4; // 安全限制

    window.mazeTimer = setInterval(() => {
        // 1. 檢查是否到終點
        if (goalPositions.has(`${x},${y}`)) {
            clearInterval(window.mazeTimer);
            finishSimulation(path);
            return;
        }
        
        // 2. 防止無窮迴圈
        if (steps++ > maxSteps) {
            clearInterval(window.mazeTimer);
            statusText.innerText = "❌ Stuck in loop.";
            return;
        }

        // 3. 視覺更新：把走過的格子變色
        const cell = document.querySelector(`.cell[data-coord="(${x}, ${y})"]`);
        if (cell) {
            cell.classList.add('searching');
            // 可以加一個 class 表示「老鼠頭」
            // cell.classList.add('current-mouse'); 
        }

        // 4. 計算下一步 (核心邏輯)
        // 左手法則：優先走「左邊」，不行走「前方」，再不行走「右邊」，死路則「後退」
        // 對應的相對方向偏移量： 
        // 左手: 左(-1) -> 前(0) -> 右(+1) -> 後(+2)
        // 右手: 右(+1) -> 前(0) -> 左(-1) -> 後(+2)
        
        const turnOrder = (algoType === 'left') ? [3, 0, 1, 2] : [1, 0, 3, 2];
        
        let moved = false;
        for (let turn of turnOrder) {
            const tryDir = (dir + turn) % 4; // 轉向後的絕對方向
            
            // 檢查那個方向有沒有牆
            if (!isWall(x, y, tryDir)) {
                // 沒牆，可以走
                dir = tryDir; // 更新面向
                x += DIRS[dir].dx;
                y += DIRS[dir].dy;
                path.push({x, y});
                moved = true;
                break; // 走出一步就結束這一輪
            }
        }

        // 如果四面都被圍住(理論上不會發生，因為有回頭路)，就停住
        if (!moved) {
             clearInterval(window.mazeTimer);
             alert("Trapped!");
        }

    }, 50); // 模擬走路可以慢一點 (50ms)
}


function animateGraphSearch(algoType) {
    if (goalPositions.size === 0) return alert("請先設定終點！");
    if (!startPos) startPos = {x:0, y:0};

    const algoName = (typeof t === 'function') ? t('algo_' + algoType) : algoType;
    statusText.innerText = `🎬 Animating ${algoName}...`;

    // 資料結構準備
    // openSet: 待檢查的格子清單 {x, y, g, h, f, parent}
    // visited: 記錄已檢查過的格子
    // costSoFar: 記錄走到某格的最短步數 (避免重複走回頭路)
    
    let openSet = [];
    let visited = new Set();
    let costSoFar = new Array(WIDTH * HEIGHT).fill(Infinity);
    let cameFrom = {}; // 用來回推路徑： cameFrom[key] = parentNode

    // 輔助函式：計算與最近終點的曼哈頓距離 (Heuristic)
    const getHeuristic = (x, y) => {
        let minH = Infinity;
        goalPositions.forEach(posStr => {
            const [gx, gy] = posStr.split(',').map(Number);
            const h = Math.abs(x - gx) + Math.abs(y - gy);
            if (h < minH) minH = h;
        });
        return minH;
    };

    // 初始化起點
    const startH = getHeuristic(startPos.x, startPos.y);
    const startNode = { 
        x: startPos.x, y: startPos.y, 
        g: 0, h: startH, f: 0 + startH 
    };
    
    openSet.push(startNode);
    costSoFar[getIndex(startPos.x, startPos.y)] = 0;

    // 開始動畫 Loop
    window.mazeTimer = setInterval(() => {
        if (openSet.length === 0) {
            clearInterval(window.mazeTimer);
            statusText.innerText = "❌ No Path Found.";
            return;
        }

        // ★ 核心差異：根據演算法決定「下一個處理誰」
        // 1. 洪水法 (BFS) => 不需要排序，先進先出 (FIFO)
        // 2. 其他 => 需要排序 (Priority Queue)
        if (algoType !== 'flood') {
            openSet.sort((a, b) => {
                if (algoType === 'astar') return a.f - b.f;     // A*: 綜合分數 f
                if (algoType === 'dijkstra') return a.g - b.g;  // Dijkstra: 實際距離 g
                if (algoType === 'manhattan') return a.h - b.h; // Greedy: 預估距離 h
                return 0;
            });
        }

        // 取出這輪要處理的節點 (一次處理一個，視覺上比較像在「思考」)
        // 如果想要跑快一點像波浪，可以把這裡改成 while loop 處理一層
        // 為了看清楚 A* 的觸手，我們這裡一次只處理一個點
        const current = openSet.shift(); 
        const currentKey = `${current.x},${current.y}`;

        // 視覺效果：標記正在搜尋
        const cell = document.querySelector(`.cell[data-coord="(${current.x}, ${current.y})"]`);
        if (cell) cell.classList.add('searching');

        // ★ 檢查是否抵達終點
        if (goalPositions.has(currentKey)) {
            clearInterval(window.mazeTimer);
            reconstructPath(cameFrom, current); // 回推路徑
            return;
        }

        visited.add(currentKey);

        // 檢查鄰居
        // 為了讓動畫好看，這裡的遍歷順序可以固定 (例如 北東南西)
        for (let i = 0; i < 4; i++) {
            if (isWall(current.x, current.y, i)) continue; // 被牆擋住

            const nx = current.x + DIRS[i].dx;
            const ny = current.y + DIRS[i].dy;
            const nKey = `${nx},${ny}`;
            const nIdx = getIndex(nx, ny);

            if (visited.has(nKey)) continue; // 已經處理完畢

            const newG = current.g + 1; // 假設每步權重 1

            // 如果找到更短的路，或是第一次走到這
            if (newG < costSoFar[nIdx]) {
                costSoFar[nIdx] = newG;
                const newH = getHeuristic(nx, ny);
                const newF = newG + newH;
                
                const neighborNode = { x: nx, y: ny, g: newG, h: newH, f: newF };
                
                openSet.push(neighborNode);
                cameFrom[nKey] = current; // 記錄老爸是誰，方便回推

                // 把鄰居標示為「待處理」(可以選用不同顏色，這裡沿用 searching)
                // const nCell = document.querySelector(`.cell[data-coord="(${nx}, ${ny})"]`);
                // if(nCell) nCell.classList.add('searching-candidate'); 
            }
        }

    }, 15); // 速度設定 (15ms 比較流暢)
}


// ★★★ 洪水演算法動畫版 ★★★
function animateFloodFill() {
    // 1. 檢查起點與終點
    if (goalPositions.size === 0) return alert("請先設定終點！");
    // 如果起點尚未初始化，防呆一下
    if (!startPos) startPos = {x:0, y:0};

    statusText.innerText = "🌊 Searching from Start...";

    // 2. 初始化：這次改成「計算離起點的距離」
    // distMap 這裡代表：從起點走幾步能到這裡
    const distMap = new Array(WIDTH * HEIGHT).fill(Infinity);
    let openSet = []; 

    // 3. 把「起點」加入 Queue，距離設為 0
    const startIdx = getIndex(startPos.x, startPos.y);
    distMap[startIdx] = 0;
    openSet.push({x: startPos.x, y: startPos.y, dist: 0});
    
    // 畫面標示：把起點變色
    const startCell = document.querySelector(`.cell[data-coord="(${startPos.x}, ${startPos.y})"]`);
    if(startCell) startCell.classList.add('searching');

    let foundGoal = null; // 用來記錄找到哪個終點

    // 4. 開始動畫迴圈
    window.mazeTimer = setInterval(() => {
        
        // 如果佇列空了 (找遍全圖都沒路)
        if (openSet.length === 0) {
            clearInterval(window.mazeTimer);
            statusText.innerText = "❌ No Path Found.";
            return;
        }

        const nextLayer = [];
        
        // 一次處理一層 (波浪效果)
        while(openSet.length > 0) {
            const current = openSet.shift();

            // ★ 檢查是否抵達終點 ★
            // 只要當前格子是在 goalPositions 集合裡，就代表找到了！
            if (goalPositions.has(`${current.x},${current.y}`)) {
                foundGoal = current;
                openSet = []; // 清空佇列，讓外層迴圈知道要停了
                break;        // 跳出 while
            }
            
            // 檢查四個方向
            for (let i = 0; i < 4; i++) {
                if (isWall(current.x, current.y, i)) continue;

                const nx = current.x + DIRS[i].dx;
                const ny = current.y + DIRS[i].dy;
                const nIdx = getIndex(nx, ny);

                if (distMap[nIdx] === Infinity) {
                    distMap[nIdx] = current.dist + 1;
                    nextLayer.push({x: nx, y: ny, dist: current.dist + 1});

                    // 更新畫面顏色
                    const cell = document.querySelector(`.cell[data-coord="(${nx}, ${ny})"]`);
                    if (cell) cell.classList.add('searching');
                }
            }
        }
        
        if (foundGoal) {
            // 找到了！停止計時器並畫路徑
            clearInterval(window.mazeTimer);
            finishAnimationFromStart(distMap, foundGoal);
        } else {
            // 繼續下一層
            openSet = nextLayer;
        }

    }, 30); // 動畫速度
}

// 動畫結束後的收尾：回推路徑
function finishAnimationFromStart(distMap, reachGoalPos) {
    statusText.innerText = "🌊 Found Goal! Tracing path...";

    // 這次的路徑回推邏輯不同：
    // distMap 紀錄的是「離起點多遠」。
    // 我們現在人在終點 (reachGoalPos)，要「往低處走」(dist - 1) 回到起點。
    // 最後把路徑陣列「反轉 (reverse)」，就會變成 起點 -> 終點。

    let curr = { x: reachGoalPos.x, y: reachGoalPos.y };
    let path = [curr];
    let currentDist = distMap[getIndex(curr.x, curr.y)];

    // 只要還沒回到起點 (距離 > 0)
    while (currentDist > 0) {
        let moved = false;
        
        // 找四周哪一個鄰居的距離是 currentDist - 1
        for (let i = 0; i < 4; i++) {
            // 注意：回推時要檢查是否有牆壁阻擋
            // 這裡用 isWall(curr.x, curr.y, i) 代表從當前格子能不能往那個方向走
            if (isWall(curr.x, curr.y, i)) continue;

            const nx = curr.x + DIRS[i].dx;
            const ny = curr.y + DIRS[i].dy;
            const nIdx = getIndex(nx, ny);

            // 如果鄰居距離剛好少 1，代表它是上一步的來源
            if (distMap[nIdx] === currentDist - 1) {
                curr = { x: nx, y: ny };
                path.push(curr);
                currentDist--;
                moved = true;
                break; // 找到一個就夠了
            }
        }

        if (!moved) break; // 防呆
    }

    // ★ 關鍵：因為我們是從終點倒推回起點，所以要反轉陣列
    path.reverse();

    // 更新全域變數並繪圖
    currentSolutionPath = path;
    
    // 注意：這裡不更新 lastFloodDistMap，因為那通常是留給「終點擴散」用的
    // 如果你更新了，切換去顯示權重時，數字會變成「離起點距離」而非「離終點距離」
    // 這邊我們選擇「只畫路徑」，保持權重功能的單純性
    
    renderGrid();

    // 移除動畫顏色
    setTimeout(() => {
        document.querySelectorAll('.cell.searching').forEach(el => el.classList.remove('searching'));
    }, 1000);

    const stats = analyzePath(path);
    statusText.innerText = `Goal Reached! | Steps: ${stats.steps}`;
}


function reconstructPath(cameFrom, current) {
    statusText.innerText = "🚩 Goal Reached! Reconstructing path...";
    
    let path = [];
    let currKey = `${current.x},${current.y}`;
    
    // 這裡 current 是最後一個節點，往回追溯
    while (currKey) {
        const parts = currKey.split(',').map(Number);
        path.push({x: parts[0], y: parts[1]});
        
        const parent = cameFrom[currKey];
        if (parent) {
            currKey = `${parent.x},${parent.y}`;
        } else {
            currKey = null; // 回到起點 (起點沒有 parent)
        }
    }
    
    // 因為是從終點往回找，所以要反轉
    path.reverse();
    
    currentSolutionPath = path;
    renderGrid();
    
    // 移除動畫顏色
    setTimeout(() => {
        document.querySelectorAll('.cell.searching').forEach(el => el.classList.remove('searching'));
    }, 1500);

    const stats = analyzePath(path);
    statusText.innerText = `Done! | Steps: ${stats.steps} | Turns: ${stats.turns}`;
}

// 模擬結束的收尾
function finishSimulation(path) {
    currentSolutionPath = path;
    renderGrid();
    
    setTimeout(() => {
        document.querySelectorAll('.cell.searching').forEach(el => el.classList.remove('searching'));
    }, 1500);

    const stats = analyzePath(path);
    statusText.innerText = `Simulation Done | Total Moves: ${stats.steps}`;
}


// ★★★ 計算次佳路徑 (阻斷法) ★★★
function calculateSecondBestPath(bestPath, algoType) {
    if (!bestPath || bestPath.length < 3) return []; // 路徑太短沒必要找

    let candidates = [];
    
    // 鎖定演算法函數
    let solver = null;
    if (algoType === 'flood') solver = solveFloodFill;
    else if (algoType === 'astar') solver = solveAStar;
    else if (algoType === 'dijkstra') solver = solveDijkstra;
    else if (algoType === 'manhattan') solver = solveManhattanGreedy;
    else return []; // 左右手法則不適用

    // 備份原始權重圖 (避免計算過程中把權重圖弄亂)
    const backupFloodDist = [...lastFloodDistMap];

    // 嘗試暫時封鎖最佳路徑上的每一個點 (除了起點和終點)
    // 我們每封鎖一個點，就跑一次演算法，看能不能繞路
    // 為了效能，我們可以只採樣，例如每隔 2 格封鎖一次，或只封鎖前 50%
    for (let i = 1; i < bestPath.length - 1; i++) {
        const p = bestPath[i];
        const idx = getIndex(p.x, p.y);
        const originalVal = mazeData[idx]; // 備份格子狀態

        // 1. 暫時變成全牆壁 (封鎖)
        mazeData[idx] = 15; 

        // 2. 重新計算路徑
        // 注意：這裡可能會修改 global 的 lastFloodDistMap，所以算完要還原
        const altPath = solver();

        // 3. 如果有找到路徑，且路徑長度比最佳路徑長 (或是相等但走法不同)
        if (altPath.length > 0) {
            candidates.push(altPath);
        }

        // 4. 還原格子狀態
        mazeData[idx] = originalVal;
    }

    // 還原權重圖 (顯示用最佳路徑的權重)
    lastFloodDistMap = backupFloodDist;

    if (candidates.length === 0) return [];

    // 5. 排序：找出長度最短的候選路徑
    candidates.sort((a, b) => a.length - b.length);

    // 回傳第一個 (也就是最短的替代路徑)
    // 簡單過濾：確保它不是最佳路徑本人 (雖然封鎖後通常不會是，但保險起見)
    const bestLen = bestPath.length;
    for (let path of candidates) {
        // 這裡可以加入更嚴格的判斷，例如重疊率，但簡單長度判斷通常夠用
        // 次佳路徑通常 >= 最佳路徑
        if (path.length >= bestLen) return path; 
    }
    
    return candidates[0];
}

// ★★★ 修改：執行演算法函數 (加入統計數據顯示) ★★★
function runAlgo(type) {
    if (goalPositions.size === 0) return alert(typeof t==='function'?t('msg_no_goal'):"No Goal");
    
    const algoName = (typeof t === 'function') ? t('algo_' + type) : type; 
    statusText.innerText = (typeof t === 'function') ? t('status_calculating') : "Calculating...";
    
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

        // 計算次佳路徑 (阻斷法)
        secondaryPath = []; 
        if (path.length > 0 && ['flood', 'astar', 'dijkstra', 'manhattan'].includes(type)) {
            if (typeof calculateSecondBestPath === 'function') {
                secondaryPath = calculateSecondBestPath(path, type);
            }
        }

        const endTime = performance.now();
        currentSolutionPath = path;
        renderGrid(); 

        if (path.length > 0) {
            const timeStr = (endTime - startTime).toFixed(2);
            let html = `${algoName} | Time: ${timeStr}ms | `;
            
            const unitS = (typeof t === 'function') ? t('unit_step') : 'st';
            const unitT = (typeof t === 'function') ? t('unit_turn') : 'tn';

            if (type === 'flood') {
                // 1. 洪水法：先顯示多路徑列表 (北迴/東迴...)
                html += getMultiRouteStatus();
                
                // ★★★ 修正：補上「次佳路徑」的顯示 ★★★
                if (secondaryPath.length > 0) {
                    // 使用方位判斷函數來命名
                    // 確保 getPathAnalysisInfo 存在
                    const secInfo = (typeof getPathAnalysisInfo === 'function') 
                        ? getPathAnalysisInfo(secondaryPath) 
                        : { dir: 'n', label: '2nd', color: '#666' };

                    const secStats = analyzePath(secondaryPath);
                    
                    // 顯示格式： | 西迴(2nd): 45步12彎
                    html += ` | <span style="color:${secInfo.color}">${secInfo.label}(2nd): ${secStats.steps}${unitS}${secStats.turns}${unitT}</span>`;
                }
            } else {
                // 2. 其他演算法：顯示 最佳 + 次佳
                
                // (A) 最佳路徑
                const bestInfo = (typeof getPathAnalysisInfo === 'function') 
                    ? getPathAnalysisInfo(path) 
                    : { dir: 'n', label: 'Path', color: '#333' };
                const bestStats = analyzePath(path);
                html += `<span style="color:${bestInfo.color}; font-weight:bold;">${bestInfo.label}: ${bestStats.steps}${unitS}${bestStats.turns}${unitT}</span>`;

                // (B) 次佳路徑
                if (secondaryPath.length > 0) {
                    const secInfo = (typeof getPathAnalysisInfo === 'function') 
                        ? getPathAnalysisInfo(secondaryPath) 
                        : { dir: 'n', label: '2nd', color: '#666' };
                    const secStats = analyzePath(secondaryPath);
                    html += ` | <span style="color:${secInfo.color}">${secInfo.label}(2nd): ${secStats.steps}${unitS}${secStats.turns}${unitT}</span>`;
                }
            }

            statusText.innerHTML = html;

        } else {
            statusText.innerText = (typeof t === 'function') ? t('status_no_path') : "No Path";
        }
    }, 10);
}

function clearPath() {
    currentSolutionPath = [];
    secondaryPath = []; // ★ 清空時也要清掉第二路徑
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
    secondaryPath = []; // ★ 清空
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
    secondaryPath = []; // ★ 清空
    lastFloodDistMap = []; // ★ 清空權重表
    renderGrid();
    statusText.innerText = t('status_reset_wall'); // 順便更新狀態
}

// 3. 修改 clearMazeEmpty (全部拆除時清空)
function clearMazeEmpty() {
    // 掃描每一個格子
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            const idx = getIndex(x, y);
            mazeData[idx] = 0; // 先清空

            // 針對邊界加上對應的牆壁 (圍欄)
            if (y === HEIGHT - 1) mazeData[idx] |= 1; // 加上北牆
            if (x === WIDTH - 1)  mazeData[idx] |= 2; // 加上東牆
            if (y === 0)          mazeData[idx] |= 4; // 加上南牆
            if (x === 0)          mazeData[idx] |= 8; // 加上西牆
        }
    }
    
    // 強制起點規則 (U型牆)
    enforceStartRule();

    // 清空路徑與權重狀態
    currentSolutionPath = [];
    secondaryPath = []; // ★ 清空
    lastFloodDistMap = [];
    
    renderGrid();
    
    // 更新狀態文字
    if (statusText && typeof t === 'function') {
        statusText.innerText = t('status_cleared');
    }
}


// 4. ★ 重要：修改按鈕呼叫的生成函數
// 由於 generateRandomMaze 在 core 裡，我們在 ui_control 寫一個 wrapper 來處理清空
// 請把 HTML 中原本的 <button onclick="generateRandomMaze()"> 改成 onclick="handleGenerate()"
// 然後在這裡新增這個函數：

function handleGenerate() {
    currentSolutionPath = []; // 先清空舊路徑
    secondaryPath = []; // ★ 清空
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

// ★★★ 3. 重構：這是原本 loadMap 裡面的邏輯，抽出來共用 ★★★
function applyMapData(mapObj) {
    // 1. 基礎檢查
    if (!mapObj.width || !mapObj.height || !mapObj.data) {
        throw new Error((typeof t === 'function' ? t('msg_file_error') : "Invalid Map Data"));
    }

    // 2. 寫入全域變數
    WIDTH = mapObj.width;
    HEIGHT = mapObj.height;
    mazeData = mapObj.data;

    // 設定起點 (若無則預設 0,0)
    startPos = mapObj.start || { x: 0, y: 0 };
    
    // 設定終點 (若無則預設空)
    goalPositions = new Set(mapObj.goals || []);

    // 3. 更新 UI 輸入框
    const inputW = document.getElementById('input-w');
    const inputH = document.getElementById('input-h');
    if (inputW) inputW.value = WIDTH;
    if (inputH) inputH.value = HEIGHT;
    
    // 4. 更新 CSS 變數
    document.documentElement.style.setProperty('--cols', WIDTH);
    document.documentElement.style.setProperty('--rows', HEIGHT);

    // ★★★ 關鍵修復：載入後強制修正起點牆壁 ★★★
    // 這會確保 (0,0) 的北方一定是開的，讓洪水演算法能流出去
    if (typeof enforceStartRule === 'function') {
        enforceStartRule();
    }
    
    // ★★★ 新增：順便更新下拉選單狀態 (連動上一題的功能) ★★★
    if (typeof switchToCustom === 'function') {
        switchToCustom(); 
    }

    // 5. 清空舊路徑與權重
    currentSolutionPath = [];
    secondaryPath = [];
    lastFloodDistMap = [];

    // 6. 重新渲染
    renderAll();
}

// ★★★ 4. 修改：原本的上傳讀取函數，改呼叫上面的 applyMapData ★★★
function loadMap(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const mapObj = JSON.parse(e.target.result);
            applyMapData(mapObj); // 改用共用函數
            statusText.innerText = t('msg_load_success');
        } catch (err) {
            alert(t('msg_file_error'));
        }
    };
    reader.readAsText(file);
    input.value = '';
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

// ★★★ 修改：根據優先順序回推路徑 (新增 strictFirstDir 參數) ★★★
function tracePathWithPriority(distMap, priorityIndices, strictFirstDir = null) {
    if (!distMap || distMap.length === 0) return [];
    
    // 確保 DIRS 存在 (maze_core.js)
    if (typeof DIRS === 'undefined') return [];

    let curr = { x: startPos.x, y: startPos.y };
    const path = [{...curr}];
    
    if (distMap[getIndex(curr.x, curr.y)] === Infinity) return [];

    while (distMap[getIndex(curr.x, curr.y)] !== 0) {
        const currentDist = distMap[getIndex(curr.x, curr.y)];
        let moved = false;

        // ★ 決定這一輪要檢查哪些方向
        let loopIndices = priorityIndices;
        // 如果是第一步，且有指定 strictFirstDir，就只檢查那個方向
        if (path.length === 1 && strictFirstDir !== null) {
            loopIndices = [strictFirstDir];
        }

        for (let i = 0; i < loopIndices.length; i++) {
            const dirIdx = loopIndices[i]; 
            
            if (isWall(curr.x, curr.y, dirIdx)) continue;
            
            const nx = curr.x + DIRS[dirIdx].dx;
            const ny = curr.y + DIRS[dirIdx].dy;
            const nIdx = getIndex(nx, ny);
            
            // 洪水法：往數值比較小的鄰居走 (下坡)
            if (distMap[nIdx] < currentDist) {
                curr = { x: nx, y: ny };
                path.push({...curr});
                moved = true;
                break; 
            }
        }
        
        if (!moved) break;
        // 安全機制：防止無窮迴圈
        if (path.length > WIDTH * HEIGHT) break;
    }

    // 檢查最後是否真的到達終點 (距離為 0)
    const last = path[path.length - 1];
    if (distMap[getIndex(last.x, last.y)] !== 0) {
        return []; 
    }

    return path;
}

// ★★★ 修改：產生多路徑分析字串 (應用強制方向) ★★★
function getMultiRouteStatus() {
    if (!lastFloodDistMap || lastFloodDistMap.length === 0) return "";

    const priorities = {
        'n': [0, 1, 3, 2],
        'e': [1, 2, 0, 3],
        's': [2, 3, 1, 0],
        'w': [3, 0, 2, 1]
    };
    
    const dirCodes = { 'n': 0, 'e': 1, 's': 2, 'w': 3 };
    const startDirs = ['n', 'e', 'w', 's']; 
    let statusParts = [];

    startDirs.forEach(startDirKey => {
        // 1. 算出該方向的路徑
        const path = tracePathWithPriority(
            lastFloodDistMap, 
            priorities[startDirKey], 
            dirCodes[startDirKey]
        );
        
        // ★★★ 修改：只有在「有路徑」的時候才顯示 ★★★
        if (path.length > 0) {
            // 分析這條路徑實際的方位 (例如從北出發但繞到西邊，會顯示西迴)
            const info = getPathAnalysisInfo(path);
            const stats = analyzePath(path);
            
            const steps = stats.totalSteps || stats.steps;
            const turns = stats.turns;
            const unitS = (typeof t === 'function') ? t('unit_step') : 'st';
            const unitT = (typeof t === 'function') ? t('unit_turn') : 'tn';

            // 顯示格式： 方位名稱: 步數+轉彎 (使用該方位的顏色，粗體)
            statusParts.push(
                `<span style="color:${info.color}; font-weight:bold;">${info.label}: ${steps}${unitS}${turns}${unitT}</span>`
            );
        } 
        // else { ...原本顯示灰色的 "-"，現在直接刪除不顯示... }
    });

    return statusParts.join(" | ");
}

function toggleFilePanel() {
    const panel = document.getElementById('file-panel');
    if (panel.style.display === 'none') {
        panel.style.display = 'flex'; // 展開
    } else {
        panel.style.display = 'none'; // 隱藏
    }
}

function toggleSettingPanel() {
    const panel = document.getElementById('setting-panel');
    // 如果有檔案面板，也可以考慮點設定時自動把檔案面板關掉，保持畫面乾淨
    const filePanel = document.getElementById('file-panel');
    if (filePanel) filePanel.style.display = 'none';

    if (panel.style.display === 'none') {
        panel.style.display = 'flex';
    } else {
        panel.style.display = 'none';
    }
}

function applySizePreset() {
    const preset = document.getElementById('size-preset').value;
    const inputW = document.getElementById('input-w');
    const inputH = document.getElementById('input-h');
    const zoomSlider = document.getElementById('zoom-slider');

    if (preset === 'custom') return; // 如果選自定義，什麼都不做

    const size = parseInt(preset);
    
    // 1. 更新輸入框數值
    inputW.value = size;
    inputH.value = size;

    // 2. 自動調整縮放比例 (貼心功能)
    // 16x16 用 30px 比較清楚，32x32 太大所以縮小成 18px 才能看全貌
    let newZoom = (size >= 32) ? 18 : 30;
    
    // 如果你在手機上，格子要更小一點
    if (window.innerWidth < 768) {
        newZoom = (size >= 32) ? 12 : 20; 
    }

    if (zoomSlider) {
        zoomSlider.value = newZoom;
        updateZoom(newZoom);
    }

    // 3. 執行重置 (產生新迷宮)
    resizeMaze();
}

// ★★★ 新增：手動輸入時切換到「自定義」 ★★★
function switchToCustom() {
    const select = document.getElementById('size-preset');
    const inputW = document.getElementById('input-w');
    const inputH = document.getElementById('input-h');
    
    // 如果當前數值剛好符合預設值，就保持選單 (例如使用者手動打回 16)
    if (inputW.value == "16" && inputH.value == "16") {
        select.value = "16";
    } else if (inputW.value == "32" && inputH.value == "32") {
        select.value = "32";
    } else {
        select.value = "custom";
    }
}

// ★★★ 新增：滑鼠滾輪直接縮放 (不需按 Ctrl) ★★★
function initWheelZoom() {
    // 我們監聽整個迷宮包裹層，這樣包含座標軸在內的區域都能觸發
    const container = document.querySelector('.layout-wrapper');
    const slider = document.getElementById('zoom-slider');

    if (!container || !slider) return;

    container.addEventListener('wheel', (e) => {
        // 1. 關鍵：阻止瀏覽器預設的「捲動網頁」行為
        e.preventDefault();

        // 2. 取得目前的縮放值
        let currentZoom = parseInt(slider.value);
        
        // 3. 決定縮放速度 (步距)
        // deltaY < 0 代表滾輪「往上推」(放大)，> 0 代表「往下拉」(縮小)
        const step = 5; // 你可以調整這裡的數字來改變縮放靈敏度
        const direction = e.deltaY < 0 ? 1 : -1;

        let newZoom = currentZoom + (direction * step);

        // 4. 限制範圍 (讀取 slider 的 min/max 設定，防止爆掉)
        const min = parseInt(slider.min) || 10;
        const max = parseInt(slider.max) || 60;

        if (newZoom < min) newZoom = min;
        if (newZoom > max) newZoom = max;

        // 5. 更新滑動桿與畫面
        slider.value = newZoom;
        updateZoom(newZoom);

    }, { passive: false }); // ★★★ 注意：這裡一定要設 passive: false 才能擋住預設捲動
}

// 啟動程式
init();