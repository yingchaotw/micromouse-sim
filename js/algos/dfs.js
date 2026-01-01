// js/algos/dfs.js

// 快速計算用 (保持原樣，因為不需要動畫)
function solveDFS(maze) {
    const { width, height, startPos, goalPositions } = maze;
    const startIdx = maze.getIndex(startPos.x, startPos.y);
    const stack = [startIdx];
    const visited = new Set([startIdx]);
    const parentMap = new Array(width * height).fill(null);
    const orderMap = new Array(width * height).fill(Infinity);
    let stepCount = 0;

    while (stack.length > 0) {
        const uIdx = stack.pop();
        const uPos = maze.getCoord(uIdx);
        orderMap[uIdx] = ++stepCount; 

        if (goalPositions.has(`${uPos.x},${uPos.y}`)) {
            maze.weightMap = orderMap; 
            return reconstructPathDFS(maze, parentMap, uIdx);
        }

        for (let i = 3; i >= 0; i--) {
            if (maze.isWall(uPos.x, uPos.y, i)) continue;
            const nx = uPos.x + DIRS[i].dx;
            const ny = uPos.y + DIRS[i].dy;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
            const vIdx = maze.getIndex(nx, ny);
            if (!visited.has(vIdx)) {
                visited.add(vIdx);
                parentMap[vIdx] = uIdx;
                stack.push(vIdx);
            }
        }
    }
    maze.weightMap = orderMap;
    return [];
}

function reconstructPathDFS(maze, parentMap, endIdx) {
    const path = [];
    let curr = endIdx;
    while (curr !== null) {
        path.push(maze.getCoord(curr));
        curr = parentMap[curr];
    }
    return path.reverse();
}

// ==========================================
// ★ 偷看版 DFS (Peeking DFS)
// ==========================================
// 一邊搜尋，一邊預判死路並打叉，不走冤枉路
function* solveDFS_Generator(maze) {
    const { width, height, startPos, goalPositions } = maze;
    const startIdx = maze.getIndex(startPos.x, startPos.y);
    
    // 使用物件堆疊來記錄狀態：processed=true 代表「準備離開/回溯」
    const stack = [{ idx: startIdx, processed: false }];
    const visited = new Set([startIdx]);
    const parentMap = new Array(width * height).fill(null);
    let stepCount = 0;

    // 輔助函式：計算某個座標周圍有幾面牆
    const getWallCount = (x, y) => {
        let count = 0;
        for (let i = 0; i < 4; i++) {
            if (maze.isWall(x, y, i)) count++;
        }
        return count;
    };

    yield { type: 'start', x: startPos.x, y: startPos.y, val: 0 };

    while (stack.length > 0) {
        // 1. 取出堆疊頂端
        const item = stack.pop();
        const { idx, processed } = item;
        const uPos = maze.getCoord(idx);

        // =========================================
        // 階段 A: 準備離開 (回溯)
        // =========================================
        // 如果這個點 processed 為 true，代表它的子路徑都探索完(或是被預判完了)
        // 現在要退回去，所以打上叉叉
        if (processed) {
            yield { type: 'backtrack', x: uPos.x, y: uPos.y };
            continue; 
        }

        // =========================================
        // 階段 B: 剛踏入這個格子 (探索)
        // =========================================
        // 標記這一步是訪問
        yield { type: 'visit', x: uPos.x, y: uPos.y, val: ++stepCount };

        if (goalPositions.has(`${uPos.x},${uPos.y}`)) {
            const path = reconstructPathDFS(maze, parentMap, idx);
            yield { type: 'found', path: path };
            return;
        }

        // ★ 關鍵：將自己重新推回堆疊底部，並標記為 processed = true
        // 這樣等一下所有鄰居都處理完後，我們會再次回到這裡，執行階段 A (打叉叉)
        stack.push({ idx: idx, processed: true });

        // 搜尋鄰居 (倒序：上右下左)
        for (let i = 3; i >= 0; i--) {
            // 1. 基本牆壁檢查
            if (maze.isWall(uPos.x, uPos.y, i)) continue;

            const nx = uPos.x + DIRS[i].dx;
            const ny = uPos.y + DIRS[i].dy;
            
            // 2. 邊界檢查
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

            const vIdx = maze.getIndex(nx, ny);

            // 3. 如果已經訪問過，跳過
            if (visited.has(vIdx)) continue;

            // =========================================
            // ★ 偷看機制 (Peeking) - 預判死路 ★
            // =========================================
            // 在把鄰居加入堆疊「之前」，先偷看它是不是死胡同 (3面牆)
            // 且它不能是終點 (終點就算是死胡同也要走進去)
            const isDeadEnd = getWallCount(nx, ny) === 3;
            const isGoal = goalPositions.has(`${nx},${ny}`);

            if (isDeadEnd && !isGoal) {
                // 發現它是死路！直接標記已訪問，並打上叉叉 (Backtrack)
                // ★ 這裡就是你要的：不走進去，直接標記 X
                visited.add(vIdx);
                yield { type: 'backtrack', x: nx, y: ny };
                
                // 這裡 continue，代表「不把這個鄰居加入 stack」，也就是「不走過去」
                continue; 
            }

            // 如果不是一眼可見的死路，就正常加入堆疊，準備走進去
            visited.add(vIdx);
            parentMap[vIdx] = idx;
            stack.push({ idx: vIdx, processed: false });
        }
    }

    yield { type: 'no_path' };
}