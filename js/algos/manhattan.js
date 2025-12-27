// js/algos/manhattan.js

function solveManhattanGreedy() {
    // 啟發函數：計算曼哈頓距離
    function getDistanceToGoal(idx) {
        const pos = getLogicalPos(idx);
        let minH = Infinity;
        goalPositions.forEach(gStr => {
            const [gx, gy] = gStr.split(',').map(Number);
            const h = Math.abs(pos.x - gx) + Math.abs(pos.y - gy);
            if (h < minH) minH = h;
        });
        return minH;
    }

    // 初始化
    const startIdx = getIndex(startPos.x, startPos.y);
    const parentMap = new Array(WIDTH * HEIGHT).fill(null);
    const visited = new Array(WIDTH * HEIGHT).fill(false);
    
    // Priority Queue (OpenSet)，存放 {idx, h}
    // 這裡我們只看 h (距離終點的估算值)，不看 g (已走步數)
    const openSet = [{ idx: startIdx, h: getDistanceToGoal(startIdx) }];
    
    // 視覺化用的熱力圖
    const heatMap = new Array(WIDTH * HEIGHT).fill(Infinity);
    lastFloodDistMap = heatMap;

    while (openSet.length > 0) {
        // 1. 取出 h 最小的節點 (貪心)
        openSet.sort((a, b) => a.h - b.h);
        const current = openSet.shift();
        const uIdx = current.idx;

        if (visited[uIdx]) continue;
        visited[uIdx] = true;

        const uPos = getLogicalPos(uIdx);
        heatMap[uIdx] = current.h; // 紀錄距離供顯示

        // 到達終點
        if (goalPositions.has(`${uPos.x},${uPos.y}`)) {
            const path = [];
            let temp = uIdx;
            while (temp !== null) {
                path.push(getLogicalPos(temp));
                temp = parentMap[temp];
            }
            return path.reverse();
        }

        // 2. 檢查鄰居
        for (let i = 0; i < 4; i++) {
            // ★★★ 關鍵：嚴格檢查牆壁 ★★★
            if (isWall(uPos.x, uPos.y, i)) continue;

            const nx = uPos.x + DIRS[i].dx;
            const ny = uPos.y + DIRS[i].dy;
            
            // 邊界防呆 (雖然 isWall 應該擋住了，但多一層保險)
            if (nx < 0 || nx >= WIDTH || ny < 0 || ny >= HEIGHT) continue;

            const vIdx = getIndex(nx, ny);

            if (!visited[vIdx]) {
                parentMap[vIdx] = uIdx;
                const h = getDistanceToGoal(vIdx);
                // 加入佇列，讓它下一輪跟其他候選人比拼
                openSet.push({ idx: vIdx, h: h });
            }
        }
    }

    return []; // 無解
}