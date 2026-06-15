import { describe, it, expect } from 'vitest';
import { executeAbility, type SupportAbilityDeps, type SupportCastContext } from '../../game/support-combat/SupportAbilityRuntime';
import { SEED_SUPPORT_ABILITIES } from '../../data/support-combat/supportCombatAbilities';
import type { CombatTarget } from '../../stores/game/combatTargetStore';
import type { DamageEventTemplate } from '../../types/game/combat';

const ability = (id: string) => SEED_SUPPORT_ABILITIES.find((a) => a.id === id)!;

interface Capture {
  damage: { id: string; tpl: DamageEventTemplate }[];
  repaired: { id: string; amount: number }[];
  scanned: string[];
  taunts: { ids: string[]; seconds: number }[];
  effects: number;
  heal: number;
  visuals: string[];
}

function makeDeps(targets: CombatTarget[]): { deps: SupportAbilityDeps; cap: Capture } {
  const cap: Capture = { damage: [], repaired: [], scanned: [], taunts: [], effects: 0, heal: 0, visuals: [] };
  const deps: SupportAbilityDeps = {
    nowMs: 1000,
    damageTarget: (id, tpl) => cap.damage.push({ id, tpl }),
    repairObstacle: (oid, amount) => { cap.repaired.push({ id: oid, amount }); return true; },
    getTarget: (id) => targets.find((t) => t.id === id),
    markScanned: (id) => cap.scanned.push(id),
    stunTarget: () => {},
    bumpTargets: () => {},
    applyTaunt: (ids, _c, seconds) => { cap.taunts.push({ ids, seconds }); return 'decoy_0'; },
    addActiveEffect: () => { cap.effects += 1; },
    healPlayer: (amt) => { cap.heal += amt; },
    playVisual: (defId) => cap.visuals.push(defId),
  };
  return { deps, cap };
}

const ctx = (targetIds: string[], primaryId?: string): SupportCastContext => ({
  center: { x: 0, z: 0 }, playerX: 0, playerZ: 0, headingRad: 0, targetIds, primaryId,
});

const enemy = (id: string): CombatTarget => ({ id, definitionId: 'd', hp: 50, maxHp: 50, shield: 0, maxShield: 0, x: 0, y: 0, z: 0, defeatedAt: 0, isEnemy: true });
const device = (id: string): CombatTarget => ({ id, definitionId: 'd', hp: 1, maxHp: 1, shield: 0, maxShield: 0, x: 0, y: 0, z: 0, defeatedAt: 0, isObstacle: true, obstacleId: id });

describe('SupportAbilityRuntime.executeAbility', () => {
  it('Strike deals a damage event through the seam', () => {
    const { deps, cap } = makeDeps([enemy('e1'), enemy('e2')]);
    const out = executeAbility(ability('support_strike_jett'), ctx(['e1', 'e2'], 'e1'), deps);
    expect(out.damageHits).toBe(2);
    expect(cap.damage[0].tpl.damageType).toBe('impact');
    expect(cap.visuals).toContain('fx_strike_ring');
  });

  it('Shield registers an active effect', () => {
    const { deps, cap } = makeDeps([]);
    const out = executeAbility(ability('support_shield_paul'), ctx(['player'], 'player'), deps);
    expect(out.shieldApplied).toBe(true);
    expect(cap.effects).toBe(1);
  });

  it('Repair routes to ObstacleDirector + reports the device', () => {
    const { deps, cap } = makeDeps([device('corrupted_device_01')]);
    const out = executeAbility(ability('support_repair_donnie'), ctx(['corrupted_device_01'], 'corrupted_device_01'), deps);
    expect(cap.repaired[0]).toEqual({ id: 'corrupted_device_01', amount: 100 });
    expect(out.repairedDeviceIds).toContain('corrupted_device_01');
    expect(cap.heal).toBe(25);
  });

  it('Scan marks targets scanned', () => {
    const { deps, cap } = makeDeps([enemy('e1')]);
    const out = executeAbility(ability('support_scan_chase'), ctx(['e1'], 'e1'), deps);
    expect(cap.scanned).toContain('e1');
    expect(out.scannedTargetIds).toContain('e1');
  });

  it('Taunt spawns a decoy + returns its id', () => {
    const { deps, cap } = makeDeps([enemy('e1'), enemy('e2')]);
    const out = executeAbility(ability('support_taunt_paul'), ctx(['e1', 'e2']), deps);
    expect(out.decoyId).toBe('decoy_0');
    expect(cap.taunts[0].ids.sort()).toEqual(['e1', 'e2']);
  });

  it('Break uses a shield-break damage template', () => {
    const { deps, cap } = makeDeps([device('energy_barrier_01')]);
    executeAbility(ability('support_break_donnie'), ctx(['energy_barrier_01'], 'energy_barrier_01'), deps);
    expect(cap.damage[0].tpl.damageType).toBe('shield-break');
    expect(cap.damage[0].tpl.attackTags).toContain('shield-break');
  });
});
