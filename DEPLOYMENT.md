# Signal Spiral deployment

## Canonical production host

`https://signalspiral.norgan.net/` is served from Nathan Organ's Hestia-managed web server.

GitHub is the canonical source repository. GitHub Pages is not the production host.

The intended flow is:

```text
GitHub main -> explicit static bundle -> Hestia public_html -> signalspiral.norgan.net
```

## Production bundle

Only the browser application files below are required in the Hestia document root:

```text
index.html
styles.css
app.js
relationship-obfuscation.js
arc-v2.js
arc-visual-semantics.js
harmonics432.js
audio-ui.js
tone-engine.js
```

`streamlit_app.py` and `requirements.txt` are retained for prototype provenance and are not part of the public production bundle.

The current browser runtime uses versioned or dynamically versioned asset URLs so a deployment can invalidate stale browser copies of earlier JavaScript.

## Relationship privacy

The application intentionally retains Name and DOB inputs for relationship calculations.

Relationship mode also provides an explicit choice between:

- showing entered names and dates;
- obfuscating personal details.

When obfuscation is enabled, the relationship display uses anonymous `Person N` labels, DOB controls are masked, and copied relationship links omit names and dates of birth.

Older relationship URLs may contain a `people=` query payload. The privacy layer treats legacy personal-data links conservatively unless full-detail display is explicitly selected.

## Audio layers

The audio runtime is split across three files:

- `harmonics432.js` preserves the historical 432-base experiment;
- `audio-ui.js` presents the legacy harmonic family as the primary listening surface and keeps 432 as a secondary historical experiment;
- `tone-engine.js` handles browser playback, state recovery, diagnostics, volume and output limits.

The primary legacy tones are selected from the 40-4000 Hz octave family. Historical 432 octave equivalents may extend nearer the edges of the nominal audible range; the UI flags tones below 40 Hz or above 12 kHz because they may be difficult to hear on some ears, speakers or devices even when the browser is generating them correctly.

## Deploy with rsync

The repository includes `deploy-hestia.sh`. It deploys only the production bundle and requires the destination to be supplied through environment variables so server details and credentials are never committed.

Example:

```bash
export HESTIA_TARGET='user@server'
export HESTIA_WEBROOT='/home/user/web/signalspiral.norgan.net/public_html'
./deploy-hestia.sh
```

The script does not delete unrelated files from the destination.

## Manual deployment

If deploying through the Hestia file manager or another mechanism, replace all nine production files together. Do not update only `app.js`: `index.html`, Arc v2, the visual-semantics layer, relationship privacy layer, harmonic renderers, audio UI and tone engine are designed to work as one static bundle.

## Verification

After deployment, verify that production is serving the current bundle:

```bash
curl -fsSL https://signalspiral.norgan.net/ | grep 'relationship-obfuscation.js'
curl -fsSL https://signalspiral.norgan.net/ | grep 'tone-engine.js'
curl -fsSL https://signalspiral.norgan.net/app.js | grep 'peopleDefaults'
curl -fsSL -I https://signalspiral.norgan.net/audio-ui.js
curl -fsSL -I https://signalspiral.norgan.net/arc-visual-semantics.js
```

The expected `peopleDefaults()` implementation contains generic `Person 1` / `Person 2` labels and blank DOBs. Personal data should never be embedded as application defaults.
