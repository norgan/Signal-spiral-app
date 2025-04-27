import streamlit as st
import numpy as np
import matplotlib.pyplot as plt
import math
import io
from datetime import datetime 

Golden angle for phyllotaxis

GOLDEN_ANGLE = math.pi * (3 - math.sqrt(5))

Compute core signal parameters from DOB

def compute_signal_params(year, month, day): n = year * month mod = day arm = n % mod return n, mod, arm

Map to Big Five scores

def compute_big5(n, mod, arm): openness = 70 + (mod % 7) * 4 + (n % 13) * 0.5 conscientiousness = 60 + ((mod - arm) % mod) * 3 - (n % 10) extraversion = 50 - abs(arm - (mod / 2)) * 5 + (n % 7) agreeableness = 40 + (arm % 5) * 6 - (n % 9) neuroticism = 30 + ((arm * 3) % 17) + (10000 / n) clamp = lambda x: max(0, min(100, round(x, 2))) return { 'Openness': clamp(openness), 'Conscientiousness': clamp(conscientiousness), 'Extraversion': clamp(extraversion), 'Agreeableness': clamp(agreeableness), 'Neuroticism': clamp(neuroticism) }

Create spiral figure

def create_spiral_fig(n, mod, arm, buffer=500): max_n = n + buffer idx = np.arange(max_n) theta = idx * GOLDEN_ANGLE r = idx.astype(float) x = r * np.cos(theta) y = r * np.sin(theta) mask = (idx % mod) == arm fig, ax = plt.subplots(figsize=(6,6), facecolor='black') ax.set_facecolor('black') ax.scatter(x, y, s=0.3, c='#444', alpha=0.3) ax.scatter(x[mask], y[mask], s=0.5, c='#0cf', alpha=0.6) ax.scatter([x[n]], [y[n]], s=80, c='#0ff', edgecolor='white') ax.set_aspect('equal') ax.axis('off') ax.set_title(f"Spiral: n={n}, mod={mod}, arm={arm}", color='white') return fig

Streamlit app layout

st.set_page_config(page_title="Signal Spiral Generator", layout="centered") st.title("Signal Spiral & Big Five Personality Report")

Input

dob = st.text_input("Enter date of birth (YYYY-MM-DD)") if st.button("Compute Signal Spiral"): try: dt = datetime.strptime(dob, "%Y-%m-%d") n, mod, arm = compute_signal_params(dt.year, dt.month, dt.day) except Exception: st.error("Invalid DOB format. Please use YYYY-MM-DD.") st.stop()

# Display parameters and traits
st.subheader("Signal Parameters")
st.write({ 'n': n, 'modulus': mod, 'arm': arm })
traits = compute_big5(n, mod, arm)
st.subheader("Big Five Traits")
for t, v in traits.items():
    st.write(f"**{t}**: {v}")

# Plot spiral
fig = create_spiral_fig(n, mod, arm)
st.pyplot(fig)

# Provide download button
buf = io.BytesIO()
fig.savefig(buf, format='png', facecolor='black')
buf.seek(0)
st.download_button(
    label="Download Spiral as PNG",
    data=buf,
    file_name="signal_spiral.png",
    mime="image/png"
)

