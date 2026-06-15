import type { TransformationDefinition } from '../../../types/game/transformation';
import type { ActiveEffectV2, TransformationEffectConfig } from '../../../types/game/transformationEffects';

// Deterministic evaluation of the v2 effect list at a time (seconds). Used by BOTH edit-preview and play (added
// to the runner snapshot) so they can never diverge. Returns the active effects with localTime + progress,
// sorted by layerOrder. `preview` filters previewEnabled in Edit Mode.
export function evaluateEffectsAtTime(def: TransformationDefinition | null | undefined, time: number, preview = false): ActiveEffectV2[] {
  const effects = def?.effects;
  if (!effects || effects.length === 0) return [];
  const out: ActiveEffectV2[] = [];
  for (const config of effects) {
    if (!config.enabled) continue;
    if (preview && !config.previewEnabled) continue;
    const start = config.startTime + (config.delay || 0);
    const dur = Math.max(0.001, config.duration);
    if (time < start || time > start + dur) continue;
    const localTime = time - start;
    out.push({ config, localTime, progress: Math.max(0, Math.min(1, localTime / dur)) });
  }
  out.sort((a, b) => (a.config.layerOrder || 0) - (b.config.layerOrder || 0));
  return out;
}

// Stable signature of the active-effect SET (ids) — lets the host re-render only when the set changes.
export function activeEffectSignature(active: ActiveEffectV2[]): string {
  return active.map((a) => a.config.effectId).join('|');
}

export function isCloneEffect(config: TransformationEffectConfig): boolean {
  return config.effectType.startsWith('clone_') || config.effectType === 'transparent_model_echo_effect';
}
