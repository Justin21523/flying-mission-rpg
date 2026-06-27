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

// ---- Wave 2 tactical archetypes ----
const dodger = baseDef({ archetype: 'dodger', dodger: { approachSpeed: 3, meleeDamage: 12, projectileDetectRange: 8, evadeSpeed: 6, evadeDurationSeconds: 0.35, evadeCooldownSeconds: 1.6 } });
const flanker = baseDef({ archetype: 'flanker', flanker: { approachSpeed: 3, flankAngleDegrees: 55, meleeDamage: 14, attackRange: 3 } });
const bomber = baseDef({ archetype: 'bomber', bomber: { rushSpeed: 5, armRange: 3, fuseSeconds: 1, blastRadius: 5, blastDamage: 30 } });
const buffer = baseDef({ archetype: 'buffer', buffer: { buffIntervalSeconds: 4, shieldAmount: 30, buffRange: 12, keepDistance: 12 } });
const suppressor = baseDef({ archetype: 'suppressor', aiBehavior: 'kiter', suppressor: { projectileSkillId: 'en_fireball', fireIntervalSeconds: 0.9, preferredRange: 14 } });

describe('Dodger AI', () => {
  it('sidesteps an incoming player projectile (perpendicular to its heading)', () => {
    const e: AiEnemy = { x: 0, z: 0, aiData: {} };
    // a projectile moving in +Z passing near the dodger → evade laterally (along X)
    const s = stepEnemyAi(e, dodger, { playerX: 0, playerZ: 20, nowS: 0, dt: 0.1, threats: [{ x: 0, z: -2, vx: 0, vz: 10 }] })!;
    expect(s.state).toBe('evading');
    const move = stepEnemyAi(e, dodger, { playerX: 0, playerZ: 20, nowS: 0.05, dt: 0.1, threats: [] })!;
    expect(Math.abs(move.moveX)).toBeGreaterThan(0);
    expect(Math.abs(move.moveZ)).toBeLessThan(1e-6);
  });
  it('melee-hits when adjacent with no threat', () => {
    const e: AiEnemy = { x: 0, z: 0, aiData: {} };
    const s = stepEnemyAi(e, dodger, { playerX: 0, playerZ: 1, nowS: 0, dt: 0.1, threats: [] })!;
    expect(s.action).toBe('melee-hit');
  });
});

describe('Flanker AI', () => {
  it('approaches off-axis while far, and melee-hits in range', () => {
    const e: AiEnemy = { x: 0, z: 0, aiData: {} };
    const far = stepEnemyAi(e, flanker, { playerX: 0, playerZ: 20, nowS: 0, dt: 0.1 })!;
    expect(far.state).toBe('flanking');
    expect(Math.abs(far.moveX)).toBeGreaterThan(0); // not a straight-line approach
    const near = stepEnemyAi(e, flanker, { playerX: 0, playerZ: 2, nowS: 0, dt: 0.1 })!;
    expect(near.action).toBe('melee-hit');
  });
});

describe('Bomber AI', () => {
  it('rushes → arms → self-destructs', () => {
    const e: AiEnemy = { x: 0, z: 0, aiData: {} };
    let s = stepEnemyAi(e, bomber, { playerX: 0, playerZ: 10, nowS: 0, dt: 0.1 })!;
    expect(s.state).toBe('chasing');
    s = stepEnemyAi(e, bomber, { playerX: 0, playerZ: 2, nowS: 1, dt: 0.1 })!; // within armRange → arming
    expect(s.state).toBe('arming');
    s = stepEnemyAi(e, bomber, { playerX: 0, playerZ: 2, nowS: 2.5, dt: 0.1 })!; // fuse elapsed
    expect(s.action).toBe('self-destruct');
  });
});

describe('Suppressor AI', () => {
  it('fires on its interval while holding range', () => {
    const e: AiEnemy = { x: 0, z: 0, aiData: {} };
    const s = stepEnemyAi(e, suppressor, { playerX: 0, playerZ: 14, nowS: 0, dt: 0.1 })!;
    expect(s.action).toBe('fire');
    const s2 = stepEnemyAi(e, suppressor, { playerX: 0, playerZ: 14, nowS: 0.1, dt: 0.1 })!;
    expect(s2.action).toBe('none'); // within fire interval
  });
});

describe('Buffer AI', () => {
  it('emits buff-allies on its interval and keeps distance', () => {
    const e: AiEnemy = { x: 0, z: 0, aiData: {} };
    const s = stepEnemyAi(e, buffer, { playerX: 0, playerZ: 6, nowS: 0, dt: 0.1 })!; // too close → backs off
    expect(s.action).toBe('buff-allies');
    expect(s.moveZ).toBeLessThan(0); // moving away from the player (+Z)
  });
});
