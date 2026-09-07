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

function toneContextInfo(context) {
  if (!context) return 'audio context unavailable';
  return `${context.state} · ${(context.sampleRate / 1000).toFixed(1)} kHz sample rate`;
}

async function toneEnsureContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) throw new Error('Web Audio is not supported by this browser.');

  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioCtx({ latencyHint: 'interactive' });
    if (audioContext.addEventListener) {
      audioContext.addEventListener('statechange', () => {
        if (!activeOscillator) toneSetStatus(`Audio ${toneContextInfo(audioContext)}`);
      });
    }
  }

  // Some browsers expose states other than "suspended" while waiting for a
  // user-gesture resume. Attempt resume for every non-running, non-closed state.
  if (audioContext.state !== 'running' && audioContext.state !== 'closed') {
    try { await audioContext.resume(); } catch (_) {}
  }

  if (audioContext.state !== 'running') {
    await new Promise((resolve) => setTimeout(resolve, 40));
    if (audioContext.state !== 'running' && audioContext.state !== 'closed') {
      try { await audioContext.resume(); } catch (_) {}
    }
  }

  if (audioContext.state !== 'running') {
    throw new Error(`Audio context did not start (${toneContextInfo(audioContext)}). Click the tone again or check browser audio permissions.`);
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
      setTimeout(() => {
        try { oscillator.disconnect(); } catch (_) {}
        try { gain.disconnect(); } catch (_) {}
      }, 80);
    } catch (_) {
      try { oscillator.stop(); } catch (_) {}
      try { oscillator.disconnect(); } catch (_) {}
      try { gain.disconnect(); } catch (_) {}
    }
  }

  if (!options.quiet) {
    toneSetStatus(context && context.state === 'running' ? `Audio ready · ${toneContextInfo(context)}` : 'Audio idle');
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
    const nyquist = context.sampleRate / 2;
    if (value >= nyquist) {
      throw new Error(`${value.toFixed(3)} Hz exceeds this device's playback limit (${nyquist.toFixed(0)} Hz Nyquist at ${(context.sampleRate / 1000).toFixed(1)} kHz sample rate).`);
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    const volume = Math.max(0, Math.min(0.08, Number($('toneVolume')?.value ?? 0.02)));

    oscillator.type = 'sine';
    oscillator.frequency.value = value;
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
      try { oscillator.disconnect(); } catch (_) {}
      try { gain.disconnect(); } catch (_) {}
      if (activeOscillator === oscillator) {
        activeOscillator = null;
        activeGain = null;
        const endedButton = activeToneButton;
        activeToneButton = null;
        toneRestoreButton(endedButton);
        toneSetStatus(`Audio ready · ${toneContextInfo(context)}`);
      }
    };

    oscillator.start(now);
    const edgeNotice = value < 40 || value > 12000 ? ' · may be difficult to hear on this ear/device' : '';
    toneSetStatus(volume > 0
      ? `Playing ${value.toFixed(3)} Hz · ${toneContextInfo(context)}${edgeNotice}`
      : `Playing ${value.toFixed(3)} Hz, but volume is zero.`,
      volume <= 0
    );
  } catch (error) {
    const contextInfo = audioContext ? ` · ${toneContextInfo(audioContext)}` : '';
    stopToneReliable({ quiet: true });
    toneSetStatus(`${error?.message || 'Audio playback failed.'}${contextInfo}`, true);
    console.error('Signal Spiral tone playback failed:', { frequency: value, error, audioContext });
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
  if (activeOscillator) toneSetStatus(`Playing · volume ${(volume * 100).toFixed(1)}% · ${toneContextInfo(audioContext)}`);
});

window.addEventListener('pagehide', () => stopToneReliable({ quiet: true }));
toneSetStatus('Audio idle · click Test 432 Hz to verify output');

// Load the optional visual-semantics layer after Arc v2 and the rest of the
// runtime are fully initialised. This changes only presentation, not formulas.
const arcVisualSemanticsScript = document.createElement('script');
arcVisualSemanticsScript.src = 'arc-visual-semantics.js?v=20260908-2';
arcVisualSemanticsScript.defer = true;
document.head.appendChild(arcVisualSemanticsScript);
