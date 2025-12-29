// js/i18n.js

const translations = {
    "zh-TW": {
        "title": "電腦鼠迷宮設定器",
        "btn_save": "💾 儲存",
        "btn_load": "📂 讀取",
        "btn_file_menu": "📂 檔案 / 地圖管理",
        "btn_setting_menu": "⚙️ 尺寸與縮放",
        "map_default": "--- 請選擇地圖 ---",
        "lbl_w": "寬:",
        "lbl_h": "高:",
        "btn_reset": "重置",
        "lbl_zoom": "🔎 縮放:",
        "lbl_speed": "🚀 速度:", // ★ 新增這行
        "lbl_algo": "🧠 演算法:",
        "lbl_animate": "🎬 動畫演示",
        "status_simulating": "🎬 模擬行走中...",
        "status_map_calc": " (地圖計算中)",
        "msg_goal_reached": "🚩 抵達終點!",
        "msg_stuck": "❌ 陷入死循環 (步數過多)",
        "msg_trapped": "⚠️ 被困住了 (無路可走)",
        "msg_no_path": "❌ 找不到路徑",
        "btn_generate": "隨機生成",
        "chk_keep": "保留現有",
        "chk_loops": "多路徑 (迴圈)",
        "chk_weight": "顯示權重",
        "btn_fill": "重置為牆",
        "btn_clear": "全部拆除",
        "btn_start": "設起點",
        "btn_goal": "設終點",
        "btn_wall": "編輯牆",
        "btn_run": "執行",
        "btn_clear_path": "❌ 清除路徑",
        "algo_flood": "🌊 洪水 (BFS/最短)",
        "algo_bfs": "📡 廣度優先 (BFS)",
        "algo_dfs": "🌀 深度優先 (DFS)",
        "algo_astar": "⭐ A* 搜尋",
        "algo_dijkstra": "🔍 Dijkstra",
        "algo_manhattan": "🚀 曼哈頓 (貪婪)",
        "algo_left": "⬅️ 左手法則",
        "algo_right": "➡️ 右手法則",
        "status_loading": "載入中...",
        "status_ready": "準備就緒",
        "status_reset_wall": "地圖已重置為牆",
        "status_cleared": "地圖已清空",
        "status_path_cleared": "路徑已清除",
        "status_calculating": "正在計算...",
        "status_no_path": "無法到達終點。",
        "status_generated": "生成完畢！",
        "scale_info": "1 格 = 180mm",
        "msg_size_error": "尺寸太小！",
        "msg_file_error": "讀取失敗：檔案格式錯誤",
        "msg_load_success": "地圖讀取成功！",
        "msg_no_goal": "請先設定終點！",
        "unit_step": "步",
        "unit_turn": "彎", // 日本習慣用"折"，台灣習慣用"彎"或"轉"
        "dir_n": "北迴", // 或 北路徑
        "dir_e": "東迴",
        "dir_s": "南迴",
        "dir_w": "西迴",
        "size_classic": "經典 (16x16)",
        "size_half": "半尺寸 (32x32)",
        "size_custom": "自定義",
        "status_result": "{algo} | 耗時: {time}ms | 步數: {steps} | 轉彎: {turns} 次 | 最長直線: {straight} 格",
        "status_info": "格數: {w}x{h} | 物理尺寸: {rw}m x {rh}m | 起點: ({sx}, {sy}) | 終點數: {gcount}",
        "btn_load_map": "📥 載入地圖",
        "msg_map_loaded": "地圖載入成功！",
        "msg_map_error": "地圖載入失敗 (404 或格式錯誤)",
        "msg_select_map": "請先選擇一張地圖！"
    },
    "en": {
        "title": "Micromouse Maze Editor",
        "btn_save": "💾 Save",
        "btn_load": "📂 Load",
        "btn_file_menu": "📂 File / Map Menu", 
        "btn_setting_menu": "⚙️ Size & Zoom",
        "map_default": "--- Select Map ---",
        "lbl_w": "W:",
        "lbl_h": "H:",
        "btn_reset": "Reset",
        "lbl_zoom": "🔎 Zoom:",
        "lbl_speed": "🚀 Speed:", // ★ 新增這行
        "lbl_algo": "🧠 Algorithm:",
        "lbl_animate": "🎬 Animate",
        "status_simulating": "🎬 Simulating...",
        "status_map_calc": " (Map Calculation)",
        "msg_goal_reached": "🚩 Goal Reached!",
        "msg_stuck": "❌ Stuck in loop",
        "msg_trapped": "⚠️ Trapped!",
        "msg_no_path": "❌ No Path Found",
        "btn_generate": "Generate",
        "chk_keep": "Keep Existing",
        "chk_loops": "Multi-Path (Loops)",
        "chk_weight": "Show Weights",
        "btn_fill": "Fill Walls",
        "btn_clear": "Clear All",
        "btn_start": "Set Start",
        "btn_goal": "Set Goal",
        "btn_wall": "Edit Wall",
        "btn_run": "Run",
        "btn_clear_path": "❌ Clear Path",
        "algo_flood": "🌊 Flood Fill (BFS)",
        "algo_bfs": "📡 Breadth-First Search",
        "algo_dfs": "🌀 Depth-First Search",
        "algo_astar": "⭐ A* Search",
        "algo_dijkstra": "🔍 Dijkstra",
        "algo_manhattan": "🚀 Manhattan (Greedy)",
        "algo_left": "⬅️ Left Hand",
        "algo_right": "➡️ Right Hand",
        "status_loading": "Loading...",
        "status_ready": "Ready",
        "status_reset_wall": "Map reset to walls",
        "status_cleared": "Map cleared",
        "status_path_cleared": "Path cleared",
        "status_calculating": "Calculating...",
        "status_no_path": "No path found.",
        "status_generated": "Generation complete!",
        "scale_info": "1 Cell = 180mm",
        "msg_size_error": "Size too small!",
        "msg_file_error": "Load failed: Invalid file format",
        "msg_load_success": "Map loaded successfully!",
        "msg_no_goal": "Please set a goal first!",
        "unit_step": " steps",
        "unit_turn": " turns",
        "dir_n": "North",
        "dir_e": "East",
        "dir_s": "South",
        "dir_w": "West",
        "size_classic": "Classic (16x16)",
        "size_half": "Half-Size (32x32)",
        "size_custom": "Custom",
        "status_result": "{algo} | Time: {time}ms | Steps: {steps} | Turns: {turns} | Max Straight: {straight}",
        "status_info": "Size: {w}x{h} | Real: {rw}m x {rh}m | Start: ({sx}, {sy}) | Goals: {gcount}",
        "btn_load_map": "📥 Load Map",
        "msg_map_loaded": "Map loaded successfully!",
        "msg_map_error": "Failed to load map.",
        "msg_select_map": "Please select a map first!"
    },
    "ja": {
        "title": "マイクロマウス迷路エディタ",
        "btn_save": "💾 保存",
        "btn_load": "📂 読込",
        "btn_file_menu": "📂 ファイル / マップ",
        "btn_setting_menu": "⚙️ サイズ / ズーム",
        "map_default": "--- マップ選択 ---",
        "lbl_w": "幅:",
        "lbl_h": "高:",
        "btn_reset": "リセット",
        "lbl_zoom": "🔎 ズーム:",
        "lbl_speed": "🚀 速度:",
        "lbl_algo": "🧠 アルゴリズム:",
        "lbl_animate": "🎬 アニメーション",
        "status_simulating": "🎬 シミュレーション中...",
        "status_map_calc": " (地図計算中)",
        "msg_goal_reached": "🚩 ゴール到達!",
        "msg_stuck": "❌ ループ (歩数オーバー)",
        "msg_trapped": "⚠️ 袋小路!",
        "msg_no_path": "❌ 経路なし",
        "btn_generate": "ランダム生成",
        "chk_keep": "現状維持",
        "chk_loops": "多重経路 (ループ)",
        "chk_weight": "重み表示",
        "btn_fill": "壁で埋める",
        "btn_clear": "全削除",
        "btn_start": "スタート",
        "btn_goal": "ゴール",
        "btn_wall": "壁編集",
        "btn_run": "実行",
        "btn_clear_path": "❌ パス削除",
        "algo_flood": "🌊 全面探索 (最短)",
        "algo_bfs": "📡 幅優先探索 (BFS)",
        "algo_dfs": "🌀 深さ優先探索 (DFS)",
        "algo_astar": "⭐ A* 探索",
        "algo_dijkstra": "🔍 ダイクストラ",
        "algo_manhattan": "🚀 マンハッタン (貪欲)",
        "algo_left": "⬅️ 左手法",
        "algo_right": "➡️ 右手法",
        "status_loading": "読み込み中...",
        "status_ready": "準備完了",
        "status_reset_wall": "壁リセット完了",
        "status_cleared": "マップ削除完了",
        "status_path_cleared": "パス削除完了",
        "status_calculating": "計算中...",
        "status_no_path": "ゴールに到達できません。",
        "status_generated": "生成完了！(パスはクリアされました)",
        "scale_info": "1マス = 180mm",
        "msg_size_error": "サイズが小さすぎます！",
        "msg_file_error": "読込失敗：ファイル形式エラー",
        "msg_load_success": "マップを読み込みました！",
        "msg_no_goal": "先にゴールを設定してください！",
        "unit_step": "歩",
        "unit_turn": "折",
        "dir_n": "北回り",
        "dir_e": "東回り",
        "dir_s": "南回り",
        "dir_w": "西回り",
        "size_classic": "クラシック (16x16)",
        "size_half": "ハーフ (32x32)",
        "size_custom": "カスタム",
        "status_result": "{algo} | 時間: {time}ms | 歩数: {steps} | ターン: {turns}回 | 最長直線: {straight}マス",
        "status_info": "サイズ: {w}x{h} | 実寸: {rw}m x {rh}m | 開始: ({sx}, {sy}) | 目標数: {gcount}",
        "btn_load_map": "📥 読込",
        "msg_map_loaded": "マップを読み込みました！",
        "msg_map_error": "読み込み失敗",
        "msg_select_map": "マップを選択してください！"
    }
};

