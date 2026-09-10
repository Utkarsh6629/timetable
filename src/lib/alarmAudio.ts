import type { AlarmTone } from '../types';

let audioCtx: AudioContext | null = null;
let compressor: DynamicsCompressorNode | null = null;
let masterGain: GainNode | null = null;
let alarmInterval: ReturnType<typeof setInterval> | null = null;
let previewTimeout: ReturnType<typeof setTimeout> | null = null;

function getAudioContext(): { ctx: AudioContext; output: AudioNode } {
  if (!audioCtx || audioCtx.state === 'closed') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();

    // Dynamics compressor for maximum loudness without distortion
    compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-12, audioCtx.currentTime);
    compressor.knee.setValueAtTime(10, audioCtx.currentTime);
    compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
    compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
    compressor.release.setValueAtTime(0.2, audioCtx.currentTime);

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(1.0, audioCtx.currentTime);

    masterGain.connect(compressor);
    compressor.connect(audioCtx.destination);
  }

  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }

  return { ctx: audioCtx, output: masterGain! };
}

/** Set master volume: 0 to 100. Uses a boosted scale up to 1.4 for extra loud piercing alarms. */
function setOutputVolume(volume: number) {
  const { ctx, output } = getAudioContext();
  const normalized = Math.max(0, Math.min(100, volume)) / 100;
  // Boosted curve: 100% volume = 1.4 gain with limiter
  const targetGain = normalized * 1.4;
  (output as GainNode).gain.setValueAtTime(targetGain, ctx.currentTime);
}

/** 1. Radar Pulse (Android Radar ping) */
function playRadarPattern(ctx: AudioContext, output: AudioNode) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(1240, now + 0.12);

  gain.gain.setValueAtTime(0.9, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  osc.connect(gain);
  gain.connect(output);

  osc.start(now);
  osc.stop(now + 0.46);

  // Secondary echo ping
  const echoOsc = ctx.createOscillator();
  const echoGain = ctx.createGain();
  echoOsc.type = 'sine';
  echoOsc.frequency.setValueAtTime(1040, now + 0.15);
  echoOsc.frequency.exponentialRampToValueAtTime(1400, now + 0.25);
  echoGain.gain.setValueAtTime(0.5, now + 0.15);
  echoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

  echoOsc.connect(echoGain);
  echoGain.connect(output);

  echoOsc.start(now + 0.15);
  echoOsc.stop(now + 0.56);
}

/** 2. Digital Beep (High-pitch dual electronic alarm beeps) */
function playDigitalPattern(ctx: AudioContext, output: AudioNode) {
  const now = ctx.currentTime;
  const beeps = [0, 0.12, 0.24, 0.36];

  beeps.forEach((startOffset) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(2600, now + startOffset);

    gain.gain.setValueAtTime(0.6, now + startOffset);
    gain.gain.setValueAtTime(0.001, now + startOffset + 0.08);

    osc.connect(gain);
    gain.connect(output);

    osc.start(now + startOffset);
    osc.stop(now + startOffset + 0.085);
  });
}

/** 3. Morning Chime (Harmonic pleasant chord bells) */
function playChimePattern(ctx: AudioContext, output: AudioNode) {
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.1);

    gain.gain.setValueAtTime(0.7, now + idx * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.7);

    osc.connect(gain);
    gain.connect(output);

    osc.start(now + idx * 0.1);
    osc.stop(now + idx * 0.1 + 0.75);
  });
}

/** 4. Retro Clock (Twin-bell mechanical rapid vibrating ring) */
function playRetroPattern(ctx: AudioContext, output: AudioNode) {
  const now = ctx.currentTime;
  const bellFreqs = [784, 880];

  for (let i = 0; i < 8; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const freq = bellFreqs[i % 2];
    const offset = i * 0.06;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now + offset);

    gain.gain.setValueAtTime(0.6, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.05);

    osc.connect(gain);
    gain.connect(output);

    osc.start(now + offset);
    osc.stop(now + offset + 0.055);
  }
}

/** 5. Urgent Siren (Sweeping penetrating high alert) */
function playSirenPattern(ctx: AudioContext, output: AudioNode) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.linearRampToValueAtTime(1600, now + 0.35);
  osc.frequency.linearRampToValueAtTime(800, now + 0.7);

  gain.gain.setValueAtTime(0.7, now);
  gain.gain.setValueAtTime(0.7, now + 0.65);
  gain.gain.linearRampToValueAtTime(0.001, now + 0.7);

  osc.connect(gain);
  gain.connect(output);

  osc.start(now);
  osc.stop(now + 0.71);
}

function playTonePattern(tone: AlarmTone) {
  const { ctx, output } = getAudioContext();
  switch (tone) {
    case 'digital':
      playDigitalPattern(ctx, output);
      break;
    case 'chime':
      playChimePattern(ctx, output);
      break;
    case 'retro':
      playRetroPattern(ctx, output);
      break;
    case 'siren':
      playSirenPattern(ctx, output);
      break;
    case 'radar':
    default:
      playRadarPattern(ctx, output);
      break;
  }
}

/** Starts sounding repeating alarm tone continuously. */
export function startAlarmSound(tone: AlarmTone = 'radar', volume = 100) {
  stopAlarmSound();
  setOutputVolume(volume);

  playTonePattern(tone);
  const intervalMs = tone === 'siren' ? 1000 : tone === 'chime' ? 1400 : 1200;
  alarmInterval = setInterval(() => {
    playTonePattern(tone);
  }, intervalMs);
}

/** Stops any playing alarm sound or preview. */
export function stopAlarmSound() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
  if (previewTimeout) {
    clearTimeout(previewTimeout);
    previewTimeout = null;
  }
}

/** Plays a short 2.5 second preview of the tone at the given volume so user can test loudness. */
export function previewAlarmSound(
  tone: AlarmTone,
  volume = 100,
  onEnd?: () => void
): () => void {
  stopAlarmSound();
  startAlarmSound(tone, volume);

  previewTimeout = setTimeout(() => {
    stopAlarmSound();
    onEnd?.();
  }, 2500);

  return stopAlarmSound;
}

export const ALARM_TONE_OPTIONS: { id: AlarmTone; name: string; description: string; icon: string }[] = [
  { id: 'radar',   name: 'Radar Pulse',   description: 'Classic ascending sonar ping',        icon: '📡' },
  { id: 'digital', name: 'Digital Pulse', description: 'Piercing rapid 4-beep digital clock', icon: '⏰' },
  { id: 'chime',   name: 'Morning Chime', description: 'Harmonic melodic bell chord',         icon: '🔔' },
  { id: 'retro',   name: 'Retro Clock',   description: 'Mechanical twin-bell hammer ring',    icon: '⏳' },
  { id: 'siren',   name: 'Urgent Siren',  description: 'Sweeping dual-frequency alert',       icon: '🚨' },
];
