import { describe, expect, it } from 'vitest';
import { SEED_SUPPORT_AI_PROFILES } from '../../../data/game/support';
import type { CharacterPresence } from '../../../types/game/support';
import { applySeparation } from './CompanionAvoidanceController';
import { updateCompanionAi } from './CompanionAiController';
import { moveToward2D } from './CompanionNavigationAgent';

const ai = SEED_SUPPORT_AI_PROFILES[0];

const companion: CharacterPresence = {
  characterId: 'char_paul',
  tier: 'active',
  aiState: 'follow-player',
  position: [12, 0.8, 0],
  heading: 0,
  controllerActive: false,
  colliderActive: true,
};

describe('CompanionAiController', () => {
  it('moves follow-player companions toward their follow slot', () => {
    const next = updateCompanionAi(companion, ai, { x: 0, z: 0 }, [], 0, 1, false);
    expect(next.position[0]).toBeLessThan(companion.position[0]);
    expect(next.aiState).toBe('follow-player');
  });

  it('keeps remote companions unticked', () => {
    const remote = { ...companion, tier: 'remote' as const };
    expect(updateCompanionAi(remote, ai, { x: 0, z: 0 }, [], 0, 1, false)).toBe(remote);
  });

  it('produces separation when companions overlap', () => {
    const separated = applySeparation({ x: 0, z: 0 }, [{ x: 0.2, z: 0 }], 1.4, 0.5);
    expect(separated.x).toBeLessThan(0);
  });

  it('does not overshoot while steering to a target', () => {
    expect(moveToward2D({ x: 0, z: 0 }, { x: 1, z: 0 }, 10, 1)).toEqual({ x: 1, z: 0 });
  });

  it('enters assist-objective state when an assist task is available', () => {
    const next = updateCompanionAi(companion, ai, { x: 0, z: 0 }, [], 0, 0.1, true);
    expect(next.aiState).toBe('assist-objective');
  });
});
