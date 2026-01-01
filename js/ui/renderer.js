// js/ui/renderer.js

// 畫面縮放
function updateZoom(val) {
    // 1. 原本設定 CSS 變數的程式碼
    document.documentElement.style.setProperty('--cell-size', val + 'px');
    
    // (如果原本有更新 Slider 文字的程式碼保留不動)
    // document.getElementById('zoom-val').innerText = val; 

    // ★ 2. 新增這段：自動判斷是否旋轉座標
    const xAxis = document.getElementById('x-axis');
    
    // 設定閾值：例如小於 24px 時就覺得太擠了，開始旋轉
    if (val < 24) {
        xAxis.classList.add('rotate-mode');
    } else {
        xAxis.classList.remove('rotate-mode');
    }
}

function resetView() {
    panX = 0;
    panY = 0;
    if(domGrid) domGrid.style.transform = `translate(0px, 0px)`;
}

// =========================================
// 主題切換邏輯 (Auto Sync Version)
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    const checkbox = document.getElementById('checkbox-theme');
    // 定義系統偏好偵測器
    const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)');

    // 1. 初始化函式：決定現在該用什麼主題
    function applyInitialTheme() {
        const savedTheme = localStorage.getItem('theme'); // 讀取使用者設定
        const isSystemDark = systemDarkMode.matches;      // 讀取系統設定

        // 邏輯：
        // A. 如果有存檔 (dark) -> 用 dark
        // B. 如果沒存檔 且 系統是 dark -> 用 dark
        // C. 其他 -> 用 light
        if (savedTheme === 'dark' || (!savedTheme && isSystemDark)) {
            setTheme('dark', false); // false 代表不要寫入 localStorage (若是自動判斷的話)
        } else {
            setTheme('light', false);
        }
    }

    // 2. 執行初始化
    applyInitialTheme();

    // 3. 【關鍵】監聽系統主題變化 (當使用者切換作業系統設定時)
    // 只有在使用者「沒有手動設定過 (localStorage 為空)」時，才自動同步
    systemDarkMode.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            setTheme(newTheme, false);
        }
    });

    // 內部 helper：統一設定 DOM 與 Checkbox 狀態
    function setTheme(themeName, saveToStorage = false) {
        document.documentElement.setAttribute('data-theme', themeName);
        
        // 同步 Checkbox 狀態 (深色=勾選, 淺色=不勾)
        if (checkbox) {
            checkbox.checked = (themeName === 'dark');
        }

        // 只有手動切換時才存入 localStorage
        if (saveToStorage) {
            localStorage.setItem('theme', themeName);
        }
    }

    // 將 setTheme 綁定到全域 (如果 toggleThemeSwitch 是 inline onclick 呼叫的話)
    // 或者你可以直接修改下方的 toggleThemeSwitch 函式
    window.internalSetTheme = setTheme; 
});

// 4. 使用者手動切換 (綁定在 Checkbox 的 onchange)
function toggleThemeSwitch(checkbox) {
    const isChecked = checkbox.checked;
    const themeName = isChecked ? 'dark' : 'light';
    
    // 呼叫內部設定並強制儲存
    if (window.internalSetTheme) {
        window.internalSetTheme(themeName, true);
    } else {
        // Fallback (如果 DOMContentLoaded 還沒跑完)
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('theme', themeName);
    }
}

