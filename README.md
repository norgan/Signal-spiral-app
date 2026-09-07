# Signal Spiral

A static browser app for exploring the Signal Spiral recursive resonance field, individual date-seeded arcs, relationship geometry, harmonic structure, experimental sound mappings, and the original Big Five estimate mapping.

Live site: https://signalspiral.norgan.net/

## Modes

- **Entire Field** — golden-angle field with optional recursive/Fibonacci or prime overlays.
- **Individual** — show the shared field only, a personal arc only, or the personal arc over the full field.
- **Relationship** — overlay two to six people on the same field and calculate pairwise geometry, modular overlap and harmonic beat relationships.

No personal example names or dates are embedded in the public interface. Inputs are processed locally in the browser. The static app does not submit DOBs or names to a server. Share links can contain values a user chooses to share, so copied links should be reviewed before sending.

## Core geometry

For integer index `n`:

```text
golden_angle = π(3 − √5)
theta_n      = n × golden_angle
radius_n     = √n
x_n          = radius_n × cos(theta_n)
y_n          = radius_n × sin(theta_n)
```

The square-root radius produces an approximately equal-area field. An optional linear radius (`r = n`) is retained because it makes the individual modular arcs visually explicit.

The current date-seeded traversal is:

```text
n         = year × month
day_arm   = n mod day
month_arm = n mod month
```

The intrinsic angular fundamental for a modular field `m` is:

```text
Δθ_m = (m × golden_angle) mod 2π
```

## Experimental harmonics

The app deliberately preserves two historical sound mappings in addition to the intrinsic geometric harmonic.

### Legacy index

```text
f0 = (n × arm) / mod
```

Octave-equivalent values are produced by multiplying/dividing by powers of two until they fall inside the audible range. This is an experimental mapping, not a physical frequency derived from a measured biological oscillator.

### Recovered 432-base mapping

The earlier Signal Spiral sensory experiment used:

```text
H    = (year × month) mod day
f432 = 432 Hz × H
```

Because `n = year × month`, `H` is the same value as `day_arm` in the current model.

A recovered early private experiment had `H = 2`, giving **864 Hz**, and was followed by a report of immediate subjective pain reduction. That observation is preserved as provenance for the experiment only. It was uncontrolled, unblinded and anecdotal, and is not evidence that 864 Hz treats pain.

The app can play the displayed audible harmonic values as sine tones through the Web Audio API. Playback requires an explicit user click, only one tone plays at a time, and the volume control is capped low.

## Big Five mapping

The original prototype's Big Five estimate formula is retained for continuity. It is an exploratory deterministic mapping from the Signal Spiral parameters and is **not** a validated psychometric assessment.

## Relationship metrics

For each pair the app reports:

- angular separation;
- radial separation;
- Euclidean field distance;
- `gcd` and `lcm` of the day moduli;
- whether the residue classes share field nodes;
- the first shared node and recurrence interval;
- harmonic beat angle.

## Epistemic boundary

The golden-angle, modular, prime and geometric calculations are mathematics.

The consciousness-field framing, personality mapping, compatibility readings and sensory interpretations are exploratory philosophical models. Harmonic values and audio tones are not medical measurements, prescriptions or treatments. The app does not diagnose, predict or treat health conditions.

## Run locally

Open `index.html` directly, or:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Deployment

The repository includes a GitHub Pages workflow for the static app and a `CNAME` file for:

```text
signalspiral.norgan.net
```

GitHub Pages must be configured to use **GitHub Actions** as its source, and DNS for the custom domain must point to GitHub Pages.

## Canon

The theory, formula, applications and epistemic boundaries are mirrored in `norgan/organian-signal-corpus`:

```text
wiki/frameworks/signal-spiral-recursive-resonance-field.md
```

## Legacy prototype

`streamlit_app.py` is retained for provenance. It is not the canonical public interface.
