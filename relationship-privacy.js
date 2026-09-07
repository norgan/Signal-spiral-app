// Relationship-mode privacy hardening.
//
// The relationship/partner surface deliberately does not collect participant
// names. Dates of birth are used transiently to calculate candidate arcs, then
// cleared from the DOM immediately after a successful render. Relationship
// share links never include participant names or DOBs.

function relationshipPrivacyRenderPeople() {
  const grid = $('peopleGrid');
  const existing = [...grid.querySelectorAll('.person')].map((card) => ({
    dob: card.querySelector('.dob')?.value || ''
  }));

  grid.innerHTML = '';
  for (let i = 0; i < peopleCount; i++) {
    const value = existing[i] || { dob: '' };
    grid.insertAdjacentHTML('beforeend', `
      <div class="card person">
        <h3><i class="swatch" style="background:${COLORS[i]}"></i>Person ${i + 1}</h3>
        <label>Date of birth
          <input class="dob" type="date" value="${esc(value.dob)}" autocomplete="off">
        </label>
        <p class="fine">Used only to calculate this arc, then cleared from the page.</p>
      </div>
    `);
  }
}

function relationshipPrivacyCollectPeople(observationValue) {
  return [...document.querySelectorAll('.person')].map((card, i) => v2Profile(
    `Person ${i + 1}`,
    card.querySelector('.dob').value,
    COLORS[i],
    observationValue
  ));
}

function relationshipPrivacyClearInputs() {
  document.querySelectorAll('#peopleGrid .dob').forEach((input) => {
    input.value = '';
    input.removeAttribute('value');
  });
}

function relationshipPrivacyCopyLink() {
  const params = new URLSearchParams({ mode: 'relationship' });
  params.set('asat', $('relationshipAsAt').value || v2IsoToday());
  params.set('future', $('relationshipFuture').value);

  const url = `${location.origin}${location.pathname}?${params}`;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(url)
      .then(() => alert('Share link copied. Participant names and dates are not included.'))
      .catch(() => prompt('Copy this privacy-safe link:', url));
  } else {
    prompt('Copy this privacy-safe link:', url);
  }
}

// Replace relationship input rendering with anonymous slots.
renderPeople = relationshipPrivacyRenderPeople;
v2CollectPeople = relationshipPrivacyCollectPeople;
renderPeople();

// Wrap the v2 relationship renderer so sensitive input values disappear after
// a successful calculation, while the generated anonymous result remains.
const relationshipPrivacyBaseMode = relationshipModeV2;
relationshipModeV2 = function relationshipModeV2Private() {
  relationshipPrivacyBaseMode();
  if (!$('relationshipSection').classList.contains('hidden')) {
    relationshipPrivacyClearInputs();
  }
};

// Relationship share links contain only view state. Individual-mode sharing is
// unchanged because this privacy rule applies specifically to the partner view.
const relationshipPrivacyBaseShare = shareV2;
shareV2 = function shareV2Private() {
  if (mode === 'relationship') {
    relationshipPrivacyCopyLink();
    return;
  }
  relationshipPrivacyBaseShare();
};

// Old relationship links may contain a serialized `people` parameter. Strip it
// immediately and clear any result that app.js rendered from it before this
// privacy layer loaded.
const relationshipPrivacyQuery = new URLSearchParams(location.search);
if (relationshipPrivacyQuery.has('people')) {
  relationshipPrivacyQuery.delete('people');
  relationshipPrivacyQuery.delete('name');
  relationshipPrivacyQuery.delete('dob');

  const queryText = relationshipPrivacyQuery.toString();
  const cleanUrl = `${location.pathname}${queryText ? `?${queryText}` : ''}${location.hash}`;
  history.replaceState(null, '', cleanUrl);

  relationshipPrivacyClearInputs();
  clear();
  hideTables();
  renderLegend([]);
  metrics([{
    label: 'Privacy',
    value: 'Participant data was removed from this legacy share link. Re-enter dates to recalculate.'
  }]);
}

// Update relationship-mode copy to make the privacy behaviour explicit.
const relationshipIntro = document.querySelector('#relationship > p');
if (relationshipIntro) {
  relationshipIntro.insertAdjacentHTML(
    'afterend',
    '<p class="fine"><strong>Privacy:</strong> names are not collected. Dates of birth are cleared from the page after generation and are never included in relationship share links.</p>'
  );
}
