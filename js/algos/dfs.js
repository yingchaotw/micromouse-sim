// js/algos/dfs.js

function solveDFS(maze) {
    const { width, height, startPos, goalPositions } = maze;
    
    const startIdx = maze.getIndex(startPos.x, startPos.y);
    const stack = [startIdx];
    
    const visited = new Set([startIdx]);
    const parentMap = new Array(width * height).fill(null);
    
    const orderMap = new Array(width * height).fill(Infinity);
    let stepCount = 0;

    while (stack.length > 0) {
        const uIdx = stack.pop();
        const uPos = maze.getCoord(uIdx);

        orderMap[uIdx] = ++stepCount; 

        if (goalPositions.has(`${uPos.x},${uPos.y}`)) {
            maze.weightMap = orderMap; 
            return reconstructPathDFS(maze, parentMap, uIdx);
        }

        for (let i = 3; i >= 0; i--) {
            if (maze.isWall(uPos.x, uPos.y, i)) continue;

            const nx = uPos.x + DIRS[i].dx;
            const ny = uPos.y + DIRS[i].dy;

            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

            const vIdx = maze.getIndex(nx, ny);

            if (!visited.has(vIdx)) {
                visited.add(vIdx);
                parentMap[vIdx] = uIdx;
                stack.push(vIdx);
            }
        }
    }
    
    maze.weightMap = orderMap;
    return [];
}

function reconstructPathDFS(maze, parentMap, endIdx) {
    const path = [];
    let curr = endIdx;
    while (curr !== null) {
        path.push(maze.getCoord(curr));
        curr = parentMap[curr];
    }
    return path.reverse();
}