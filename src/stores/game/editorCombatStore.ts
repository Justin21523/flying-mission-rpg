import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { CombatStatsPreset, CombatSkillDefinition, DamageableDefinition, CombatEffectDefinition, EnemyDefinition, BossPhaseDefinition, EnemySpawnGroupDefinition } from '../../types/game/combat';
import { SEED_COMBAT_STATS } from '../../data/combat/defaultCombatStats';
import { SEED_COMBAT_SKILLS } from '../../data/combat/defaultSkills';
import { SEED_DAMAGEABLES } from '../../data/combat/damageableDefinitions';
import { SEED_COMBAT_EFFECTS } from '../../data/combat/combatEffectDefinitions';
import { SEED_ENEMY_SKILLS } from '../../data/combat/enemySkills';
import { SEED_CHARACTER_SKILLS } from '../../data/combat/characterSkills';
import { SEED_ENEMIES, SEED_BOSS_PHASES } from '../../data/combat/enemyDefinitions';
import { FULL_ENEMY_ROSTER_ADDITIONS } from '../../data/enemies/fullEnemyRoster';
import { SEED_ENEMY_SPAWN_GROUPS } from '../../data/combat/enemySpawnGroups';
import { SEED_KIT_SKILLS } from '../../data/character-skills/kitSkills';
import { SEED_KIT_EFFECTS } from '../../data/character-skills/characterSkillEffects';
import { SEED_SUPPORT_EFFECTS } from '../../data/support-combat/supportVisualEffects';
import { SEED_BOSS_EFFECTS } from '../../data/bosses/bossVisualPresets';
import { SEED_ARSENAL_SKILLS } from '../../data/character-abilities/allCharacterAbilities';
import type { RandomBossPoolDefinition } from '../../types/game/randomBoss';
import { SEED_RANDOM_BOSS_POOLS } from '../../data/bosses/randomBossPools';

// Editable Combat Runtime data (⚔ Combat tab). Four createEditorCollection stores — player stat presets,
// skills, dummy damageables, and model-first effect defs. Seed-merged at boot in seedGameContent.

export const useEditorCombatStatsStore = createEditorCollection<CombatStatsPreset>({
  storageKey: 'aero-rescue-editor-combat-stats-v1',
  seed: SEED_COMBAT_STATS,
  makeId: () => `combat_stats_${nanoid(6)}`,
});

export const useEditorCombatSkillStore = createEditorCollection<CombatSkillDefinition>({
  storageKey: 'aero-rescue-editor-combat-skill-v3',
  seed: [...SEED_COMBAT_SKILLS, ...SEED_CHARACTER_SKILLS, ...SEED_ENEMY_SKILLS, ...SEED_KIT_SKILLS, ...SEED_ARSENAL_SKILLS],
  makeId: () => `skill_${nanoid(6)}`,
});

export const useEditorEnemyStore = createEditorCollection<EnemyDefinition>({
  storageKey: 'aero-rescue-editor-combat-enemy-v1',
  seed: [...SEED_ENEMIES, ...FULL_ENEMY_ROSTER_ADDITIONS],
  makeId: () => `enemy_${nanoid(6)}`,
});

export const useEditorBossPhaseStore = createEditorCollection<BossPhaseDefinition>({
  storageKey: 'aero-rescue-editor-combat-bossphase-v1',
  seed: SEED_BOSS_PHASES,
  makeId: () => `phase_${nanoid(6)}`,
});

export const useEditorSpawnGroupStore = createEditorCollection<EnemySpawnGroupDefinition>({
  storageKey: 'aero-rescue-editor-combat-spawngroup-v1',
  seed: SEED_ENEMY_SPAWN_GROUPS,
  makeId: () => `spawn_${nanoid(6)}`,
});

export const useEditorDamageableStore = createEditorCollection<DamageableDefinition>({
  storageKey: 'aero-rescue-editor-combat-damageable-v1',
  seed: SEED_DAMAGEABLES,
  makeId: () => `combat_dummy_${nanoid(6)}`,
});

// Batch J — random-boss pools (threat-gauge encounters). Edited in the 👹 Boss tab.
export const useEditorRandomBossPoolStore = createEditorCollection<RandomBossPoolDefinition>({
  storageKey: 'aero-rescue-editor-random-boss-pool-v1',
  seed: SEED_RANDOM_BOSS_POOLS,
  makeId: () => `rbp_${nanoid(6)}`,
  // World-build W1 — bump so reconcileFromSeed adds the skyport elite candidate on existing saves.
  seedVersion: 'worldbuild-w1',
});

export const useEditorCombatEffectStore = createEditorCollection<CombatEffectDefinition>({
  storageKey: 'aero-rescue-editor-combat-effect-v2',
  seed: [...SEED_COMBAT_EFFECTS, ...SEED_KIT_EFFECTS, ...SEED_SUPPORT_EFFECTS, ...SEED_BOSS_EFFECTS],
  makeId: () => `fx_${nanoid(6)}`,
});

// ---- accessors (non-reactive reads for runtime modules) ----

export function getCombatSkills(): CombatSkillDefinition[] {
  return useEditorCombatSkillStore.getState().items;
}
export function getCombatSkill(id: string): CombatSkillDefinition | undefined {
  return useEditorCombatSkillStore.getState().items.find((s) => s.id === id);
}
export function getDamageable(id: string): DamageableDefinition | undefined {
  return useEditorDamageableStore.getState().items.find((d) => d.id === id);
}
export function getCombatEffect(id: string): CombatEffectDefinition | undefined {
  return useEditorCombatEffectStore.getState().items.find((e) => e.id === id);
}
export function getCombatStatsPreset(characterId: string | undefined): CombatStatsPreset | undefined {
  const items = useEditorCombatStatsStore.getState().items;
  return items.find((p) => p.characterId === characterId) ?? items.find((p) => p.characterId === 'default') ?? items[0];
}
// A character's player-faction skills, ordered by slot (for the skill bar).
export function getSkillsForCharacter(characterId: string | undefined): CombatSkillDefinition[] {
  if (!characterId) return [];
  const seen = new Set<string>();
  return useEditorCombatSkillStore.getState().items
    .filter((s) => s.enabled !== false && (s.faction ?? 'player') === 'player' && s.ownerCharacterId === characterId)
    .filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true))) // dedupe by id → no duplicate React keys in the upgrade panel
    .sort((a, b) => (a.slot ?? 99) - (b.slot ?? 99));
}
export function getEnemyDefs(): EnemyDefinition[] {
  return useEditorEnemyStore.getState().items;
}
export function getEnemyDef(id: string): EnemyDefinition | undefined {
  return useEditorEnemyStore.getState().items.find((e) => e.id === id);
}
export function getBossPhases(bossId: string): BossPhaseDefinition[] {
  return useEditorBossPhaseStore.getState().items.filter((p) => p.bossId === bossId).sort((a, b) => a.order - b.order);
}
export function getSpawnGroup(id: string): EnemySpawnGroupDefinition | undefined {
  return useEditorSpawnGroupStore.getState().items.find((g) => g.id === id);
}
export function getSpawnGroupsForSegment(segmentId: string): EnemySpawnGroupDefinition[] {
  return useEditorSpawnGroupStore.getState().items.filter((g) => g.segmentId === segmentId && g.enabled !== false);
}
export function getRandomBossPool(id: string | undefined): RandomBossPoolDefinition | undefined {
  if (!id) return undefined;
  return useEditorRandomBossPoolStore.getState().items.find((p) => p.id === id);
}
