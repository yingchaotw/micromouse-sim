// js/algos/bfs.js

function solveBFS(maze) {
    const { width, height, startPos, goalPositions } = maze;
    
    const distMap = new Array(width * height).fill(Infinity);
    const parentMap = new Array(width * height).fill(null);
    const startIdx = maze.getIndex(startPos.x, startPos.y);
    
    const queue = [startIdx];
    distMap[startIdx] = 0;

    maze.weightMap = distMap;

    while (queue.length > 0) {
        const uIdx = queue.shift();
        const uPos = maze.getCoord(uIdx);

        if (goalPositions.has(`${uPos.x},${uPos.y}`)) {
            return reconstructPathBFS(maze, parentMap, uIdx);
        }

        for (let i = 0; i < 4; i++) {
            if (maze.isWall(uPos.x, uPos.y, i)) continue;

            const nx = uPos.x + DIRS[i].dx;
            const ny = uPos.y + DIRS[i].dy;

            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

            const vIdx = maze.getIndex(nx, ny);

            if (distMap[vIdx] === Infinity) {
                distMap[vIdx] = distMap[uIdx] + 1;
                parentMap[vIdx] = uIdx;           
                queue.push(vIdx);                  
            }
        }
    }

    return [];
}

function reconstructPathBFS(maze, parentMap, endIdx) {
    const path = [];
    let curr = endIdx;
    while (curr !== null) {
        path.push(maze.getCoord(curr));
        curr = parentMap[curr];
    }
    return path.reverse();
}

// --- 追加在檔案末尾 ---

function* solveBFS_Generator(maze, isFloodMode = false) {
    const { width, height, startPos, goalPositions } = maze;
    const startIdx = maze.getIndex(startPos.x, startPos.y);
    const queue = [startIdx];
    const distMap = new Array(width * height).fill(Infinity);
    const parentMap = new Array(width * height).fill(null);
    
    distMap[startIdx] = 0;
    
    yield { type: 'start', x: startPos.x, y: startPos.y, val: 0 };

    let foundGoal = false;
    let goalIdx = null;

    while (queue.length > 0) {
        const uIdx = queue.shift();
        const uPos = maze.getCoord(uIdx);

        yield { type: 'searching', x: uPos.x, y: uPos.y, val: distMap[uIdx] };

        // 檢查是否碰到終點
        if (goalPositions.has(`${uPos.x},${uPos.y}`)) {
            if (!foundGoal) {
                foundGoal = true;
                goalIdx = uIdx;
                // 如果不是 Flood 模式 (是 BFS)，找到就停
                if (!isFloodMode) break; 
            }
        }

        for (let i = 0; i < 4; i++) {
            if (maze.isWall(uPos.x, uPos.y, i)) continue;
            const nx = uPos.x + DIRS[i].dx;
            const ny = uPos.y + DIRS[i].dy;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

            const vIdx = maze.getIndex(nx, ny);
            if (distMap[vIdx] === Infinity) {
                distMap[vIdx] = distMap[uIdx] + 1;
                parentMap[vIdx] = uIdx;
                queue.push(vIdx);
            }
        }
    }

    if (!foundGoal && !isFloodMode) {
        yield { type: 'no_path' };
        return;
    }

    // 重建路徑 (如果有找到終點的話)
    if (goalIdx !== null) {
        const path = [];
        let curr = goalIdx;
        while (curr !== null) {
            path.push(maze.getCoord(curr));
            curr = parentMap[curr];
        }
        // 對於 Flood Fill 模式，你可以在這裡額外 yield 填滿後的狀態
        yield { type: 'found', path: path.reverse() };
    } else {
        yield { type: 'no_path' };
    }
}
