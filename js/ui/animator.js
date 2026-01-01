/* js/ui/animator.js */

window.currentStepFunc = null;

// ===========================================
// 1. 核心控制
// ===========================================

function stopAnimation() {
    if (window.mazeTimer) {
        clearTimeout(window.mazeTimer);
        window.mazeTimer = null;
    }
    window.currentStepFunc = null;

    // 清除畫面上的標記
    document.querySelectorAll('.cell.searching, .cell.current-head, .cell.path-node, .cell.backtracking').forEach(el => {
        el.classList.remove('searching', 'current-head', 'path-node', 'backtracking');
    });
}

function pauseAnimation() {
    if (window.mazeTimer) {
        clearTimeout(window.mazeTimer);
        window.mazeTimer = null;
    }
}

function resumeAnimation() {
    if (window.currentStepFunc && !window.mazeTimer) {
        window.currentStepFunc();
    }
}

function getDelay() {
    const slider = document.getElementById('speed-slider');
    if (!slider) return 30;
    let val = parseInt(slider.value);
    if (val >= 98) return 0; 
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
// 2. 演算法執行器 (動畫版 & 瞬間版)
// ===========================================

// 【A. 動畫版】慢慢跑，會更新 UI
function animateGenerator(generatorFunc) {
    stopAnimation(); 
    renderGrid();    
    
    // ★ 翻譯狀態文字
    const statusText = document.getElementById('status-text');
    statusText.innerText = (typeof t === 'function') ? t('status_simulating') : "Simulating...";
    
    if (typeof generatorFunc !== 'function') {
        alert("錯誤：找不到演算法函式。請確認 algos/*.js 檔案是否正確載入。");
        return;
    }

    let iterator;
    try {
        iterator = generatorFunc(mazeApp); 
    } catch (e) {
        console.error(e);
        statusText.innerText = "Error init: " + e.message;
        return;
    }

    // 重置權重地圖
    mazeApp.weightMap = new Array(mazeApp.width * mazeApp.height).fill(Infinity);

    function step() {
        window.currentStepFunc = step;
        let res;
        try {
            res = iterator.next();
        } catch (e) {
            console.error("Algorithm Error:", e);
            finishAnimation([], "Error: " + e.message);
            return;
        }

        const { value, done } = res;

        if (done) {
            if (!mazeApp.solutionPath || mazeApp.solutionPath.length === 0) {
                 console.log("Animation finished without explicit result.");
            }
            return; 
        }

        handleGeneratorYield(value, true); 

        // 檢查是否結束
        if (value.type === 'found' || value.type === 'no_path' || value.type === 'stuck') {
             return;
        }

        window.mazeTimer = setTimeout(step, getDelay());
    }
    step();
}

// 【B. 瞬間版】(直接運算，不使用任何 Timer)
function runGeneratorSync(generatorFunc) {
    const statusEl = document.getElementById('status-text');
    
    if (typeof generatorFunc !== 'function') {
        statusEl.innerText = "Error: Func missing";
        alert("找不到演算法函式，請確認 algos 檔案是否載入");
        return;
    }

    mazeApp.weightMap = new Array(mazeApp.width * mazeApp.height).fill(Infinity);

    try {
        const iterator = generatorFunc(mazeApp);
        let res = iterator.next();
        let finalResultYielded = false; 
        
        // 安全計數器：防止死迴圈卡死瀏覽器
        let safetyCounter = 0;
        const MAX_LOOPS = 2000000; // 200萬次，足夠應付 64x64 的全圖掃描

        while (!res.done) {
            const val = res.value;
            
            // 更新資料 (不更新 UI DOM)
            if (val && val.val !== undefined) {
                const idx = mazeApp.getIndex(val.x, val.y);
                if (idx >= 0 && idx < mazeApp.weightMap.length) {
                    mazeApp.weightMap[idx] = val.val;
                }
            }

            // 檢查關鍵結果
            if (val && (val.type === 'found' || val.type === 'no_path' || val.type === 'stuck')) {
                handleGeneratorYield(val, false); // 觸發結束處理
                finalResultYielded = true;
                break; 
            }
            
            res = iterator.next();
            
            if (++safetyCounter > MAX_LOOPS) {
                console.warn("Safety limit reached in sync mode.");
                finishAnimation([], "Timeout (Loop limit)");
                return;
            }
        }

        // 如果迴圈跑完了但沒找到路 (例如 Flood Fill 掃描全圖結束)
        // 這時候我們手動觸發 finishAnimation 來顯示已經填好的 weightMap
        if (!finalResultYielded) {
             finishAnimation([], "Scan Completed");
        }

    } catch (e) {
        console.error("Sync Error:", e);
        statusEl.innerText = "Error: " + e.message;
        renderGrid(); 
    }
}

// 【共用邏輯】處理 Generator 吐出來的資料
function handleGeneratorYield(value, updateUI) {
    if (!value) return;

    // 1. 瞬間模式 (updateUI=false)
    if (!updateUI) {
        if (value.type === 'found') finishAnimation(value.path, 'msg_goal_reached');
        else if (value.type === 'no_path') finishAnimation([], 'msg_no_path');
        else if (value.type === 'stuck') finishAnimation(value.path, 'msg_stuck');
        return;
    }

    // 2. 動畫模式 (updateUI=true)
    switch (value.type) {
        case 'start':
            updateCellUI(value.x, value.y, 0);
            break;
        case 'searching':
            const searchCell = document.querySelector(`.cell[data-coord="(${value.x}, ${value.y})"]`);
            if (searchCell) {
                searchCell.classList.add('searching'); 
                if (value.val !== undefined) updateCellUI(value.x, value.y, value.val);
            }
            break;
        case 'visit':
            document.querySelectorAll('.current-head').forEach(el => el.classList.remove('current-head'));
            const cell = document.querySelector(`.cell[data-coord="(${value.x}, ${value.y})"]`);
            if (cell) {
                cell.classList.add('searching', 'current-head');
                if (value.val !== undefined) updateCellUI(value.x, value.y, value.val);
            }
            break;
        case 'backtrack':
            const backCell = document.querySelector(`.cell[data-coord="(${value.x}, ${value.y})"]`);
            if (backCell) {
                backCell.classList.remove('current-head');
                backCell.classList.add('backtracking');
            }
            break;
        case 'path_node': 
            const pCell = document.querySelector(`.cell[data-coord="(${value.x}, ${value.y})"]`);
            if (pCell) pCell.classList.add('path-node');
            break;
        case 'found':
            finishAnimation(value.path, 'msg_goal_reached');
            break;
        case 'no_path':
            finishAnimation([], 'msg_no_path');
            break;
        case 'stuck':
            finishAnimation(value.path, 'msg_stuck');
            break;
    }
}

// ★★★ 關鍵修改：finishAnimation 支援多國語言 ★★★
// msgKey: 傳入 i18n 的 key (例如 'msg_goal_reached')，而不是寫死的字串
function finishAnimation(path, msgKey) {
    if (window.mazeTimer) clearTimeout(window.mazeTimer);
    window.mazeTimer = null;
    window.currentStepFunc = null;

    mazeApp.solutionPath = path;
    
    renderGrid(); 
    
    const hasAnimationTrace = document.querySelector('.cell.searching');
    if (hasAnimationTrace) {
        setTimeout(() => {
            document.querySelectorAll('.cell.searching, .cell.backtracking, .cell.current-head').forEach(el => {
                el.classList.remove('searching', 'current-head', 'backtracking');
            });
        }, 1500);
    }

    // ★ 這裡進行翻譯
    // 如果 msgKey 是 'msg_xxx' 這種格式，就嘗試翻譯；否則直接顯示 (相容錯誤訊息)
    const displayMsg = (typeof t === 'function' && msgKey.startsWith('msg_')) ? t(msgKey) : msgKey;
    
    // 如果是 'Scan Completed' 這種特殊字串，也嘗試翻譯一下 (可選)
    const finalMsg = displayMsg === "Scan Completed" ? ((typeof t === 'function') ? t('status_generated') : "Scan Completed") : displayMsg;

    if (path && path.length > 0) {
        // 簡單判斷如果有載入 path_analyzer 則顯示步數，否則只顯示訊息
        if (typeof analyzePath === 'function') {
            const stats = analyzePath(path); 
            // 這裡也可以把 Steps 翻譯一下，但這需要改動 status_result 結構，這裡先維持 Steps:
            document.getElementById('status-text').innerHTML = `${finalMsg} | Steps: <b>${stats.steps}</b>`;
        } else {
            document.getElementById('status-text').innerHTML = `${finalMsg} (Steps: ${path.length})`;
        }
    } else {
        document.getElementById('status-text').innerHTML = finalMsg;
    }
}

// ===========================================
// 3. 入口函式
// ===========================================

function startAnimation(type) {
    // 1. 強制停止舊的，並清除所有計時器
    stopAnimation();
    
    const statusText = document.getElementById('status-text');
    if (statusText) statusText.innerText = "Initializing...";

    const chkAnimate = document.getElementById('chk-animate');
    const isAnimate = chkAnimate ? chkAnimate.checked : true;

    let genFunc = null;
    try {
        switch(type) {
            case 'dfs': genFunc = solveDFS_Generator; break;
            case 'bfs': genFunc = function*(maze) { yield* solveBFS_Generator(maze, false); }; break;
            case 'flood': genFunc = function*(maze) { yield* solveBFS_Generator(maze, true); }; break;
            case 'astar': genFunc = solveAStar_Generator; break;
            case 'dijkstra': genFunc = solveDijkstra_Generator; break;
            case 'manhattan': genFunc = solveManhattan_Generator; break;
            case 'left': genFunc = function*(maze) { yield* solveWallFollower_Generator(maze, 'left'); }; break;
            case 'right': genFunc = function*(maze) { yield* solveWallFollower_Generator(maze, 'right'); }; break;
            default: console.error("Unknown algorithm:", type); return;
        }
    } catch (e) {
        alert(`無法啟動 ${type}：變數未定義。\n請檢查 algos/${type === 'flood' ? 'flood_fill' : type}.js 是否已載入。`);
        return;
    }

    if (!genFunc) return;

    if (isAnimate) {
        animateGenerator(genFunc);
    } else {
        // ★★★ 最終修正：完全移除 setTimeout ★★★
        // 直接執行，不給任何失敗的機會
        if (statusText) statusText.innerText = "Calculating...";
        runGeneratorSync(genFunc);
    }
}