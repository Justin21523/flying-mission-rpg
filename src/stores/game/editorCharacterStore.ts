import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { CharacterDefinition } from '../../types/game/character';
import { SEED_CHARACTERS } from '../../data/game/characters';
import { getModelAsset } from '../../data/modelLibrary';
import { poseModelsFor, primaryPlaneModelAssetIdFor, primaryRobotModelAssetIdFor } from '../../data/game/heroModels';

export const useEditorCharacterStore = createEditorCollection<CharacterDefinition>({
  storageKey: 'aero-rescue-editor-character-v4',
  seed: SEED_CHARACTERS,
  makeId: () => `char_${nanoid(6)}`,
});

export function getEditorCharacters(): CharacterDefinition[] {
  return useEditorCharacterStore.getState().items;
}
export function getEditorCharacter(id: string): CharacterDefinition | undefined {
  return useEditorCharacterStore.getState().items.find((c) => c.id === id);
}

function samePoseModels(a: CharacterDefinition['poseModels'], b: CharacterDefinition['poseModels']): boolean {
  if ((a?.length ?? 0) !== (b?.length ?? 0)) return false;
  return (a ?? []).every((pose, index) => {
    const next = b?.[index];
    return !!next && pose.id === next.id && pose.label === next.label && pose.assetId === next.assetId;
  });
}

function missingOrUnknownAsset(assetId: string | undefined): boolean {
  return !assetId || !getModelAsset(assetId);
}

export function syncAutoCharacterModelsFromLibrary(): void {
  const store = useEditorCharacterStore.getState();
  for (const character of store.items) {
    const poseModels = poseModelsFor(character.id);
    if (poseModels.length === 0) continue;

    const patch: Partial<CharacterDefinition> = {};
    if (!samePoseModels(character.poseModels, poseModels)) patch.poseModels = poseModels;

    const robotAssetId = primaryRobotModelAssetIdFor(character.id);
    if (robotAssetId && missingOrUnknownAsset(character.modelAssetId)) patch.modelAssetId = robotAssetId;

    const planeAssetId = primaryPlaneModelAssetIdFor(character.id);
    if (planeAssetId && missingOrUnknownAsset(character.planeModelAssetId)) patch.planeModelAssetId = planeAssetId;

    if (Object.keys(patch).length > 0) store.update(character.id, patch);
  }
}
