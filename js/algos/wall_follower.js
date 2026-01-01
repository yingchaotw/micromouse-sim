// js/algos/wall_follower.js

function solveWallFollower(maze, hand) {
    const { width, height, startPos, goalPositions } = maze;
    
    const path = [];
    let curr = { x: startPos.x, y: startPos.y };
    let dirIdx = 0; // 預設朝北

    const MAX_STEPS = width * height * 4; 
    path.push({ ...curr });

    const turns = hand === 'left' ? [3, 0, 1, 2] : [1, 0, 3, 2]; 

    for (let step = 0; step < MAX_STEPS; step++) {
        if (goalPositions.has(`${curr.x},${curr.y}`)) return path;

        let moved = false;
        for (let i = 0; i < 4; i++) {
            const tryDirIdx = (dirIdx + turns[i] + 4) % 4;
            
            // 使用 maze.isWall
            if (!maze.isWall(curr.x, curr.y, tryDirIdx)) {
                curr.x += DIRS[tryDirIdx].dx;
                curr.y += DIRS[tryDirIdx].dy;
                dirIdx = tryDirIdx; 
                path.push({ ...curr });
                moved = true;
                break; 
            }
        }
        if (!moved) break; 
    }
    throw new Error("無法抵達終點 (可能迷宮封閉)");
}

// --- 追加在檔案末尾 ---

function* solveWallFollower_Generator(maze, hand) {
    const { width, height, startPos, goalPositions } = maze;
    
    const path = [];
    let curr = { x: startPos.x, y: startPos.y };
    
    // 初始化方向：如果前面有牆，就順著手找路，不然就預設北
    let dirIdx = 0; 
    
    const MAX_STEPS = width * height * 4; 
    path.push({ ...curr });
    const turns = hand === 'left' ? [3, 0, 1, 2] : [1, 0, 3, 2]; 

    yield { type: 'start', x: curr.x, y: curr.y, val: 0 };

    for (let step = 0; step < MAX_STEPS; step++) {
        // 視覺化：移動老鼠
        yield { type: 'visit', x: curr.x, y: curr.y, val: step };

        if (goalPositions.has(`${curr.x},${curr.y}`)) {
            yield { type: 'found', path: path };
            return;
        }

        let moved = false;
        for (let i = 0; i < 4; i++) {
            // 計算絕對方向：(當前方向 + 相對轉向) % 4
            // 例如左手：先看左 (-1 -> +3)，再看前 (+0)，再看右 (+1)，再看後 (+2)
            const tryDirIdx = (dirIdx + turns[i] + 4) % 4;
            
            if (!maze.isWall(curr.x, curr.y, tryDirIdx)) {
                curr.x += DIRS[tryDirIdx].dx;
                curr.y += DIRS[tryDirIdx].dy;
                dirIdx = tryDirIdx; 
                path.push({ ...curr });
                moved = true;
                break; 
            }
        }
        if (!moved) {
            // 四面楚歌，通常是不可能的，除非被封死在 1x1
             yield { type: 'no_path' };
             return;
        }
    }
    yield { type: 'stuck', path: path };
}