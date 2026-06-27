import { useCombatTargetStore, type CombatTarget } from '../../stores/game/combatTargetStore';
import { getDamageable, getEnemyDef } from '../../stores/game/editorCombatStore';
import type { DamageableDefinition, EnemyDefinition, BossPhaseDefinition } from '../../types/game/combat';

// Enemy/boss runtime helpers (no CombatDirector import → no cycle). Spawns enemies into the shared combat
// target registry and synthesises a DamageableDefinition from each EnemyDefinition so player skills resolve
// weakness/resistance against them. Boss-phase selection is a pure helper (also used by tests).

let uid = 0;

export function synthDamageable(def: EnemyDefinition): DamageableDefinition {
  return {
    id: def.id,
    maxHp: def.maxHp,
    maxShield: def.maxShield,
    weaknessTags: def.weaknessTags,
    resistanceTags: def.resistanceTags,
    armorType: def.maxShield ? 'shielded' : 'medium',
    shieldRules: def.maxShield ? { enabled: true, shieldHp: def.maxShield, shieldWeaknessTags: ['shield-break'], shieldBreakStaggerSeconds: 1.2 } : undefined,
    onHpZero: 'destroy',
    editorMeta: { displayName: def.name, color: def.color },
  };
}

// Runtime damageables registered by other systems (e.g. ObstacleDirector) so their proxy targets resolve
// weakness/resistance through the shared DamageResolver without polluting the editor store.
const runtimeDamageables: Record<string, DamageableDefinition> = {};
export function registerRuntimeDamageable(def: DamageableDefinition): void { runtimeDamageables[def.id] = def; }
export function clearRuntimeDamageables(): void { for (const k of Object.keys(runtimeDamageables)) delete runtimeDamageables[k]; }

// A target's damageable: an authored dummy def, a registered runtime def (obstacles), else synthesised from
// its enemy def.
export function getEffectiveDamageable(definitionId: string): DamageableDefinition | undefined {
  const authored = getDamageable(definitionId);
  if (authored) return authored;
  if (runtimeDamageables[definitionId]) return runtimeDamageables[definitionId];
  const enemy = getEnemyDef(definitionId);
  return enemy ? synthDamageable(enemy) : undefined;
}

export function spawnEnemyFromDef(def: EnemyDefinition, x: number, z: number): CombatTarget {
  const shieldHp = def.maxShield ?? def.shield?.shieldHp ?? 0;
  const target: CombatTarget = {
    id: `enemy_${uid++}`,
    definitionId: def.id,
    hp: def.maxHp, maxHp: def.maxHp,
    shield: shieldHp, maxShield: shieldHp,
    x, y: 0, z, defeatedAt: 0,
    isEnemy: true,
    enemyDefId: def.id,
    modelAssetId: def.modelAssetId,
    scale: def.scale,
    color: def.color,
    moveSpeed: def.moveSpeed,
    aggroRange: def.aggroRange,
    attackRange: def.attackRange,
    aiBehavior: def.aiBehavior,
    skillIds: [...def.skillIds],
    skillCooldowns: {},
    bossId: def.isBoss ? def.bossId : undefined,
    bossPhaseIndex: def.isBoss ? 0 : undefined,
    // Batch C — archetype AI runtime.
    archetype: def.archetype,
    aiState: 'idle',
    aiData: {},
    facingRad: 0,
    shieldBroken: false,
    // Wave 2 — poise meter (only enemies with a configured max participate).
    poiseValue: def.poise ? 0 : undefined,
    maxPoise: def.poise?.max,
  };
  useCombatTargetStore.getState().spawn(target);
  return target;
}

// The active boss phase for a given hp fraction (1 = full). Phases entered as hp drops below their threshold;
// returns the deepest-entered phase. Pure.
export function bossActivePhase(phases: BossPhaseDefinition[], hpFraction: number): BossPhaseDefinition | undefined {
  const sorted = [...phases].sort((a, b) => a.order - b.order);
  let active: BossPhaseDefinition | undefined;
  for (const p of sorted) {
    if (hpFraction <= p.hpThresholdPct) active = p;
  }
  return active ?? sorted[0];
}
