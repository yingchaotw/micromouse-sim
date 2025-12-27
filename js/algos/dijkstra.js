// js/algos/dijkstra.js

function solveDijkstra() {
    const distMap = new Array(WIDTH * HEIGHT).fill(Infinity);
    const parentMap = new Array(WIDTH * HEIGHT).fill(null);
    const visited = new Array(WIDTH * HEIGHT).fill(false);
    
    let openSet = []; 

    const startIdx = getIndex(startPos.x, startPos.y);
    distMap[startIdx] = 0;
    openSet.push(startIdx);

    while (openSet.length > 0) {
        openSet.sort((a, b) => distMap[a] - distMap[b]);
        const uIdx = openSet.shift();
        
        if (visited[uIdx]) continue;
        visited[uIdx] = true;

        const uPos = getLogicalPos(uIdx);

        if (goalPositions.has(`${uPos.x},${uPos.y}`)) {
            const path = [];
            let currIdx = uIdx;
            while (currIdx !== null) {
                path.push(getLogicalPos(currIdx));
                currIdx = parentMap[currIdx];
            }
            lastFloodDistMap = distMap;
            return path.reverse();
        }

        for (let i = 0; i < 4; i++) {
            const nx = uPos.x + DIRS[i].dx;
            const ny = uPos.y + DIRS[i].dy;
            
            // 邊界檢查
            if (nx < 0 || nx >= WIDTH || ny < 0 || ny >= HEIGHT) continue;

            // ★★★ 雙重牆壁檢查 ★★★
            const opDir = (i + 2) % 4;
            if (isWall(uPos.x, uPos.y, i) || isWall(nx, ny, opDir)) continue;

            const vIdx = getIndex(nx, ny);

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
    
    lastFloodDistMap = distMap;
    return []; 
}