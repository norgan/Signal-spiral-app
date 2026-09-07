// Recovered historical Signal Spiral sound mapping.
//
// H = (year × month) mod day
// f432 = 432 Hz × H
//
// Because the current profile uses n = year × month and dayArm = n mod day,
// H is exactly dayArm. This is preserved as experimental provenance only.
// It is not a validated medical frequency, diagnosis, prescription or treatment.

function historic432(person) {
  return 432 * Math.abs(person.dayArm);
}

function historic432Octaves(person, low = 20, high = 20000) {
  const base = historic432(person);
  if (!Number.isFinite(base) || base <= 0) return [];
  const values = [];
  for (let k = -14; k <= 14; k++) {
    const value = base * Math.pow(2, k);
    if (value >= low && value <= high) values.push(value);
  }
  return [...new Set(values.map((v) => Math.round(v * 1000) / 1000))].sort((a, b) => a - b);
}

renderHarmonics = function renderHarmonicsWithHistoric432(people) {
  let html = '<tr><th>Person</th><th>Geometric fundamental</th><th>Day cycles</th><th>432-base harmonic</th><th>432 octave family</th><th>Legacy index</th><th>Legacy octave family</th><th>Closest returns</th></tr>';

  for (const person of people) {
    const h = harmonic(person);
    const h432 = historic432(person);
    const h432Octaves = historic432Octaves(person);
    const legacy = legacyIndex(person);
    const legacyOctaves = octaveFamily(person);
    const returns = h.returns.slice(0, 4).map((r) => `${r.k}×: ${r.returnDistance.toFixed(6)}`).join('<br>');

    const h432Tone = h432 > 0 ? toneButtonHtml(h432) : '0 Hz / phase-zero';
    const h432Family = h432Octaves.length ? h432Octaves.map(toneButtonHtml).join(' ') : '—';
    const legacyFamily = legacyOctaves.length ? legacyOctaves.map(toneButtonHtml).join(' ') : '—';

    html += `<tr>
      <td>${esc(person.name)}</td>
      <td>${deg(h.dayDelta).toFixed(3)}°</td>
      <td>${h.dayCycles.toFixed(6)}</td>
      <td class="tone-list">${h432Tone}</td>
      <td class="tone-list">${h432Family}</td>
      <td>${legacy.toFixed(3)}</td>
      <td class="tone-list">${legacyFamily}</td>
      <td>${returns}</td>
    </tr>`;
  }

  $('harmonicsTable').innerHTML = html;
  $('harmonicsSection').classList.remove('hidden');
};
