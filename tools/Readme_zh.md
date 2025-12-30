# 電腦鼠迷宮圖片轉 JSON 工具 (Maze Image Converter)

這是一個 Python 工具，用於將實體迷宮的照片轉換為電腦鼠模擬器可讀取的 JSON 格式。本工具具備自動裁切、網格對齊視覺化以及雙向牆壁校正功能，能確保產生的地圖準確無誤。

## 🚀 環境需求

* **Python 3.8** 或更高版本
* `pip` (Python 套件管理工具)

## 🛠️ 安裝與設定

建議在虛擬環境 (Virtual Environment) 中執行此腳本，以保持系統整潔。

### 1. 建立虛擬環境

請在專案資料夾中開啟終端機 (Terminal) 或命令提示字元 (CMD)，輸入以下指令：

```bash
# Windows / macOS / Linux 通用
python -m venv venv

```

### 2. 啟動虛擬環境

* **Windows (CMD 命令提示字元):**
```cmd
.\venv\Scripts\activate

```


* **Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1

```


* **macOS / Linux:**
```bash
source venv/bin/activate

```



*(啟動成功後，你的終端機提示字元前面會出現 `(venv)` 字樣。)*

### 3. 安裝相依套件

使用 `requirements.txt` 安裝所需的 Python 套件 (Pillow, NumPy)：

```bash
pip install -r requirements.txt

```

---

## 🏃‍♂️ 如何使用

1. 將你的迷宮圖片 (例如 `maze.png` 或 `photo.jpg`) 放入此資料夾中。
2. 執行轉換腳本：

```bash
# 預設執行 (會自動尋找 'maze.png')
python maze_converter.py

# 或者指定你的圖片檔名
python maze_converter.py my_maze_photo.jpg

```

3. **檢查輸出檔案：**
* **`maze_output.json`**: 轉換完成的 JSON 檔，可直接匯入模擬器。
* **`debug_visual.png`**: 除錯圖片。請檢查圖上的**紅線**是否完美覆蓋在黑色的牆壁上。



## ⚙️ 參數調整

如果轉換結果不理想，你可以打開 `maze_converter.py` 修改以下變數：

* **`MAZE_SIZE`**: 設定為 `16` (古典迷宮) 或 `32` (半尺寸迷宮)。
* **`WALL_SENSITIVITY`** (0-255): 牆壁判定靈敏度。
* 數值調大 (例如 `220`)：更靈敏，適合線條較淡的圖片。
* 數值調小 (例如 `180`)：更嚴格，適合雜訊較多的圖片。


* **`OFFSET_X` / `OFFSET_Y**`: 如果發現除錯圖的網格偏移，可調整此數值 (像素) 來對齊。

---

## 🛑 離開虛擬環境

當你完成操作後，輸入以下指令即可退出虛擬環境：

```bash
deactivate

```