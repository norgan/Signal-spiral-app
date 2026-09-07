// Relationship display privacy controls.
//
// Relationship inputs remain available: users may enter names and dates of
// birth normally. When obfuscation is enabled, names are replaced by anonymous
// Person N labels for rendering and DOB controls are visually masked. Raw
// values remain only in this browser session so the relationship can be
// recalculated after the user chooses to reveal them again.

const relationshipPrivacySelect = $('relationshipPrivacy');
const relationshipPrivacyQuery = new URLSearchParams(location.search);

function relationshipCards() {
  return [...document.querySelectorAll('#peopleGrid .person')];
}

function relationshipCaptureFullValues() {
  relationshipCards().forEach((card) => {
    const name = card.querySelector('.name');
    const dob = card.querySelector('.dob');
    if (!name || !dob) return;

    name.dataset.privateName = name.value;
    if (dob.type === 'date') dob.dataset.privateDob = dob.value;
  });
}

function relationshipHasCompleteDates() {
  return relationshipCards().length >= 2 && relationshipCards().every((card) => {
    const dob = card.querySelector('.dob');
    return Boolean(dob?.dataset.privateDob || (dob?.type === 'date' && dob.value));
  });
}

function relationshipPreparePrivateRender() {
  relationshipCards().forEach((card, i) => {
    const name = card.querySelector('.name');
    const dob = card.querySelector('.dob');
    if (!name || !dob) return;

    name.value = `Person ${i + 1}`;
    name.readOnly = false;

    dob.disabled = false;
    dob.readOnly = false;
    dob.type = 'date';
    dob.value = dob.dataset.privateDob || '';
    dob.autocomplete = 'off';
  });
}

function relationshipMaskInputs() {
  relationshipCards().forEach((card, i) => {
    const name = card.querySelector('.name');
    const dob = card.querySelector('.dob');
    if (!name || !dob) return;

    name.value = `Person ${i + 1}`;
    name.readOnly = true;
    name.setAttribute('aria-label', `Person ${i + 1} name hidden`);

    dob.type = 'text';
    dob.value = '••••-••-••';
    dob.readOnly = true;
    dob.disabled = true;
    dob.setAttribute('aria-label', `Person ${i + 1} date of birth hidden`);
  });
  $('peopleGrid').classList.add('relationship-obfuscated');
}

function relationshipRevealInputs() {
  relationshipCards().forEach((card, i) => {
    const name = card.querySelector('.name');
    const dob = card.querySelector('.dob');
    if (!name || !dob) return;

    name.readOnly = false;
    name.value = name.dataset.privateName ?? (name.value === `Person ${i + 1}` ? '' : name.value);
    name.removeAttribute('aria-label');

    dob.disabled = false;
    dob.readOnly = false;
    dob.type = 'date';
    dob.value = dob.dataset.privateDob || '';
    dob.autocomplete = 'off';
    dob.removeAttribute('aria-label');
  });
  $('peopleGrid').classList.remove('relationship-obfuscated');
}

function relationshipSetPrivacyInUrl(value, stripPeople = false) {
  const params = new URLSearchParams(location.search);
  if (stripPeople) {
    for (const key of ['people', 'name', 'dob']) params.delete(key);
  }
  params.set('privacy', value);

  const queryText = params.toString();
  const clean = `${location.pathname}${queryText ? `?${queryText}` : ''}${location.hash}`;
  history.replaceState(null, '', clean);
}

function relationshipPrivacySafeShare() {
  const params = new URLSearchParams({ mode: 'relationship', privacy: 'obfuscate' });
  params.set('asat', $('relationshipAsAt').value || (typeof v2IsoToday === 'function' ? v2IsoToday() : ''));
  params.set('future', $('relationshipFuture').value);
  params.set('view', $('relationshipView').value);
  params.set('geometry', $('relationshipGeometry').value);
  params.set('connections', $('relationshipConnections').value);

  const url = `${location.origin}${location.pathname}?${params}`;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(url)
      .then(() => alert('Privacy-safe link copied. Names and dates of birth are not included.'))
      .catch(() => prompt('Copy this privacy-safe link:', url));
  } else {
    prompt('Copy this privacy-safe link:', url);
  }
}

