# Signal Spiral

A browser-based exploratory interface for the Signal Spiral recursive resonance field, birth-seeded individual arcs, lived traversal, relationship geometry, harmonic structure, experimental tone mappings, and the original Big Five estimate mapping.

Live site: https://signalspiral.norgan.net/

## Current interface

The canonical public interface is a static browser app. The production bundle is:

- `index.html`
- `styles.css`
- `app.js`
- `relationship-obfuscation.js`
- `arc-v2.js`
- `harmonics432.js`
- `tone-engine.js`

It runs entirely in the browser and requires no server-side runtime.

Modes:

- **Entire Field** — the shared golden-angle field, with optional recursive/Fibonacci or prime overlays.
- **Individual** — generate a candidate individual arc from a date of birth, distinguish the full candidate residue family from the lived traversal, choose an observation date, and optionally preview future arc nodes.
- **Relationship** — overlay two to six candidate arcs on the same field and calculate projected separation, modular intersection, recurrence period and stride-beat relationships.

## Arc Generator v2

Arc Generator v2 formalises the original purpose of the individual Signal Spiral: to suppose what an individual's arc might look like within the wider consciousness-field hypothesis.

For a birth date with year `Y`, month `M`, and day `D`, the original Signal Spiral seed is retained:

```text
n0 = Y × M
m  = D
a  = n0 mod m
```

The candidate individual arc is the ordered subsequence:

```text
n(k) = n0 + k × m,   k >= 0
```

Every node therefore remains in the same residue class:

```text
n(k) mod m = a
```

The app distinguishes:

- **candidate arc family** — the full residue class `a mod m` visible within the rendered field;
- **lived traversal** — the ordered nodes from `n0` through one node per completed birthday;
- **projected present position** — linear interpolation between the last completed-birthday node and the next candidate node according to progress through the current year of life.

The observation date can be changed, allowing the same candidate arc to be viewed at earlier or later stages. A future preview may also be drawn, but it is explicitly continuation of the hypothesis rather than lived trajectory.

For 29/12/1977:

```text
n0 = 1977 × 12 = 23724
m  = 29
a  = 23724 mod 29 = 2

n(k) = 23724 + 29k
```

As of 8 September 2026, 48 birthdays have been completed, so the completed-birthday traversal reaches:

```text
n(48) = 25116
```

The observation date is approximately 69.3% of the way from that node toward the next node under the current interpolation convention.

Arc Generator v2 is a designed hypothesis. The mathematics establishes the consequences of this mapping once chosen; it does not establish that a date of birth determines consciousness, personality, identity, fate, or behaviour.

## Relationship geometry

Multiple candidate arcs can be placed on the same field. The app currently calculates:

- projected angular separation at the selected observation date;
- projected radial separation;
- Euclidean separation in the canonical `sqrt(n)` field geometry;
- `gcd` and `lcm` of the two arc strides;
- whether the two residue-class candidate arcs have exact shared nodes;
- the next shared candidate node at or beyond the two current traversal nodes;
- the stride-beat angle induced by the difference between their modular strides.

Two candidate arcs `a1 mod m1` and `a2 mod m2` have exact shared nodes only when:

```text
a1 ≡ a2 (mod gcd(m1, m2))
```

When that condition holds, intersections recur every:

```text
lcm(m1, m2)
```

These are geometric or number-theoretic outputs. Compatibility meaning is not inferred by the mathematics.

## Relationship privacy

Relationship mode keeps Name and DOB inputs because those values are part of the chosen exploratory mapping. The user can choose how those details are displayed and shared.

The relationship privacy control provides:

- **Show entered names and dates** — normal local display and explicit full-detail sharing;
- **Obfuscate personal details** — render anonymous `Person N` labels, mask DOB controls, and omit names/DOBs from copied relationship links.

No personal example names or dates are embedded as application defaults. The base `peopleDefaults()` values are generic `Person 1` / `Person 2` labels with blank DOBs.

Older relationship URLs may contain a `people=` query payload. The privacy layer treats legacy personal-data links conservatively unless full-detail display is explicitly selected.

