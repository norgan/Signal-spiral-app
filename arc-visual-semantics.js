// Arc visual semantics and visual-depth layer.
//
// Keeps Arc Generator v2 mathematics unchanged while improving the visual
// hierarchy of the field and separating:
//   1. the candidate residue-class substrate;
//   2. sampled annual traversal nodes;
//   3. a chronology guide drawn only as a visual ordering aid.
//
// Strong angular near-returns are shown as halo markers rather than text labels
// on the canvas, avoiding the clutter that occurred when several recurrence
// years occupied nearly the same location.

const SIGNAL_VISUAL = {
  fieldInner: '#26d9ff',
  fieldMid: '#169fca',
  fieldOuter: '#0b607a',
  recurrence: '#43c7f4',
  live: '#1fd5ff',
  current: '#e9fbff',
  recurrenceAccent: '#ffd86a',
  panel: 'rgba(2, 11, 17, .82)',
  panelBorder: 'rgba(99, 220, 255, .26)'
};

function visualRoundedRectPath(context, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function visualDrawCore(centre) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  const glow = ctx.createRadialGradient(centre, centre, 0, centre, centre, 26);
  glow.addColorStop(0, 'rgba(225,250,255,.92)');
  glow.addColorStop(.08, 'rgba(74,224,255,.72)');
  glow.addColorStop(.30, 'rgba(0,189,238,.25)');
  glow.addColorStop(1, 'rgba(0,189,238,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(centre, centre, 26, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = 'rgba(109,225,255,.20)';
  ctx.lineWidth = .8;
  ctx.beginPath();
  ctx.arc(centre, centre, 8, 0, TAU);
  ctx.stroke();

  ctx.fillStyle = 'rgba(240,253,255,.92)';
  ctx.beginPath();
  ctx.arc(centre, centre, 1.65, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// Replace the flat black clear with a dimensional field background.
clear = function visualClear() {
  const centre = canvas.width / 2;
  ctx.save();
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#010509';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const glow = ctx.createRadialGradient(centre, centre, 0, centre, centre, canvas.width * .60);
  glow.addColorStop(0, 'rgba(0,157,205,.18)');
  glow.addColorStop(.16, 'rgba(0,137,180,.13)');
  glow.addColorStop(.42, 'rgba(0,88,122,.075)');
  glow.addColorStop(.72, 'rgba(0,38,56,.025)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
};

// Make the wider field visible as a layered substrate rather than a flat set of
// almost-black points. No geometry is changed: only point size and opacity.
baseField = function visualBaseField(maxIndex, limit, geometry, kind = 'full', alpha = .18) {
  const centre = canvas.width / 2;
  const count = Math.min(maxIndex, limit);
  const scale = scaleFor(maxIndex, geometry);

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';

  if (kind === 'prime') {
    ctx.fillStyle = 'rgba(39,214,255,.56)';
    for (const i of primes(count)) {
      const p = point(i, geometry, scale, centre);
      ctx.fillRect(p.x - .65, p.y - .65, 1.3, 1.3);
    }
  } else {
    const innerEnd = Math.floor(count * .20);
    const middleEnd = Math.floor(count * .62);
    const baseAlpha = Math.max(alpha, .18);

    ctx.fillStyle = rgba(SIGNAL_VISUAL.fieldInner, Math.min(.39, baseAlpha * 1.70));
    for (let i = 0; i < innerEnd; i++) {
      const p = point(i, geometry, scale, centre);
      ctx.fillRect(p.x - .58, p.y - .58, 1.16, 1.16);
    }

    ctx.fillStyle = rgba(SIGNAL_VISUAL.fieldMid, Math.min(.30, baseAlpha * 1.28));
    for (let i = innerEnd; i < middleEnd; i++) {
      const p = point(i, geometry, scale, centre);
      ctx.fillRect(p.x - .50, p.y - .50, 1, 1);
    }

    ctx.fillStyle = rgba(SIGNAL_VISUAL.fieldOuter, Math.min(.22, baseAlpha * .92));
    for (let i = middleEnd; i < count; i++) {
      const p = point(i, geometry, scale, centre);
      ctx.fillRect(p.x - .45, p.y - .45, .90, .90);
    }
  }

  ctx.restore();
  visualDrawCore(centre);
  return { centre, scale, count };
};

// Give recursive field traces a soft luminous hierarchy.
recurrence = function visualRecurrence(count, geometry, scale, centre) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.shadowColor = 'rgba(34,194,238,.24)';
  ctx.shadowBlur = 3;

  [13, 21, 34, 55, 89, 144].forEach((step, layer) => {
    ctx.strokeStyle = rgba(SIGNAL_VISUAL.recurrence, .055 + layer * .013);
    ctx.lineWidth = .46 + layer * .055;

    for (let offset = 0; offset < Math.min(step, 12); offset++) {
      ctx.beginPath();
      let started = false;
      for (let i = offset; i < count; i += step * 18) {
        const p = point(i, geometry, scale, centre);
        if (!started) {
          ctx.moveTo(p.x, p.y);
          started = true;
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }
      ctx.stroke();
    }
  });
  ctx.restore();
};

// Candidate residue family: a crisp point on top of a very soft halo so the
// structure can be read without becoming another bright line.
residue = function visualResidue(modulus, arm, colour, maxIndex, geometry, scale, centre, size = 1.55, alpha = .72) {
  if (!modulus || modulus < 1) return;
  ctx.save();

  const haloAlpha = Math.min(.10, Math.max(.04, alpha * .34));
  ctx.fillStyle = rgba(colour, haloAlpha);
  for (let i = arm; i < maxIndex; i += modulus) {
    const p = point(i, geometry, scale, centre);
    ctx.fillRect(p.x - 1.35, p.y - 1.35, 2.7, 2.7);
  }

  const crispAlpha = Math.min(.46, Math.max(.17, alpha));
  ctx.fillStyle = rgba(colour, crispAlpha);
  const dot = Math.max(.82, Math.min(1.22, size * .72));
  for (let i = arm; i < maxIndex; i += modulus) {
    const p = point(i, geometry, scale, centre);
    ctx.fillRect(p.x - dot / 2, p.y - dot / 2, dot, dot);
  }
  ctx.restore();
};

function v2AngularReturnForPeriod(stride, period) {
  const angle = mod(stride * period * GOLDEN_ANGLE, TAU);
  return Math.min(angle, TAU - angle);
}

function v2BestRecurrence(stride, maxPeriod = 24) {
  let best = null;
  for (let period = 2; period <= maxPeriod; period++) {
    const error = v2AngularReturnForPeriod(stride, period);
    if (!best || error < best.error) best = { period, error };
  }
  return best;
}

function v2DrawSampleNodes(indices, colour, geometry, scale, centre, alpha, radiusPx, hollow = false) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (const index of indices) {
    const p = point(index, geometry, scale, centre);

    ctx.shadowColor = rgba(colour, .52);
    ctx.shadowBlur = hollow ? 3 : 6;
    ctx.lineWidth = hollow ? .9 : .7;

    ctx.beginPath();
    ctx.arc(p.x, p.y, radiusPx + (hollow ? .5 : 1.25), 0, TAU);
    if (hollow) {
      ctx.strokeStyle = rgba(colour, alpha * .48);
      ctx.stroke();
    } else {
      ctx.fillStyle = rgba(colour, alpha * .16);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(p.x, p.y, hollow ? radiusPx : Math.max(1.35, radiusPx * .58), 0, TAU);
    if (hollow) {
      ctx.strokeStyle = rgba(colour, alpha * .78);
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(220,248,255,.92)';
      ctx.fill();
    }
  }
  ctx.restore();
}

// A smoothed chronology guide removes the hard polygonal visual while making it
// explicit that the connector is presentation, not the field geometry itself.
function v2DrawChronologyGuide(indices, colour, geometry, scale, centre, options = {}) {
  if (indices.length < 2) return;
  const { alpha = .14, dashed = false, width = .8 } = options;
  const points = indices.map((index) => point(index, geometry, scale, centre));

  ctx.save();
  ctx.strokeStyle = rgba(colour, alpha);
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = rgba(colour, alpha * .7);
  ctx.shadowBlur = 2;
  if (dashed) ctx.setLineDash([3, 8]);

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
  } else {
    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const midX = (current.x + next.x) / 2;
      const midY = (current.y + next.y) / 2;
      ctx.quadraticCurveTo(current.x, current.y, midX, midY);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
  }
  ctx.stroke();
  ctx.restore();
}

function v2DrawRecurrenceMarkers(indices, colour, geometry, scale, centre) {
  if (indices.length < 3) return null;
  const stride = Math.abs(indices[1] - indices[0]);
  if (!stride) return null;

  const recurrence = v2BestRecurrence(stride);
  if (!recurrence) return null;

  const threshold = 2 * Math.PI / 180;
  if (recurrence.error > threshold) return null;

  const marked = [];
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (let k = recurrence.period; k < indices.length; k += recurrence.period) {
    const p = point(indices[k], geometry, scale, centre);
    const prominence = k === recurrence.period ? 1 : .72;

    ctx.shadowColor = 'rgba(255,216,106,.70)';
    ctx.shadowBlur = 9;
    ctx.strokeStyle = `rgba(255,216,106,${.78 * prominence})`;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 7.2, 0, TAU);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(255,236,173,${.62 * prominence})`;
    ctx.lineWidth = .75;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4.4, 0, TAU);
    ctx.stroke();

    ctx.fillStyle = `rgba(255,221,120,${.76 * prominence})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.45, 0, TAU);
    ctx.fill();
    marked.push(k);
  }
  ctx.restore();

  return {
    ...recurrence,
    errorDegrees: deg(recurrence.error),
    marked
  };
}

v2StrokeArc = function v2StrokeArcSemantic(indices, colour, geometry, scale, centre, alpha, width, dashed = false) {
  if (!indices.length) return;

  if (dashed) {
    v2DrawChronologyGuide(indices, colour, geometry, scale, centre, {
      alpha: Math.min(.13, Math.max(.065, alpha * .34)),
      dashed: true,
      width: .62
    });
    v2DrawSampleNodes(indices, colour, geometry, scale, centre, .40, 2.15, true);
    return;
  }

  v2DrawChronologyGuide(indices, colour, geometry, scale, centre, {
    alpha: Math.min(.16, Math.max(.095, alpha * .15)),
    dashed: false,
    width: .78
  });
  v2DrawSampleNodes(indices, colour, geometry, scale, centre, .92, 2.25, false);
  if (mode === 'individual') v2DrawRecurrenceMarkers(indices, colour, geometry, scale, centre);
};

function visualDrawInfoCard(person, projected, centre) {
  ctx.save();
  const title = person.name || 'Person';
  const line2 = `birth n₀ ${person.birthIndex.toLocaleString()}`;
  const line3 = `observed ${v2FormatDate(person.observation)}`;

  ctx.font = '600 13px Inter, system-ui, sans-serif';
  const titleWidth = ctx.measureText(title).width;
  ctx.font = '11px Inter, system-ui, sans-serif';
  const width = Math.ceil(Math.max(titleWidth, ctx.measureText(line2).width, ctx.measureText(line3).width) + 22);
  const height = 54;

  let x = projected.x + 17;
  if (x + width > canvas.width - 10) x = projected.x - width - 17;
  x = Math.max(10, x);
  let y = projected.y - height / 2;
  y = Math.max(10, Math.min(canvas.height - height - 10, y));

  const edgeX = x > projected.x ? x : x + width;
  const edgeY = Math.max(y + 10, Math.min(y + height - 10, projected.y));
  ctx.strokeStyle = 'rgba(119,225,255,.26)';
  ctx.lineWidth = .8;
  ctx.beginPath();
  ctx.moveTo(projected.x, projected.y);
  ctx.lineTo(edgeX, edgeY);
  ctx.stroke();

  visualRoundedRectPath(ctx, x, y, width, height, 8);
  ctx.fillStyle = SIGNAL_VISUAL.panel;
  ctx.fill();
  ctx.strokeStyle = SIGNAL_VISUAL.panelBorder;
  ctx.stroke();

  ctx.fillStyle = '#f2fcff';
  ctx.font = '600 13px Inter, system-ui, sans-serif';
  ctx.fillText(title, x + 10, y + 17);
  ctx.fillStyle = 'rgba(198,226,237,.82)';
  ctx.font = '11px Inter, system-ui, sans-serif';
  ctx.fillText(line2, x + 10, y + 33);
  ctx.fillText(line3, x + 10, y + 47);
  ctx.restore();
}

v2DrawMarkers = function v2DrawMarkersVisual(person, geometry, scale, centre) {
  const birth = point(person.birthIndex, geometry, scale, centre);
  const currentNode = point(person.currentIndex, geometry, scale, centre);
  const projected = v2ProjectedPosition(person, geometry, scale, centre);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  ctx.shadowColor = 'rgba(255,216,106,.42)';
  ctx.shadowBlur = 7;
  ctx.strokeStyle = 'rgba(255,222,125,.82)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(birth.x, birth.y, 5.7, 0, TAU);
  ctx.stroke();

  if (Math.hypot(projected.x - currentNode.x, projected.y - currentNode.y) > 1) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(166,233,250,.28)';
    ctx.lineWidth = .75;
    ctx.beginPath();
    ctx.moveTo(currentNode.x, currentNode.y);
    ctx.lineTo(projected.x, projected.y);
    ctx.stroke();
  }

  ctx.shadowColor = 'rgba(31,213,255,.78)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = 'rgba(31,213,255,.36)';
  ctx.beginPath();
  ctx.arc(projected.x, projected.y, 9.5, 0, TAU);
  ctx.fill();

  ctx.shadowBlur = 8;
  ctx.fillStyle = SIGNAL_VISUAL.current;
  ctx.beginPath();
  ctx.arc(projected.x, projected.y, 4.1, 0, TAU);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(218,247,255,.76)';
  ctx.beginPath();
  ctx.arc(currentNode.x, currentNode.y, 2.2, 0, TAU);
  ctx.fill();
  ctx.restore();

  visualDrawInfoCard(person, projected, centre);
  return { birth, currentNode, projected };
};

