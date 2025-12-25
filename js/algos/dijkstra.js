// js/algos/dijkstra.js

function solveDijkstra() {
    const distMap = new Array(WIDTH * HEIGHT).fill(Infinity);
    const parentMap = new Array(WIDTH * HEIGHT).fill(null); // 紀錄路徑來源
    const visited = new Array(WIDTH * HEIGHT).fill(false);
    
    // 簡單的陣列當作 Priority Queue (效能較差但夠用)
    let openSet = []; 

    // 初始化起點 (Dijkstra 通常從起點開始算)
    const startIdx = getIndex(startPos.x, startPos.y);
    distMap[startIdx] = 0;
    openSet.push(startIdx);

    while (openSet.length > 0) {
        // 1. 取出距離最小的點
        openSet.sort((a, b) => distMap[a] - distMap[b]);
        const uIdx = openSet.shift();
        
        if (visited[uIdx]) continue;
        visited[uIdx] = true;

        const uPos = getLogicalPos(uIdx);

        // 如果到達終點
        if (goalPositions.has(`${uPos.x},${uPos.y}`)) {
            // 回溯路徑
            const path = [];
            let currIdx = uIdx;
            while (currIdx !== null) {
                path.push(getLogicalPos(currIdx));
                currIdx = parentMap[currIdx];
            }
            lastFloodDistMap = distMap; // 順便更新權重圖
            return path.reverse();
        }

        // 2. 鬆弛 (Relax) 鄰居
        for (let i = 0; i < 4; i++) {
            if (isWall(uPos.x, uPos.y, i)) continue;

            const nx = uPos.x + DIRS[i].dx;
            const ny = uPos.y + DIRS[i].dy;
            const vIdx = getIndex(nx, ny);

            if (!visited[vIdx]) {
                const alt = distMap[uIdx] + 1; // 假設每步成本為 1
                if (alt < distMap[vIdx]) {
                    distMap[vIdx] = alt;
                    parentMap[vIdx] = uIdx;
                    openSet.push(vIdx);
                }
            }
        }
    }
    
    lastFloodDistMap = distMap;
    return []; // 無解
}