// 輔助 SVG 畫線
function drawSvgPath(svg, pathData, color, isDashed) {
    const svgNS = "http://www.w3.org/2000/svg";
    const pathElem = document.createElementNS(svgNS, "path");
    
    pathElem.setAttribute("class", isDashed ? "path-dashed" : "path-line");
    pathElem.style.stroke = color;
    
    let d = "";
    const points = pathData.map(p => ({
        x: p.x + 0.5,
        y: (mazeApp.height - 1 - p.y) + 0.5 
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

// 從 Core 更新 UI 數值
function updateUIFromCore() {
    document.documentElement.style.setProperty('--cols', mazeApp.width);
    document.documentElement.style.setProperty('--rows', mazeApp.height);
    const inputW = document.getElementById('input-w');
    const inputH = document.getElementById('input-h');
    if(inputW) inputW.value = mazeApp.width;
    if(inputH) inputH.value = mazeApp.height;
    renderAll();
}

// 渲染外框與座標
function renderAll() {
    domYAxis.innerHTML = '';
    domXAxis.innerHTML = '';
    for (let y = mazeApp.height - 1; y >= 0; y--) {
        const div = document.createElement('div'); div.textContent = y; domYAxis.appendChild(div);
    }
    for (let x = 0; x < mazeApp.width; x++) {
        const div = document.createElement('div'); div.textContent = x; domXAxis.appendChild(div);
    }
    renderGrid();
    updateStatus();
}

// 核心渲染 (繪製格子與路徑)
function renderGrid() {
    domGrid.innerHTML = '';
    domGrid.style.position = 'relative';

    // SVG 層
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "maze-svg-layer");
    svg.setAttribute("viewBox", `0 0 ${mazeApp.width} ${mazeApp.height}`);
    svg.setAttribute("preserveAspectRatio", "none");

    if (mazeApp.secondaryPath && mazeApp.secondaryPath.length > 0) {
        const info = getPathAnalysisInfo(mazeApp.secondaryPath);
        drawSvgPath(svg, mazeApp.secondaryPath, info.color, true);
    }
    if (mazeApp.solutionPath && mazeApp.solutionPath.length > 0) {
        const info = getPathAnalysisInfo(mazeApp.solutionPath);
        drawSvgPath(svg, mazeApp.solutionPath, info.color, false);
    }
    domGrid.appendChild(svg);

    const isSpecialCell = (tx, ty) => {
        if (tx === mazeApp.startPos.x && ty === mazeApp.startPos.y) return true;
        return mazeApp.goalPositions.has(`${tx},${ty}`);
    };

    for (let i = 0; i < mazeApp.data.length; i++) {
        const pos = mazeApp.getCoord(i); 
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.setAttribute('data-coord', `(${pos.x}, ${pos.y})`);

        const val = mazeApp.data[i];
        const amISpecial = isSpecialCell(pos.x, pos.y);

        if ((val & 1) && !isSpecialCell(pos.x, pos.y + 1)) cell.classList.add('wall-n');
        if ((val & 8) && !isSpecialCell(pos.x - 1, pos.y)) cell.classList.add('wall-w');
        if ((val & 2) && (pos.x === mazeApp.width - 1 || amISpecial)) cell.classList.add('wall-e');
        if ((val & 4) && (pos.y === 0 || amISpecial)) cell.classList.add('wall-s');

        if (amISpecial && pos.x === mazeApp.startPos.x && pos.y === mazeApp.startPos.y) cell.classList.add('is-start');
        if (amISpecial && mazeApp.goalPositions.has(`${pos.x},${pos.y}`)) cell.classList.add('is-goal');

        if (mazeApp.weightMap && mazeApp.weightMap[i] !== undefined && mazeApp.weightMap[i] !== Infinity) {
            const dist = mazeApp.weightMap[i];
            const span = document.createElement('span');
            span.className = 'cell-weight';
            if (val === 15) span.classList.add('on-wall');
            span.innerText = dist;
            cell.appendChild(span);
        }

        cell.onclick = (e) => {
            if (currentMode === 'wall') return; 
            handleCellClick(i, e);
        };
        domGrid.appendChild(cell);
    }
}

function updateStatus() {
    const realW = (mazeApp.width * REAL_CELL_SIZE_MM / 1000).toFixed(2);
    const realH = (mazeApp.height * REAL_CELL_SIZE_MM / 1000).toFixed(2);
    
    statusText.innerText = t('status_info', {
        w: mazeApp.width, h: mazeApp.height,
        rw: realW, rh: realH,
        sx: mazeApp.startPos.x, sy: mazeApp.startPos.y,
        gcount: mazeApp.goalPositions.size
    });
}