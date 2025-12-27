// js/algos/astar.js

function solveAStar() {
    function heuristic(idx) {
        const pos = getLogicalPos(idx);
        let minH = Infinity;
        goalPositions.forEach(gStr => {
            const [gx, gy] = gStr.split(',').map(Number);
            const h = Math.abs(pos.x - gx) + Math.abs(pos.y - gy);
            if (h < minH) minH = h;
        });
        return minH;
    }

    const gScore = new Array(WIDTH * HEIGHT).fill(Infinity);
    const fScore = new Array(WIDTH * HEIGHT).fill(Infinity);
    const parentMap = new Array(WIDTH * HEIGHT).fill(null);
    
    const startIdx = getIndex(startPos.x, startPos.y);
    gScore[startIdx] = 0;
    fScore[startIdx] = heuristic(startIdx);
    
    const openSet = [startIdx];
    const openSetHash = new Set([startIdx]);

    while (openSet.length > 0) {
        openSet.sort((a, b) => fScore[a] - fScore[b]);
        const currentIdx = openSet.shift();
        openSetHash.delete(currentIdx);
        
        const currPos = getLogicalPos(currentIdx);

        if (goalPositions.has(`${currPos.x},${currPos.y}`)) {
            const path = [];
            let temp = currentIdx;
            while (temp !== null) {
                path.push(getLogicalPos(temp));
                temp = parentMap[temp];
            }
            lastFloodDistMap = fScore; 
            return path.reverse();
        }

        for (let i = 0; i < 4; i++) {
            const nx = currPos.x + DIRS[i].dx;
            const ny = currPos.y + DIRS[i].dy;

            // 邊界檢查
            if (nx < 0 || nx >= WIDTH || ny < 0 || ny >= HEIGHT) continue;

            // ★★★ 雙重牆壁檢查 ★★★
            const opDir = (i + 2) % 4;
            if (isWall(currPos.x, currPos.y, i) || isWall(nx, ny, opDir)) continue;

            const neighborIdx = getIndex(nx, ny);
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