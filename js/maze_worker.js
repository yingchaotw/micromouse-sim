// js/maze_worker.js

// 1. 引入必要的類別與演算法
// 確保這些路徑相對於 maze_worker.js 是正確的
importScripts('maze_core.js'); 
importScripts('algos/flood_fill.js');
importScripts('algos/bfs.js');
importScripts('algos/dfs.js');
importScripts('algos/dijkstra.js');
importScripts('algos/astar.js');
importScripts('algos/manhattan.js');
importScripts('algos/wall_follower.js');

// 2. 定義次佳路徑計算函數 (搬移至 Worker 內執行)
function calculateSecondBestPath(maze, bestPath, algoType) {
    if (!bestPath || bestPath.length < 3) return [];

    let candidates = [];
    let solver = null;
    
    if (algoType === 'flood') solver = solveFloodFill;
    else if (algoType === 'astar') solver = solveAStar;
    else if (algoType === 'dijkstra') solver = solveDijkstra;
    else if (algoType === 'manhattan') solver = solveManhattanGreedy;
    else return []; 

    // 備份權重圖
    const backupWeightMap = maze.weightMap ? new Float32Array(maze.weightMap) : null;

    // 採樣阻斷 (為了效能，設定上限)
    const limit = Math.min(bestPath.length - 1, 100); 
    
    for (let i = 1; i < limit; i++) {
        const p = bestPath[i];
        const idx = maze.getIndex(p.x, p.y);
        const originalVal = maze.data[idx]; 

        maze.data[idx] = 15; // 封鎖
        const altPath = solver(maze); // 重新計算

        if (altPath.length > 0) {
            candidates.push(altPath);
        }
        maze.data[idx] = originalVal; // 還原
    }
    
    if(backupWeightMap) maze.weightMap = backupWeightMap;

    if (candidates.length === 0) return [];
    candidates.sort((a, b) => a.length - b.length);
    
    const bestLen = bestPath.length;
    for (let path of candidates) {
        if (path.length >= bestLen) return path; 
    }
    return candidates[0] || [];
}

// 3. 監聽主執行緒訊息
self.onmessage = function(e) {
    const { type, mazeConfig, algoType } = e.data;

    if (type === 'RUN_ALGO') {
        const startTime = performance.now();

        // ★ 重建迷宮實例 (Worker 無法直接接收 Class，只能接收 JSON)
        const maze = new MazeCore(mazeConfig.width, mazeConfig.height);
        maze.loadFromJSON(mazeConfig); 

        let path = [];
        let errorMsg = null;

        try {
            switch (algoType) {
                case 'left': path = solveWallFollower(maze, 'left'); break;
                case 'right': path = solveWallFollower(maze, 'right'); break;
                case 'flood': path = solveFloodFill(maze); break;
                case 'dijkstra': path = solveDijkstra(maze); break;
                case 'astar': path = solveAStar(maze); break;
                case 'manhattan': path = solveManhattanGreedy(maze); break;
                case 'bfs': path = solveBFS(maze); break;
                case 'dfs': path = solveDFS(maze); break;
                default: errorMsg = "Unknown Algorithm: " + algoType;
            }
        } catch (err) {
            errorMsg = err.message;
        }

        // 計算次佳路徑
        let secondaryPath = [];
        if (path.length > 0 && ['flood', 'astar', 'dijkstra', 'manhattan'].includes(algoType)) {
            secondaryPath = calculateSecondBestPath(maze, path, algoType);
        }

        const endTime = performance.now();

        // 回傳結果
        self.postMessage({
            type: 'ALGO_RESULT',
            path: path,
            secondaryPath: secondaryPath,
            weightMap: maze.weightMap,
            time: (endTime - startTime).toFixed(2),
            error: errorMsg
        });
    }
};