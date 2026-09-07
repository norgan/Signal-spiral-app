// Arc Generator v2
//
// Formalises the original Signal Spiral individual-arc hypothesis without
// changing the underlying golden-angle field or the historical harmonic work.
//
// Birth seed:      n0 = year × month
// Arc stride:      m  = day
// Candidate arc:   n(k) = n0 + k·m
// Candidate class: n(k) mod m = n0 mod m
//
// One traversal node is advanced per completed birthday. Progress through the
// current year of life is shown by interpolation between the last completed
// birthday node and the next candidate node. This is an exploratory mapping,
// not a claim that date of birth determines consciousness or identity.

function v2IsoToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function v2IsLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function v2DaysInMonth(year, month) {
  return [31, v2IsLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] || 0;
}

function v2ParseDate(value, label = 'date') {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) throw new Error(`Enter a valid ${label}.`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > v2DaysInMonth(year, month)) {
    throw new Error(`Enter a valid ${label}.`);
  }
  return { year, month, day };
}

function v2Ordinal(parts) {
  const { year, month, day } = parts;
  const y = year - 1;
  const beforeYear = 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400);
  const monthOffsets = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const leap = v2IsLeapYear(year) && month > 2 ? 1 : 0;
  return beforeYear + monthOffsets[month - 1] + leap + day;
}

function v2CompareDates(a, b) {
  return v2Ordinal(a) - v2Ordinal(b);
}

function v2Anniversary(birth, year) {
  return {
    year,
    month: birth.month,
    day: Math.min(birth.day, v2DaysInMonth(year, birth.month))
  };
}

function v2FormatDate(parts) {
  return `${String(parts.day).padStart(2, '0')}/${String(parts.month).padStart(2, '0')}/${parts.year}`;
}

function v2LifeProgress(birth, observation) {
  if (v2CompareDates(observation, birth) < 0) {
    throw new Error('The observation date cannot be before the date of birth.');
  }

  let completedYears = observation.year - birth.year;
  let last = v2Anniversary(birth, birth.year + completedYears);
  if (v2CompareDates(observation, last) < 0) {
    completedYears -= 1;
    last = v2Anniversary(birth, birth.year + completedYears);
  }

  const next = v2Anniversary(birth, birth.year + completedYears + 1);
  const span = Math.max(1, v2Ordinal(next) - v2Ordinal(last));
  const elapsed = Math.max(0, v2Ordinal(observation) - v2Ordinal(last));

  return {
    completedYears,
    fraction: Math.max(0, Math.min(1, elapsed / span)),
    ageDays: v2Ordinal(observation) - v2Ordinal(birth),
    last,
    next
  };
}

function v2Profile(name, dob, colour, observationValue) {
  const birth = v2ParseDate(dob, 'date of birth');
  const observation = v2ParseDate(observationValue || v2IsoToday(), 'observation date');
  const life = v2LifeProgress(birth, observation);
  const birthIndex = birth.year * birth.month;
  const arcMod = birth.day;
  const arcArm = mod(birthIndex, arcMod);
  const currentIndex = birthIndex + life.completedYears * arcMod;
  const nextIndex = currentIndex + arcMod;

  return {
    name: (name || 'Person').trim() || 'Person',
    dob,
    colour,
    year: birth.year,
    month: birth.month,
    day: birth.day,
    birth,
    observation,
    birthIndex,
    arcMod,
    arcArm,
    currentIndex,
    nextIndex,
    completedYears: life.completedYears,
    yearProgress: life.fraction,
    ageDays: life.ageDays,
    lastAnniversary: life.last,
    nextAnniversary: life.next,

    // Compatibility with the original harmonic and Big Five prototype code.
    n: birthIndex,
    dayMod: arcMod,
    dayArm: arcArm,
    monthMod: birth.month,
    monthArm: 0
  };
}

function v2ArcIndices(person, futureNodes = 0) {
  const indices = [];
  const end = person.completedYears + Math.max(0, futureNodes);
  for (let k = 0; k <= end; k++) indices.push(person.birthIndex + k * person.arcMod);
  return indices;
}

