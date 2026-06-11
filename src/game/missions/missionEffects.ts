import type { DialogueEffect } from '../../types/dialogue';
import { executeEffect } from '../executeEffect';

// Fire a mission's completion effects (rewards / world flags / trust …) — reuse the POLI effect engine.
// `apply` is injectable so the order/coverage is unit-testable without mutating the live stores.
export function runEffects(effects: DialogueEffect[] | undefined, apply: (e: DialogueEffect) => void = executeEffect): void {
  for (const e of effects ?? []) apply(e);
}
