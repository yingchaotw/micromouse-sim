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