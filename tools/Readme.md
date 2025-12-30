# Micromouse Maze Image Converter

A Python tool to convert physical maze photographs into JSON format compatible with Micromouse simulators. It features auto-cropping, grid alignment visualization, and bidirectional wall consistency checks to ensure accurate map generation.

## 🚀 Prerequisites

* **Python 3.8** or higher
* `pip` (Python package installer)

## 🛠️ Installation & Setup

It is recommended to run this script in a virtual environment to avoid conflicts.

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



*(Once activated, you should see `(venv)` at the beginning of your terminal prompt.)*

### 3. Install Dependencies

Install the required packages using `requirements.txt`:

```bash
pip install -r requirements.txt

```

---

## 🏃‍♂️ Usage

1. Place your maze image (e.g., `maze.png` or `photo.jpg`) in the project folder.
2. Run the script:

```bash
# Default usage (looks for 'maze.png' by default)
python maze_converter.py

# Or specify a custom image file
python maze_converter.py my_maze_photo.jpg

```

3. **Check the Output:**
* **`maze_output.json`**: The converted JSON file.
* **`debug_visual.png`**: A debugging image showing the detected walls (red lines) overlaid on the original image.



## ⚙️ Configuration

You can adjust the following variables inside `maze_converter.py` to improve accuracy:

* **`MAZE_SIZE`**: Set to `16` (Classic) or `32` (Half-size).
* **`WALL_SENSITIVITY`** (0-255):
* Higher value (e.g., `220`) = More sensitive (detects faint walls).
* Lower value (e.g., `180`) = Stricter (reduces noise).


* **`OFFSET_X` / `OFFSET_Y**`: Adjust these if the grid is slightly misaligned in the debug image.

---

## 🛑 Deactivate

To exit the virtual environment when you are done:

```bash
deactivate

```