function relationshipFullDetailShare() {
  const people = relationshipCards()
    .map((card, i) => ({
      name: card.querySelector('.name')?.value || `Person ${i + 1}`,
      dob: card.querySelector('.dob')?.value || ''
    }))
    .filter((person) => person.dob);

  const params = new URLSearchParams({ mode: 'relationship', privacy: 'full' });
  if (people.length) params.set('people', JSON.stringify(people));
  params.set('asat', $('relationshipAsAt').value || (typeof v2IsoToday === 'function' ? v2IsoToday() : ''));
  params.set('future', $('relationshipFuture').value);

  const url = `${location.origin}${location.pathname}?${params}`;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(url)
      .then(() => alert('Full-detail relationship link copied. It includes entered names and dates of birth.'))
      .catch(() => prompt('Copy this full-detail link:', url));
  } else {
    prompt('Copy this full-detail link:', url);
  }
}

function relationshipPrivacyEnabled() {
  return relationshipPrivacySelect?.value === 'obfuscate';
}

relationshipPrivacySelect?.addEventListener('change', () => {
  if (relationshipPrivacyEnabled()) {
    relationshipCaptureFullValues();
    if (relationshipHasCompleteDates() && typeof relationshipMode === 'function') {
      relationshipPreparePrivateRender();
      relationshipMode();
    }
    relationshipMaskInputs();
    relationshipSetPrivacyInUrl('obfuscate', true);
  } else {
    relationshipRevealInputs();
    relationshipSetPrivacyInUrl('full', false);
    if (relationshipHasCompleteDates() && typeof relationshipMode === 'function') relationshipMode();
  }
});

// This capture listener is registered before Arc Generator v2's handler. When
// privacy is on it provides real DOBs for calculation but anonymous names for
// every rendered label/table/canvas marker.
$('renderRelationship')?.addEventListener('click', () => {
  if (!relationshipPrivacyEnabled()) return;
  relationshipPreparePrivateRender();
  setTimeout(() => relationshipMaskInputs(), 0);
}, true);

// Preserve the real values across add/remove operations while the controls are
// masked, then reapply the visual privacy state.
for (const id of ['addPerson', 'removePerson']) {
  $(id)?.addEventListener('click', () => {
    if (!relationshipPrivacyEnabled()) return;
    relationshipRevealInputs();
    setTimeout(() => {
      relationshipCaptureFullValues();
      relationshipMaskInputs();
    }, 0);
  }, true);
}

// Own relationship sharing in both modes so the privacy choice is explicit.
// This listener is registered before arc-v2.js and therefore prevents its
// generic relationship share handler from running.
$('copyLink')?.addEventListener('click', (event) => {
  if (mode !== 'relationship') return;
  event.preventDefault();
  event.stopImmediatePropagation();

  if (relationshipPrivacyEnabled()) relationshipPrivacySafeShare();
  else relationshipFullDetailShare();
}, true);

// Generic public pages start with details visible for normal data entry. Old
// relationship links that contain a `people` payload but no explicit privacy
// choice are treated as private-by-default and sanitised from the address bar.
// A new link carrying privacy=full remains full-detail by explicit choice.
if (relationshipPrivacySelect) {
  const requested = relationshipPrivacyQuery.get('privacy');
  const legacyPersonalLink = relationshipPrivacyQuery.has('people') && !requested;
  relationshipPrivacySelect.value = requested === 'obfuscate' || legacyPersonalLink ? 'obfuscate' : 'full';

  if (relationshipPrivacyEnabled()) {
    relationshipCaptureFullValues();
    relationshipPreparePrivateRender();
    relationshipSetPrivacyInUrl('obfuscate', true);
    setTimeout(() => relationshipMaskInputs(), 0);
  }
}
