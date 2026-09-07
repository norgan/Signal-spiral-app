# Signal Spiral

A browser-based interface for exploring the Signal Spiral recursive resonance field, individual date-based traversals, relationship geometry, harmonic structure, experimental tone mappings, and the original Big Five estimate mapping.

Live site: https://signalspiral.norgan.net/

## Current interface

The canonical public interface is the static browser app:

- `index.html`
- `styles.css`
- `app.js`

It runs entirely in the browser and requires no server-side runtime.

Modes:

- **Entire Field** — the shared golden-angle field, with optional recursive/Fibonacci or prime overlays.
- **Individual** — choose the full field only, a DOB-seeded personal arc only, or the personal arc over the full field. The current DOB mapping uses `n = year × month`, with the day as the primary modular field and the month as the secondary anchor field.
- **Relationship** — overlay two to six people on the same field and calculate pairwise geometry, modular overlap and harmonic beat relationships.

The app also reports:

- geometric day and month fundamental angles;
- normalised harmonic cycles;
- closest phase returns;
- the historical experimental harmonic index `f0 = (n × arm) / mod`;
- its octave-equivalent family, retained for continuity with earlier Signal Spiral sensory experiments;
- a browser tone generator with a play/stop control beside each displayed audio-mapped octave equivalent;
- the original Big Five estimate mapping from the prototype;
- angular separation, radial separation, Euclidean distance, `gcd`, `lcm`, shared residue nodes, first shared node and pairwise harmonic beat angle.

## Privacy

No personal example names or dates are embedded in the public interface.

Dates and optional names entered into the app are processed locally in the browser by the static JavaScript application. The app does not submit them to a server. A user-generated share link can contain the values that user chooses to share, so copied links should be reviewed before distribution.

## Tone generator

The harmonic table can map the legacy octave-equivalent values into audible sine tones using the Web Audio API.

- only one tone plays at a time;
- playback starts only after an explicit user click;
- volume defaults low and is capped in the interface;
- tones can be stopped immediately with the Stop tone control.

These tones are experimental audio references only. They are not validated therapeutic frequencies and are not medical treatments.

## Epistemic boundary

The golden-angle, modular, prime and geometric calculations are mathematics.

The consciousness-field framing, personality mapping, compatibility readings and sensory interpretation are exploratory philosophical models. The Big Five mapping is not a validated psychometric assessment. Harmonic indices and octave families are not medical measurements, prescriptions or treatments.

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

The square-root radius produces an approximately equal-area field. An optional linear radius (`r = n`) is retained to make individual traversal arcs more visually explicit.

For the current DOB-seeded traversal:

```text
n         = year × month
day_arm   = n mod day
month_arm = n mod month
```

The intrinsic modular angular fundamental for modulus `m` is:

```text
Δθ_m = (m × golden_angle) mod 2π
```

The earlier experimental harmonic index is preserved separately:

```text
f0 = (n × arm) / mod
```

It is intentionally labelled as a legacy experimental index rather than a physical frequency measurement. Audio playback uses octave-equivalent values derived from this index as a deliberate sound mapping.

The canonical theory, formula, epistemic boundaries, and applications are recorded in `norgan/organian-signal-corpus`:

```text
wiki/frameworks/signal-spiral-recursive-resonance-field.md
```

## Legacy Streamlit prototype

`streamlit_app.py` is the earlier prototype and is retained for provenance. It is not the canonical public interface.
