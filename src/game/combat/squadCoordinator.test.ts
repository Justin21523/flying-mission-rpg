import { describe, it, expect, beforeEach } from 'vitest';
import { applyRoleNudge, applySquadTactics } from './squadCoordinator';
import { useEditorSpawnGroupStore } from '../../stores/game/editorCombatStore';
import type { CombatTarget } from '../../stores/game/combatTargetStore';
import type { EnemySpawnGroupDefinition } from '../../types/game/combat';

function enemy(over: Partial<CombatTarget>): CombatTarget {
  return { id: 'e', definitionId: 'd', hp: 50, maxHp: 50, shield: 0, maxShield: 0, x: 0, y: 0, z: 0, defeatedAt: 0, isEnemy: true, ...over };
}

describe('applyRoleNudge', () => {
  it('ranged-keep-distance backs away when too close', () => {
    const e = enemy({ x: 5, z: 0 });
    applyRoleNudge(e, 'ranged-keep-distance', 0, 0);
    expect(e.x).toBeGreaterThan(5); // pushed away from the player at origin
  });
  it('melee-swarm closes the gap', () => {
    const e = enemy({ x: 5, z: 0 });
    applyRoleNudge(e, 'melee-swarm', 0, 0);
    expect(e.x).toBeLessThan(5);
  });
  it('flank drifts perpendicular to the player line', () => {
    const e = enemy({ x: 5, z: 0 });
    applyRoleNudge(e, 'flank', 0, 0);
    expect(Math.abs(e.z)).toBeGreaterThan(0); // sideways drift
  });
});

describe('applySquadTactics', () => {
  beforeEach(() => {
    const group: EnemySpawnGroupDefinition = {
      id: 'grp_test', zoneId: 'z', segmentId: 's', spawnMode: 'debug-only',
      enemies: [{ enemyDefinitionId: 'suppressor_node', count: 1 }],
      completeWhenAllDefeated: false, enabled: true,
      squadPolicy: { enabled: true, roles: [{ enemyDefinitionId: 'suppressor_node', role: 'ranged-keep-distance' }] },
    };
    useEditorSpawnGroupStore.getState().importState({ items: [group] });
  });

  it('nudges a roled enemy per its group policy', () => {
    const e = enemy({ x: 4, z: 0, spawnGroupId: 'grp_test', enemyDefId: 'suppressor_node' });
    applySquadTactics([e], 0, 0);
    expect(e.x).toBeGreaterThan(4); // ranged role backed away
  });

  it('is a no-op for enemies whose group has no policy', () => {
    useEditorSpawnGroupStore.getState().importState({ items: [] });
    const e = enemy({ x: 4, z: 0, spawnGroupId: 'grp_test', enemyDefId: 'suppressor_node' });
    applySquadTactics([e], 0, 0);
    expect(e.x).toBe(4);
  });
});
