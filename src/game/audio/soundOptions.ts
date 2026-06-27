// Shared sound-id dropdown options for timeline editors (transformation effects, flight events, …). Synth sfx
// (always audible) + a few audio cue ids. Single source so every editor offers the same list — no hardcoded
// copies drifting apart. Values feed `playTimelineSound`.
export const SOUND_OPTIONS: { value: string; label: string }[] = [
  '', 'transform', 'ability', 'boost', 'ring', 'warn', 'land', 'coin', 'blip', 'pickup', 'objective',
  'fx.boost', 'fx.ring', 'fx.warn', 'ui.launch', 'ui.confirm',
].map((v) => ({ value: v, label: v || '(none)' }));
