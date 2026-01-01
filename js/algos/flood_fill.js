// js/algos/flood_fill.js

// 為了保持相容性，保留原本的函式 (同步計算用)
function solveFloodFill(maze) {
    const { width, height, startPos, goalPositions } = maze;
    // 這裡維持原本的「終點 -> 起點」邏輯，因為這是 Micromouse 硬體的標準做法
    const distMap = new Array(width * height).fill(Infinity);
    const queue = [];

    goalPositions.forEach(goalStr => {
        const [gx, gy] = goalStr.split(',').map(Number);
        const idx = maze.getIndex(gx, gy);
        distMap[idx] = 0;
        queue.push({ x: gx, y: gy });
    });

    let head = 0;
    while(head < queue.length) {
        const curr = queue[head++];
        const currentDist = distMap[maze.getIndex(curr.x, curr.y)];

        for (let i = 0; i < 4; i++) {
            if (maze.isWall(curr.x, curr.y, i)) continue;
            const nx = curr.x + DIRS[i].dx;
            const ny = curr.y + DIRS[i].dy;
            const nIdx = maze.getIndex(nx, ny);

            if (distMap[nIdx] === Infinity) {
                distMap[nIdx] = currentDist + 1;
                queue.push({ x: nx, y: ny });
            }
        }
    }
    maze.weightMap = distMap;

    // 回溯路徑
    const path = [];
    let curr = { x: startPos.x, y: startPos.y };
    path.push({...curr});

    if (distMap[maze.getIndex(curr.x, curr.y)] === Infinity) return []; 

    while (distMap[maze.getIndex(curr.x, curr.y)] !== 0) {
        const currentDist = distMap[maze.getIndex(curr.x, curr.y)];
        for (let i = 0; i < 4; i++) {
            if (maze.isWall(curr.x, curr.y, i)) continue;
            const nx = curr.x + DIRS[i].dx;
            const ny = curr.y + DIRS[i].dy;
            const nIdx = maze.getIndex(nx, ny);
            if (distMap[nIdx] < currentDist) {
                curr = { x: nx, y: ny };
                path.push({...curr});
                break;
            }
        }
    }
    return path;
}

// ★★★ 新增：Generator 版本 (改為從 起點 -> 終點 擴散) ★★★
function* solveFloodFill_Generator(maze) {
    const { width, height, startPos, goalPositions } = maze;
    
    // 1. 初始化：從「起點」開始
    const startIdx = maze.getIndex(startPos.x, startPos.y);
    const distMap = new Array(width * height).fill(Infinity);
    const parentMap = new Array(width * height).fill(null); // 用來記錄水流來源，方便回溯
    
    distMap[startIdx] = 0;
    const queue = [startIdx];

    yield { type: 'start', x: startPos.x, y: startPos.y, val: 0 };

    let foundGoalIdx = null;

    // 2. 洪水擴散 (Start -> Goal)
    while (queue.length > 0) {
        const uIdx = queue.shift();
        const uPos = maze.getCoord(uIdx);
        const currentDist = distMap[uIdx];

        // 視覺化：顯示水流擴散 (數值代表「離起點的步數」)
        yield { type: 'searching', x: uPos.x, y: uPos.y, val: currentDist };

        // 檢查是否碰到終點
        if (goalPositions.has(`${uPos.x},${uPos.y}`)) {
            foundGoalIdx = uIdx;
            break; // 碰到終點就停止 (如果想要填滿全圖，可以拿掉這行)
        }

        // 往四周流動
        for (let i = 0; i < 4; i++) {
            if (maze.isWall(uPos.x, uPos.y, i)) continue;

            const nx = uPos.x + DIRS[i].dx;
            const ny = uPos.y + DIRS[i].dy;
            
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

            const vIdx = maze.getIndex(nx, ny);

            if (distMap[vIdx] === Infinity) {
                distMap[vIdx] = currentDist + 1;
                parentMap[vIdx] = uIdx; // 記錄我是從哪裡流過來的
                queue.push(vIdx);
            }
        }
    }

    if (foundGoalIdx === null) {
        yield { type: 'no_path' };
        return;
    }

    // 3. 建立路徑 (從終點回溯到起點)
    const path = [];
    let currIdx = foundGoalIdx;
    while (currIdx !== null) {
        path.push(maze.getCoord(currIdx));
        currIdx = parentMap[currIdx];
    }
    
    // 因為是從終點回溯，所以要反轉陣列才是 Start -> Goal
    path.reverse();

    // 4. (選用) 模擬老鼠跑這條路徑
    // 如果你希望看到老鼠快速跑過路徑的動畫，可以取消下面註解
    /*
    for (const node of path) {
        yield { type: 'path_node', x: node.x, y: node.y };
    }
    */

    // 回傳最終路徑
    yield { type: 'found', path: path };
}