var currentLang = localStorage.getItem('mm_lang') || "zh-TW";

// 初始化語言設定
function initLanguage() {
    // 1. 嘗試讀取瀏覽器語言
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('ja')) currentLang = 'ja';
    else if (browserLang.startsWith('en')) currentLang = 'en';
    else currentLang = 'zh-TW'; // 預設繁中

    // 2. 如果使用者有選過 (存在 localStorage)，優先使用
    const savedLang = localStorage.getItem('mm_lang');
    if (savedLang) currentLang = savedLang;

    // 3. 設定下拉選單的值
    const langSelect = document.getElementById('lang-select');
    if(langSelect) langSelect.value = currentLang;

    applyTranslations();
}

// 切換語言
function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('mm_lang', lang); // 記住選擇
    applyTranslations();
    
    // 觸發 UI 更新 (例如重繪下拉選單文字)
    if(typeof updateStatus === 'function') updateStatus();
}

// 應用翻譯到 DOM
function applyTranslations() {
    // 1. 處理所有有 data-i18n 屬性的元素
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            // 如果是 input 按鈕，改 value；如果是 checkbox，改後面的文字節點(有點複雜，這裡簡化處理 label)
            if (el.tagName === 'INPUT' && el.type === 'button') {
                el.value = translations[currentLang][key];
            } else {
                el.innerText = translations[currentLang][key];
            }
        }
    });

    // 2. 處理下拉選單 (algo-select) 的選項
    const algoSelect = document.getElementById('algo-select');
    if (algoSelect) {
        for (let option of algoSelect.options) {
            const key = 'algo_' + option.value;
            if (translations[currentLang][key]) {
                option.text = translations[currentLang][key];
            }
        }
    }
}

// 取得翻譯字串 (給 JS 內部使用)
function t(key, params = {}) {
    let str = translations[currentLang][key] || key;
    // 簡單的參數替換 {key}
    for (let p in params) {
        str = str.replace(`{${p}}`, params[p]);
    }
    return str;
}