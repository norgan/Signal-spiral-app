// Reliable browser tone engine for Signal Spiral.
//
// Loaded after app.js, arc-v2.js and harmonics432.js so it can harden the
// existing experimental tone controls without changing the harmonic mappings.
// It deliberately keeps all playback user-initiated to satisfy browser audio
// policies and exposes audio-context state in the UI for diagnosis.

function toneSetStatus(message, isError = false) {
  const status = $('toneStatus');
  if (!status) return;
  status.textContent = message;
  status.setAttribute('data-state', isError ? 'error' : 'ok');
  status.style.color = isError ? '#ff9d3d' : '';
}

function toneRestoreButton(button) {
  if (!button) return;
  button.textContent = button.dataset.originalLabel || button.textContent.replace(/^■\s*/, '▶ ');
  button.classList.remove('playing');
  delete button.dataset.originalLabel;
}

function toneMarkButton(button, frequency) {
  if (!button) return;
  if (!button.dataset.originalLabel) button.dataset.originalLabel = button.textContent;
  button.textContent = `■ ${frequency.toFixed(3)} Hz`;
  button.classList.add('playing');
}

async function toneEnsureContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) throw new Error('Web Audio is not supported by this browser.');

  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioCtx({ latencyHint: 'interactive' });
    if (audioContext.addEventListener) {
      audioContext.addEventListener('statechange', () => {
        if (!activeOscillator) toneSetStatus(`Audio ${audioContext.state}`);
      });
    }
  }

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  if (audioContext.state !== 'running') {
    throw new Error(`Audio context is ${audioContext.state}. Click the test button again to allow audio.`);
  }

  return audioContext;
}

function stopToneReliable(options = {}) {
  const button = activeToneButton;
  const oscillator = activeOscillator;
  const gain = activeGain;
  const context = audioContext;

  activeToneButton = null;
  activeOscillator = null;
  activeGain = null;
  toneRestoreButton(button);

  if (oscillator && gain && context && context.state !== 'closed') {
    const now = context.currentTime;
    try {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value || 0.0001), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
      oscillator.stop(now + 0.045);
    } catch (_) {
      try { oscillator.stop(); } catch (_) {}
    }
  }

  if (!options.quiet) {
    toneSetStatus(context && context.state === 'running' ? 'Audio ready' : 'Audio idle');
  }
}

async function playToneReliable(frequency, button) {
  const value = Number(frequency);
  if (!Number.isFinite(value) || value < 20 || value > 20000) {
    toneSetStatus('Tone must be between 20 Hz and 20,000 Hz.', true);
    return;
  }

  if (activeOscillator && activeToneButton === button) {
    stopToneReliable();
    return;
  }

  stopToneReliable({ quiet: true });

  try {
    const context = await toneEnsureContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const volume = Math.max(0, Math.min(0.08, Number($('toneVolume')?.value ?? 0.02)));

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(value, now);
    gain.gain.setValueAtTime(0.0001, now);
    if (volume > 0) {
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), now + 0.04);
    }

    oscillator.connect(gain);
    gain.connect(context.destination);

    activeOscillator = oscillator;
    activeGain = gain;
    activeToneButton = button || null;
    toneMarkButton(button, value);

    oscillator.onended = () => {
      if (activeOscillator === oscillator) {
        activeOscillator = null;
        activeGain = null;
        const endedButton = activeToneButton;
        activeToneButton = null;
        toneRestoreButton(endedButton);
        toneSetStatus('Audio ready');
      }
    };

    oscillator.start(now);
    toneSetStatus(volume > 0
      ? `Playing ${value.toFixed(3)} Hz · audio ${context.state}`
      : `Playing ${value.toFixed(3)} Hz, but volume is zero.`,
      volume <= 0
    );
  } catch (error) {
    stopToneReliable({ quiet: true });
    toneSetStatus(error?.message || 'Audio playback failed.', true);
    console.error('Signal Spiral tone playback failed:', error);
  }
}

// Replace the mutable global function bindings used by app.js.
playTone = playToneReliable;
stopTone = stopToneReliable;

// Capture tone-button clicks before the older delegated handler. This avoids
// duplicate oscillator starts while retaining the original HTML generation.
$('harmonicsTable')?.addEventListener('click', (event) => {
  const button = event.target.closest('.tone-button');
  if (!button) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  playToneReliable(Number(button.dataset.frequency), button);
}, true);

// app.js registered the original stop function by reference, so intercept the
// stop button in capture phase and route it to the hardened engine.
$('stopTone')?.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();
  stopToneReliable();
}, true);

$('testTone')?.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();
  playToneReliable(432, event.currentTarget);
}, true);

$('toneVolume')?.addEventListener('input', () => {
  const volume = Math.max(0, Math.min(0.08, Number($('toneVolume')?.value ?? 0.02)));
  if (activeGain && audioContext && audioContext.state === 'running') {
    activeGain.gain.setTargetAtTime(Math.max(0.0001, volume), audioContext.currentTime, 0.015);
  }
  if (activeOscillator) toneSetStatus(`Playing · volume ${(volume * 100).toFixed(1)}%`);
});

window.addEventListener('pagehide', () => stopToneReliable({ quiet: true }));
toneSetStatus('Audio idle · click Test 432 Hz to verify output');
