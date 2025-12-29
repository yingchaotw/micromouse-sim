// js/utils/path_analyzer.js

// 判斷路徑主要方向與顏色
function getPathAnalysisInfo(path) {
    if (!path || path.length === 0) return { dir: 'n', label: 'Path', color: '#333' };

    let goalSumX = 0, goalSumY = 0, goalCount = 0;
    
    if (mazeApp.goalPositions && mazeApp.goalPositions.size > 0) {
        mazeApp.goalPositions.forEach(posStr => {
            const parts = posStr.split(',');
            const gx = parseInt(parts[0], 10);
            const gy = parseInt(parts[1], 10);
            if (!isNaN(gx) && !isNaN(gy)) {
                goalSumX += gx;
                goalSumY += gy;
                goalCount++;
            }
        });
    }

    let centerRefX = (goalCount > 0) ? (goalSumX / goalCount) : ((mazeApp.width - 1) / 2);
    let centerRefY = (goalCount > 0) ? (goalSumY / goalCount) : ((mazeApp.height - 1) / 2);

    let pathSumX = 0, pathSumY = 0;
    path.forEach(p => { pathSumX += p.x; pathSumY += p.y; });
    const pathAvgX = pathSumX / path.length;
    const pathAvgY = pathSumY / path.length;

    const diffX = pathAvgX - centerRefX;
    const diffY = pathAvgY - centerRefY;

    let dir = 'n';
    if (Math.abs(diffX) > Math.abs(diffY)) {
        dir = diffX > 0 ? 'e' : 'w'; 
    } else {
        dir = diffY > 0 ? 'n' : 's'; 
    }

    const label = (typeof t === 'function') ? t('dir_' + dir) : dir;
    const color = (typeof DIR_COLORS !== 'undefined') ? DIR_COLORS[dir] : '#333';

    return { dir, label, color };
}

// 分析步數與轉彎
function analyzePath(path) {
    if (!path || path.length < 2) {
        return { steps: 0, turns: 0, maxStraight: 0 };
    }
    let steps = path.length - 1; 
    let turns = 0;
    let maxStraight = 0;
    let currentRun = 0; 
    let lastDir = null;

    for (let i = 0; i < steps; i++) {
        const p1 = path[i];
        const p2 = path[i+1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const currDir = `${dx},${dy}`;

        if (lastDir !== null) {
            if (currDir !== lastDir) {
                turns++; 
                if (currentRun + 1 > maxStraight) maxStraight = currentRun + 1;
                currentRun = 1; 
            } else {
                currentRun++; 
            }
        } else {
            currentRun = 1; 
        }
        lastDir = currDir;
    }
    if (currentRun + 1 > maxStraight) maxStraight = currentRun + 1;
    return { steps, turns, maxStraight };
}

// 根據優先順序回推路徑 (給洪水法多路徑分析用)
function tracePathWithPriority(distMap, priorityIndices, strictFirstDir = null) {
    if (!distMap || distMap.length === 0) return [];
    if (typeof DIRS === 'undefined') return [];

    let curr = { x: mazeApp.startPos.x, y: mazeApp.startPos.y };
    const path = [{...curr}];
    
    if (distMap[mazeApp.getIndex(curr.x, curr.y)] === Infinity) return [];

    while (distMap[mazeApp.getIndex(curr.x, curr.y)] !== 0) {
        const currentDist = distMap[mazeApp.getIndex(curr.x, curr.y)];
        let moved = false;
        let loopIndices = priorityIndices;
        if (path.length === 1 && strictFirstDir !== null) {
            loopIndices = [strictFirstDir];
        }

        for (let i = 0; i < loopIndices.length; i++) {
            const dirIdx = loopIndices[i]; 
            if (mazeApp.isWall(curr.x, curr.y, dirIdx)) continue;
            
            const nx = curr.x + DIRS[dirIdx].dx;
            const ny = curr.y + DIRS[dirIdx].dy;
            const nIdx = mazeApp.getIndex(nx, ny);
            
            if (distMap[nIdx] < currentDist) {
                curr = { x: nx, y: ny };
                path.push({...curr});
                moved = true;
                break; 
            }
        }
        if (!moved) break;
        if (path.length > mazeApp.width * mazeApp.height) break;
    }
    const last = path[path.length - 1];
    if (distMap[mazeApp.getIndex(last.x, last.y)] !== 0) return []; 
    return path;
}

// 產生多路徑分析 HTML
function getMultiRouteStatus() {
    if (!mazeApp.weightMap || mazeApp.weightMap.length === 0) return "";

    const priorities = {
        'n': [0, 1, 3, 2], 'e': [1, 2, 0, 3],
        's': [2, 3, 1, 0], 'w': [3, 0, 2, 1]
    };
    const dirCodes = { 'n': 0, 'e': 1, 's': 2, 'w': 3 };
    const startDirs = ['n', 'e', 'w', 's']; 
    let statusParts = [];

    startDirs.forEach(startDirKey => {
        const path = tracePathWithPriority(
            mazeApp.weightMap, 
            priorities[startDirKey], 
            dirCodes[startDirKey]
        );
        
        if (path.length > 0) {
            const info = getPathAnalysisInfo(path);
            const stats = analyzePath(path);
            const unitS = (typeof t === 'function') ? t('unit_step') : 'st';
            const unitT = (typeof t === 'function') ? t('unit_turn') : 'tn';
            statusParts.push(
                `<span style="color:${info.color}; font-weight:bold;">${info.label}: ${stats.steps}${unitS}${stats.turns}${unitT}</span>`
            );
        } 
    });
    return statusParts.join(" | ");
}