import { describe, it, expect, beforeEach } from 'vitest';
import * as Weakpoint from '../../game/bosses/BossWeakpointController';
import { SEED_BOSS_WEAKPOINTS } from '../../data/bosses/bossWeakpointDefinitions';
import { useCombatTargetStore, liveTargets } from '../../stores/game/combatTargetStore';

const wpCore = SEED_BOSS_WEAKPOINTS.find((w) => w.id === 'wp_core')!;
const wpTarget = () => liveTargets.find((t) => t.bossWeakpointId === 'wp_core')!;

beforeEach(() => {
  useCombatTargetStore.getState().reset();
  Weakpoint.reset();
});

describe('BossWeakpointController', () => {
  it('pins HP while hidden (invulnerable)', () => {
    Weakpoint.spawnWeakpoint(wpCore, { x: 0, y: 0, z: 0 });
    const t = wpTarget();
    t.hp = 10; // simulate a hit
    Weakpoint.update(false, 100);
    expect(t.hp).toBe(t.maxHp); // damage undone while hidden
    expect(Weakpoint.isExposed('wp_core', 100)).toBe(false);
  });

  it('exposes on scan', () => {
    Weakpoint.spawnWeakpoint(wpCore, { x: 0, y: 0, z: 0 });
    wpTarget().scanned = true;
    Weakpoint.update(false, 100);
    expect(Weakpoint.isExposed('wp_core', 100)).toBe(true);
    expect(Weakpoint.visualState('wp_core')).toBe('exposed');
  });

  it('exposes on shield break', () => {
    Weakpoint.spawnWeakpoint(wpCore, { x: 0, y: 0, z: 0 });
    Weakpoint.update(true, 100); // bossShieldBroken
    expect(Weakpoint.isExposed('wp_core', 100)).toBe(true);
  });

  it('destroying an exposed weakpoint returns its effect', () => {
    Weakpoint.spawnWeakpoint(wpCore, { x: 0, y: 0, z: 0 });
    Weakpoint.exposeWeakpoint('wp_core', 8, 100);
    wpTarget().hp = 0;
    const events = Weakpoint.update(false, 101);
    expect(events).toHaveLength(1);
    expect(events[0].weakpointId).toBe('wp_core');
    expect(events[0].effect.damageBossAmount).toBe(150);
    expect(Weakpoint.visualState('wp_core')).toBe('destroyed');
  });
});
