# Signal Spiral

A browser-based interface for exploring the Signal Spiral recursive resonance field, individual date-based traversals, and relationship geometry.

Live site: https://signalspiral.norgan.net/

## Current interface

The canonical public interface is `index.html`. It runs entirely in the browser and requires no server-side runtime.

Modes:

- **Entire Field** — equal-area golden-angle phyllotaxis with optional Fibonacci recurrence overlays.
- **Individual** — day and month modular traversals with `year × month` as the marked traversal index.
- **Relationship** — overlays two to six individual traversals on the same field and reports objective geometric quantities such as angular separation, radial separation, and Euclidean distance.

The interface deliberately separates geometry from interpretation. It does not claim to measure consciousness, personality, compatibility, destiny, health, or moral character.

## Run locally

Open `index.html` directly, or serve the repository with any static web server:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Deployment

Deploy the repository root as a static site. The custom production domain is:

```text
https://signalspiral.norgan.net/
```

## Mathematical basis

For integer index `n`:

```text
golden_angle = π(3 − √5)
theta_n      = n × golden_angle
radius_n     = √n
x_n          = radius_n × cos(theta_n)
y_n          = radius_n × sin(theta_n)
```

The square-root radius produces an approximately equal-area point distribution. Modular and Fibonacci-separated subsequences reveal different recurrence structures within the same underlying field.

The canonical theory, formula, epistemic boundaries, and applications are recorded in `norgan/organian-signal-corpus`:

```text
wiki/frameworks/signal-spiral-recursive-resonance-field.md
```

## Legacy Streamlit prototype

`streamlit_app.py` is the earlier prototype and is retained for provenance. It is not the canonical public interface. Its personality and frequency mappings are experimental legacy code and should not be treated as validated inference.
