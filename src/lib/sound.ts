// A single shared AudioContext, created lazily on first use (constructing
// one before any user gesture can throw/stay suspended in some browsers).
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) audioContext = new Ctor();
  // Autoplay policies can leave a freshly-created context suspended even
  // after a user gesture elsewhere on the page — resuming is a no-op if
  // it's already running.
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

/**
 * A short synthesized "ding-ding" (~250ms, two quick ascending tones) —
 * played for everyone in the room whenever anyone guesses correctly, not
 * just the guesser. Generated with the Web Audio API rather than an audio
 * file — no asset to source/host/license, and this is tiny either way.
 * Silently no-ops if Web Audio isn't available (SSR, old browsers).
 */
export function playCorrectGuessSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [880, 1318.5]; // A5 then E6
  for (let i = 0; i < notes.length; i++) {
    const freq = notes[i];
    if (freq === undefined) continue;
    const start = now + i * 0.09;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.22, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.24);
  }
}
