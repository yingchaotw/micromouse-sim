// js/algos/astar.js

function solveAStar() {
    // 啟發函數 (Heuristic): 曼哈頓距離
    function heuristic(idx) {
        const pos = getLogicalPos(idx);
        let minH = Infinity;
        // 找距離最近的終點
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
    
    // OpenSet 存放待檢查的節點
    const openSet = [startIdx];
    const openSetHash = new Set([startIdx]); // 為了快速查詢

    while (openSet.length > 0) {
        // 取出 fScore 最小的節點
        openSet.sort((a, b) => fScore[a] - fScore[b]);
        const currentIdx = openSet.shift();
        openSetHash.delete(currentIdx);
        
        const currPos = getLogicalPos(currentIdx);

        // 到達終點
        if (goalPositions.has(`${currPos.x},${currPos.y}`)) {
            const path = [];
            let temp = currentIdx;
            while (temp !== null) {
                path.push(getLogicalPos(temp));
                temp = parentMap[temp];
            }
            lastFloodDistMap = fScore; // A* 的權重通常顯示 F值或 G值，這裡顯示 F
            return path.reverse();
        }

        for (let i = 0; i < 4; i++) {
            if (isWall(currPos.x, currPos.y, i)) continue;

            const nx = currPos.x + DIRS[i].dx;
            const ny = currPos.y + DIRS[i].dy;
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