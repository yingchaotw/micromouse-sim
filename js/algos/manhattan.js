// js/algos/manhattan.js

function solveManhattanGreedy() {
    // 僅基於曼哈頓距離做決策
    function getDistanceToGoal(x, y) {
        let minH = Infinity;
        goalPositions.forEach(gStr => {
            const [gx, gy] = gStr.split(',').map(Number);
            const h = Math.abs(x - gx) + Math.abs(y - gy);
            if (h < minH) minH = h;
        });
        return minH;
    }

    const path = [];
    let curr = { x: startPos.x, y: startPos.y };
    path.push({...curr});
    
    const visited = new Set();
    visited.add(`${curr.x},${curr.y}`);
    
    // 為了視覺化，我們把距離填入 map
    const heatMap = new Array(WIDTH * HEIGHT).fill(Infinity);
    for(let i=0; i<WIDTH*HEIGHT; i++) {
        const p = getLogicalPos(i);
        heatMap[i] = getDistanceToGoal(p.x, p.y);
    }
    lastFloodDistMap = heatMap;

    // 簡單的防死循環限制
    for(let step=0; step < WIDTH*HEIGHT*2; step++) {
        if (goalPositions.has(`${curr.x},${curr.y}`)) return path;

        // 檢查四周，選擇「距離終點最近」且「沒牆壁」且「沒走過」的格子
        let bestNext = null;
        let minDist = Infinity;

        // 這裡會嘗試找最佳解，但如果走進死巷，貪心法通常需要配合 Stack (Backtracking)
        // 為了展示曼哈頓法則的特性，我們用一個簡單的 Priority 選擇
        
        const candidates = [];
        for (let i = 0; i < 4; i++) {
            if (isWall(curr.x, curr.y, i)) continue;
            
            const nx = curr.x + DIRS[i].dx;
            const ny = curr.y + DIRS[i].dy;
            const key = `${nx},${ny}`;
            
            if (!visited.has(key)) {
                const dist = getDistanceToGoal(nx, ny);
                candidates.push({ x: nx, y: ny, dist: dist });
            }
        }

        if (candidates.length > 0) {
            // 貪心：選距離最小的
            candidates.sort((a, b) => a.dist - b.dist);
            bestNext = candidates[0];
            
            visited.add(`${bestNext.x},${bestNext.y}`);
            curr = { x: bestNext.x, y: bestNext.y };
            path.push({...curr});
        } else {
            // 貪心法走進死胡同了，這裡簡單處理：停止
            // (真正的 Micromouse 會有更複雜的修正，但這裡展示純貪心)
            console.log("貪心法走進死巷，停止搜尋");
            break;
        }
    }
    
    return path;
}