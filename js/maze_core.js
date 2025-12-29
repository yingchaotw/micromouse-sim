// js/maze_core.js

// 定義方向常數 (靜態常數，供外部或內部使用)
const DIRS = [
    { dx: 0, dy: 1, bit: 1 }, // N
    { dx: 1, dy: 0, bit: 2 }, // E
    { dx: 0, dy: -1, bit: 4 }, // S
    { dx: -1, dy: 0, bit: 8 }  // W
];

class MazeCore {
    constructor(width = 16, height = 16) {
        this.setSize(width, height);
    }

    // 初始化/重置尺寸
    setSize(w, h) {
        this.width = w;
        this.height = h;
        // 使用 Uint8Array 優化效能 (0~255)，迷宮牆壁數值最大只到 15
        this.data = new Uint8Array(w * h).fill(15);
        
        this.startPos = { x: 0, y: 0 };
        this.goalPositions = new Set();
        
        // 用來儲存最後一次計算的權重圖 (供 UI 顯示)
        this.weightMap = null; 
        // 用來儲存路徑
        this.solutionPath = [];
        this.secondaryPath = [];
    }

    // --- 基礎存取 Helper ---

    getIndex(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return -1;
        // Y 軸向上為正，陣列存儲通常是 row-major，這裡維持你原本的邏輯
        // (Height - 1 - y) * width + x
        return (this.height - 1 - y) * this.width + x;
    }

    getCoord(index) {
        const y = this.height - 1 - Math.floor(index / this.width);
        const x = index % this.width;
        return { x, y };
    }

