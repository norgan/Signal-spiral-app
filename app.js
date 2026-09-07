const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const TAU = Math.PI * 2;
const COLORS = ['#15c7ff', '#ffd54f', '#ff4fc3', '#9cff57', '#ff9d3d', '#a88cff'];

const canvas = document.getElementById('spiral');
const ctx = canvas.getContext('2d');

let mode = 'field';
let peopleCount = 2;
let primeCache = { limit: 0, list: [] };

const $ = (id) => document.getElementById(id);
const deg = (radians) => radians * 180 / Math.PI;
const mod = (value, modulus) => ((value % modulus) + modulus) % modulus;

function parseDob(value) {
  const [year, month, day] = String(value || '').split('-').map(Number);
  if (!year || !month || !day) throw new Error('Enter a valid date of birth.');
  return { year, month, day };
}

function profile(name, dob, colour) {
  const { year, month, day } = parseDob(dob);
  const n = year * month;
  return {
    name: (name || 'Person').trim() || 'Person',
    dob,
    year,
    month,
    day,
    n,
    dayMod: day,
    dayArm: n % day,
    monthMod: month,
    monthArm: n % month,
    colour
  };
}

function radius(index, geometry, scale) {
  return (geometry === 'linear' ? index : Math.sqrt(index)) * scale;
}

function point(index, geometry, scale, centre) {
  const r = radius(index, geometry, scale);
  const theta = index * GOLDEN_ANGLE;
  return { x: centre + r * Math.cos(theta), y: centre + r * Math.sin(theta), r, theta };
}

function scaleFor(maxIndex, geometry) {
  const basis = geometry === 'linear' ? Math.max(1, maxIndex) : Math.sqrt(Math.max(1, maxIndex));
  return canvas.width * 0.455 / basis;
}

function clear() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = 0;
  ctx.setLineDash([]);
}