const v2IndividualModeBeforeSemanticLayer = individualModeV2;
individualModeV2 = function individualModeV2WithSemanticMetrics() {
  v2IndividualModeBeforeSemanticLayer();

  try {
    const person = v2Profile(
      $('individualName').value,
      $('individualDob').value,
      COLORS[0],
      $('individualAsAt').value || v2IsoToday()
    );
    const recurrence = v2BestRecurrence(person.arcMod);
    if (!recurrence || recurrence.error > 2 * Math.PI / 180) return;

    const summary = $('summary');
    if (!summary) return;
    const card = document.createElement('div');
    card.className = 'metric';
    const label = document.createElement('span');
    label.textContent = 'Strong angular recurrence';
    const value = document.createElement('strong');
    value.textContent = `${recurrence.period} years · ${deg(recurrence.error).toFixed(3)}° return error`;
    card.append(label, value);
    summary.appendChild(card);
  } catch (_) {}
};

individualMode = individualModeV2;

$('renderIndividual')?.addEventListener('click', (event) => {
  event.stopImmediatePropagation();
  individualModeV2();
}, true);

// Redraw whatever is currently visible once this presentation layer has loaded,
// because the base runtime may have rendered before the dynamic script arrived.
setTimeout(() => {
  try {
    if (mode === 'field') {
      fieldMode();
      return;
    }
    if (mode === 'individual' && $('individualDob')?.value) {
      individualModeV2();
      return;
    }
    if (mode === 'relationship') {
      const validCount = [...document.querySelectorAll('.person .dob')].filter((input) => input.value).length;
      if (validCount >= 2) relationshipModeV2();
    }
  } catch (_) {}
}, 0);
