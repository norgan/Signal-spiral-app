// Arc visual semantics layer.
//
// Keeps Arc Generator v2 mathematics unchanged while making the rendering
// reflect the distinction between:
//   1. the candidate residue-class field;
//   2. sampled annual traversal nodes;
//   3. the chronological connector drawn only as a visual guide.
//
// It also identifies strong angular near-returns of the annual stride and marks
// completed recurrence nodes explicitly instead of allowing the connector to
// imply a literal ring or continuous orbit.

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
  ctx.lineWidth = 1;
  for (const index of indices) {
    const p = point(index, geometry, scale, centre);
    ctx.beginPath();
    ctx.arc(p.x, p.y, radiusPx, 0, TAU);
    if (hollow) {
      ctx.strokeStyle = rgba(colour, alpha);
      ctx.stroke();
    } else {
      ctx.fillStyle = rgba(colour, alpha);
      ctx.fill();
    }
  }
  ctx.restore();
}

function v2DrawChronologyGuide(indices, colour, geometry, scale, centre, options = {}) {
  if (indices.length < 2) return;
  const { alpha = 0.18, dashed = false, width = 0.75 } = options;
  ctx.save();
  ctx.strokeStyle = rgba(colour, alpha);
  ctx.lineWidth = width;
  if (dashed) ctx.setLineDash([3, 7]);
  ctx.beginPath();
  indices.forEach((index, i) => {
    const p = point(index, geometry, scale, centre);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();
  ctx.restore();
}

function v2DrawRecurrenceMarkers(indices, colour, geometry, scale, centre) {
  if (indices.length < 3) return null;
  const stride = Math.abs(indices[1] - indices[0]);
  if (!stride) return null;

  const recurrence = v2BestRecurrence(stride);
  if (!recurrence) return null;

  // Mark only genuinely tight angular returns. 2 degrees is deliberately
  // conservative enough to reveal Fibonacci-like recurrences without making
  // every stride look special.
  const threshold = 2 * Math.PI / 180;
  if (recurrence.error > threshold) return null;

  const marked = [];
  ctx.save();
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = rgba(colour, 0.95);
  ctx.fillStyle = '#fff';
  ctx.font = '11px Inter, system-ui, sans-serif';

  for (let k = recurrence.period; k < indices.length; k += recurrence.period) {
    const p = point(indices[k], geometry, scale, centre);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6.25, 0, TAU);
    ctx.stroke();
    ctx.fillText(`${k}y`, p.x + 8, p.y - 7);
    marked.push(k);
  }
  ctx.restore();

  return {
    ...recurrence,
    errorDegrees: deg(recurrence.error),
    marked
  };
}

// Replace Arc v2's old polygon-emphasising renderer. The signature stays the
// same because individualModeV2 and relationshipModeV2 already call it.
v2StrokeArc = function v2StrokeArcSemantic(indices, colour, geometry, scale, centre, alpha, width, dashed = false) {
  if (!indices.length) return;

  if (dashed) {
    // Future samples: faint hollow nodes plus a very light dashed order guide.
    v2DrawChronologyGuide(indices, colour, geometry, scale, centre, {
      alpha: Math.min(0.18, Math.max(0.08, alpha * 0.45)),
      dashed: true,
      width: 0.65
    });
    v2DrawSampleNodes(indices, colour, geometry, scale, centre, 0.42, 2.25, true);
    return;
  }

  // Lived samples: annual nodes are primary; the chord is only a faint ordering
  // aid and should never read as the mathematical arc itself.
  v2DrawChronologyGuide(indices, colour, geometry, scale, centre, {
    alpha: Math.min(0.22, Math.max(0.12, alpha * 0.2)),
    dashed: false,
    width: 0.75
  });
  v2DrawSampleNodes(indices, colour, geometry, scale, centre, 0.9, 2.7, false);
  if (mode === 'individual') v2DrawRecurrenceMarkers(indices, colour, geometry, scale, centre);
};

// Add recurrence information to the metric panel after an individual render.
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

// Arc v2 already assigned the mutable function binding before this layer loads.
// Rebind it so tab actions and capture handlers resolve the semantic renderer.
individualMode = individualModeV2;

// Direct listener registered by arc-v2.js captured the previous function object,
// so intercept Individual generation before it and invoke the semantic wrapper.
$('renderIndividual')?.addEventListener('click', (event) => {
  event.stopImmediatePropagation();
  individualModeV2();
}, true);

// If a populated individual share link auto-rendered before this layer loaded,
// redraw once so the corrected visual semantics are visible immediately.
const arcSemanticQuery = new URLSearchParams(location.search);
if (arcSemanticQuery.get('mode') === 'individual' && $('individualDob')?.value) {
  individualModeV2();
}