    // 檢查是否有牆 (支援邊界檢查)
    isWall(x, y, dirIndex) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return true;
        const idx = this.getIndex(x, y);
        return (this.data[idx] & DIRS[dirIndex].bit) !== 0;
    }

    // --- 編輯功能 ---

    // 切換牆壁 (自動處理鄰居)
    toggleWall(x, y, dirIdx) {
        const idx = this.getIndex(x, y);
        if (idx === -1) return;

        const bit = DIRS[dirIdx].bit;
        this.data[idx] ^= bit; // 反轉自己的牆

        // 處理鄰居的牆
        const nx = x + DIRS[dirIdx].dx;
        const ny = y + DIRS[dirIdx].dy;
        const nIdx = this.getIndex(nx, ny);
        
        if (nIdx !== -1) {
            // 對面方向的 bit (N<->S: 1<->4, E<->W: 2<->8)
            // 簡單算法: N(0)->S(2), E(1)->W(3) => (dirIdx + 2) % 4
            const opDirIdx = (dirIdx + 2) % 4;
            const opBit = DIRS[opDirIdx].bit;
            this.data[nIdx] ^= opBit;
        }
    }

    setStart(x, y) {
        this.startPos = { x, y };
        // 如果起點剛好是終點，移除該終點
        const key = `${x},${y}`;
        if (this.goalPositions.has(key)) {
            this.goalPositions.delete(key);
        }
        this.enforceStartRule();
    }

    toggleGoal(x, y) {
        const key = `${x},${y}`;
        // 終點不能是起點
        if (x === this.startPos.x && y === this.startPos.y) return;

        if (this.goalPositions.has(key)) {
            this.goalPositions.delete(key);
        } else {
            this.goalPositions.add(key);
        }
        // 當終點改變時，重新執行終點規則 (打通內部)
        this.enforceGoalRule();
    }

    // --- 規則強制 ---

    enforceStartRule() {
        const { x, y } = this.startPos;
        const idx = this.getIndex(x, y);
        
        // 1. 本身只留北牆開口 (U型: 14 = 8+4+2)
        this.data[idx] = 14;

        // 2. 打通北方鄰居的南牆
        if (y < this.height - 1) {
            const nIdx = this.getIndex(x, y + 1);
            this.data[nIdx] &= ~4; // Remove South(4)
        }
        // 3. 封閉其他方向鄰居 (如果鄰居存在)
        if (x < this.width - 1) this.data[this.getIndex(x + 1, y)] |= 8; // E鄰居加W牆
        if (x > 0)              this.data[this.getIndex(x - 1, y)] |= 2; // W鄰居加E牆
        if (y > 0)              this.data[this.getIndex(x, y - 1)] |= 1; // S鄰居加N牆
    }

    enforceGoalRule() {
        if (this.goalPositions.size === 0) return;
        
        // 簡單實作：遍歷所有終點格子，若鄰居也是終點，則打通中間的牆
        this.goalPositions.forEach(posStr => {
            const [x, y] = posStr.split(',').map(Number);
            const idx = this.getIndex(x, y);

            // Check North
            if (y < this.height - 1 && this.goalPositions.has(`${x},${y + 1}`)) {
                this.data[idx] &= ~1;
                this.data[this.getIndex(x, y + 1)] &= ~4;
            }
            // Check East
            if (x < this.width - 1 && this.goalPositions.has(`${x + 1},${y}`)) {
                this.data[idx] &= ~2;
                this.data[this.getIndex(x + 1, y)] &= ~8;
            }
            // South & West 會在處理鄰居時被連帶處理，但為了完整性可以全寫
        });
    }

    // --- 生成演算法 (封裝在內部) ---

    generateRandom(keepExisting = false, allowLoops = false) {
        // 1. Reset Logic
        if (!keepExisting) {
            this.data.fill(15);
        } else {
            for(let i=0; i<this.data.length; i++) {
                if(this.data[i] === 0) this.data[i] = 15;
            }
        }

        // 先執行一次規則，確保起點周圍的牆壁狀態正確
        this.enforceStartRule();

        const stack = [];
        const visited = new Set();
        
        // ... (中間保留既有路徑的邏輯不變) ...
        for(let i=0; i<this.data.length; i++) {
            if (this.data[i] !== 15) {
                const p = this.getCoord(i);
                visited.add(`${p.x},${p.y}`);
                stack.push(p); 
            }
        }

        if (stack.length === 0) {
            stack.push(this.startPos);
            visited.add(`${this.startPos.x},${this.startPos.y}`);
        } else {
            stack.sort(() => Math.random() - 0.5);
        }

        while(stack.length > 0) {
            const curr = stack[stack.length - 1];
            const { x, y } = curr;
            const idx = this.getIndex(x, y);

            let dirs = [0, 1, 2, 3]; // N, E, S, W
            
            // ★★★ 新增：如果當前是起點，強制優先嘗試往北 (0) ★★★
            // 這避免了隨機挖了東邊，結果最後被 enforceStartRule 封死的狀況
            if (x === this.startPos.x && y === this.startPos.y) {
                // 將北 (0) 移到陣列最後面 (Stack 是後進先出? 不，這裡是 dirs 迴圈，我們希望北被選中)
                // 這裡的邏輯是 shuffle dirs，我們只要確保 '0' 在裡面。
                // 為了保險，我們可以把其他方向移除，只留北。
                // 只有當北邊在範圍內才這樣做
                if (y + 1 < this.height) {
                    dirs = [0]; 
                }
            } else {
                // 其他格子正常隨機洗牌
                for (let i = dirs.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
                }
            }

            let carved = false;
            for (let dirIdx of dirs) {
                const nx = x + DIRS[dirIdx].dx;
                const ny = y + DIRS[dirIdx].dy;
                const nKey = `${nx},${ny}`;

                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                    const nIdx = this.getIndex(nx, ny);
                    if (!visited.has(nKey) && this.data[nIdx] === 15) {
                        const bit = DIRS[dirIdx].bit;
                        const opBit = DIRS[(dirIdx + 2) % 4].bit;
                        
                        this.data[idx] &= ~bit;
                        this.data[nIdx] &= ~opBit;
                        
                        visited.add(nKey);
                        stack.push({x: nx, y: ny});
                        carved = true;
                        break;
                    }
                }
            }
            if (!carved) stack.pop();
        }

        if (allowLoops) {
            this.removeDeadEnds(0.5);
        }

        // 最後再強制執行一次，確保格式正確
        this.enforceStartRule();
        this.enforceGoalRule();
    }

    removeDeadEnds(percentage) {
        // 邏輯同原本，但使用 this.data
        const deadEnds = [];
        for (let i = 0; i < this.data.length; i++) {
            let walls = 0;
            if (this.data[i] & 1) walls++;
            if (this.data[i] & 2) walls++;
            if (this.data[i] & 4) walls++;
            if (this.data[i] & 8) walls++;
            
            const p = this.getCoord(i);
            // 排除起點
            if (walls === 3 && !(p.x === this.startPos.x && p.y === this.startPos.y)) {
                deadEnds.push(i);
            }
        }

        deadEnds.forEach(idx => {
            if (Math.random() > percentage) return;
            const p = this.getCoord(idx);
            // 隨機找一個有牆的方向打通... (省略細節，邏輯同前，改用 this 存取)
            // 簡單版：隨機選一個方向，如果是牆且不出界，就拆
            const candidates = [];
            for(let d=0; d<4; d++) {
                 if (this.isWall(p.x, p.y, d)) {
                     const nx = p.x + DIRS[d].dx;
                     const ny = p.y + DIRS[d].dy;
                     if(nx >=0 && nx < this.width && ny >= 0 && ny < this.height) {
                         candidates.push(d);
                     }
                 }
            }
            if(candidates.length > 0) {
                const pick = candidates[Math.floor(Math.random()*candidates.length)];
                this.toggleWall(p.x, p.y, pick);
            }
        });
    }

    // --- 資料匯出/匯入 ---
    
