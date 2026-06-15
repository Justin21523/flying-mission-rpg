import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { CinematicEffectDefinition } from '../../types/cinematicVfxTypes';
import { SEED_CINEMATIC_EFFECTS } from '../../data/character-abilities/allCharacterAbilities';

// Editable cinematic effect definitions (Batch F.5) — one per ability + any extra presets. Seed-merged at
// boot; resolved by the CinematicVfxDirector when a skill's effect references a cinematic effect.
export const useCinematicEffectStore = createEditorCollection<CinematicEffectDefinition>({
  storageKey: 'aero-rescue-editor-cinematic-effect-v1',
  seed: SEED_CINEMATIC_EFFECTS,
  makeId: () => `cfx_${nanoid(6)}`,
});

export function getCinematicEffect(id: string | undefined): CinematicEffectDefinition | undefined {
  if (!id) return undefined;
  return useCinematicEffectStore.getState().items.find((e) => e.id === id);
}
