from PIL import Image, ImageOps, ImageTk, ImageEnhance
import numpy as np
import json
import sys
import os
import tkinter as tk
from tkinter import messagebox

# ================= Configuration =================
DEFAULT_IMAGE_PATH = 'maze.png'
OUTPUT_DIR = 'result'
WALL_SENSITIVITY = 195 
# ===============================================

class MazeEditor:
    def __init__(self, grid_data, size, bg_image, cell_px=40, on_save=None):
        self.grid = grid_data # 2D array
        self.size = size
        self.cell_px = cell_px
        self.on_save = on_save
        
        # Initialize Goals (Set to center for 16x16 by default)
        self.goals = set()
        if self.size == 16:
            self.goals = {(7,7), (7,8), (8,7), (8,8)}
        
        self.window = tk.Tk()
        self.window.title(f"Maze Editor ({size}x{size})")
        
        # Convert PIL image to Tkinter format
        self.bg_photo = ImageTk.PhotoImage(bg_image)
        
        canvas_size = size * cell_px
        self.canvas = tk.Canvas(self.window, width=canvas_size, height=canvas_size, bg="white")
        self.canvas.pack(side=tk.TOP)
        
        # Bind mouse clicks
        self.canvas.bind("<Button-1>", self.handle_left_click)  # Left: Walls
        self.canvas.bind("<Button-3>", self.handle_right_click) # Right: Goals (Win/Linux)
        self.canvas.bind("<Button-2>", self.handle_right_click) # Right: Goals (Mac)
        
        # Bottom UI
        btn_frame = tk.Frame(self.window)
        btn_frame.pack(side=tk.BOTTOM, fill=tk.X, pady=5)
        
        instr = "Left Click: Walls | Right Click: Goals (Green Area)"
        tk.Label(btn_frame, text=instr, fg="#333", font=("Arial", 10, "bold")).pack(side=tk.LEFT, padx=10)
        
        tk.Button(btn_frame, text="Confirm & Save JSON", command=self.save_and_close, 
                  bg="#4CAF50", fg="white", font=("Arial", 10, "bold"), height=2).pack(side=tk.RIGHT, padx=10)

        self.draw_maze()
        self.center_window()
        self.window.mainloop()

    def center_window(self):
        self.window.update_idletasks()
        w = self.window.winfo_width()
        h = self.window.winfo_height()
        ws = self.window.winfo_screenwidth()
        hs = self.window.winfo_screenheight()
        x = (ws/2) - (w/2)
        y = (hs/2) - (h/2)
        self.window.geometry('+%d+%d' % (x, y))

    def draw_maze(self):
        self.canvas.delete("all")
        cp = self.cell_px
        
        # 1. Draw Background
        self.canvas.create_image(0, 0, image=self.bg_photo, anchor=tk.NW)
        
        # 2. Draw Goals
        for (r, c) in self.goals:
            x1, y1 = c*cp, r*cp
            x2, y2 = (c+1)*cp, (r+1)*cp
            self.canvas.create_rectangle(x1, y1, x2, y2, fill="#00FF00", outline="", stipple="gray50")
            self.canvas.create_text(x1 + cp/2, y1 + cp/2, text="G", fill="black", font=("Arial", int(cp/2.5), "bold"))

        # 3. Draw Grid
        for i in range(self.size + 1):
            self.canvas.create_line(0, i*cp, self.size*cp, i*cp, fill="#444444", dash=(2, 4))
            self.canvas.create_line(i*cp, 0, i*cp, self.size*cp, fill="#444444", dash=(2, 4))

        # 4. Draw Walls
        for r in range(self.size):
            for c in range(self.size):
                val = self.grid[r][c]
                x1, y1 = c*cp, r*cp
                x2, y2 = (c+1)*cp, (r+1)*cp
                
                width = 3
                color = "#FF0000"
                
                if val & 1: self.canvas.create_line(x1, y1, x2, y1, width=width, fill=color) # N
                if val & 2: self.canvas.create_line(x2, y1, x2, y2, width=width, fill=color) # E
                if val & 4: self.canvas.create_line(x1, y2, x2, y2, width=width, fill=color) # S
                if val & 8: self.canvas.create_line(x1, y1, x1, y2, width=width, fill=color) # W

    def handle_left_click(self, event):
        col = event.x // self.cell_px
        row = event.y // self.cell_px
        if not self.is_valid(row, col): return

        rel_x, rel_y = event.x % self.cell_px, event.y % self.cell_px
        min_dist = min(rel_y, self.cell_px - rel_y, rel_x, self.cell_px - rel_x)
        
        if min_dist == rel_y: self.toggle_wall(row, col, 1)
        elif min_dist == (self.cell_px - rel_y): self.toggle_wall(row, col, 4)
        elif min_dist == rel_x: self.toggle_wall(row, col, 8)
        elif min_dist == (self.cell_px - rel_x): self.toggle_wall(row, col, 2)
            
        self.draw_maze()

    def handle_right_click(self, event):
        col = event.x // self.cell_px
        row = event.y // self.cell_px
        if not self.is_valid(row, col): return
        
        target = (row, col)
        if target in self.goals:
            self.goals.remove(target)
        else:
            self.goals.add(target)
        self.draw_maze()

    def is_valid(self, r, c):
        return 0 <= r < self.size and 0 <= c < self.size

    def toggle_wall(self, r, c, bit):
        self.grid[r][c] ^= bit
        if bit == 1 and r > 0: self.grid[r-1][c] ^= 4
        elif bit == 4 and r < self.size - 1: self.grid[r+1][c] ^= 1
        elif bit == 2 and c < self.size - 1: self.grid[r][c+1] ^= 8
        elif bit == 8 and c > 0: self.grid[r][c-1] ^= 2

    def save_and_close(self):
        if self.on_save:
            self.on_save(self.grid, self.goals)
        self.window.destroy()

