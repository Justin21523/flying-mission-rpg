import { describe, it, expect, beforeEach } from 'vitest';
import { spawnGroup, isGroupCleared, groupRemaining, resetSpawnDirector } from './enemySpawnDirector';
import { useEditorEnemyStore, useEditorSpawnGroupStore } from '../../stores/game/editorCombatStore';
import { useCombatTargetStore, liveTargets } from '../../stores/game/combatTargetStore';
import { validateEnemy, validateSpawnGroup } from './enemyValidation';
import { SEED_ENEMIES } from '../../data/combat/enemyDefinitions';
import { SEED_ENEMY_SPAWN_GROUPS } from '../../data/combat/enemySpawnGroups';

beforeEach(() => {
  useEditorEnemyStore.getState().importState({ items: SEED_ENEMIES });
  useEditorSpawnGroupStore.getState().importState({ items: SEED_ENEMY_SPAWN_GROUPS });
  useCombatTargetStore.getState().reset();
  resetSpawnDirector();
});

describe('enemySpawnDirector', () => {
  it('spawns the group enemy count and is not cleared until all defeated', () => {
    expect(spawnGroup('signal_yard_wave_01', 0, 0)).toBe(true);
    // crusher_drone x1 + pulse_turret x1 = 2 enemies
    expect(liveTargets.filter((t) => t.isEnemy).length).toBe(2);
    expect(isGroupCleared('signal_yard_wave_01')).toBe(false);
    expect(groupRemaining('signal_yard_wave_01')).toEqual({ remaining: 2, total: 2 });

    // defeat both
    for (const t of liveTargets) { t.hp = 0; t.defeatedAt = 1; }
    expect(isGroupCleared('signal_yard_wave_01')).toBe(true);
    expect(groupRemaining('signal_yard_wave_01').remaining).toBe(0);
  });

  it('does not double-spawn an already-active group', () => {
    spawnGroup('signal_yard_wave_01', 0, 0);
    expect(spawnGroup('signal_yard_wave_01', 0, 0)).toBe(false);
  });
});

describe('enemyValidation', () => {
  it('accepts the archetype seeds; rejects a crusher without charge config', () => {
    for (const e of SEED_ENEMIES) expect(validateEnemy(e).ok, e.id).toBe(true);
    expect(validateEnemy({ ...SEED_ENEMIES[0], archetype: 'crusher-drone', charge: undefined }).ok).toBe(false);
  });
  it('validates a spawn group against the enemy roster', () => {
    const ok = validateSpawnGroup(SEED_ENEMY_SPAWN_GROUPS[0], (id) => SEED_ENEMIES.some((e) => e.id === id));
    expect(ok.ok).toBe(true);
    const bad = validateSpawnGroup({ ...SEED_ENEMY_SPAWN_GROUPS[0], enemies: [{ enemyDefinitionId: 'nope', count: 1 }] }, () => false);
    expect(bad.ok).toBe(false);
  });
});
