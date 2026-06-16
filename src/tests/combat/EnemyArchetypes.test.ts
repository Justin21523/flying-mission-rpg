import { describe, it, expect } from 'vitest';
import { stepEnemyAi, type AiEnemy } from '../../game/combat/enemyAi';
import { validateEnemy } from '../../game/combat/enemyValidation';
import { SEED_ENEMIES } from '../../data/combat/enemyDefinitions';

const byId = (id: string) => SEED_ENEMIES.find((e) => e.id === id)!;
const mk = (state: string): AiEnemy => ({ x: 0, z: 0, aiState: state, aiData: {} });

describe('Batch I enemy archetypes (complete the 8)', () => {
  it('seeds 4 new archetype enemies that validate', () => {
    for (const id of ['glitch_spawner', 'zip_glitch', 'quake_walker', 'repair_wisp']) {
      const def = byId(id);
      expect(def, id).toBeTruthy();
      expect(validateEnemy(def).ok, `${id}: ${validateEnemy(def).errors.join(', ')}`).toBe(true);
    }
    expect(SEED_ENEMIES.length).toBeGreaterThanOrEqual(11);
  });

  it('spawner-bug summons minions on interval', () => {
    const step = stepEnemyAi(mk('idle'), byId('glitch_spawner'), { playerX: 3, playerZ: 0, nowS: 1, dt: 0.1 });
    expect(step?.action).toBe('spawn-minions');
  });

  it('zip-glitch dashes evasively', () => {
    const step = stepEnemyAi(mk('idle'), byId('zip_glitch'), { playerX: 5, playerZ: 0, nowS: 1, dt: 0.1 });
    expect(step?.action).toBe('dash');
  });

  it('quake-walker telegraphs (interruptible) then slams', () => {
    const def = byId('quake_walker');
    const e = mk('chasing');
    const s1 = stepEnemyAi(e, def, { playerX: 2, playerZ: 0, nowS: 1, dt: 0.1 });
    expect(e.aiState).toBe('quake-windup');
    expect(s1?.action).toBe('none');
    const s2 = stepEnemyAi(e, def, { playerX: 2, playerZ: 0, nowS: 1 + def.quake!.windupSeconds + 0.1, dt: 0.1 });
    expect(s2?.action).toBe('quake-slam');
  });

  it('quake-walker windup is cancelled by a stun (interrupt)', () => {
    const def = byId('quake_walker');
    const e = mk('chasing');
    stepEnemyAi(e, def, { playerX: 2, playerZ: 0, nowS: 1, dt: 0.1 }); // → quake-windup
    e.aiData!.stunUntil = 100;
    const s = stepEnemyAi(e, def, { playerX: 2, playerZ: 0, nowS: 2, dt: 0.1 });
    expect(s?.action).toBe('none');
    expect(e.aiState).toBe('chasing');
  });

  it('repair-wisp heals an ally on interval', () => {
    const step = stepEnemyAi(mk('idle'), byId('repair_wisp'), { playerX: 20, playerZ: 0, nowS: 1, dt: 0.1 });
    expect(step?.action).toBe('heal-ally');
  });
});
