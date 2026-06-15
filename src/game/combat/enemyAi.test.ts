import { describe, it, expect } from 'vitest';
import { stepEnemyAi, type AiEnemy } from './enemyAi';
import type { EnemyDefinition } from '../../types/game/combat';

const baseDef = (over: Partial<EnemyDefinition>): EnemyDefinition => ({
  id: 'e', name: 'e', maxHp: 100, moveSpeed: 3, aggroRange: 20, attackRange: 4, aiBehavior: 'chaser',
  skillIds: [], weaknessTags: [], resistanceTags: [], enabled: true, ...over,
});

const crusher = baseDef({ archetype: 'crusher-drone', charge: { windupSeconds: 0.5, chargeSpeed: 12, chargeDurationSeconds: 0.8, recoverSeconds: 1, damageAmount: 16 } });
const turret = baseDef({ archetype: 'pulse-turret', moveSpeed: 0, turret: { rotationSpeed: 10, projectileSkillId: 'en_fireball', fireCooldownSeconds: 2 } });
const shield = baseDef({ archetype: 'shield-carrier', shield: { arcDegrees: 140, shieldHp: 80, breakStaggerSeconds: 2, bashDamage: 14, bashRange: 4 } });

describe('Crusher Drone AI', () => {
  it('walks idle → chasing → charge-windup → charging → recovering', () => {
    const e: AiEnemy = { x: 0, z: 0, aiData: {} };
    // far away → idle stays idle
    let s = stepEnemyAi(e, crusher, { playerX: 50, playerZ: 0, nowS: 0, dt: 0.1 })!;
    expect(s.state).toBe('idle');
    // within aggro → chasing
    s = stepEnemyAi(e, crusher, { playerX: 10, playerZ: 0, nowS: 0, dt: 0.1 })!;
    expect(s.state).toBe('chasing');
    // within attack range → windup
    s = stepEnemyAi(e, crusher, { playerX: 1, playerZ: 0, nowS: 1, dt: 0.1 })!;
    expect(s.state).toBe('charge-windup');
    // windup elapses → charging
    s = stepEnemyAi(e, crusher, { playerX: 1, playerZ: 0, nowS: 2, dt: 0.1 })!;
    expect(s.state).toBe('charging');
    // reaching the player emits a charge-hit and recovers
    s = stepEnemyAi(e, crusher, { playerX: e.x, playerZ: e.z, nowS: 2.1, dt: 0.1 })!;
    expect(s.action).toBe('charge-hit');
    expect(s.state).toBe('recovering');
  });
});

describe('Pulse Turret AI', () => {
  it('fires when aligned + off cooldown, then enters cooldown', () => {
    const e: AiEnemy = { x: 0, z: 0, facingRad: 0, aiData: {} };
    // player straight ahead (+Z) → already aligned → fires
    const s = stepEnemyAi(e, turret, { playerX: 0, playerZ: 10, nowS: 0, dt: 0.1 })!;
    expect(s.action).toBe('fire');
    // next immediate step is on cooldown (no fire)
    const s2 = stepEnemyAi(e, turret, { playerX: 0, playerZ: 10, nowS: 0.1, dt: 0.1 })!;
    expect(s2.action).toBe('none');
  });
});

describe('Shield Carrier AI', () => {
  it('bashes in range and goes stunned when shield broken', () => {
    const e: AiEnemy = { x: 0, z: 0, aiData: {} };
    const bash = stepEnemyAi(e, shield, { playerX: 0, playerZ: 2, nowS: 0, dt: 0.1 })!;
    expect(bash.action).toBe('bash');
    // shield broken + within stun window → stunned, no action
    e.shieldBroken = true; e.aiData!.stunUntil = 5;
    const st = stepEnemyAi(e, shield, { playerX: 0, playerZ: 2, nowS: 1, dt: 0.1 })!;
    expect(st.state).toBe('stunned');
    expect(st.action).toBe('none');
  });
});
