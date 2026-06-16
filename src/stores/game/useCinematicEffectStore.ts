import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { CinematicEffectDefinition } from '../../types/cinematicVfxTypes';
import { SEED_CINEMATIC_EFFECTS } from '../../data/character-abilities/allCharacterAbilities';

// Editable cinematic effect definitions (Batch F.5) — one per ability + any extra presets. Seed-merged at
// boot; resolved by the CinematicVfxDirector when a skill's effect references a cinematic effect.
export const useCinematicEffectStore = createEditorCollection<CinematicEffectDefinition>({
  // storageKey bumped to v2 (F.6c): fully abandon any stale persisted effect set so the store seeds fresh from
  // the authored rebuild — bulletproof against a returning browser still holding pre-rebuild content.
  storageKey: 'aero-rescue-editor-cinematic-effect-v2',
  seed: SEED_CINEMATIC_EFFECTS,
  makeId: () => `cfx_${nanoid(6)}`,
  // Bump when the authored effect CONTENT changes so returning users get the refreshed effects (the runtime
  // resolves effects from this persisted store, not directly from the seed).
  seedVersion: 'f7-16-skills',
});

// Index the authored seed by id for an always-available fallback (the runtime must resolve an authored effect
// even if the persisted store is somehow empty/stale).
const SEED_BY_ID = new Map(SEED_CINEMATIC_EFFECTS.map((e) => [e.id, e]));

export function getCinematicEffect(id: string | undefined): CinematicEffectDefinition | undefined {
  if (!id) return undefined;
  return useCinematicEffectStore.getState().items.find((e) => e.id === id) ?? SEED_BY_ID.get(id);
}
