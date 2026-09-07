// Relationship display privacy controls.
//
// Relationship inputs remain available: users may enter names and dates of
// birth normally. When obfuscation is enabled, names are replaced by anonymous
// Person N labels for rendering and DOB controls are visually masked. The raw
// values remain only in this browser session so the relationship can be
// recalculated after the user chooses to reveal them again.

const relationshipPrivacySelect = $('relationshipPrivacy');
const relationshipPrivacyQuery = new URLSearchParams(location.search);

function relationshipCards() {
  return [...document.querySelectorAll('#peopleGrid .person')];
}

function relationshipHasCompleteDates() {
  return relationshipCards().length >= 2 && relationshipCards().every((card) => {
    const dob = card.querySelector('.dob');
    return Boolean(dob?.dataset.privateDob || (dob?.type === 'date' && dob.value));
  });
}

function relationshipStorePrivateValues() {
  relationshipCards().forEach((card) => {
    const name = card.querySelector('.name');
    const dob = card.querySelector('.dob');
    if (!name || !dob) return;

    if (!name.dataset.privateName) name.dataset.privateName = name.value;
    if (!dob.dataset.privateDob && dob.type === 'date') dob.dataset.privateDob = dob.value;
  });
}

function relationshipPreparePrivateRender() {
  relationshipStorePrivateValues();
  relationshipCards().forEach((card, i) => {
    const name = card.querySelector('.name');
    const dob = card.querySelector('.dob');
    if (!name || !dob) return;

    name.value = `Person ${i + 1}`;
    dob.disabled = false;
    dob.type = 'date';
    dob.value = dob.dataset.privateDob || '';
    dob.autocomplete = 'off';
  });
}

function relationshipMaskInputs() {
  relationshipStorePrivateValues();
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
    name.value = name.dataset.privateName || (name.value === `Person ${i + 1}` ? '' : name.value);
    name.removeAttribute('aria-label');

    const privateDob = dob.dataset.privateDob || '';
    dob.disabled = false;
    dob.readOnly = false;
    dob.type = 'date';
    dob.value = privateDob;
    dob.autocomplete = 'off';
    dob.removeAttribute('aria-label');
  });
  $('peopleGrid').classList.remove('relationship-obfuscated');
}

function relationshipSanitiseUrl() {
  const params = new URLSearchParams(location.search);
  let changed = false;
  for (const key of ['people', 'name', 'dob']) {
    if (params.has(key)) {
      params.delete(key);
      changed = true;
    }
  }
  params.set('privacy', 'obfuscate');
  if (!changed && new URLSearchParams(location.search).get('privacy') === 'obfuscate') return;

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

function relationshipPrivacyEnabled() {
  return relationshipPrivacySelect?.value === 'obfuscate';
}

// Apply the user's selection. Rendering while obfuscated temporarily restores
// only the DOB values required by the calculator; names remain anonymous.
relationshipPrivacySelect?.addEventListener('change', () => {
  if (relationshipPrivacyEnabled()) {
    relationshipStorePrivateValues();
    if (relationshipHasCompleteDates() && typeof relationshipMode === 'function') {
      relationshipPreparePrivateRender();
      relationshipMode();
    }
    relationshipMaskInputs();
    relationshipSanitiseUrl();
  } else {
    relationshipRevealInputs();
    if (relationshipHasCompleteDates() && typeof relationshipMode === 'function') relationshipMode();
  }
});

// Run before Arc Generator v2's capture handler so its calculations receive
// real DOBs but anonymous display names when privacy is enabled.
$('renderRelationship')?.addEventListener('click', () => {
  if (!relationshipPrivacyEnabled()) return;
  relationshipPreparePrivateRender();
  setTimeout(() => relationshipMaskInputs(), 0);
}, true);

// Preserve private values across add/remove operations, then restore masking.
for (const id of ['addPerson', 'removePerson']) {
  $(id)?.addEventListener('click', () => {
    if (!relationshipPrivacyEnabled()) return;
    relationshipRevealInputs();
    setTimeout(() => {
      relationshipStorePrivateValues();
      relationshipMaskInputs();
    }, 0);
  }, true);
}

// This listener is registered before arc-v2.js. When privacy is enabled it
// prevents the normal relationship share handler from serialising people/DOBs.
$('copyLink')?.addEventListener('click', (event) => {
  if (mode !== 'relationship' || !relationshipPrivacyEnabled()) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  relationshipPrivacySafeShare();
}, true);

// Generic public pages start with details visible for normal data entry. Legacy
// relationship links containing personal data default to obfuscation and are
// cleaned from the visible URL immediately.
if (relationshipPrivacySelect) {
  const requested = relationshipPrivacyQuery.get('privacy');
  const legacyPersonalLink = relationshipPrivacyQuery.has('people');
  relationshipPrivacySelect.value = requested === 'obfuscate' || legacyPersonalLink ? 'obfuscate' : 'full';

  if (relationshipPrivacyEnabled()) {
    relationshipStorePrivateValues();
    relationshipPreparePrivateRender();
    relationshipSanitiseUrl();
    setTimeout(() => relationshipMaskInputs(), 0);
  }
}
