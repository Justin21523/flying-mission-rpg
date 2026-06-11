import type { CharacterDefinition } from '../../types/game/character';

// Which model a character shows in a given form (pure → testable). Flight uses the plane/vehicle model
// (falling back to the robot model when none is authored); ground / landing / mission use the robot model.
// Single source so every presenter agrees — no hardcoded model ids.
export type CharacterModelForm = 'plane' | 'robot';

export function characterModelForForm(character: CharacterDefinition | undefined, form: CharacterModelForm): string | undefined {
  if (!character) return undefined;
  if (form === 'plane') return character.planeModelAssetId ?? character.modelAssetId;
  return character.modelAssetId;
}
