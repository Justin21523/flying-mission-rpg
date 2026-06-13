import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { TransformationDefinition, TransformationEffectTrack } from '../../types/game/transformation';
import { SEED_TRANSFORMATIONS } from '../../data/game/transformations';

function upgradeHeroCloneEffect(effect: TransformationEffectTrack): TransformationEffectTrack {
  if (effect.type !== 'ghost-burst') return effect;
  const isLegacySeedGhost = effect.id === 'fx_ghost' && (effect.scale == null || effect.scale <= 2) && (effect.repeat == null || effect.repeat <= 12);
  if (!isLegacySeedGhost) return effect;
  return {
    ...effect,
    scale: 14,
    repeat: 54,
    ghostSpread: effect.ghostSpread ?? 12,
    ghostPersist: effect.ghostPersist ?? true,
    modelSlot: effect.modelSlot ?? 'robot',
  };
}

function upgradeHeroCloneEffects(def: TransformationDefinition): TransformationDefinition {
  let changed = false;
  const effectTracks = (def.effectTracks ?? []).map((effect) => {
    const upgraded = upgradeHeroCloneEffect(effect);
    if (upgraded !== effect) changed = true;
    return upgraded;
  });
  return changed ? { ...def, effectTracks } : def;
}

const transformationStore = createEditorCollection<TransformationDefinition>({
  storageKey: 'aero-rescue-editor-transformation-v6',
  seed: SEED_TRANSFORMATIONS.map(upgradeHeroCloneEffects),
  makeId: () => `xf_${nanoid(6)}`,
});

const loaded = transformationStore.getState().items;
const upgraded = loaded.map(upgradeHeroCloneEffects);
if (JSON.stringify(upgraded) !== JSON.stringify(loaded)) {
  transformationStore.getState().importState({ items: upgraded, seeded: transformationStore.getState().seeded });
}

export const useEditorTransformationStore = transformationStore;

export function getEditorTransformations(): TransformationDefinition[] {
  return useEditorTransformationStore.getState().items;
}
export function getEditorTransformation(id: string): TransformationDefinition | undefined {
  return useEditorTransformationStore.getState().items.find((t) => t.id === id);
}
