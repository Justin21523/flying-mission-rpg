import type { CharacterDefinition } from '../../types/game/character';

// Single source of truth for the on-ground/destination character model scale. The seed default keeps the
// existing look; authors override it per-character via `modelScale` (🛩 Characters tab) and every ground
// presenter + the rescue afterimages/FX read THIS so duplicated visuals always match the current size — no
// hardcoded scale anywhere (Edit Mode decides everything).
export const GROUND_BASE_SCALE = 1.4;

export function groundCharacterScale(character: CharacterDefinition | undefined): number {
  const s = character?.modelScale;
  return s != null && s > 0 ? s : GROUND_BASE_SCALE;
}

// Ratio vs the base look — ability FX (cloud/ring/glow) multiply their authored radius by this so they frame
// the current character size.
export function groundScaleRatio(character: CharacterDefinition | undefined): number {
  return groundCharacterScale(character) / GROUND_BASE_SCALE;
}
