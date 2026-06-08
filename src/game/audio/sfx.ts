import { useAudioStore } from '../../stores/audioStore';

// POLI placeholder SFX — short WebAudio synth blips. No sample files (content-policy: legally-free /
// generated only). One lazily-created AudioContext, gated by audioStore.sfxEnabled + sfxVolume.
// Call playSfx(name) at event sites (transform, ability, rescue, incident, quest, ui). Never per-frame.

export type SfxName =
  | 'transform'
  | 'ability'
  | 'rescueSuccess'
  | 'rescueFail'
  | 'incident'
  | 'questComplete'
  | 'ui';

interface Note { freq: number; dur: number; type: OscillatorType; delay: number; gain?: number; sweepTo?: number; }

// Each cue is a tiny sequence of oscillator notes — recognisable, child-friendly, non-jarring.
const CUES: Record<SfxName, Note[]> = {
  // Rising two-tone "whirr" — vehicle⇄robot morph.
  transform: [
    { freq: 320, dur: 0.12, type: 'sawtooth', delay: 0, sweepTo: 620 },
    { freq: 660, dur: 0.14, type: 'triangle', delay: 0.1 },
  ],
  // Bright sparkle for a character ability.
  ability: [
    { freq: 880, dur: 0.08, type: 'sine', delay: 0 },
    { freq: 1180, dur: 0.1, type: 'sine', delay: 0.07 },
  ],
  // Happy major arpeggio — rescue / stage success.
  rescueSuccess: [
    { freq: 523, dur: 0.1, type: 'triangle', delay: 0 },
    { freq: 659, dur: 0.1, type: 'triangle', delay: 0.1 },
    { freq: 784, dur: 0.16, type: 'triangle', delay: 0.2 },
  ],
  // Soft descending "aww" — recoverable failure, never harsh.
  rescueFail: [
    { freq: 440, dur: 0.14, type: 'sine', delay: 0, sweepTo: 300 },
    { freq: 300, dur: 0.16, type: 'sine', delay: 0.12 },
  ],
  // Gentle two-pulse alert — incident spawned.
  incident: [
    { freq: 700, dur: 0.1, type: 'square', delay: 0, gain: 0.5 },
    { freq: 700, dur: 0.1, type: 'square', delay: 0.18, gain: 0.5 },
  ],
  // Cheerful chime — quest complete.
  questComplete: [
    { freq: 659, dur: 0.1, type: 'triangle', delay: 0 },
    { freq: 988, dur: 0.18, type: 'triangle', delay: 0.1 },
  ],
  // Tiny click — generic UI.
  ui: [{ freq: 520, dur: 0.05, type: 'sine', delay: 0, gain: 0.4 }],
};

let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch { return null; }
  }
  // Browsers suspend the context until a user gesture; resume opportunistically.
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function playSfx(name: SfxName): void {
  const { sfxEnabled, sfxVolume } = useAudioStore.getState();
  if (!sfxEnabled || sfxVolume <= 0) return;
  const ac = getCtx();
  if (!ac) return;
  const cue = CUES[name];
  if (!cue) return;
  const now = ac.currentTime;
  for (const n of cue) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = n.type;
    osc.frequency.setValueAtTime(n.freq, now + n.delay);
    if (n.sweepTo) osc.frequency.linearRampToValueAtTime(n.sweepTo, now + n.delay + n.dur);
    const peak = sfxVolume * (n.gain ?? 0.7);
    g.gain.setValueAtTime(0, now + n.delay);
    g.gain.linearRampToValueAtTime(peak, now + n.delay + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + n.delay + n.dur);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(now + n.delay);
    osc.stop(now + n.delay + n.dur + 0.02);
  }
}