# ================= Core Logic =================

def get_maze_info_from_filename(filepath):
    filename = os.path.basename(filepath)
    name_without_ext = os.path.splitext(filename)[0]
    
    if '32' in filename:
        size = 32
        print(f"[System] Filename contains '32' -> Mode: 32x32")
    elif '16' in filename:
        size = 16
        print(f"[System] Filename contains '16' -> Mode: 16x16")
    else:
        size = 16
        print(f"[System] No size in filename -> Default: 16x16")

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    output_path = os.path.join(OUTPUT_DIR, f"{name_without_ext}.json")
    return size, output_path

def convert_and_edit(img_path, out_path, size):
    if not os.path.exists(img_path):
        print(f"Error: File not found: {img_path}")
        return

    # 1. Image Processing
    try:
        original = Image.open(img_path).convert("RGB")
        gray = original.convert("L")
    except Exception as e:
        print(f"Image Load Error: {e}")
        return

    inverted = ImageOps.invert(gray)
    bbox = inverted.getbbox()
    if bbox:
        print(f"Auto-Crop applied: {bbox}")
        original = original.crop(bbox)
        gray = gray.crop(bbox)
    
    cell_px = 40
    target_size = size * cell_px
    resized_gray = gray.resize((target_size, target_size), resample=Image.LANCZOS)
    arr = np.array(resized_gray)
    
    # Background Image
    resized_color = original.resize((target_size, target_size), resample=Image.LANCZOS)
    enhancer = ImageEnhance.Brightness(resized_color)
    bg_display = enhancer.enhance(1.3)

    print(f"Scanning {size}x{size} maze...")

    # Initial Detection
    raw_grid = [[0 for _ in range(size)] for _ in range(size)]
    for row in range(size):
        for col in range(size):
            y1 = row * cell_px
            y2 = (row + 1) * cell_px
            x1 = col * cell_px
            x2 = (col + 1) * cell_px
            cell = arr[y1:y2, x1:x2]
            m = 8 
            thresh = WALL_SENSITIVITY
            val = 0
            if np.mean(cell[0:m, :]) < thresh: val |= 1
            if np.mean(cell[:, -m:]) < thresh: val |= 2
            if np.mean(cell[-m:, :]) < thresh: val |= 4
            if np.mean(cell[:, 0:m]) < thresh: val |= 8
            raw_grid[row][col] = val

    # Auto Correction
    final_grid = [[0 for _ in range(size)] for _ in range(size)]
    for r in range(size):
        for c in range(size):
            val = raw_grid[r][c]
            if r > 0 and (raw_grid[r-1][c] & 4): val |= 1
            if r < size - 1 and (raw_grid[r+1][c] & 1): val |= 4
            if c > 0 and (raw_grid[r][c-1] & 2): val |= 8
            if c < size - 1 and (raw_grid[r][c+1] & 8): val |= 2
            
            if r == 0: val |= 1
            if r == size - 1: val |= 4
            if c == 0: val |= 8
            if c == size - 1: val |= 2
            final_grid[r][c] = val

    # === Launch Editor ===
    print("Launching Editor...")
    
    def save_json(edited_grid, edited_goals):
        map_data = ""
        # Create Map Data (Assuming loader handles row-order or flips correctly)
        for row in range(size):
            for col in range(size):
                val = edited_grid[row][col]
                map_data += format(val, 'X')
        
        # --- FIX: Convert Coordinates to Bottom-Left Origin ---
        # Visual (Top-Left): Row 0 is Top
        # Logical (Bottom-Left): Y 0 is Bottom
        # Formula: Logical_Y = (Size - 1) - Visual_Row
        
        goal_list = []
        for (r, c) in edited_goals:
            logical_x = c
            logical_y = (size - 1) - r  # <--- Flip Y axis here
            goal_list.append(f"{logical_x},{logical_y}")

        out = {
            "version": "2.0",
            "width": size,
            "height": size,
            "mapData": map_data,
            "start": {"x": 0, "y": 0},
            "goals": goal_list
        }

        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(out, f, separators=(',', ':'))
            
        print(f"✅ Success! JSON saved to: {out_path}")
        print(f"   Goals (Corrected): {goal_list}")

    MazeEditor(final_grid, size, bg_display, cell_px, on_save=save_json)

if __name__ == "__main__":
    target_image = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_IMAGE_PATH
    auto_size, auto_output_path = get_maze_info_from_filename(target_image)
    convert_and_edit(target_image, auto_output_path, auto_size)