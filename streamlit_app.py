""" Signal Spiral Personality & Resonance Application

Standalone Python GUI using tkinter and Matplotlib to:

Input DOB

Compute signal spiral parameters (n, mod, arm)

Derive Big Five traits

Plot and display the phyllotactic spiral

Download the spiral plot as PNG


Usage: python signal_spiral_app.py

Dependencies: numpy, matplotlib, tkinter """ import tkinter as tk from tkinter import ttk, filedialog, messagebox from datetime import datetime import math import numpy as np import matplotlib.pyplot as plt from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg

Golden angle constant for phyllotaxis

GOLDEN_ANGLE = math.pi * (3 - math.sqrt(5))

----- Signal Spiral Functions -----

def compute_signal_params(year: int, month: int, day: int): n = year * month mod = day arm = n % mod return {"n": n, "mod": mod, "arm": arm}

----- Big Five Mapping -----

def compute_big5(params: dict) -> dict: n, mod, arm = params['n'], params['mod'], params['arm'] openness = 70 + (mod % 7) * 4 + (n % 13) * 0.5 conscientiousness = 60 + ((mod - arm) % mod) * 3 - (n % 10) extraversion = 50 - abs(arm - (mod / 2)) * 5 + (n % 7) agreeableness = 40 + (arm % 5) * 6 - (n % 9) neuroticism = 30 + ((arm * 3) % 17) + (10000 / n) def clamp(x): return max(0, min(100, round(x, 2))) return { 'Openness': clamp(openness), 'Conscientiousness': clamp(conscientiousness), 'Extraversion': clamp(extraversion), 'Agreeableness': clamp(agreeableness), 'Neuroticism': clamp(neuroticism) }

----- Plotting -----

def create_spiral_figure(params: dict, max_n: int = None): n_val, mod, arm = params['n'], params['mod'], params['arm'] max_n = max_n or (n_val + 500) n = np.arange(max_n) theta = n * GOLDEN_ANGLE r = n.astype(float) x = r * np.cos(theta) y = r * np.sin(theta) classes = n % mod mask = classes == arm fig, ax = plt.subplots(figsize=(6, 6), facecolor='black') ax.set_facecolor('black') ax.scatter(x, y, s=0.3, c='#444', alpha=0.3) ax.scatter(x[mask], y[mask], s=0.5, c='#0cf', alpha=0.6) ax.scatter([x[n_val]], [y[n_val]], s=80, c='#0ff', edgecolor='white') ax.set_aspect('equal') ax.axis('off') ax.set_title(f"Spiral: n={n_val}, mod={mod}, arm={arm}", color='white') return fig

----- GUI Application -----

class SignalSpiralApp(tk.Tk): def init(self): super().init() self.title("Signal Spiral Personality App") self.configure(bg='black') self.create_widgets() self.spiral_fig = None

def create_widgets(self):
    frame = ttk.Frame(self)
    frame.pack(padx=10, pady=10)
    # DOB entry
    ttk.Label(frame, text="Date of Birth (YYYY-MM-DD):").grid(row=0, column=0, sticky='w')
    self.dob_var = tk.StringVar()
    ttk.Entry(frame, textvariable=self.dob_var, width=15).grid(row=0, column=1)
    # Buttons
    ttk.Button(frame, text="Compute & Plot", command=self.compute_and_plot).grid(row=1, column=0, pady=5)
    ttk.Button(frame, text="Save Plot as PNG", command=self.save_plot).grid(row=1, column=1, pady=5)
    # Big Five display
    self.big5_text = tk.Text(self, height=7, width=40, bg='black', fg='white')
    self.big5_text.pack(pady=5)
    # Canvas placeholder
    self.canvas_frame = ttk.Frame(self)
    self.canvas_frame.pack()

def compute_and_plot(self):
    dob_str = self.dob_var.get().strip()
    try:
        dob = datetime.strptime(dob_str, '%Y-%m-%d')
    except ValueError:
        messagebox.showerror("Invalid Date", "Please enter DOB as YYYY-MM-DD.")
        return
    params = compute_signal_params(dob.year, dob.month, dob.day)
    traits = compute_big5(params)
    # Display Big Five
    self.big5_text.delete('1.0', tk.END)
    self.big5_text.insert(tk.END, "Signal Params: " + str(params) + "\n")
    self.big5_text.insert(tk.END, "Big Five Traits:\n")
    for t, v in traits.items():
        self.big5_text.insert(tk.END, f"  {t}: {v}\n")
    # Plot spiral
    if self.spiral_fig:
        plt.close(self.spiral_fig)
    self.spiral_fig = create_spiral_figure(params)
    # Embed
    self.embed_figure()

def embed_figure(self):
    for widget in self.canvas_frame.winfo_children():
        widget.destroy()
    canvas = FigureCanvasTkAgg(self.spiral_fig, master=self.canvas_frame)
    canvas.draw()
    canvas.get_tk_widget().pack()

def save_plot(self):
    if not self.spiral_fig:
        messagebox.showwarning("No Plot", "Generate a plot before saving.")
        return
    file = filedialog.asksaveasfilename(defaultextension='.png', filetypes=[('PNG files','*.png')])
    if file:
        self.spiral_fig.savefig(file, facecolor='black')
        messagebox.showinfo("Saved", f"Plot saved to {file}")

if name == 'main': app = SignalSpiralApp() app.mainloop()

