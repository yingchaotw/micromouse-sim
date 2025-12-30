from PIL import Image, ImageDraw, ImageOps
import numpy as np
import json
import sys
import os

# ================= 參數調整區 =================
# 預設輸入圖片 (當沒有給參數時使用)
DEFAULT_IMAGE_PATH = 'maze.png' 
# 預設大小 (當檔名沒有數字時使用)
DEFAULT_SIZE = 16 

# 輸出資料夾
OUTPUT_DIR = 'build'

# 牆壁靈敏度
WALL_SENSITIVITY = 195 
# ============================================

def get_maze_info_from_filename(filepath):
    """
    從檔名判斷迷宮大小，並產生對應的輸出 JSON 路徑
    """
    filename = os.path.basename(filepath)
    name_without_ext = os.path.splitext(filename)[0]
    
    # 1. 判斷大小
    if '32' in filename:
        size = 32
        print(f"[系統] 檔名包含 '32' -> 設定為 32x32 迷宮")
    elif '16' in filename:
        size = 16
        print(f"[系統] 檔名包含 '16' -> 設定為 16x16 迷宮")
    else:
        size = DEFAULT_SIZE
        print(f"[系統] 檔名無明確數字 -> 使用預設值 {size}x{size}")

    # 2. 自動產生輸出路徑 (避免檔名重複導致覆蓋)
    # 例如: maze_32.png -> result/maze_32.json
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    output_path = os.path.join(OUTPUT_DIR, f"{name_without_ext}.json")
    
    return size, output_path

def convert_and_fix(img_path, out_path, size):
    if not os.path.exists(img_path):
        print(f"錯誤：找不到檔案 {img_path}")
        return

    # 1. 讀取並轉灰階
    try:
        original = Image.open(img_path).convert("RGB")
        gray = original.convert("L")
    except Exception as e:
        print(f"圖片讀取錯誤: {e}")
        return

    # 2. 自動切除白邊
    inverted = ImageOps.invert(gray)
    bbox = inverted.getbbox()
    if bbox:
        print(f"自動裁切範圍: {bbox}")
        original = original.crop(bbox)
        gray = gray.crop(bbox)
    
    # 3. 縮放
    cell_px = 40
    target_size = size * cell_px
    resized_gray = gray.resize((target_size, target_size), resample=Image.LANCZOS)
    arr = np.array(resized_gray)

    # 建立除錯圖
    debug_img = resized_gray.convert("RGB")
    draw = ImageDraw.Draw(debug_img)

    print(f"正在掃描 {size}x{size} 迷宮... (靈敏度: {WALL_SENSITIVITY})")

    # === 第一階段：原始偵測 ===
    raw_grid = [[0 for _ in range(size)] for _ in range(size)]

    for row in range(size):
        for col in range(size):
            y1 = row * cell_px
            y2 = (row + 1) * cell_px
            x1 = col * cell_px
            x2 = (col + 1) * cell_px
            
            cell = arr[y1:y2, x1:x2]
            m = 8 # Margin
            
            mean_n = np.mean(cell[0:m, :])
            mean_e = np.mean(cell[:, -m:])
            mean_s = np.mean(cell[-m:, :])
            mean_w = np.mean(cell[:, 0:m])
            
            thresh = WALL_SENSITIVITY
            
            val = 0
            if mean_n < thresh: val |= 1
            if mean_e < thresh: val |= 2
            if mean_s < thresh: val |= 4
            if mean_w < thresh: val |= 8
            
            raw_grid[row][col] = val

    # === 第二階段：雙向牆壁校正 ===
    final_grid = [[0 for _ in range(size)] for _ in range(size)]

    for r in range(size):
        for c in range(size):
            val = raw_grid[r][c]

            # 檢查鄰居
            if r > 0:
                neighbor_s = raw_grid[r-1][c] & 4
                if (val & 1) or neighbor_s: val |= 1
            if r < size - 1:
                neighbor_n = raw_grid[r+1][c] & 1
                if (val & 4) or neighbor_n: val |= 4
            if c > 0:
                neighbor_e = raw_grid[r][c-1] & 2
                if (val & 8) or neighbor_e: val |= 8
            if c < size - 1:
                neighbor_w = raw_grid[r][c+1] & 8
                if (val & 2) or neighbor_w: val |= 2

            # 強制外框
            if r == 0: val |= 1
            if r == size - 1: val |= 4
            if c == 0: val |= 8
            if c == size - 1: val |= 2
            
            final_grid[r][c] = val

    # === 第三階段：繪圖與輸出 ===
    map_data = ""
    
    for row in range(size):
        for col in range(size):
            val = final_grid[row][col]
            map_data += format(val, 'X')
            
            x1 = col * cell_px
            y1 = row * cell_px
            x2 = (col + 1) * cell_px
            y2 = (row + 1) * cell_px
            
            line_w = 3
            fill_color = (255, 0, 0)
            off = 2
            
            if val & 1: draw.line([(x1+off, y1+off), (x2-off, y1+off)], fill=fill_color, width=line_w)
            if val & 2: draw.line([(x2-off, y1+off), (x2-off, y2-off)], fill=fill_color, width=line_w)
            if val & 4: draw.line([(x1+off, y2-off), (x2-off, y2-off)], fill=fill_color, width=line_w)
            if val & 8: draw.line([(x1+off, y1+off), (x1+off, y2-off)], fill=fill_color, width=line_w)

    # 輸出 JSON
    out = {
        "version": "2.0",
        "width": size,
        "height": size,
        "mapData": map_data,
        "start": {"x": 0, "y": 0},
        "goals": ["7,7", "8,7", "7,8", "8,8"] if size==16 else []
    }

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(out, f, separators=(',', ':'))

    # 除錯圖也跟著改名，才不會互相覆蓋
    debug_img_name = out_path.replace(".json", "_debug.png")
    debug_img.save(debug_img_name)
    
    print(f"轉換完成！JSON 儲存於: {out_path}")
    print(f"除錯圖儲存於: {debug_img_name}")

if __name__ == "__main__":
    # 1. 取得圖片路徑 (從參數或預設)
    target_image = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_IMAGE_PATH
    
    # 2. 自動判斷大小與輸出檔名
    auto_size, auto_output_path = get_maze_info_from_filename(target_image)
    
    # 3. 執行轉換
    convert_and_fix(target_image, auto_output_path, auto_size)