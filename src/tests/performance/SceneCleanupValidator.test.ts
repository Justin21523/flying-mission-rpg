import { beforeEach, describe, expect, it } from 'vitest';
import { validateSceneCleanup } from '../../game/performance/SceneCleanupValidator';
import { useCombatTargetStore } from '../../stores/game/combatTargetStore';
import { useCombatSpawnStore } from '../../stores/game/combatSpawnStore';

describe('SceneCleanupValidator', () => {
  beforeEach(() => { useCombatTargetStore.getState().reset(); useCombatSpawnStore.getState().reset(); });

  it('passes when no transient objects remain', () => {
    expect(validateSceneCleanup().ok).toBe(true);
  });

  it('detects leaked enemy placeholder targets', () => {
    useCombatTargetStore.getState().spawn({
      id: 'leaked_enemy',
      definitionId: 'crusher_drone',
      hp: 10,
      maxHp: 10,
      shield: 0,
      maxShield: 0,
      x: 0,
      y: 0,
      z: 0,
      defeatedAt: 0,
      isEnemy: true,
    });
    const report = validateSceneCleanup();
    expect(report.ok).toBe(false);
    expect(report.warnings.join(' ')).toContain('Active enemies');
  });
});
