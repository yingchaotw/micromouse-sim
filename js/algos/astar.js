// js/algos/astar.js

function solveAStar(maze) {
    const { width, height, startPos, goalPositions } = maze;

    function heuristic(idx) {
        const pos = maze.getCoord(idx); // 改用 maze.getCoord
        let minH = Infinity;
        goalPositions.forEach(gStr => {
            const [gx, gy] = gStr.split(',').map(Number);
            const h = Math.abs(pos.x - gx) + Math.abs(pos.y - gy);
            if (h < minH) minH = h;
        });
        return minH;
    }

    const gScore = new Array(width * height).fill(Infinity);
    const fScore = new Array(width * height).fill(Infinity);
    const parentMap = new Array(width * height).fill(null);
    
    const startIdx = maze.getIndex(startPos.x, startPos.y);
    gScore[startIdx] = 0;
    fScore[startIdx] = heuristic(startIdx);
    
    const openSet = [startIdx];
    const openSetHash = new Set([startIdx]);

    while (openSet.length > 0) {
        openSet.sort((a, b) => fScore[a] - fScore[b]);
        const currentIdx = openSet.shift();
        openSetHash.delete(currentIdx);
        
        const currPos = maze.getCoord(currentIdx);

        if (goalPositions.has(`${currPos.x},${currPos.y}`)) {
            const path = [];
            let temp = currentIdx;
            while (temp !== null) {
                path.push(maze.getCoord(temp));
                temp = parentMap[temp];
            }
            // 寫回權重供顯示 (顯示 fScore 或 gScore 皆可)
            maze.weightMap = fScore; 
            return path.reverse();
        }

        for (let i = 0; i < 4; i++) {
            const nx = currPos.x + DIRS[i].dx;
            const ny = currPos.y + DIRS[i].dy;

            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

            // 雙重牆壁檢查
            const opDir = (i + 2) % 4;
            if (maze.isWall(currPos.x, currPos.y, i) || maze.isWall(nx, ny, opDir)) continue;

            const neighborIdx = maze.getIndex(nx, ny);
            const tentative_gScore = gScore[currentIdx] + 1;

            if (tentative_gScore < gScore[neighborIdx]) {
                parentMap[neighborIdx] = currentIdx;
                gScore[neighborIdx] = tentative_gScore;
                fScore[neighborIdx] = gScore[neighborIdx] + heuristic(neighborIdx);

                if (!openSetHash.has(neighborIdx)) {
                    openSet.push(neighborIdx);
                    openSetHash.add(neighborIdx);
                }
            }
        }
    }
    return [];
}