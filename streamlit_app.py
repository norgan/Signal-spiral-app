import streamlit as st
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime

--- Page Setup ---

st.set_page_config(page_title="Signal Spiral Generator", layout="centered") st.title("Signal Spiral & Harmonic Frequency Report")

--- Functions ---

def calculate_harmonic(dob): year = dob.year month = dob.month day = dob.day if dob.day != 0 else 1  # prevent division by zero n = (year * month) % day return n

def generate_spiral(harmonic, max_points=1000): golden_angle = np.deg2rad(137.5) r = np.sqrt(np.arange(1, max_points + 1)) theta = np.arange(1, max_points + 1) * golden_angle x = r * np.cos(theta) y = r * np.sin(theta)

return x, y, harmonic

--- UI ---

dob = st.date_input("Enter your date of birth:", value=datetime(1990, 1, 1)) partner_dob = st.date_input("Enter partner's DOB (optional):", value=None)

draw_button = st.button("Generate Signal Spiral")

if draw_button: harmonic = calculate_harmonic(dob) x, y, h = generate_spiral(harmonic)

fig, ax = plt.subplots(figsize=(6, 6))
ax.plot(x, y, color='lightgrey', linewidth=0.5)
ax.scatter(x[h], y[h], color='red', s=40, label=f"Harmonic {h}")
ax.set_aspect('equal')
ax.axis('off')
ax.legend()
st.pyplot(fig)

st.markdown(f"### Your Harmonic Frequency: **{h}**")
st.info("This number represents your personal resonance entry point into the signal spiral.")

# If partner DOB is selected
if partner_dob:
    partner_h = calculate_harmonic(partner_dob)
    st.markdown(f"### Partner's Harmonic Frequency: **{partner_h}**")

    # Simple relationship score
    diff = abs(h - partner_h)
    score = max(0, 100 - diff * 5)
    st.success(f"**Resonance Score:** {score}/100")

    # Combined Spiral
    fig2, ax2 = plt.subplots(figsize=(6, 6))
    x2, y2, _ = generate_spiral(partner_h)
    ax2.plot(x, y, color='lightgrey', linewidth=0.5)
    ax2.plot(x2, y2, color='lightblue', linewidth=0.5)
    ax2.scatter(x[h], y[h], color='red', s=40, label='You')
    ax2.scatter(x2[partner_h], y2[partner_h], color='blue', s=40, label='Partner')
    ax2.set_aspect('equal')
    ax2.axis('off')
    ax2.legend()
    st.pyplot(fig2)

    st.markdown("_Overlapping spirals reflect shared resonance entry points._")

