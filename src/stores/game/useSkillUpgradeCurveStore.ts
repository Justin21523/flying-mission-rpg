import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { SkillUpgradeLevelDefinition } from '../../types/game/skillUpgrade';
import { SEED_SKILL_UPGRADE_CURVE } from '../../data/progression/skillUpgradeCurve';

// Batch L — editable skill-upgrade curve (⬆ Upgrades tab). One item per level; runtime reads it sorted.
export const useSkillUpgradeCurveStore = createEditorCollection<SkillUpgradeLevelDefinition>({
  storageKey: 'aero-rescue-skill-upgrade-curve-v1',
  seed: SEED_SKILL_UPGRADE_CURVE,
  makeId: () => `sklvl_${nanoid(6)}`,
});

export function getUpgradeCurve(): SkillUpgradeLevelDefinition[] {
  return [...useSkillUpgradeCurveStore.getState().items].sort((a, b) => a.level - b.level);
}

export function getMaxSkillLevel(): number {
  const c = getUpgradeCurve();
  return c.length ? c[c.length - 1].level : 0;
}
