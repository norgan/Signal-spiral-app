// Historical Signal Spiral 432-base harmonic mapping.
//
// Recovered from the earlier experimental Signal Spiral work:
//   H = (month × year) mod day
//   f432 = 432 Hz × H
//
// In the current profile model H is exactly dayArm because
// n = year × month and dayArm = n mod day.
//
// This mapping is retained for provenance and experimentation only. It is not
// a clinical frequency, medical prescription, or evidence of therapeutic effect.

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

// Extend the existing harmonic table while leaving the core spiral geometry
// and legacy index untouched.
renderHarmonics = function renderHarmonicsWith432(people) {
  let html = '<tr><th>Person</th><th>Day fundamental</th><th>Month fundamental</th><th>Day cycles</th><th>Legacy index</th><th>Legacy audio mapping</th><th>432-base harmonic</th><th>432 octave family</th><th>Closest returns</th></tr>';

  for (const person of people) {
    const h = harmonic(person);
    const legacyOctaves = octaveFamily(person);
    const legacyTones = legacyOctaves.length ? legacyOctaves.map(toneButtonHtml).join(' ') : '—';
    const h432 = historic432(person);
    const h432Octaves = historic432Octaves(person);
    const tones432 = h432Octaves.length ? h432Octaves.map(toneButtonHtml).join(' ') : '—';
    const returns = h.returns.slice(0, 4).map((r) => `${r.k}×: ${r.returnDistance.toFixed(6)}`).join('<br>');

    html += `<tr>
      <td>${esc(person.name)}</td>
      <td>${deg(h.dayDelta).toFixed(3)}°</td>
      <td>${deg(h.monthDelta).toFixed(3)}°</td>
      <td>${h.dayCycles.toFixed(6)}</td>
      <td>${legacyIndex(person).toFixed(3)}</td>
      <td class="tone-list">${legacyTones}</td>
      <td>${h432 > 0 ? `${h432.toFixed(3)} Hz` : '0 Hz / phase-zero'}</td>
      <td class="tone-list">${tones432}</td>
      <td>${returns}</td>
    </tr>`;
  }

  $('harmonicsTable').innerHTML = html;
  $('harmonicsSection').classList.remove('hidden');
};
