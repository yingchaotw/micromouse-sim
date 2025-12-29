// js/algos/flood_fill.js

function solveFloodFill(maze) {
    // 1. 從 maze 實例解構出需要的資訊
    const { width, height, startPos, goalPositions } = maze;
    
    const distMap = new Array(width * height).fill(Infinity);
    const queue = [];

    // 從終點開始倒灌
    goalPositions.forEach(goalStr => {
        const [gx, gy] = goalStr.split(',').map(Number);
        const idx = maze.getIndex(gx, gy); // 改用 maze.getIndex
        distMap[idx] = 0;
        queue.push({ x: gx, y: gy });
    });

    // BFS 擴展
    let head = 0;
    while(head < queue.length) {
        const curr = queue[head++];
        const currentDist = distMap[maze.getIndex(curr.x, curr.y)];

        for (let i = 0; i < 4; i++) {
            // 改用 maze.isWall
            if (maze.isWall(curr.x, curr.y, i)) continue;

            const nx = curr.x + DIRS[i].dx; // DIRS 仍是全域常數，沒問題
            const ny = curr.y + DIRS[i].dy;
            const nIdx = maze.getIndex(nx, ny);

            if (distMap[nIdx] === Infinity) {
                distMap[nIdx] = currentDist + 1;
                queue.push({ x: nx, y: ny });
            }
        }
    }

    // ★★★ 關鍵：將計算結果寫回實例，讓 UI 可以畫出數字 ★★★
    maze.weightMap = distMap;

    // 2. 從起點回溯路徑
    const path = [];
    let curr = { x: startPos.x, y: startPos.y };
    path.push({...curr});

    if (distMap[maze.getIndex(curr.x, curr.y)] === Infinity) return []; 

    while (distMap[maze.getIndex(curr.x, curr.y)] !== 0) {
        const currentDist = distMap[maze.getIndex(curr.x, curr.y)];
        let moved = false;
        
        for (let i = 0; i < 4; i++) {
            if (maze.isWall(curr.x, curr.y, i)) continue;
            const nx = curr.x + DIRS[i].dx;
            const ny = curr.y + DIRS[i].dy;
            const nIdx = maze.getIndex(nx, ny);
            
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