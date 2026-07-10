/**
 * Small, dependency-free sound effects synthesized with the Web Audio API
 * — no external audio files to host or license. Browsers block audio
 * until a user gesture, so `unlockAudio()` must be called from a click
 * handler once per page load before any of the effect functions will
 * actually be audible.
 */

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx) ctx = new AudioCtx();
  return ctx;
}

/** Call from a click handler to satisfy the browser's autoplay gesture requirement. */
export function unlockAudio(): void {
  const audioCtx = getContext();
  if (audioCtx?.state === "suspended") {
    audioCtx.resume().catch(() => undefined);
  }
}

function tone(freq: number, duration: number, type: OscillatorType, startOffset: number, gain: number): void {
  const audioCtx = getContext();
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;

  const start = audioCtx.currentTime + startOffset;
  gainNode.gain.setValueAtTime(0, start);
  gainNode.gain.linearRampToValueAtTime(gain, start + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/** A single filtered-noise "clap" — one hand-clap in a crowd. */
function clap(startOffset: number, gain: number): void {
  const audioCtx = getContext();
  if (!audioCtx) return;

  const bufferSize = Math.floor(audioCtx.sampleRate * 0.15);
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const bandpass = audioCtx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = 1400 + Math.random() * 800;
  bandpass.Q.value = 0.9;

  const gainNode = audioCtx.createGain();
  const start = audioCtx.currentTime + startOffset;
  gainNode.gain.setValueAtTime(0, start);
  gainNode.gain.linearRampToValueAtTime(gain, start + 0.005);
  gainNode.gain.exponentialRampToValueAtTime(0.001, start + 0.14);

  noise.connect(bandpass);
  bandpass.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  noise.start(start);
  noise.stop(start + 0.16);
}

/** A short burst of crowd applause — layered under the sold chime. */
export function playApplauseSound(): void {
  const clapCount = 26;
  for (let i = 0; i < clapCount; i++) {
    clap(Math.random() * 1.1, 0.12 + Math.random() * 0.1);
  }
}

/** A bright ascending arpeggio — played when a player is sold. */
export function playSoldSound(): void {
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => tone(freq, 0.3, "triangle", i * 0.1, 0.14));
  playApplauseSound();
}

/** A low descending buzz — played when a player goes unsold. */
export function playUnsoldSound(): void {
  [349.23, 293.66, 233.08].forEach((freq, i) => tone(freq, 0.35, "sawtooth", i * 0.12, 0.1));
}

/** A short tick — played on every bid update, so a raised bid is audible even across the room. */
export function playBidSound(): void {
  tone(880, 0.09, "square", 0, 0.07);
}
