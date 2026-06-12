// Batch 12.1 — one shared WebAudio context for the synth SFX (sfx.ts) AND the procedural music/ambient
// engine, so they mix through the same clock and there's a single thing to unlock on the first user gesture
// (browser autoplay policy). Returns null when WebAudio is unavailable (tests / SSR) — callers no-op.

let ctx: AudioContext | null = null;

export function getAudioCtx(): AudioContext | null {
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
