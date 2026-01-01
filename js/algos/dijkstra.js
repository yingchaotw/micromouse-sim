// js/algos/dijkstra.js

function solveDijkstra(maze) {
    const { width, height, startPos, goalPositions } = maze;

    const distMap = new Array(width * height).fill(Infinity);
    const parentMap = new Array(width * height).fill(null);
    const visited = new Array(width * height).fill(false);
    
    let openSet = []; 

    const startIdx = maze.getIndex(startPos.x, startPos.y);
    distMap[startIdx] = 0;
    openSet.push(startIdx);

    while (openSet.length > 0) {
        openSet.sort((a, b) => distMap[a] - distMap[b]);
        const uIdx = openSet.shift();
        
        if (visited[uIdx]) continue;
        visited[uIdx] = true;

        const uPos = maze.getCoord(uIdx);

        if (goalPositions.has(`${uPos.x},${uPos.y}`)) {
            const path = [];
            let currIdx = uIdx;
            while (currIdx !== null) {
                path.push(maze.getCoord(currIdx));
                currIdx = parentMap[currIdx];
            }
            maze.weightMap = distMap; // 更新權重
            return path.reverse();
        }

        for (let i = 0; i < 4; i++) {
            const nx = uPos.x + DIRS[i].dx;
            const ny = uPos.y + DIRS[i].dy;
            
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

            const opDir = (i + 2) % 4;
            if (maze.isWall(uPos.x, uPos.y, i) || maze.isWall(nx, ny, opDir)) continue;

            const vIdx = maze.getIndex(nx, ny);

            if (!visited[vIdx]) {
                const alt = distMap[uIdx] + 1;
                if (alt < distMap[vIdx]) {
                    distMap[vIdx] = alt;
                    parentMap[vIdx] = uIdx;
                    openSet.push(vIdx);
                }
            }
        }
    }
    
    maze.weightMap = distMap;
    return []; 
}

// --- 追加在檔案末尾 ---

function* solveDijkstra_Generator(maze) {
    const { width, height, startPos, goalPositions } = maze;
    const distMap = new Array(width * height).fill(Infinity);
    const parentMap = new Array(width * height).fill(null);
    const visited = new Array(width * height).fill(false);
    
    const startIdx = maze.getIndex(startPos.x, startPos.y);
    distMap[startIdx] = 0;
    const openSet = [startIdx];

    yield { type: 'start', x: startPos.x, y: startPos.y, val: 0 };

    while (openSet.length > 0) {
        // 依照距離排序 (模擬 Priority Queue)
        openSet.sort((a, b) => distMap[a] - distMap[b]);
        const uIdx = openSet.shift();

        if (visited[uIdx]) continue;
        visited[uIdx] = true;

        const uPos = maze.getCoord(uIdx);

        // 視覺化：擴展最短路徑樹
        yield { type: 'searching', x: uPos.x, y: uPos.y, val: distMap[uIdx] };

        if (goalPositions.has(`${uPos.x},${uPos.y}`)) {
            const path = [];
            let curr = uIdx;
            while (curr !== null) {
                path.push(maze.getCoord(curr));
                curr = parentMap[curr];
            }
            yield { type: 'found', path: path.reverse() };
            return;
        }

        for (let i = 0; i < 4; i++) {
            const nx = uPos.x + DIRS[i].dx;
            const ny = uPos.y + DIRS[i].dy;
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

            const opDir = (i + 2) % 4;
            if (maze.isWall(uPos.x, uPos.y, i) || maze.isWall(nx, ny, opDir)) continue;

            const vIdx = maze.getIndex(nx, ny);
            if (!visited[vIdx]) {
                const alt = distMap[uIdx] + 1;
                if (alt < distMap[vIdx]) {
                    distMap[vIdx] = alt;
                    parentMap[vIdx] = uIdx;
                    openSet.push(vIdx);
                }
            }
        }
    }
    yield { type: 'no_path' };
}