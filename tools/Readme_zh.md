# 電腦鼠迷宮圖片轉 JSON 工具 (Maze Image Converter)

這是一個強大的 Python 工具，用於將實體迷宮照片轉換為電腦鼠模擬器專用的 JSON 格式。本工具結合了**自動影像辨識**與**互動式 GUI 編輯器**，讓您能視覺化地修正牆壁並設定終點。

## ✨ 主要功能

* **智慧判斷尺寸**：根據檔名自動決定迷宮大小 (16x16 或 32x32)。
* **互動式編輯器**：提供視窗介面，將偵測結果直接疊加在原圖上。
    * **滑鼠左鍵**：新增或移除牆壁 (自動處理雙向連動)。
    * **滑鼠右鍵**：設定或取消終點 (Goal)。
* **座標自動修正**：存檔時會自動將終點座標轉換為 MicroMouse 標準座標系 (左下角為 0,0)。
* **自動裁切**：自動去除圖片白邊並對齊網格。

## 🚀 環境需求

* **Python 3.8** 或更高版本
* `pip` (Python 套件管理工具)
* `tkinter` (通常內建於 Python 安裝中)

## 🛠️ 安裝與設定

建議在虛擬環境 (Virtual Environment) 中執行以保持系統整潔。

### 1. 建立虛擬環境

在專案資料夾中開啟終端機 (Terminal) 或命令提示字元 (CMD)：

```bash
# Windows / macOS / Linux 通用
python -m venv venv

```

### 2. 啟動虛擬環境

* **Windows (CMD):**
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



### 3. 安裝相依套件

使用 `requirements.txt` 安裝所需的 Python 套件 (Pillow, NumPy)：

```bash
pip install -r requirements.txt

```

---

## 🏃‍♂️ 使用教學

### 1. 準備圖片與命名

將迷宮照片放入專案資料夾。**請透過檔名來設定迷宮大小：**

* 欲產生 **32x32** 地圖：檔名需包含 `32` (例如：`maze_32.png`, `final_32.jpg`)。
* 欲產生 **16x16** 地圖：檔名需包含 `16` (例如：`test_16.png`)。
* *若無數字，預設為 16x16。*

### 2. 執行腳本

```bash
# 範例：
python maze_converter.py maze_32.png

```

### 3. 互動微調 (GUI 介面)

程式執行後會彈出一個視窗，顯示您的圖片與紅色牆壁線條。

* **🖱️ 滑鼠左鍵 (牆壁)**：點擊牆壁位置可進行切換。
* 若程式漏抓牆壁 -> 點一下補上。
* 若程式誤判陰影為牆 -> 點一下消除。


* **🖱️ 滑鼠右鍵 (終點)**：點擊格子可將其設為終點 (Goal)。
* 終點格子會顯示為 **綠色**。
* *註：16x16 迷宮預設會將中央四格標記為終點。*



### 4. 存檔

確認無誤後，點擊視窗下方的 **"Confirm & Save JSON"** 按鈕。
檔案將儲存於 `result/` 資料夾中 (例如 `result/maze_32.json`)。

---

## ⚙️ 參數調整 (選用)

若自動偵測效果不佳，可打開 `maze_converter.py` 修改開頭的設定：

* **`WALL_SENSITIVITY`** (0-255): 牆壁判定靈敏度。
* 數值調大 (例如 `220`)：更靈敏 (適合線條較淡的圖)。
* 數值調小 (例如 `180`)：更嚴格 (適合雜訊較多的圖)。



---

## 🛑 離開虛擬環境

完成後輸入以下指令退出：

```bash
deactivate

```