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
harmonics432.js
tone-engine.js
```

`streamlit_app.py` and `requirements.txt` are retained for prototype provenance and are not part of the public production bundle.

The current `index.html` uses versioned asset URLs so a deployment can invalidate stale browser copies of earlier JavaScript.

## Relationship privacy

The application intentionally retains Name and DOB inputs for relationship calculations.

Relationship mode also provides an explicit choice between:

- showing entered names and dates;
- obfuscating personal details.

When obfuscation is enabled, the relationship display uses anonymous `Person N` labels, DOB controls are masked, and copied relationship links omit names and dates of birth.

Older relationship URLs may contain a `people=` query payload. The privacy layer treats legacy personal-data links conservatively unless full-detail display is explicitly selected.

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

If deploying through the Hestia file manager or another mechanism, replace all seven production files together. Do not update only `app.js`: `index.html`, the Arc v2 extension, relationship privacy layer, harmonic renderer and tone engine are designed to work as one static bundle.

## Verification

After deployment, verify that production is serving the current bundle:

```bash
curl -fsSL https://signalspiral.norgan.net/ | grep 'relationship-obfuscation.js'
curl -fsSL https://signalspiral.norgan.net/ | grep 'tone-engine.js'
curl -fsSL https://signalspiral.norgan.net/app.js | grep 'peopleDefaults'
```

The expected `peopleDefaults()` implementation contains generic `Person 1` / `Person 2` labels and blank DOBs. Personal data should never be embedded as application defaults.
