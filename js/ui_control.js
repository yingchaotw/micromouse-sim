// js/ui_control.js (完整修復版)

// === Worker 訊息處理 ===
mazeWorker.onmessage = function(e) {
    const data = e.data;
    if (data.type === 'ALGO_RESULT') {
        handleAlgoResult(data);
    }
};

function handleAlgoResult(data) {
    domGrid.style.opacity = '1';
    domGrid.style.pointerEvents = 'auto';

    if (data.error) {
        statusText.innerText = "Error: " + data.error;
        return;
    }

    const { path, secondaryPath, weightMap, time } = data;
    const select = document.getElementById('algo-select');
    const type = select.value;
    const algoName = (typeof t === 'function') ? t('algo_' + type) : type;

    // 更新核心資料
    mazeApp.solutionPath = path;
    mazeApp.secondaryPath = secondaryPath;
    mazeApp.weightMap = weightMap;

    // 重繪 (renderer.js)
    renderGrid(); 

    // 更新狀態文字
    if (path.length > 0) {
        const unitS = (typeof t === 'function') ? t('unit_step') : 'st';
        const unitT = (typeof t === 'function') ? t('unit_turn') : 'tn';
        let html = `${algoName} | Time: ${time}ms | `;

        if (type === 'flood') {
            html += getMultiRouteStatus(); 
            if (secondaryPath.length > 0) {
                const secInfo = getPathAnalysisInfo(secondaryPath);
                const secStats = analyzePath(secondaryPath);
                html += ` | <span style="color:${secInfo.color}">${secInfo.label}(2nd): ${secStats.steps}${unitS}${secStats.turns}${unitT}</span>`;
            }
        } else {
            const bestInfo = getPathAnalysisInfo(path);
            const bestStats = analyzePath(path);
            html += `<span style="color:${bestInfo.color}; font-weight:bold;">${bestInfo.label}: ${bestStats.steps}${unitS}${bestStats.turns}${unitT}</span>`;

            if (secondaryPath.length > 0) {
                const secInfo = getPathAnalysisInfo(secondaryPath);
                const secStats = analyzePath(secondaryPath);
                html += ` | <span style="color:${secInfo.color}">${secInfo.label}(2nd): ${secStats.steps}${unitS}${secStats.turns}${unitT}</span>`;
            }
        }
        statusText.innerHTML = html;
    } else {
        statusText.innerText = (typeof t === 'function') ? t('status_no_path') : "No Path";
    }
}

// === 應用程式初始化 ===

function init() {
    const slider = document.getElementById('zoom-slider');
    if(slider) updateZoom(slider.value); 
    
    // 初始化語言 (i18n.js)
    if(typeof initLanguage === 'function') initLanguage();
    
    initMapList();          // 初始化地圖選單
    resizeMaze(); 
    handleGenerate(true);   // 預設生成一個迷宮

    if (statusText && typeof t === 'function') {
        statusText.innerText = t('status_ready');
    }

    if (typeof initPanHandler === 'function') initPanHandler();
    if (typeof initSpeedSlider === 'function') initSpeedSlider();
    if (typeof initSwipeSidebar === 'function') initSwipeSidebar();

    updateAlgoUI();
    // 初始化事件監聽
    initWheelZoom();      
    initMouseHandlers();  

    // ★★★ 新增：監聽權重 Checkbox，只切換 CSS，不重繪 ★★★
    const chkWeights = document.getElementById('chk-show-weights');
    if (chkWeights) {
        // 移除原本可能在 HTML 裡的 onchange，改用這行監聽
        chkWeights.onchange = toggleWeightDisplay;
    }

    setMode('wall');
}


// ★★★ 新增這個函式：純粹切換顯示狀態，不清除路徑 ★★★
function toggleWeightDisplay(e) {
    const isChecked = e.target.checked;
    if (isChecked) {
        domGrid.classList.add('show-weights');
    } else {
        domGrid.classList.remove('show-weights');
    }
}

// === 地圖清單與讀取功能 ===

