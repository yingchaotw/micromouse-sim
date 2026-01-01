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
    // 1. 切換 CSS Class (控制選單開關)
    document.body.classList.toggle('sidebar-closed');

    // 2. 判斷是否為手機版
    const isMobile = window.innerWidth <= 768;
    
    // 判斷側邊欄是否變為「關閉 (隱藏)」狀態
    // 如果 body 有 sidebar-closed，代表側邊欄現在是關起來的
    const isSidebarClosed = document.body.classList.contains('sidebar-closed');

    if (isMobile) {
        if (!isSidebarClosed) {
            // 狀態：開啟選單 -> 暫停動畫
            if (typeof pauseAnimation === 'function') {
                pauseAnimation();
            }
        } else {
            // 狀態：關閉選單 -> 恢復動畫
            if (typeof resumeAnimation === 'function') {
                resumeAnimation();
            }
        }
    }

    // 3. 只更新必要的 UI，不要觸發全域 resize 事件！
    // 這樣可以避免 mazeApp 被重置
    setTimeout(() => {
        if (typeof checkInfoOverlap === 'function') {
            checkInfoOverlap();
        }
    }, 350); // 等待 CSS 動畫結束
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

        // ★★★ 新增這行：平移時檢查是否重疊 ★★★
        if (typeof checkInfoOverlap === 'function') checkInfoOverlap();
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

function checkInfoOverlap() {
    const infoBox = document.querySelector('.info-container');
    const mazeGrid = document.getElementById('maze-grid');

    if (!infoBox || !mazeGrid) return;

    // 1. 取得兩個元素的矩形範圍 (位置與大小)
    const infoRect = infoBox.getBoundingClientRect();
    const mazeRect = mazeGrid.getBoundingClientRect();

    // 2. 判斷是否重疊 (AABB Collision Detection)
    // 只要有一邊沒碰到，就是沒重疊
    const isOverlapping = !(
        infoRect.right < mazeRect.left || 
        infoRect.left > mazeRect.right || 
        infoRect.bottom < mazeRect.top || 
        infoRect.top > mazeRect.bottom
    );

    // 3. 根據結果切換 Class
    if (isOverlapping) {
        infoBox.classList.add('is-overlapping');
    } else {
        infoBox.classList.remove('is-overlapping');
    }
}

// 監聽會改變版面的事件，觸發檢查
window.addEventListener('resize', checkInfoOverlap);
window.addEventListener('scroll', checkInfoOverlap); // 如果你的頁面會捲動

// 使用 ResizeObserver 監測迷宮大小變化 (例如縮放、生成新地圖時)
const mazeObserver = new ResizeObserver(() => {
    checkInfoOverlap();
});

// 等 DOM 載入後啟動監聽
document.addEventListener('DOMContentLoaded', () => {
    const mazeGrid = document.getElementById('maze-grid');
    if (mazeGrid) {
        mazeObserver.observe(mazeGrid);
        
        // 為了保險，同時監聽 body 大小變化 (因為 sidebar 開關會改變版面)
        mazeObserver.observe(document.body);
    }
});

