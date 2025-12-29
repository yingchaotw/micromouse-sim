// js/algos/bfs.js

function solveBFS(maze) {
    const { width, height, startPos, goalPositions } = maze;
    
    const distMap = new Array(width * height).fill(Infinity);
    const parentMap = new Array(width * height).fill(null);
    const startIdx = maze.getIndex(startPos.x, startPos.y);
    
    const queue = [startIdx];
    distMap[startIdx] = 0;

    maze.weightMap = distMap;

    while (queue.length > 0) {
        const uIdx = queue.shift();
        const uPos = maze.getCoord(uIdx);

        if (goalPositions.has(`${uPos.x},${uPos.y}`)) {
            return reconstructPathBFS(maze, parentMap, uIdx);
        }

        for (let i = 0; i < 4; i++) {
            if (maze.isWall(uPos.x, uPos.y, i)) continue;

            const nx = uPos.x + DIRS[i].dx;
            const ny = uPos.y + DIRS[i].dy;

            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

            const vIdx = maze.getIndex(nx, ny);

            if (distMap[vIdx] === Infinity) {
                distMap[vIdx] = distMap[uIdx] + 1;
                parentMap[vIdx] = uIdx;           
                queue.push(vIdx);                  
            }
        }
    }

    return [];
}

function reconstructPathBFS(maze, parentMap, endIdx) {
    const path = [];
    let curr = endIdx;
    while (curr !== null) {
        path.push(maze.getCoord(curr));
        curr = parentMap[curr];
    }
    return path.reverse();
}