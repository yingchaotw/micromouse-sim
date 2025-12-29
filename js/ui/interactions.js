// js/ui/interactions.js

// 全域變數：記錄拖曳偏移量 (Panning)
let panX = 0;
let panY = 0;
let isPanning = false;
let startPanX = 0;
let startPanY = 0;

// 從滑鼠事件算出是哪個格子的哪面牆
function getWallFromEvent(e) {
    const cell = e.target.closest('.cell');
    if (!cell) return null;

    const coordStr = cell.getAttribute('data-coord'); 
    if (!coordStr) return null;
    
    const parts = coordStr.replace(/[()]/g, '').split(',').map(s => parseInt(s.trim()));
    const x = parts[0];
    const y = parts[1];

    const rect = cell.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    const distN = clickY;           
    const distS = h - clickY;       
    const distW = clickX;           
    const distE = w - clickX;       

    const min = Math.min(distN, distS, distW, distE);
    let dirIdx = 0; 
    if (min === distN) dirIdx = 0;      
    else if (min === distE) dirIdx = 1; 
    else if (min === distS) dirIdx = 2; 
    else dirIdx = 3;                    

    return { x, y, dirIdx };
}

// 核心繪圖動作
function handleDrawAction(e) {
    const target = getWallFromEvent(e);
    if (!target) return;

    const { x, y, dirIdx } = target;
    const currentKey = `${x},${y}-${dirIdx}`;

    if (currentKey === lastWallKey) return;

    // 1. 強制停止動畫計時器
    if (typeof stopAnimation === 'function') {
        stopAnimation();
    }

    // 2. 清除舊的路徑資料 (因為地圖變了，舊路徑無效)
    mazeApp.solutionPath = [];
    mazeApp.secondaryPath = [];
    mazeApp.weightMap = null; // 權重也無效了

    // 3. 執行切換牆壁
    mazeApp.toggleWall(x, y, dirIdx);
    lastWallKey = currentKey;
    
    // 4. 重繪
    renderGrid();
    
    // 5. 更新狀態文字 (提示使用者路徑已重置)
    if (typeof statusText !== 'undefined' && typeof t === 'function') {
        statusText.innerText = t('status_reset_wall'); // 或顯示 "Map Modified"
    }
}

// 初始化滑鼠監聽
function initMouseHandlers() {
    if (!domGrid) return;
    domGrid.style.userSelect = 'none'; 

    domGrid.addEventListener('mousedown', (e) => {
        if (currentMode !== 'wall') return; 
        isDrawing = true;
        lastWallKey = null; 
        handleDrawAction(e);
    });

    domGrid.addEventListener('mousemove', (e) => {
        if (!isDrawing || currentMode !== 'wall') return;
        handleDrawAction(e);
    });

    window.addEventListener('mouseup', () => {
        isDrawing = false;
        lastWallKey = null;
    });

    domGrid.addEventListener('dragstart', (e) => e.preventDefault());
}

// 滾輪縮放
function initWheelZoom() {
    const container = document.querySelector('.layout-wrapper');
    const slider = document.getElementById('zoom-slider');

    if (!container || !slider) return;

    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        let currentZoom = parseInt(slider.value);
        const step = 5; 
        const direction = e.deltaY < 0 ? 1 : -1;
        let newZoom = currentZoom + (direction * step);

        const min = parseInt(slider.min) || 10;
        const max = parseInt(slider.max) || 60;
        if (newZoom < min) newZoom = min;
        if (newZoom > max) newZoom = max;

        slider.value = newZoom;
        updateZoom(newZoom);
    }, { passive: false }); 
}

// 處理單點點擊 (起點/終點)
function handleCellClick(index, e) {
    const pos = mazeApp.getCoord(index);
    
    // 1. 強制停止動畫
    if (typeof stopAnimation === 'function') {
        stopAnimation();
    }
    
    // 2. 清除路徑資料
    mazeApp.solutionPath = [];
    mazeApp.secondaryPath = [];
    mazeApp.weightMap = null;

    if (currentMode === 'start') {
        mazeApp.setStart(pos.x, pos.y);
    } 
    else if (currentMode === 'goal') {
        mazeApp.toggleGoal(pos.x, pos.y);
    }
    
    // 3. 重繪
    renderGrid();
    updateStatus();
}

// 切換模式
function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.getElementById(`mode-${mode}`);
    if(btn) btn.classList.add('active');

    if (mode === 'wall') {
        domGrid.classList.add('editing-wall');
    } else {
        domGrid.classList.remove('editing-wall');
    }
}


function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
    
    // 為了讓這功能更像 Gemini，我們可以切換按鈕的圖示
    // (非必要，但體驗較好)
    
    const btn = document.querySelector('.sidebar-toggle');
    if (sidebar.classList.contains('collapsed')) {
        btn.innerText = '☰'; // 或者 '»'
    } else {
        btn.innerText = '☰'; // 或者 '«'
    }
    
}

// ★★★ 新增：迷宮拖曳功能 (Pan) ★★★
function initPanHandler() {
    const container = document.querySelector('.layout-wrapper');
    if (!container) return;

    let isPanning = false;
    let startX, startY, scrollLeft, scrollTop;

    // 1. 按下 (開始拖曳)
    container.addEventListener('mousedown', (e) => {
        // 觸發條件：
        // (A) 按下中鍵 (滾輪)
        // (B) 按住空白鍵 + 左鍵
        const isMiddleClick = e.button === 1;
        const isSpaceDrag = e.code === 'Space' || e.key === ' ';

        if (isMiddleClick || isSpaceDrag) {
            e.preventDefault(); // 防止出現捲動圖示或選取文字
            isPanning = true;
            container.classList.add('grabbing');

            // 紀錄滑鼠起始位置與目前的捲動位置
            startX = e.pageX - container.offsetLeft;
            startY = e.pageY - container.offsetTop;
            scrollLeft = container.scrollLeft;
            scrollTop = container.scrollTop;
        }
    });

    // 2. 移動 (計算位移)
    container.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        e.preventDefault();

        const x = e.pageX - container.offsetLeft;
        const y = e.pageY - container.offsetTop;

        // 計算滑鼠移動了多少
        const walkX = (x - startX); 
        const walkY = (y - startY);

        // 更新捲動軸 (反向移動才有拖曳感)
        container.scrollLeft = scrollLeft - walkX;
        container.scrollTop = scrollTop - walkY;
    });

    // 3. 放開或離開 (停止拖曳)
    const stopPanning = () => {
        isPanning = false;
        container.classList.remove('grabbing');
    };

    container.addEventListener('mouseup', stopPanning);
    container.addEventListener('mouseleave', stopPanning);

    // 4. 偵測空白鍵按下/放開，改變游標樣式 (UX 優化)
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !isPanning) {
            container.classList.add('grab-mode');
        }
    });
    
    window.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            container.classList.remove('grab-mode');
            // 如果放開空白鍵時還在拖曳，強制停止
            if (isPanning) stopPanning();
        }
    });
}

function initSpeedSlider() {
    const slider = document.getElementById('speed-slider');
    const display = document.getElementById('speed-val');

    if (!slider || !display) return;

    // 定義更新函式
    const update = () => {
        display.innerText = slider.value + '%';
    };

    // 監聽 'input' 事件 (拖動時即時觸發)
    slider.addEventListener('input', update);

    // 初始化 (頁面剛載入時先顯示一次)
    update();
}