/* =========================================
   Mobile Pinch-to-Zoom (手機雙指縮放 & 單指平移)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    const layoutWrapper = document.querySelector('.layout-wrapper');
    const mazeContainer = document.getElementById('maze-container');
    const zoomSlider = document.getElementById('zoom-slider');

    if (!layoutWrapper || !mazeContainer || !zoomSlider) return;

    let state = {
        isDragging: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        initialDist: 0,
        initialZoom: 30
    };

    const updateTransform = () => {
        mazeContainer.style.transform = `translate3d(${state.currentX}px, ${state.currentY}px, 0)`;
        if (typeof checkInfoOverlap === 'function') checkInfoOverlap();
    };

    // ============================
    // 1. 觸控事件 (Mobile Touch)
    // ============================

    layoutWrapper.addEventListener('touchstart', (e) => {
        // ★★★ 關鍵修正：邊緣防誤觸 (Edge Guard) ★★★
        // 如果觸控點在螢幕左側 40px 內，視為「要拉選單」，不觸發迷宮拖曳
        if (e.touches.length > 0 && e.touches[0].clientX < 40) {
            return; 
        }

        if (e.touches.length === 1) {
            // [單指] 開始平移
            state.isDragging = true;
            state.startX = e.touches[0].clientX - state.currentX;
            state.startY = e.touches[0].clientY - state.currentY;
            layoutWrapper.classList.add('grabbing');
        } 
        else if (e.touches.length === 2) {
            // [雙指] 開始縮放
            state.isDragging = false;
            state.initialDist = getDistance(e.touches[0], e.touches[1]);
            state.initialZoom = parseFloat(zoomSlider.value);
        }
    }, { passive: false });

    // ... (後面的 touchmove, touchend 保持不變) ...
    
    layoutWrapper.addEventListener('touchmove', (e) => {
        e.preventDefault(); 

        if (e.touches.length === 1 && state.isDragging) {
            const x = e.touches[0].clientX;
            const y = e.touches[0].clientY;
            state.currentX = x - state.startX;
            state.currentY = y - state.startY;
            requestAnimationFrame(updateTransform);
        } 
        else if (e.touches.length === 2) {
            const currentDist = getDistance(e.touches[0], e.touches[1]);
            if (state.initialDist > 0) {
                const scale = currentDist / state.initialDist;
                let newZoom = state.initialZoom * scale;
                const min = parseFloat(zoomSlider.min);
                const max = parseFloat(zoomSlider.max);
                if (newZoom < min) newZoom = min;
                if (newZoom > max) newZoom = max;
                zoomSlider.value = newZoom;
                if (typeof updateZoom === 'function') updateZoom(newZoom);
            }
        }
    }, { passive: false });

    layoutWrapper.addEventListener('touchend', () => {
        state.isDragging = false;
        layoutWrapper.classList.remove('grabbing');
        state.initialDist = 0;
    });

    // ... (滑鼠事件與 helper 保持不變) ...
    
    // ============================
    // 2. 滑鼠事件 (Desktop Mouse)
    // ============================
    layoutWrapper.addEventListener('mousedown', (e) => {
        state.isDragging = true;
        state.startX = e.clientX - state.currentX;
        state.startY = e.clientY - state.currentY;
        layoutWrapper.classList.add('grabbing');
    });

    window.addEventListener('mousemove', (e) => {
        if (!state.isDragging) return;
        e.preventDefault();
        state.currentX = e.clientX - state.startX;
        state.currentY = e.clientY - state.startY;
        requestAnimationFrame(updateTransform);
    });

    window.addEventListener('mouseup', () => {
        state.isDragging = false;
        layoutWrapper.classList.remove('grabbing');
    });

    function getDistance(touch1, touch2) {
        return Math.hypot(
            touch1.clientX - touch2.clientX,
            touch1.clientY - touch2.clientY
        );
    }
});

/* =========================================
   Mobile: Click Outside to Close Sidebar
   (手機版：點擊迷宮區域自動收合選單)
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    const mainView = document.querySelector('.main-view');

    if (mainView) {
        mainView.addEventListener('click', (e) => {
            // 1. 檢查是否為手機版 (寬度 < 768px)
            const isMobile = window.innerWidth <= 768;
            
            // 2. 檢查側邊欄目前是否「開啟」
            // (我們定義: body 沒有 'sidebar-closed' class 代表開啟)
            const isSidebarOpen = !document.body.classList.contains('sidebar-closed');

            // 3. 如果是手機且選單開著，就執行收合
            if (isMobile && isSidebarOpen) {
                // 防止這一下點擊穿透下去觸發迷宮畫牆 (重要!)
                e.preventDefault();
                e.stopPropagation();
                
                // 呼叫原本的切換函式
                toggleSidebar();
            }
        });
    }
});

// =========================================
// Mobile Edge Swipe (手機邊緣滑動選單)
// =========================================
function initSwipeSidebar() {
    let touchStartX = 0;
    let touchStartY = 0;
    const EDGE_THRESHOLD = 40; 
    const SWIPE_DISTANCE = 50;

    document.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (e.changedTouches.length !== 1) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diffX = touchEndX - touchStartX;
        
        // 簡單判斷：如果是從邊緣向右滑，且距離夠長
        if (touchStartX < EDGE_THRESHOLD && diffX > SWIPE_DISTANCE) {
            // 如果選單是關著的，就打開
            if (document.body.classList.contains('sidebar-closed')) {
                toggleSidebar();
            }
        }
        
        // 如果是向左滑 (關閉選單)
        if (diffX < -SWIPE_DISTANCE && !document.body.classList.contains('sidebar-closed')) {
            toggleSidebar();
        }
    });
}