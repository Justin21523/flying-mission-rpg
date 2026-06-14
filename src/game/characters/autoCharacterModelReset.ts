import { primaryPlaneModelAssetIdFor, primaryRobotModelAssetIdFor } from '../../data/game/heroModels';
import type { CharacterDefinition } from '../../types/game/character';

export function resetRobotModelToAuto(characterId: string): Partial<CharacterDefinition> {
  const modelAssetId = primaryRobotModelAssetIdFor(characterId);
  return modelAssetId ? { modelAssetId } : {};
}

export function resetPlaneModelToAuto(characterId: string): Partial<CharacterDefinition> {
  return { planeModelAssetId: primaryPlaneModelAssetIdFor(characterId) };
}
