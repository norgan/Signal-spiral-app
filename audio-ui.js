// Signal Spiral audio presentation layer.
//
// Makes the historical legacy harmonic family the primary experimental sound
// surface while keeping the recovered 432-base mapping as a secondary historical
// experiment. This layer changes presentation only; harmonic formulas remain in
// app.js and harmonics432.js.

function audioClosest(values, target) {
  if (!values?.length) return null;
  return values.reduce((best, value) => Math.abs(value - target) < Math.abs(best - target) ? value : best, values[0]);
}

function audioBandPicks(values) {
  const sorted = [...new Set((values || []).map(Number).filter(Number.isFinite))].sort((a, b) => a - b);
  if (!sorted.length) return [];

  const targets = [110, 440, 1760];
  const labels = ['Low', 'Mid', 'High'];
  const picks = [];

  targets.forEach((target, i) => {
    const value = audioClosest(sorted, target);
    if (value == null || picks.some((pick) => Math.abs(pick.value - value) < 0.0005)) return;
    picks.push({ label: labels[i], value });
  });

  return picks;
}

function audioToneButton(value, label = null, extraClass = '') {
  const frequency = Number(value);
  if (!Number.isFinite(frequency) || frequency < 20 || frequency > 20000) {
    return `<span class="tone-unavailable" title="Outside browser playback range">${label ? `${esc(label)} · ` : ''}${Number.isFinite(frequency) ? `${frequency.toFixed(3)} Hz` : 'Unavailable'}</span>`;
  }

  const edge = frequency < 40 || frequency > 12000;
  const text = `${label ? `${label} · ` : ''}${frequency.toFixed(3)} Hz`;
  const title = edge
    ? 'Browser can generate this tone, but it may be difficult to hear on some ears, speakers or devices.'
    : `Play ${text}`;
  const classes = ['tone-button', extraClass, edge ? 'tone-edge' : ''].filter(Boolean).join(' ');
  return `<button type="button" class="${classes}" data-frequency="${frequency.toFixed(6)}" aria-label="Play ${esc(text)}" title="${esc(title)}">▶ ${esc(text)}${edge ? ' ⚠' : ''}</button>`;
}

function audioLegacyPrimary(person) {
  // Keep the primary legacy family in the comfortably audible range used by the
  // original interface. This is where the user-reported preferred tones live.
  const family = octaveFamily(person, 40, 4000);
  const picks = audioBandPicks(family);
  return {
    family,
    picks,
    primaryHtml: picks.length ? picks.map((pick) => audioToneButton(pick.value, pick.label, 'tone-primary')).join(' ') : '—',
    allHtml: family.length ? family.map((value) => audioToneButton(value)).join(' ') : '—'
  };
}

function audioHistorical432(person) {
  const base = typeof historic432 === 'function' ? historic432(person) : 432 * Math.abs(person.dayArm || 0);
  const family = typeof historic432Octaves === 'function'
    ? historic432Octaves(person, 20, 20000)
    : [];

  return {
    base,
    family,
    baseHtml: base > 0 ? audioToneButton(base, null, 'tone-secondary') : '0 Hz / phase-zero',
    familyHtml: family.length ? family.map((value) => audioToneButton(value, null, 'tone-secondary')).join(' ') : '—'
  };
}

renderHarmonics = function renderHarmonicsLegacyFirst(people) {
  let html = '<tr><th>Person</th><th>Legacy primary tones</th><th>Full legacy octave family</th><th>Geometric stride</th><th>Closest returns</th><th>Historical 432 experiment</th></tr>';

  for (const person of people) {
    const legacy = audioLegacyPrimary(person);
    const historical = audioHistorical432(person);
    const h = harmonic(person);
    const returns = h.returns.slice(0, 4).map((r) => `${r.k}×: ${r.returnDistance.toFixed(6)}`).join('<br>');

    html += `<tr>
      <td>${esc(person.name)}</td>
      <td class="tone-list tone-primary-list">${legacy.primaryHtml}<div class="fine">Chosen from the legacy octave family around low, mid and high listening bands.</div></td>
      <td class="tone-list"><details><summary>${legacy.family.length} legacy octave-equivalent tone${legacy.family.length === 1 ? '' : 's'}</summary><div class="tone-family">${legacy.allHtml}</div></details></td>
      <td>${deg(h.dayDelta).toFixed(3)}°<br><span class="fine">${h.dayCycles.toFixed(6)} cycles</span></td>
      <td>${returns}</td>
      <td><details><summary>${historical.base > 0 ? `${historical.base.toFixed(3)} Hz base` : 'phase-zero'}</summary><div class="tone-family"><div>${historical.baseHtml}</div><div class="fine">Historical 432 octave family. ⚠ marks frequencies that may be hard to hear on some ears or devices.</div>${historical.familyHtml}</div></details></td>
    </tr>`;
  }

  $('harmonicsTable').innerHTML = html;
  $('harmonicsSection').classList.remove('hidden');
};

// If this layer is loaded after a populated view was already rendered, redraw
// once so the legacy-first audio interface appears immediately.
try {
  const audioUiQuery = new URLSearchParams(location.search);
  if (mode === 'individual' && $('individualDob')?.value && typeof individualMode === 'function') individualMode();
  if (mode === 'relationship') {
    const valid = [...document.querySelectorAll('.person .dob')].filter((input) => input.value || input.dataset.privateDob).length;
    if (valid >= 2 && typeof relationshipMode === 'function') relationshipMode();
  }
} catch (_) {}