All entered data is processed locally in the browser. The static app does not submit names or DOBs to a server.

## Experimental harmonics and legacy mappings

The app reports the geometric stride angle:

```text
Delta_theta_m = (m × golden_angle) mod 2pi
```

It also retains the historical experimental harmonic index from the April 2025 prototype:

```text
f0 = (n0 × a) / m
```

and the recovered 432-base mapping:

```text
H    = (year × month) mod day
f432 = 432 Hz × H
```

Because `n0 = year × month` and `a = n0 mod day`, `H` is the same residue value as `a` in Arc Generator v2. Both harmonic systems and their octave families are deliberate experimental sound mappings, not physical measurements or therapeutic frequencies.

The original Big Five estimate formula is retained for provenance. It is not derived from Arc Generator v2 and is not a validated psychometric assessment.

### Historical 432-base observation

A historical private test case produced:

```text
H = 2
f432 = 864 Hz
```

The session was followed by a report of immediate subjective pain reduction. This is preserved as provenance for the experiment, not as evidence that 864 Hz treats pain. The observation was uncontrolled, unblinded and anecdotal.

## Tone generator

The harmonic table maps experimental harmonic values into audible sine tones using the Web Audio API.

- playback starts only after explicit user interaction;
- only one tone plays at a time;
- volume defaults low and is capped in the interface;
- a fixed 432 Hz test control verifies browser audio independently of profile calculations;
- the UI reports audio-context state and playback errors;
- tones can be stopped immediately.

These tones are experimental audio references only. They are not validated therapeutic frequencies and are not medical treatments.

## Epistemic boundary

The golden-angle, modular, prime and geometric calculations are mathematics.

The consciousness-field framing, the DOB-seeded candidate arc, personality mapping, compatibility readings and sensory interpretation are exploratory philosophical models. The app does not establish that the field is consciousness or that a birth date reveals an objectively real personal trajectory.

The intended discipline is:

```text
geometry first -> declared mapping -> observed consequence -> interpretation
```

## Mathematical basis

For integer index `n`:

```text
golden_angle = pi(3 - sqrt(5))
theta_n      = n × golden_angle
radius_n     = sqrt(n)
x_n          = radius_n × cos(theta_n)
y_n          = radius_n × sin(theta_n)
```

The square-root radius produces an approximately equal-area field. An optional linear radius (`r = n`) is retained to make individual traversal arcs more visually explicit.

Arc Generator v2 uses:

```text
n0   = year × month
m    = day
a    = n0 mod m
n(k) = n0 + k × m
```

The intrinsic modular angular fundamental for stride `m` is:

```text
Delta_theta_m = (m × golden_angle) mod 2pi
```

## Run locally

Open `index.html` directly, or serve the repository with any static web server:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Production deployment

The canonical production host is Nathan Organ's Hestia-managed web server. GitHub is the canonical source repository; GitHub Pages is not the production host.

Deploy the seven-file static bundle together:

```text
index.html
styles.css
app.js
relationship-obfuscation.js
arc-v2.js
harmonics432.js
tone-engine.js
```

Do not update only `app.js`, because the privacy, Arc v2, harmonic and tone layers are separate browser files loaded by `index.html`.

A generic rsync helper is provided:

```bash
export HESTIA_TARGET='user@server'
export HESTIA_WEBROOT='/home/user/web/signalspiral.norgan.net/public_html'
bash deploy-hestia.sh
```

Server details and credentials are intentionally not stored in the repository. See `DEPLOYMENT.md` for the deployment contract and verification commands.

## Canon

The canonical theory, formula, epistemic boundaries, applications, and harmonic-experiment provenance are recorded in `norgan/organian-signal-corpus`:

```text
wiki/frameworks/signal-spiral-recursive-resonance-field.md
wiki/frameworks/signal-spiral-harmonic-experiments.md
```

## Legacy Streamlit prototype

`streamlit_app.py` is the April 2025 prototype and is retained for provenance. It is not part of the canonical public deployment.
