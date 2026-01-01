// js/algos/manhattan.js

function solveManhattanGreedy(maze) {
    const { width, height, startPos, goalPositions } = maze;

    function getDistanceToGoal(idx) {
        const pos = maze.getCoord(idx);
        let minH = Infinity;
        goalPositions.forEach(gStr => {
            const [gx, gy] = gStr.split(',').map(Number);
            const h = Math.abs(pos.x - gx) + Math.abs(pos.y - gy);
            if (h < minH) minH = h;
        });
        return minH;
    }

    const startIdx = maze.getIndex(startPos.x, startPos.y);
    const parentMap = new Array(width * height).fill(null);
    const visited = new Array(width * height).fill(false);
    
    const openSet = [{ idx: startIdx, h: getDistanceToGoal(startIdx) }];
    
    // 視覺化用的熱力圖
    const heatMap = new Array(width * height).fill(Infinity);
    maze.weightMap = heatMap;

    while (openSet.length > 0) {
        openSet.sort((a, b) => a.h - b.h);
        const current = openSet.shift();
        const uIdx = current.idx;

        if (visited[uIdx]) continue;
        visited[uIdx] = true;

        const uPos = maze.getCoord(uIdx);
        heatMap[uIdx] = current.h; 

        if (goalPositions.has(`${uPos.x},${uPos.y}`)) {
            const path = [];
            let temp = uIdx;
            while (temp !== null) {
                path.push(maze.getCoord(temp));
                temp = parentMap[temp];
            }
            return path.reverse();
        }

        for (let i = 0; i < 4; i++) {
            if (maze.isWall(uPos.x, uPos.y, i)) continue;

            const nx = uPos.x + DIRS[i].dx;
            const ny = uPos.y + DIRS[i].dy;
            
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

            const vIdx = maze.getIndex(nx, ny);

            if (!visited[vIdx]) {
                parentMap[vIdx] = uIdx;
                const h = getDistanceToGoal(vIdx);
                openSet.push({ idx: vIdx, h: h });
            }
        }
    }

    return []; 
}

// --- 追加在檔案末尾 ---

function* solveManhattan_Generator(maze) {
    const { width, height, startPos, goalPositions } = maze;

    const getDistanceToGoal = (idx) => {
        const pos = maze.getCoord(idx);
        let minH = Infinity;
        goalPositions.forEach(gStr => {
            const [gx, gy] = gStr.split(',').map(Number);
            const h = Math.abs(pos.x - gx) + Math.abs(pos.y - gy);
            if (h < minH) minH = h;
        });
        return minH;
    };

    const startIdx = maze.getIndex(startPos.x, startPos.y);
    const parentMap = new Array(width * height).fill(null);
    const visited = new Array(width * height).fill(false);
    
    // 只根據 Heuristic 排序
    const openSet = [{ idx: startIdx, h: getDistanceToGoal(startIdx) }];

    yield { type: 'start', x: startPos.x, y: startPos.y, val: 0 };

    while (openSet.length > 0) {
        openSet.sort((a, b) => a.h - b.h);
        const current = openSet.shift();
        const uIdx = current.idx;

        if (visited[uIdx]) continue;
        visited[uIdx] = true;
        
        const uPos = maze.getCoord(uIdx);

        // 視覺化：Greedy 搜尋，顯示離終點的距離
        yield { type: 'searching', x: uPos.x, y: uPos.y, val: current.h };

        if (goalPositions.has(`${uPos.x},${uPos.y}`)) {
            const path = [];
            let temp = uIdx;
            while (temp !== null) {
                path.push(maze.getCoord(temp));
                temp = parentMap[temp];
            }
            yield { type: 'found', path: path.reverse() };
            return;
        }

        for (let i = 0; i < 4; i++) {
            if (maze.isWall(uPos.x, uPos.y, i)) continue;
            const nx = uPos.x + DIRS[i].dx;
            const ny = uPos.y + DIRS[i].dy;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

            const vIdx = maze.getIndex(nx, ny);
            if (!visited[vIdx]) {
                parentMap[vIdx] = uIdx;
                openSet.push({ idx: vIdx, h: getDistanceToGoal(vIdx) });
            }
        }
    }
    yield { type: 'no_path' };
}