toJSON() {
        // 優化：將資料陣列轉換為 16 進制字串 (Hex String)
        // 例如 [15, 14, 5] -> "FE5"
        // 這樣可以大幅縮小 JSON 檔案體積
        let hexString = "";
        for (let i = 0; i < this.data.length; i++) {
            // toString(16) 轉成 16 進制, toUpperCase() 轉大寫
            hexString += this.data[i].toString(16).toUpperCase();
        }

        return {
            version: "2.0", // 標記版本
            width: this.width,
            height: this.height,
            mapData: hexString, // 改用字串儲存
            start: this.startPos,
            // Set 轉 Array
            goals: Array.from(this.goalPositions)
        };
    }

loadFromJSON(json) {
        this.width = json.width;
        this.height = json.height;
        this.startPos = json.start || {x:0, y:0};
        this.goalPositions = new Set(json.goals || []);
        
        // 重置資料陣列
        this.data = new Uint8Array(this.width * this.height);

        // ★★★ 關鍵：判斷資料格式以支援舊版 ★★★
        
        if (typeof json.mapData === 'string') {
            // 新版格式：讀取 Hex 字串 ("FE5...")
            // 檢查長度是否吻合，防呆
            const limit = Math.min(json.mapData.length, this.data.length);
            for (let i = 0; i < limit; i++) {
                // parseInt(char, 16) 將 "F" 轉回 15
                this.data[i] = parseInt(json.mapData[i], 16);
            }
        } 
        else if (Array.isArray(json.data)) {
            // 舊版格式：讀取陣列 ([15, 14, 5...]) - 向下相容
            // 你的舊檔案是用 'data' 這個 key
            this.data = new Uint8Array(json.data);
        }
        else if (typeof json.data === 'object') {
            // 有時候 JSON.stringify(Uint8Array) 會變成 {"0":15, "1":14...} 的物件格式
            // 這裡做個防護轉回 Array
            const arr = Object.values(json.data);
            this.data = new Uint8Array(arr);
        }

        // 清空暫存狀態
        this.solutionPath = [];
        this.secondaryPath = [];
        this.weightMap = null;
        
        this.enforceStartRule();
    }
}