function initMapList() {
    const select = document.getElementById('map-select');
    // 檢查 MAP_LIST 是否存在 (由 maps_index.js 提供)
    if (!select || typeof MAP_LIST === 'undefined') return;

    const currentVal = select.value;
    select.innerHTML = '';
    
    MAP_LIST.forEach(map => {
        const option = document.createElement('option');
        option.value = map.file;
        // 支援多語系名稱
        option.textContent = typeof t === 'function' ? t(map.name) : map.name;
        select.appendChild(option);
    });

    if (currentVal) select.value = currentVal;
}

function loadSelectedMap() {
    const select = document.getElementById('map-select');
    const filename = select.value;

    if (!filename) {
        alert(typeof t === 'function' ? t('msg_select_map') : "Please select a map!");
        return;
    }

    // 假設地圖檔都在 maps/ 資料夾下
    const filePath = `maps/${filename}`; 

    statusText.innerText = typeof t === 'function' ? t('status_loading') : "Loading...";

    fetch(filePath)
        .then(response => {
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
            alert((typeof t === 'function' ? t('msg_map_error') : "Load Failed") + "\n" + err.message);
            statusText.innerText = "Error: " + err.message;
        });
}

// === ★★★ 補回：語言切換功能 ★★★ ===

function changeLanguage(lang) {
    // 1. 設定全域語言變數 (這變數通常在 i18n.js 定義)
    if (typeof currentLang !== 'undefined') {
        currentLang = lang;
    }
    
    // 2. 存入 LocalStorage
    localStorage.setItem('mm_lang', lang);

    // 3. 呼叫 i18n.js 的翻譯函式 (只更新文字 DOM)
    if (typeof applyTranslations === 'function') {
        applyTranslations();
    }
    
    // 4. 重繪「地圖清單」 (因為選單選項是用 JS 產生的，必須重跑才能翻譯)
    initMapList();
    
    // 5. 更新狀態列文字
    updateStatus();

    // 6. 更新演算法選單文字 (如果 algo-select 是動態生成的也需要，如果是靜態的 applyTranslations 會處理)
    // 這裡為了保險起見，重新觸發一次 algo UI 的檢查
    updateAlgoUI();
    
}

// === 核心控制邏輯 ===

function runAlgo(type) {
    if (mazeApp.goalPositions.size === 0) return alert(typeof t==='function'?t('msg_no_goal'):"No Goal");
    statusText.innerText = (typeof t === 'function') ? t('status_calculating') : "Calculating...";
    
    domGrid.style.opacity = '0.7'; 
    domGrid.style.pointerEvents = 'none';

    mazeWorker.postMessage({
        type: 'RUN_ALGO',
        algoType: type,
        mazeConfig: mazeApp.toJSON()
    });
}

function resizeMaze() {
    if (typeof stopAnimation === 'function') stopAnimation(); // ★ 強制停止動畫

    const w = parseInt(document.getElementById('input-w').value);
    const h = parseInt(document.getElementById('input-h').value);
    mazeApp.setSize(w, h);
    
    if (typeof resetView === 'function') resetView();

    const midX = Math.floor(w / 2);
    const midY = Math.floor(h / 2);
    const xRange = (w % 2 === 0) ? [midX - 1, midX] : [midX];
    const yRange = (h % 2 === 0) ? [midY - 1, midY] : [midY];

    for (let x of xRange) {
        for (let y of yRange) {
            mazeApp.toggleGoal(x, y); 
        }
    }

    mazeApp.enforceStartRule();
    updateUIFromCore(); 
    handleGenerate(true);
}

function handleGenerate(forceReset = null) {
    if (typeof stopAnimation === 'function') stopAnimation(); // ★ 強制停止動畫

    const chkKeep = document.getElementById('chk-keep');
    const chkLoops = document.getElementById('chk-loops');
    
    let shouldKeep = chkKeep.checked;
    if (forceReset === true) shouldKeep = false;
    const loops = chkLoops.checked;
    
    mazeApp.solutionPath = [];
    mazeApp.secondaryPath = [];
    mazeApp.weightMap = null;

    mazeApp.generateRandom(shouldKeep, loops);
    
    renderGrid(); 
    updateStatus(); 
}

