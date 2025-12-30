# Micromouse Maze Image Converter & Editor

A Python tool to convert physical maze photographs into JSON format compatible with Micromouse simulators. It features **automatic processing** followed by an **interactive GUI editor**, allowing you to verify walls, fix detection errors, and set goal coordinates visually.

## ✨ Key Features

* **Auto-Detection:** Automatically determines maze size (16x16 or 32x32) based on the filename.
* **Interactive Editor:** A GUI window overlays detected walls on your original image.
    * **Left Click:** Toggle walls (with bidirectional sync).
    * **Right Click:** Set/Unset Goal cells.
* **Smart Coordinates:** Automatically flips Y-axis coordinates for Goals to match Micromouse simulator standards.
* **Auto-Crop & Align:** Automatically removes white borders and aligns the grid.

## 🚀 Prerequisites

* **Python 3.8** or higher
* `pip` (Python package installer)
* `tkinter` (Usually included with Python standard library)

## 🛠️ Installation & Setup

It is recommended to run this script in a virtual environment.

### 1. Create a Virtual Environment

Open your terminal or command prompt in the project folder:

```bash
# Windows / macOS / Linux
python -m venv venv

```

### 2. Activate the Virtual Environment

* **Windows (Command Prompt):**
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



### 3. Install Dependencies

Install the required packages (Pillow, NumPy):

```bash
pip install -r requirements.txt

```

---

## 🏃‍♂️ Usage

### 1. Prepare Your Image

Place your maze photo in the project folder. **Name your file accordingly to auto-set the size:**

* To generate a **32x32** map: Include `32` in the filename (e.g., `maze_32.png`, `contest_32.jpg`).
* To generate a **16x16** map: Include `16` in the filename (e.g., `maze_16.png`).
* *Default: 16x16 if no number is found.*

### 2. Run the Script

```bash
# Example:
python maze_converter.py maze_32.png

```

### 3. Interactive Editing (The GUI)

A window will appear showing your image with red wall lines overlaid.

* **🖱️ Left Click (Walls):** Click on any wall edge to toggle it. If the auto-detection missed a wall, click to add it. If it detected a shadow as a wall, click to remove it.
* **🖱️ Right Click (Goals):** Click on a cell to mark it as a Goal.
* Goal cells will be highlighted in **Green**.
* *Note: For 16x16 maps, the center 4 cells are marked by default.*



### 4. Save

Click the **"Confirm & Save JSON"** button at the bottom.
The file will be saved in the `result/` folder (e.g., `result/maze_32.json`).

---

## ⚙️ Configuration (Optional)

You can modify variables at the top of `maze_converter.py` if needed:

* **`WALL_SENSITIVITY`** (0-255):
* Higher (e.g., `220`): More sensitive (good for faint lines).
* Lower (e.g., `180`): Stricter (good for noisy images).



---

## 🛑 Deactivate

To exit the virtual environment:

```bash
deactivate

```