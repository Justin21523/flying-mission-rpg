import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { CombatStatsPreset, CombatSkillDefinition, DamageableDefinition, CombatEffectDefinition } from '../../types/game/combat';
import { SEED_COMBAT_STATS } from '../../data/combat/defaultCombatStats';
import { SEED_COMBAT_SKILLS } from '../../data/combat/defaultSkills';
import { SEED_DAMAGEABLES } from '../../data/combat/damageableDefinitions';
import { SEED_COMBAT_EFFECTS } from '../../data/combat/combatEffectDefinitions';

// Editable Combat Runtime data (⚔ Combat tab). Four createEditorCollection stores — player stat presets,
// skills, dummy damageables, and model-first effect defs. Seed-merged at boot in seedGameContent.

export const useEditorCombatStatsStore = createEditorCollection<CombatStatsPreset>({
  storageKey: 'aero-rescue-editor-combat-stats-v1',
  seed: SEED_COMBAT_STATS,
  makeId: () => `combat_stats_${nanoid(6)}`,
});

export const useEditorCombatSkillStore = createEditorCollection<CombatSkillDefinition>({
  storageKey: 'aero-rescue-editor-combat-skill-v1',
  seed: SEED_COMBAT_SKILLS,
  makeId: () => `skill_${nanoid(6)}`,
});

export const useEditorDamageableStore = createEditorCollection<DamageableDefinition>({
  storageKey: 'aero-rescue-editor-combat-damageable-v1',
  seed: SEED_DAMAGEABLES,
  makeId: () => `combat_dummy_${nanoid(6)}`,
});

export const useEditorCombatEffectStore = createEditorCollection<CombatEffectDefinition>({
  storageKey: 'aero-rescue-editor-combat-effect-v1',
  seed: SEED_COMBAT_EFFECTS,
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
