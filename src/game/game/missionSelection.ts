import type { MissionDefinition } from '../../types/game/mission';
import type { CharacterDefinition } from '../../types/game/character';

// Pure helpers for Mission Control (kept out of components so they're unit-testable). The Batch 10
// rule-based generator will replace pickTestMissionId with a real pipeline; for now it just samples the
// existing authored pool.
export function pickTestMissionId(missions: MissionDefinition[], excludeId?: string): string | null {
  if (missions.length === 0) return null;
  const pool = excludeId ? missions.filter((m) => m.id !== excludeId) : missions;
  const list = pool.length > 0 ? pool : missions;
  const i = Math.floor(Math.random() * list.length);
  return list[i].id;
}

// A character is "recommended" for a mission if the mission names it explicitly OR the character's
// suitability covers the mission type.
export function isCharacterRecommended(character: CharacterDefinition, mission: MissionDefinition | null): boolean {
  if (!mission) return false;
  if (mission.recommendedCharacterIds.includes(character.id)) return true;
  return character.missionSuitability.includes(mission.type);
}
