import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorCombatSkillStore, getCombatSkill } from '../../stores/game/editorCombatStore';
import { useCombatTargetStore, liveTargets } from '../../stores/game/combatTargetStore';
import { registerRuntimeDamageable } from '../../game/combat/enemyRuntime';
import { registerPlayerCombatant, castSkillById } from '../../game/combat/CombatDirector';
import { castCharacterSkillById } from '../../game/character-skills/CharacterSkillKitDirector';
import { robotHandle } from '../../game/destination/robotHandle';
import { SEED_ARSENAL_SKILLS, SEED_ARSENAL_ABILITIES } from '../../data/character-abilities/allCharacterAbilities';
import { useCombatStore } from '../../stores/game/useCombatStore';

// End-to-end: an arsenal ability casts through the real CombatDirector → SkillRuntime → DamageResolver and
// damages a dummy target. Also asserts the gameplay-hook wiring for support/obstacle/boss interactions.
beforeEach(() => {
  useEditorCombatSkillStore.getState().importState({ items: SEED_ARSENAL_SKILLS, seeded: true });
  useCombatTargetStore.getState().reset();
  useCombatStore.getState().resetCombat();
  robotHandle.pos.x = 0; robotHandle.pos.y = 0; robotHandle.pos.z = 0; robotHandle.heading = 0;
  registerPlayerCombatant('char_jett');
});

describe('AbilitySkillRegistryIntegration', () => {
  it("Jett's basic attack damages a dummy enemy via the shared DamageResolver", () => {
    registerRuntimeDamageable({ id: 'dmg_test', maxHp: 100, weaknessTags: [], resistanceTags: [], onHpZero: 'destroy' });
    useCombatTargetStore.getState().spawn({ id: 'd1', definitionId: 'dmg_test', hp: 100, maxHp: 100, shield: 0, maxShield: 0, x: 0, y: 0, z: 3, defeatedAt: 0, isEnemy: true });
    const outcome = castSkillById('jett_dash_slash', 'char_jett');
    expect(outcome?.ok).toBe(true);
    expect(liveTargets.find((t) => t.id === 'd1')!.hp).toBeLessThan(100);
    expect(useCombatStore.getState().lastFeedbackEvents[0]?.kind).toBeTruthy();
  });

  it('Chase scan creates a readable weakpoint feedback event', () => {
    registerRuntimeDamageable({ id: 'dmg_scan_test', maxHp: 100, weaknessTags: ['precision'], resistanceTags: [], onHpZero: 'destroy' });
    useCombatTargetStore.getState().spawn({ id: 'scan_target', definitionId: 'dmg_scan_test', hp: 100, maxHp: 100, shield: 0, maxShield: 0, x: 0, y: 0, z: 0, defeatedAt: 0, isEnemy: true });
    registerPlayerCombatant('char_chase');
    const outcome = castCharacterSkillById('char_chase', 'chase_weakpoint_scan');
    expect(outcome?.ok).toBe(true);
    expect(liveTargets.find((t) => t.id === 'scan_target')?.weakpointExposed).toBe(true);
    expect(useCombatStore.getState().lastFeedbackEvents.some((event) => event.kind === 'scan-exposed')).toBe(true);
  });

  it('every arsenal skill is registered + resolvable', () => {
    for (const a of SEED_ARSENAL_ABILITIES) expect(getCombatSkill(a.combat.skillDefinitionId), a.id).toBeTruthy();
  });

  it('gameplay hooks wire abilities to obstacles / boss weakpoints / repair / shield-break', () => {
    const a = (id: string) => SEED_ARSENAL_ABILITIES.find((x) => x.id === id)!;
    expect(a('todd_armor_bore').gameplayHooks?.effectiveAgainstObstacleTypes).toContain('cracked-wall');
    expect(a('chase_weakpoint_scan').gameplayHooks?.canExposeWeakpoint).toBe(true);
    expect(a('chase_blackbox_breaker').gameplayHooks?.canBreakShield).toBe(true);
    expect(a('donnie_auto_repair').gameplayHooks?.canRepairDevice).toBe(true);
    expect(a('todd_earth_core_breaker').gameplayHooks?.canDamageBoss).toBe(true);
  });

  it('Paul defense abilities carry a real mitigation behaviour (defenseType)', () => {
    const def = getCombatSkill('paul_shield_wall');
    expect(def?.defenseType).toBeTruthy();
    expect((def?.defenseValue ?? 0)).toBeGreaterThan(0);
  });
});