function rgba(hex, alpha) {
  const h = hex.replace('#', '');
  const expanded = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  const n = parseInt(expanded, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function primes(limit) {
  if (primeCache.limit >= limit) return primeCache.list.filter((x) => x < limit);
  const sieve = new Uint8Array(limit + 1);
  sieve.fill(1, 2);
  for (let p = 2; p * p <= limit; p++) {
    if (!sieve[p]) continue;
    for (let k = p * p; k <= limit; k += p) sieve[k] = 0;
  }
  const list = [];
  for (let i = 2; i <= limit; i++) if (sieve[i]) list.push(i);
  primeCache = { limit, list };
  return list;
}

function baseField(maxIndex, limit, geometry, kind = 'full', alpha = 0.18) {
  const centre = canvas.width / 2;
  const count = Math.min(maxIndex, limit);
  const scale = scaleFor(maxIndex, geometry);
  ctx.fillStyle = kind === 'prime' ? 'rgba(21,199,255,.52)' : `rgba(55,72,90,${alpha})`;
  if (kind === 'prime') {
    for (const i of primes(count)) {
      const p = point(i, geometry, scale, centre);
      ctx.fillRect(p.x, p.y, 1.25, 1.25);
    }
  } else {
    for (let i = 0; i < count; i++) {
      const p = point(i, geometry, scale, centre);
      ctx.fillRect(p.x, p.y, 1, 1);
    }
  }
  return { centre, scale, count };
}

function recurrence(count, geometry, scale, centre) {
  [13, 21, 34, 55, 89, 144].forEach((step, layer) => {
    ctx.strokeStyle = `rgba(255,255,255,${0.032 + layer * 0.006})`;
    ctx.lineWidth = 0.38;
    for (let offset = 0; offset < Math.min(step, 12); offset++) {
      ctx.beginPath();
      let started = false;
      for (let i = offset; i < count; i += step * 18) {
        const p = point(i, geometry, scale, centre);
        if (!started) {
          ctx.moveTo(p.x, p.y);
          started = true;
        } else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
  });
}

function residue(modulus, arm, colour, maxIndex, geometry, scale, centre, size = 1.55, alpha = 0.72) {
  if (!modulus || modulus < 1) return;
  ctx.fillStyle = rgba(colour, alpha);
  for (let i = arm; i < maxIndex; i += modulus) {
    const p = point(i, geometry, scale, centre);
    ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
  }
}

function marker(person, geometry, scale, centre) {
  const q = point(person.n, geometry, scale, centre);
  ctx.strokeStyle = 'rgba(255,255,255,.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centre, centre);
  ctx.lineTo(q.x, q.y);
  ctx.stroke();
  ctx.save();
  ctx.shadowBlur = 18;
  ctx.shadowColor = person.colour;
  ctx.fillStyle = person.colour;
  ctx.beginPath();
  ctx.arc(q.x, q.y, 7, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = '13px Inter, system-ui, sans-serif';
  [person.name, `${String(person.day).padStart(2, '0')}/${String(person.month).padStart(2, '0')}/${person.year}`, `n = ${person.n.toLocaleString()}`]
    .forEach((text, i) => ctx.fillText(text, q.x + 10, q.y - 12 + i * 14));
  return q;
}

function big5(person) {
  const clamp = (x) => Math.max(0, Math.min(100, Math.round(x * 100) / 100));
  const n = person.n;
  const m = person.dayMod;
  const a = person.dayArm;
  return {
    Openness: clamp(70 + (m % 7) * 4 + (n % 13) * 0.5),
    Conscientiousness: clamp(60 + mod(m - a, m) * 3 - (n % 10)),
    Extraversion: clamp(50 - Math.abs(a - m / 2) * 5 + (n % 7)),
    Agreeableness: clamp(40 + (a % 5) * 6 - (n % 9)),
    Neuroticism: clamp(30 + ((a * 3) % 17) + 10000 / Math.max(1, n))
  };
}

function legacyIndex(person) {
  return person.n * person.dayArm / Math.max(1, person.dayMod);
}

function octaveFamily(person, low = 40, high = 4000) {
  const base = Math.abs(legacyIndex(person));
  if (!Number.isFinite(base) || base <= 0) return [];
  const values = [];
  for (let k = -14; k <= 14; k++) {
    const value = base * Math.pow(2, k);
    if (value >= low && value <= high) values.push(value);
  }
  return [...new Set(values.map((v) => Math.round(v * 1000) / 1000))].sort((a, b) => a - b);
}

function harmonic(person) {
  const dayDelta = mod(person.dayMod * GOLDEN_ANGLE, TAU);
  const monthDelta = mod(person.monthMod * GOLDEN_ANGLE, TAU);
  const returns = [];
  for (let k = 1; k <= 12; k++) {
    const angle = mod(k * person.dayMod * GOLDEN_ANGLE, TAU);
    const cycles = angle / TAU;
    returns.push({ k, angle, cycles, returnDistance: Math.min(cycles, 1 - cycles) });
  }
  returns.sort((a, b) => a.returnDistance - b.returnDistance);
  return { dayDelta, monthDelta, dayCycles: dayDelta / TAU, monthCycles: monthDelta / TAU, returns };
}

function gcd(a, b) { while (b) [a, b] = [b, a % b]; return Math.abs(a); }
function lcm(a, b) { return Math.abs(a * b) / gcd(a, b); }
function smallestAngle(angle) { const normal = mod(angle, TAU); return Math.min(normal, TAU - normal); }
function firstShared(a1, m1, a2, m2) {
  const period = lcm(m1, m2);
  for (let x = 0; x < period; x++) if (x % m1 === mod(a1, m1) && x % m2 === mod(a2, m2)) return x;
  return null;
}

function renderLegend(items) {
  $('legend').innerHTML = items.map((item) => `<span><i class="swatch" style="background:${item.colour}"></i>${esc(item.label)}</span>`).join('');
}
function metrics(items) {
  $('summary').innerHTML = items.map((item) => `<div class="metric"><span>${esc(item.label)}</span><strong>${esc(item.value)}</strong></div>`).join('');
}
function hideTables() { ['harmonicsSection', 'big5Section', 'relationshipSection'].forEach((id) => $(id).classList.add('hidden')); }

function renderHarmonics(people) {
  let html = '<tr><th>Person</th><th>Day fundamental</th><th>Month fundamental</th><th>Day cycles</th><th>Legacy index</th><th>Octave family</th><th>Closest returns</th></tr>';
  for (const person of people) {
    const h = harmonic(person);
    const octaves = octaveFamily(person);
    const returns = h.returns.slice(0, 4).map((r) => `${r.k}×: ${r.returnDistance.toFixed(6)}`).join('<br>');
    html += `<tr><td>${esc(person.name)}</td><td>${deg(h.dayDelta).toFixed(3)}°</td><td>${deg(h.monthDelta).toFixed(3)}°</td><td>${h.dayCycles.toFixed(6)}</td><td>${legacyIndex(person).toFixed(3)}</td><td>${octaves.length ? octaves.map((v) => v.toFixed(3)).join('<br>') : '—'}</td><td>${returns}</td></tr>`;
  }
  $('harmonicsTable').innerHTML = html;
  $('harmonicsSection').classList.remove('hidden');
}

function renderBig5(people) {
  let html = '<tr><th>Person</th><th>Openness</th><th>Conscientiousness</th><th>Extraversion</th><th>Agreeableness</th><th>Neuroticism</th></tr>';
  for (const person of people) {
    const b = big5(person);
    html += `<tr><td>${esc(person.name)}</td><td>${b.Openness}</td><td>${b.Conscientiousness}</td><td>${b.Extraversion}</td><td>${b.Agreeableness}</td><td>${b.Neuroticism}</td></tr>`;
  }
  $('big5Table').innerHTML = html;
  $('big5Section').classList.remove('hidden');
}

function renderRelationship(rows) {
  let html = '<tr><th>Pair</th><th>Angular sep.</th><th>Δr</th><th>Distance</th><th>gcd</th><th>lcm</th><th>Shared nodes</th><th>First shared</th><th>Beat angle</th></tr>';
  for (const r of rows) html += `<tr><td>${esc(r.pair)}</td><td>${r.angular}</td><td>${r.radial}</td><td>${r.distance}</td><td>${r.g}</td><td>${r.l}</td><td>${r.shared}</td><td>${r.first}</td><td>${r.beat}</td></tr>`;
  $('relationshipTable').innerHTML = html;
  $('relationshipSection').classList.remove('hidden');
}

function fieldMode() {
  mode = 'field'; clear(); hideTables();
  const count = Number($('fieldPoints').value), overlay = $('fieldOverlay').value, geometry = $('fieldGeometry').value;
  const centre = canvas.width / 2, scale = scaleFor(count, geometry);
  if (overlay === 'primes') {
    ctx.fillStyle = 'rgba(21,199,255,.85)';
    for (const i of primes(count)) { const p = point(i, geometry, scale, centre); ctx.fillRect(p.x, p.y, 1.45, 1.45); }
    renderLegend([{ label: 'Prime field', colour: '#15c7ff' }]);
  } else {
    ctx.fillStyle = 'rgba(21,199,255,.50)';
    for (let i = 0; i < count; i++) { const p = point(i, geometry, scale, centre); ctx.fillRect(p.x, p.y, 1, 1); }
    if (overlay === 'recurrence') recurrence(count, geometry, scale, centre);
    renderLegend([{ label: 'Signal field', colour: '#15c7ff' }, ...(overlay === 'recurrence' ? [{ label: 'Recursive resonance', colour: '#ffffff' }] : [])]);
  }
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(centre, centre, 3, 0, TAU); ctx.fill();
  metrics([{ label: 'Field points', value: count.toLocaleString() }, { label: 'Golden angle', value: '137.507764°' }, { label: 'Radius', value: geometry === 'sqrt' ? '√n — equal-area' : 'n — linear traversal' }]);
}

function individualMode() {
  mode = 'individual'; clear(); hideTables();
  try {
    const person = profile($('individualName').value, $('individualDob').value, COLORS[0]);
    const view = $('individualView').value, background = $('individualBackground').value, geometry = $('individualGeometry').value;
    const fieldPoints = Number($('individualPoints').value), maxIndex = Math.max(fieldPoints, person.n + 500);
    const centre = canvas.width / 2, scale = scaleFor(maxIndex, geometry);
    if (view === 'field' || view === 'overlay') baseField(maxIndex, fieldPoints, geometry, background, 0.16);
    if (view === 'arc' || view === 'overlay') {
      residue(person.monthMod, person.monthArm, COLORS[1], maxIndex, geometry, scale, centre, 1.15, 0.38);
      residue(person.dayMod, person.dayArm, person.colour, maxIndex, geometry, scale, centre, 1.7, 0.8);
      marker(person, geometry, scale, centre);
    }
    const legend = [];
    if (view !== 'field') legend.push({ label: `${person.dayMod}-field day arc`, colour: person.colour }, { label: `${person.monthMod}-field month anchor`, colour: COLORS[1] });
    if (view !== 'arc') legend.push({ label: `${background === 'prime' ? 'Prime' : 'Full'} consciousness field`, colour: '#4a5c70' });
    renderLegend(legend);
    const h = harmonic(person), octaves = octaveFamily(person);
    metrics([{ label: 'Traversal index', value: person.n.toLocaleString() }, { label: 'Day residue', value: `${person.dayArm} mod ${person.dayMod}` }, { label: 'Month residue', value: `${person.monthArm} mod ${person.monthMod}` }, { label: 'Day fundamental', value: `${deg(h.dayDelta).toFixed(3)}°` }, { label: 'Legacy harmonic index', value: legacyIndex(person).toFixed(3) }, { label: 'Octave family', value: octaves.length ? octaves.map((v) => v.toFixed(3)).join(' · ') : '—' }]);
    renderHarmonics([person]); renderBig5([person]);
  } catch (error) { metrics([{ label: 'Input needed', value: error.message }]); }
}

function relationshipMode() {
  mode = 'relationship'; clear(); hideTables();
  try {
    const people = collectPeople(), view = $('relationshipView').value, geometry = $('relationshipGeometry').value;
    const fieldPoints = Number($('relationshipPoints').value), maxIndex = Math.max(fieldPoints, ...people.map((p) => p.n + 800));
    const centre = canvas.width / 2, scale = scaleFor(maxIndex, geometry), points = [];
    if (view === 'field' || view === 'overlay') baseField(maxIndex, fieldPoints, geometry, 'full', 0.12);
    for (const person of people) {
      if (view === 'arcs' || view === 'overlay') { residue(person.dayMod, person.dayArm, person.colour, maxIndex, geometry, scale, centre, 1.5, 0.72); points.push(marker(person, geometry, scale, centre)); }
      else points.push(point(person.n, geometry, scale, centre));
    }
    if (view !== 'field') connections(points, $('relationshipConnections').value);
    renderLegend(view === 'field' ? [{ label: 'Shared consciousness field', colour: '#4a5c70' }] : people.map((p) => ({ label: `${p.name}: ${p.dayArm} mod ${p.dayMod}`, colour: p.colour })));
    const rows = [], cards = [];
    for (let i = 0; i < people.length; i++) for (let j = i + 1; j < people.length; j++) {
      const a = people[i], b = people[j], angular = smallestAngle(a.n * GOLDEN_ANGLE - b.n * GOLDEN_ANGLE), radial = Math.abs(Math.sqrt(a.n) - Math.sqrt(b.n));
      const dx = (points[i].x - points[j].x) / scale, dy = (points[i].y - points[j].y) / scale, distance = Math.hypot(dx, dy);
      const g = gcd(a.dayMod, b.dayMod), l = lcm(a.dayMod, b.dayMod), shared = mod(a.dayArm - b.dayArm, g) === 0;
      const first = shared ? firstShared(a.dayArm, a.dayMod, b.dayArm, b.dayMod) : null, beat = smallestAngle(harmonic(a).dayDelta - harmonic(b).dayDelta);
      rows.push({ pair: `${a.name} ↔ ${b.name}`, angular: `${deg(angular).toFixed(2)}°`, radial: radial.toFixed(3), distance: distance.toFixed(3), g, l, shared: shared ? 'Yes' : 'No', first: shared ? `${first} (every ${l})` : '—', beat: `${deg(beat).toFixed(2)}°` });
      cards.push({ label: `${a.name} ↔ ${b.name}`, value: `${deg(angular).toFixed(1)}° · Δr ${radial.toFixed(1)} · d ${distance.toFixed(1)}` });
    }
    metrics([{ label: 'People', value: String(people.length) }, { label: 'Max traversal', value: Math.max(...people.map((p) => p.n)).toLocaleString() }, { label: 'Geometry', value: geometry === 'sqrt' ? '√n — equal-area' : 'n — linear' }, ...cards]);
    renderHarmonics(people); renderBig5(people); renderRelationship(rows);
  } catch (error) { metrics([{ label: 'Input needed', value: error.message }]); }
}

function connections(points, type) {
  if (type === 'none') return;
  ctx.strokeStyle = 'rgba(255,255,255,.52)'; ctx.lineWidth = 1.15; ctx.setLineDash([6, 7]);
  if (type === 'polygon') { ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); ctx.stroke(); }
  else for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) { ctx.beginPath(); ctx.moveTo(points[i].x, points[i].y); ctx.lineTo(points[j].x, points[j].y); ctx.stroke(); }
  ctx.setLineDash([]);
}

function esc(value) { return String(value).replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }
function peopleDefaults() { return [{ name: 'Person 1', dob: '' }, { name: 'Person 2', dob: '' }]; }

function renderPeople() {
  const grid = $('peopleGrid');
  const existing = [...grid.querySelectorAll('.person')].map((card) => ({ name: card.querySelector('.name')?.value || '', dob: card.querySelector('.dob')?.value || '' }));
  const defaults = peopleDefaults();
  grid.innerHTML = '';
  for (let i = 0; i < peopleCount; i++) {
    const value = existing[i] || defaults[i] || { name: `Person ${i + 1}`, dob: '' };
    grid.insertAdjacentHTML('beforeend', `<div class="card person"><h3><i class="swatch" style="background:${COLORS[i]}"></i>Person ${i + 1}</h3><label>Name (optional)<input class="name" value="${esc(value.name)}" placeholder="Person ${i + 1}"></label><label>Date of birth<input class="dob" type="date" value="${esc(value.dob)}"></label></div>`);
  }
}

function collectPeople() { return [...document.querySelectorAll('.person')].map((card, i) => profile(card.querySelector('.name').value, card.querySelector('.dob').value, COLORS[i])); }

function activate(next) {
  mode = next;
  document.querySelectorAll('.mode').forEach((el) => el.classList.toggle('active', el.id === next));
  document.querySelectorAll('.tab').forEach((el) => el.classList.toggle('active', el.dataset.mode === next));
  if (next === 'field') { fieldMode(); return; }
  clear(); hideTables(); renderLegend([]);
  metrics([{ label: 'Ready', value: next === 'individual' ? 'Enter a date of birth, then generate a fingerprint.' : 'Enter dates of birth for at least two people, then generate the relationship field.' }]);
}

function share() {
  const params = new URLSearchParams({ mode });
  if (mode === 'individual' && $('individualDob').value) { if ($('individualName').value) params.set('name', $('individualName').value); params.set('dob', $('individualDob').value); }
  if (mode === 'relationship') {
    const people = [...document.querySelectorAll('.person')].map((card) => ({ name: card.querySelector('.name').value, dob: card.querySelector('.dob').value })).filter((p) => p.dob);
    if (people.length) params.set('people', JSON.stringify(people));
  }
  const url = `${location.origin}${location.pathname}?${params}`;
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(() => alert('Share link copied.')).catch(() => prompt('Copy this link:', url));
  else prompt('Copy this link:', url);
}

function download() { const link = document.createElement('a'); link.download = `signal-spiral-${mode}.png`; link.href = canvas.toDataURL('image/png'); link.click(); }

document.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', () => activate(button.dataset.mode)));
$('renderField').addEventListener('click', fieldMode);
$('renderIndividual').addEventListener('click', individualMode);
$('renderRelationship').addEventListener('click', relationshipMode);
$('addPerson').addEventListener('click', () => { if (peopleCount < 6) { peopleCount++; renderPeople(); } });
$('removePerson').addEventListener('click', () => { if (peopleCount > 2) { peopleCount--; renderPeople(); } });
$('downloadPng').addEventListener('click', download);
$('copyLink').addEventListener('click', share);

renderPeople();
const query = new URLSearchParams(location.search);
if (query.get('name')) $('individualName').value = query.get('name');
if (query.get('dob')) $('individualDob').value = query.get('dob');
if (query.get('people')) {
  try {
    const list = JSON.parse(query.get('people'));
    peopleCount = Math.max(2, Math.min(6, list.length));
    renderPeople();
    [...document.querySelectorAll('.person')].forEach((card, i) => { card.querySelector('.name').value = list[i]?.name || `Person ${i + 1}`; card.querySelector('.dob').value = list[i]?.dob || ''; });
  } catch (_) {}
}
const requestedMode = ['field', 'individual', 'relationship'].includes(query.get('mode')) ? query.get('mode') : 'field';
activate(requestedMode);
if (requestedMode === 'individual' && $('individualDob').value) individualMode();
if (requestedMode === 'relationship') {
  const validCount = [...document.querySelectorAll('.person .dob')].filter((input) => input.value).length;
  if (validCount >= 2) relationshipMode();
}