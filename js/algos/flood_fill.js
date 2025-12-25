// js/algos/flood_fill.js

function solveFloodFill() {
    // 1. 建立距離表 (權重圖)
    const distMap = new Array(WIDTH * HEIGHT).fill(Infinity);
    const queue = [];

    // 從終點開始倒灌 (Reverse Flood Fill)
    goalPositions.forEach(goalStr => {
        const [gx, gy] = goalStr.split(',').map(Number);
        const idx = getIndex(gx, gy);
        distMap[idx] = 0;
        queue.push({ x: gx, y: gy });
    });

    // BFS 擴展
    let head = 0;
    while(head < queue.length) {
        const curr = queue[head++];
        const currentDist = distMap[getIndex(curr.x, curr.y)];

        for (let i = 0; i < 4; i++) {
            if (isWall(curr.x, curr.y, i)) continue;

            const nx = curr.x + DIRS[i].dx;
            const ny = curr.y + DIRS[i].dy;
            const nIdx = getIndex(nx, ny);

            if (distMap[nIdx] === Infinity) {
                distMap[nIdx] = currentDist + 1;
                queue.push({ x: nx, y: ny });
            }
        }
    }

    // 更新全域變數以供顯示
    lastFloodDistMap = distMap;

    // 2. 從起點回溯路徑
    const path = [];
    let curr = { x: startPos.x, y: startPos.y };
    path.push({...curr});

    if (distMap[getIndex(curr.x, curr.y)] === Infinity) return []; // 無解

    while (distMap[getIndex(curr.x, curr.y)] !== 0) {
        const currentDist = distMap[getIndex(curr.x, curr.y)];
        let moved = false;
        
        // 找周圍數字比較小的鄰居
        for (let i = 0; i < 4; i++) {
            if (isWall(curr.x, curr.y, i)) continue;
            const nx = curr.x + DIRS[i].dx;
            const ny = curr.y + DIRS[i].dy;
            const nIdx = getIndex(nx, ny);
            
            if (distMap[nIdx] < currentDist) {
                curr = { x: nx, y: ny };
                path.push({...curr});
                moved = true;
                break;
            }
        }
        if (!moved) break;
    }
    return path;
}