function v2StrokeArc(indices, colour, geometry, scale, centre, alpha, width, dashed = false) {
  if (!indices.length) return;
  ctx.save();
  ctx.strokeStyle = rgba(colour, alpha);
  ctx.lineWidth = width;
  if (dashed) ctx.setLineDash([5, 6]);
  ctx.beginPath();
  indices.forEach((index, i) => {
    const p = point(index, geometry, scale, centre);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = rgba(colour, Math.min(1, alpha + 0.08));
  const dot = width > 1.4 ? 2.4 : 1.8;
  for (const index of indices) {
    const p = point(index, geometry, scale, centre);
    ctx.beginPath();
    ctx.arc(p.x, p.y, dot, 0, TAU);
    ctx.fill();
  }
}

function v2ProjectedPosition(person, geometry, scale = 1, centre = 0) {
  const a = point(person.currentIndex, geometry, scale, centre);
  const b = point(person.nextIndex, geometry, scale, centre);
  const f = person.yearProgress;
  const x = a.x + (b.x - a.x) * f;
  const y = a.y + (b.y - a.y) * f;
  const dx = x - centre;
  const dy = y - centre;
  return { x, y, r: Math.hypot(dx, dy), theta: Math.atan2(dy, dx), fraction: f };
}

function v2DrawMarkers(person, geometry, scale, centre) {
  const birth = point(person.birthIndex, geometry, scale, centre);
  const currentNode = point(person.currentIndex, geometry, scale, centre);
  const projected = v2ProjectedPosition(person, geometry, scale, centre);

  ctx.save();
  ctx.strokeStyle = rgba(person.colour, 0.95);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(birth.x, birth.y, 6, 0, TAU);
  ctx.stroke();

  ctx.shadowBlur = 18;
  ctx.shadowColor = person.colour;
  ctx.fillStyle = person.colour;
  ctx.beginPath();
  ctx.arc(projected.x, projected.y, 7, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = 'rgba(255,255,255,.72)';
  ctx.beginPath();
  ctx.arc(currentNode.x, currentNode.y, 3, 0, TAU);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = '13px Inter, system-ui, sans-serif';
  [person.name, `birth n₀ = ${person.birthIndex.toLocaleString()}`, `as at ${v2FormatDate(person.observation)}`]
    .forEach((text, i) => ctx.fillText(text, projected.x + 10, projected.y - 12 + i * 14));

  return { birth, currentNode, projected };
}

function v2SharedNodeAtOrAfter(a, b, minimum) {
  const g = gcd(a.arcMod, b.arcMod);
  if (mod(a.arcArm - b.arcArm, g) !== 0) return null;
  const base = firstShared(a.arcArm, a.arcMod, b.arcArm, b.arcMod);
  if (base === null) return null;
  const period = lcm(a.arcMod, b.arcMod);
  const floor = Math.max(minimum, a.birthIndex, b.birthIndex);
  if (base >= floor) return base;
  return base + Math.ceil((floor - base) / period) * period;
}

function v2RenderRelationship(rows) {
  let html = '<tr><th>Pair</th><th>Projected angle sep.</th><th>Δr</th><th>Projected distance</th><th>gcd</th><th>lcm</th><th>Shared candidate arc</th><th>Next shared node</th><th>Stride beat</th></tr>';
  for (const r of rows) {
    html += `<tr><td>${esc(r.pair)}</td><td>${r.angular}</td><td>${r.radial}</td><td>${r.distance}</td><td>${r.g}</td><td>${r.l}</td><td>${r.shared}</td><td>${r.nextShared}</td><td>${r.beat}</td></tr>`;
  }
  $('relationshipTable').innerHTML = html;
  $('relationshipSection').classList.remove('hidden');
}

function individualModeV2() {
  mode = 'individual';
  clear();
  hideTables();

  try {
    const person = v2Profile(
      $('individualName').value,
      $('individualDob').value,
      COLORS[0],
      $('individualAsAt').value || v2IsoToday()
    );
    const view = $('individualView').value;
    const background = $('individualBackground').value;
    const geometry = $('individualGeometry').value;
    const fieldPoints = Number($('individualPoints').value);
    const futureNodes = Number($('individualFuture').value);
    const maxIndex = Math.max(fieldPoints, person.nextIndex + futureNodes * person.arcMod + 500);
    const centre = canvas.width / 2;
    const scale = scaleFor(maxIndex, geometry);

    if (view === 'field' || view === 'overlay') {
      baseField(maxIndex, fieldPoints, geometry, background, 0.16);
    }

    if (view === 'arc' || view === 'overlay') {
      // The whole residue family is the candidate arc. The bright segment is
      // the hypothesised lived traversal from the birth seed.
      residue(person.arcMod, person.arcArm, person.colour, maxIndex, geometry, scale, centre, 1.1, 0.20);
      v2StrokeArc(v2ArcIndices(person), person.colour, geometry, scale, centre, 0.92, 1.8, false);

      if (futureNodes > 0) {
        const future = [];
        for (let k = person.completedYears; k <= person.completedYears + futureNodes; k++) {
          future.push(person.birthIndex + k * person.arcMod);
        }
        v2StrokeArc(future, person.colour, geometry, scale, centre, 0.38, 1.15, true);
      }

      v2DrawMarkers(person, geometry, scale, centre);
    }

    const legend = [];
    if (view !== 'field') {
      legend.push(
        { label: `${person.name}: candidate arc ${person.arcArm} mod ${person.arcMod}`, colour: person.colour },
        { label: `${person.name}: lived traversal`, colour: '#ffffff' }
      );
    }
    if (view !== 'arc') {
      legend.push({ label: `${background === 'prime' ? 'Prime' : 'Full'} consciousness field`, colour: '#4a5c70' });
    }
    renderLegend(legend);

    const h = harmonic(person);
    const octaves = octaveFamily(person);
    metrics([
      { label: 'Birth seed n₀', value: person.birthIndex.toLocaleString() },
      { label: 'Arc rule', value: `n(k) = ${person.birthIndex} + k×${person.arcMod}` },
      { label: 'Candidate residue', value: `${person.arcArm} mod ${person.arcMod}` },
      { label: 'Completed traversal nodes', value: String(person.completedYears) },
      { label: 'Current completed node', value: person.currentIndex.toLocaleString() },
      { label: 'Progress to next node', value: `${(person.yearProgress * 100).toFixed(1)}%` },
      { label: 'Arc stride angle', value: `${deg(h.dayDelta).toFixed(3)}°` },
      { label: 'Legacy harmonic index', value: legacyIndex(person).toFixed(3) },
      { label: 'Legacy octave family', value: octaves.length ? octaves.map((v) => `${v.toFixed(3)} Hz`).join(' · ') : '—' }
    ]);

    renderHarmonics([person]);
    renderBig5([person]);
  } catch (error) {
    metrics([{ label: 'Input needed', value: error.message }]);
  }
}

function v2CollectPeople(observationValue) {
  return [...document.querySelectorAll('.person')].map((card, i) => v2Profile(
    card.querySelector('.name').value,
    card.querySelector('.dob').value,
    COLORS[i],
    observationValue
  ));
}

function relationshipModeV2() {
  mode = 'relationship';
  clear();
  hideTables();

  try {
    const observationValue = $('relationshipAsAt').value || v2IsoToday();
    const people = v2CollectPeople(observationValue);
    const view = $('relationshipView').value;
    const geometry = $('relationshipGeometry').value;
    const fieldPoints = Number($('relationshipPoints').value);
    const futureNodes = Number($('relationshipFuture').value);
    const maxIndex = Math.max(fieldPoints, ...people.map((p) => p.nextIndex + futureNodes * p.arcMod + 800));
    const centre = canvas.width / 2;
    const scale = scaleFor(maxIndex, geometry);
    const positions = [];

    if (view === 'field' || view === 'overlay') {
      baseField(maxIndex, fieldPoints, geometry, 'full', 0.12);
    }

    for (const person of people) {
      if (view === 'arcs' || view === 'overlay') {
        residue(person.arcMod, person.arcArm, person.colour, maxIndex, geometry, scale, centre, 1.0, 0.13);
        v2StrokeArc(v2ArcIndices(person), person.colour, geometry, scale, centre, 0.82, 1.5, false);

        if (futureNodes > 0) {
          const future = [];
          for (let k = person.completedYears; k <= person.completedYears + futureNodes; k++) {
            future.push(person.birthIndex + k * person.arcMod);
          }
          v2StrokeArc(future, person.colour, geometry, scale, centre, 0.25, 1.0, true);
        }

        positions.push(v2DrawMarkers(person, geometry, scale, centre).projected);
      } else {
        positions.push(v2ProjectedPosition(person, geometry, scale, centre));
      }
    }

    if (view !== 'field') connections(positions, $('relationshipConnections').value);
    renderLegend(view === 'field'
      ? [{ label: 'Shared consciousness field', colour: '#4a5c70' }]
      : people.map((p) => ({ label: `${p.name}: n = ${p.birthIndex} + k×${p.arcMod}`, colour: p.colour })));

    const rows = [];
    const cards = [];
    for (let i = 0; i < people.length; i++) {
      for (let j = i + 1; j < people.length; j++) {
        const a = people[i];
        const b = people[j];
        const pa = v2ProjectedPosition(a, 'sqrt', 1, 0);
        const pb = v2ProjectedPosition(b, 'sqrt', 1, 0);
        const angular = smallestAngle(pa.theta - pb.theta);
        const radial = Math.abs(pa.r - pb.r);
        const distance = Math.hypot(pa.x - pb.x, pa.y - pb.y);
        const g = gcd(a.arcMod, b.arcMod);
        const l = lcm(a.arcMod, b.arcMod);
        const shared = mod(a.arcArm - b.arcArm, g) === 0;
        const minimum = Math.max(a.currentIndex, b.currentIndex);
        const nextShared = v2SharedNodeAtOrAfter(a, b, minimum);
        const beat = smallestAngle((a.arcMod - b.arcMod) * GOLDEN_ANGLE);

        rows.push({
          pair: `${a.name} ↔ ${b.name}`,
          angular: `${deg(angular).toFixed(2)}°`,
          radial: radial.toFixed(3),
          distance: distance.toFixed(3),
          g,
          l,
          shared: shared ? 'Yes' : 'No',
          nextShared: nextShared === null ? '—' : `${nextShared} (period ${l})`,
          beat: `${deg(beat).toFixed(2)}°`
        });
        cards.push({
          label: `${a.name} ↔ ${b.name}`,
          value: `${deg(angular).toFixed(1)}° · Δr ${radial.toFixed(2)} · d ${distance.toFixed(2)}`
        });
      }
    }

    metrics([
      { label: 'People', value: String(people.length) },
      { label: 'Observation date', value: v2FormatDate(v2ParseDate(observationValue, 'observation date')) },
      { label: 'Arc model', value: 'v2 — birth seed + day stride + lived annual traversal' },
      { label: 'Geometry', value: geometry === 'sqrt' ? '√n — equal-area' : 'n — linear' },
      ...cards
    ]);

    renderHarmonics(people);
    renderBig5(people);
    v2RenderRelationship(rows);
  } catch (error) {
    metrics([{ label: 'Input needed', value: error.message }]);
  }
}

function shareV2() {
  const params = new URLSearchParams({ mode });
  if (mode === 'individual' && $('individualDob').value) {
    if ($('individualName').value) params.set('name', $('individualName').value);
    params.set('dob', $('individualDob').value);
    params.set('asat', $('individualAsAt').value || v2IsoToday());
    params.set('future', $('individualFuture').value);
  }
  if (mode === 'relationship') {
    const people = [...document.querySelectorAll('.person')]
      .map((card) => ({ name: card.querySelector('.name').value, dob: card.querySelector('.dob').value }))
      .filter((person) => person.dob);
    if (people.length) params.set('people', JSON.stringify(people));
    params.set('asat', $('relationshipAsAt').value || v2IsoToday());
    params.set('future', $('relationshipFuture').value);
  }

  const url = `${location.origin}${location.pathname}?${params}`;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(url)
      .then(() => alert('Share link copied.'))
      .catch(() => prompt('Copy this link:', url));
  } else {
    prompt('Copy this link:', url);
  }
}

// Replace the mode functions for calls made after this script loads.
individualMode = individualModeV2;
relationshipMode = relationshipModeV2;
share = shareV2;

// app.js registered direct click-function references before this extension was
// loaded. Capture-phase handlers prevent the old direct listeners from also
// firing while preserving the original static app architecture.
$('renderIndividual').addEventListener('click', (event) => {
  event.stopImmediatePropagation();
  individualModeV2();
}, true);

$('renderRelationship').addEventListener('click', (event) => {
  event.stopImmediatePropagation();
  relationshipModeV2();
}, true);

$('copyLink').addEventListener('click', (event) => {
  event.stopImmediatePropagation();
  shareV2();
}, true);

$('individualAsAt').value = new URLSearchParams(location.search).get('asat') || v2IsoToday();
$('relationshipAsAt').value = new URLSearchParams(location.search).get('asat') || v2IsoToday();

const v2Query = new URLSearchParams(location.search);
if (v2Query.get('future')) {
  const value = v2Query.get('future');
  if ([...$('individualFuture').options].some((option) => option.value === value)) $('individualFuture').value = value;
  if ([...$('relationshipFuture').options].some((option) => option.value === value)) $('relationshipFuture').value = value;
}

// If a share link opened directly into a populated individual or relationship
// mode, redraw once using Arc Generator v2 after the extension has loaded.
if (v2Query.get('mode') === 'individual' && $('individualDob').value) individualModeV2();
if (v2Query.get('mode') === 'relationship') {
  const validCount = [...document.querySelectorAll('.person .dob')].filter((input) => input.value).length;
  if (validCount >= 2) relationshipModeV2();
}