// === 檔案功能 ===

function loadMap(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const mapObj = JSON.parse(e.target.result);
            applyMapData(mapObj);
            statusText.innerText = t('msg_load_success');
        } catch (err) {
            alert(t('msg_file_error'));
        }
    };
    reader.readAsText(file);
    input.value = '';
}

function applyMapData(mapObj) {
    if (typeof stopAnimation === 'function') stopAnimation(); // ★ 強制停止動畫

    mazeApp.loadFromJSON(mapObj); 
    updateUIFromCore(); 
    mazeApp.solutionPath = [];
    mazeApp.secondaryPath = [];
    mazeApp.weightMap = null;
    if (typeof switchToCustom === 'function') switchToCustom(); 
}

function downloadMap() {
    const mapObj = mazeApp.toJSON();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mapObj));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `maze_${mazeApp.width}x${mazeApp.height}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function runSelectedAlgo() {
    const chkAnimate = document.getElementById('chk-animate');
    // const useAnim = chkAnimate && chkAnimate.checked; // 這行可以註解掉或刪除

    const select = document.getElementById('algo-select');
    const type = select.value;

    // 定義核心執行邏輯
    const execute = () => {
        // ★★★ 關鍵修正：統一由 startAnimation 接管 ★★★
        // 不管有沒有勾選動畫，都交給 animator.js 處理
        // animator.js 內部會自己判斷要 runGeneratorSync (瞬間) 還是 animateGenerator (動畫)
        if (typeof startAnimation === 'function') {
            startAnimation(type);
        } else {
            console.error("startAnimation function missing!");
            runAlgo(type); // 只有在找不到函式時才降級使用 Worker
        }
    };

    // --- 手機版優化邏輯 (保持不變) ---
    const isMobile = window.innerWidth <= 768;
    const isSidebarOpen = !document.body.classList.contains('sidebar-closed');

    if (isMobile && isSidebarOpen) {
        toggleSidebar();
        setTimeout(() => {
            execute();
        }, 360); 
    } else {
        execute();
    }
}

function clearPath() {
    if (typeof stopAnimation === 'function') stopAnimation(); // ★ 清除路徑時也要停止

    mazeApp.solutionPath = [];
    mazeApp.secondaryPath = [];
    renderGrid();
    statusText.innerText = t('status_path_cleared');
}

function fillMazeWalls() {
    mazeApp.data.fill(15);
    mazeApp.enforceStartRule();
    clearPath();
    statusText.innerText = t('status_reset_wall');
}

function clearMazeEmpty() {
    mazeApp.data.fill(0);
    for(let y=0; y<mazeApp.height; y++) {
        for(let x=0; x<mazeApp.width; x++) {
            const idx = mazeApp.getIndex(x, y);
            if(y === mazeApp.height-1) mazeApp.data[idx] |= 1;
            if(x === mazeApp.width-1)  mazeApp.data[idx] |= 2;
            if(y === 0)                mazeApp.data[idx] |= 4;
            if(x === 0)                mazeApp.data[idx] |= 8;
        }
    }
    mazeApp.enforceStartRule();
    clearPath();
    statusText.innerText = t('status_cleared');
}

function updateAlgoUI() {
    const select = document.getElementById('algo-select');
    const chkWeights = document.getElementById('chk-show-weights');
    const type = select.value;
    const hasWeights = ['flood', 'astar', 'dijkstra', 'manhattan', 'bfs', 'dfs'];

    if (hasWeights.includes(type)) {
        chkWeights.disabled = false;
        chkWeights.parentElement.style.color = ''; 
    } else {
        chkWeights.checked = false;
        chkWeights.disabled = true;
        chkWeights.parentElement.style.color = '#ccc';
        // 移除 class
        domGrid.classList.remove('show-weights');
    }

    if (chkWeights.checked) {
        domGrid.classList.add('show-weights');
    } else {
        domGrid.classList.remove('show-weights');
    }

}

function applySizePreset() {
    const preset = document.getElementById('size-preset').value;
    const inputW = document.getElementById('input-w');
    const inputH = document.getElementById('input-h');
    const zoomSlider = document.getElementById('zoom-slider');

    if (preset === 'custom') return;

    const size = parseInt(preset);
    inputW.value = size;
    inputH.value = size;

    let newZoom = (size >= 32) ? 18 : 30;
    if (window.innerWidth < 768) newZoom = (size >= 32) ? 12 : 20; 

    if (zoomSlider) {
        zoomSlider.value = newZoom;
        updateZoom(newZoom);
    }
    resizeMaze();
}

function switchToCustom() {
    const select = document.getElementById('size-preset');
    const inputW = document.getElementById('input-w');
    const inputH = document.getElementById('input-h');
    
    if (inputW.value == "16" && inputH.value == "16") {
        select.value = "16";
    } else if (inputW.value == "32" && inputH.value == "32") {
        select.value = "32";
    } else {
        select.value = "custom";
    }
}

function toggleFilePanel() {
    const panel = document.getElementById('file-panel');
    panel.style.display = (panel.style.display === 'none') ? 'flex' : 'none';
}

function toggleSettingPanel() {
    const panel = document.getElementById('setting-panel');
    const filePanel = document.getElementById('file-panel');
    if (filePanel) filePanel.style.display = 'none';
    panel.style.display = (panel.style.display === 'none') ? 'flex' : 'none';
}


// === 地圖清單與讀取功能 ===

function initMapList() {
    const select = document.getElementById('map-select');
    // 檢查 MAP_LIST 是否存在 (由 maps_index.js 提供)
    if (!select || typeof MAP_LIST === 'undefined') return;

    const currentVal = select.value;
    select.innerHTML = ''; // 清空現有選項

    // 1. 準備容器：用來分類年份
    const groups = {}; 
    const others = [];

    // 2. 遍歷 MAP_LIST 進行分類
    MAP_LIST.forEach(map => {
        // 跳過空檔名 (如果有定義分隔線的話)
        if (!map.file) return;

        // ★ Regex: 抓取名稱中的 4 位數年份 (例如 2024, 2023)
        // map.name 可能是 "2024第45回..." 或 "Demo Map"
        const match = map.name.match(/(20\d{2})/);

        if (match) {
            const year = match[1];
            if (!groups[year]) groups[year] = [];
            groups[year].push(map);
        } else {
            // 沒抓到年份的，放進「其他」
            others.push(map);
        }
    });

    // 3. 加入一個預設提示選項 (可選)
    const defaultOpt = document.createElement('option');
    defaultOpt.value = "";
    defaultOpt.textContent = typeof t === 'function' ? t('lbl_select_map') : "-- Select Map --";
    // 如果想要預設選中這個，可以 uncomment 下面這行，但在 changeLanguage 時會重置
    // if (!currentVal) defaultOpt.selected = true; 
    select.appendChild(defaultOpt);

    // 4. 依照年份「由大到小」排序 (最新的在最上面)
    const sortedYears = Object.keys(groups).sort((a, b) => b - a);

    sortedYears.forEach(year => {
        // 建立分組標籤
        const groupEl = document.createElement('optgroup');
        groupEl.label = `${year}`; // 標題顯示年份

        groups[year].forEach(map => {
            const option = document.createElement('option');
            option.value = map.file;
            // 支援多語系名稱
            option.textContent = typeof t === 'function' ? t(map.name) : map.name;
            groupEl.appendChild(option);
        });

        select.appendChild(groupEl);
    });

    // 5. 最後加入「其他」類別 (如果有)
    if (others.length > 0) {
        const otherGroup = document.createElement('optgroup');
        otherGroup.label = typeof t === 'function' ? t('lbl_others') : "Others"; // 你可以在 i18n 裡加個 lbl_others

        others.forEach(map => {
            const option = document.createElement('option');
            option.value = map.file;
            option.textContent = typeof t === 'function' ? t(map.name) : map.name;
            otherGroup.appendChild(option);
        });

        select.appendChild(otherGroup);
    }

    // 6. 嘗試恢復原本選中的值 (避免切換語言時跳掉)
    if (currentVal) {
        select.value = currentVal;
    }
}

// 啟動程式
init();