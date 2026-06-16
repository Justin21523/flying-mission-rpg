import type { SkillSlotName } from '../../types/game/characterKit';
import type { AbilityLoadoutDefinition } from '../../types/abilityArsenalTypes';
import { getKitForCharacter } from '../../stores/game/editorCharacterKitStore';
import { getLoadout } from '../../stores/game/useAbilityLoadoutStore';
import { getAbilityBySlot } from '../../stores/game/useCinematicAbilityEditorStore';
import { getCombatSkill } from '../../stores/game/editorCombatStore';
import { useCharacterSkillStore } from '../../stores/game/useCharacterSkillStore';
import { useCombatStore } from '../../stores/game/useCombatStore';
import { castSkillById, activeCombatantId, registerPlayerCombatant } from '../combat/CombatDirector';
import { detectCombo } from './CharacterComboController';
import { applyUtilityFromCast } from './CharacterUtilityResolver';
import { accrueSyncFromAction } from '../support-combat/PartnerFusionDirector';
import type { SkillCastOutcome } from '../combat/SkillRuntime';

// Entry point for character-kit skills (Batch D-kits). Resolves a named slot → skill id via the active kit
// and casts through CombatDirector.castSkillById (NO separate damage logic), then runs combo detection (bonus
// crit / energy refund / cooldown reduction) and the utility resolver (scan / stun / repair / speed-gate).

const nowS = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

export function loadKitForCharacter(characterId: string | undefined): void {
  if (!characterId) return;
  const kit = getKitForCharacter(characterId);
  if (kit) useCharacterSkillStore.getState().setActiveKit(characterId, kit.id);
  registerPlayerCombatant(characterId);
}

// Batch F.5 — the per-character ability LOADOUT drives the keyed slots for ALL 8 heroes (so the cinematic
// arsenal is live on Z/X/Y/H/B/N + ultimate). Falls back to the kit's defaultSkillIds when no loadout exists.
const SLOT_TO_LOADOUT: Record<SkillSlotName, keyof AbilityLoadoutDefinition | undefined> = {
  basic: 'basic', special1: 'special1', special2: 'special2', aoe: 'aoe', defense: 'defense', utility: 'utility', ultimatePlaceholder: 'ultimate',
};

export function getSkillIdForSlot(characterId: string | undefined, slot: SkillSlotName): string | undefined {
  const key = SLOT_TO_LOADOUT[slot];
  const loId = key ? (getLoadout(characterId)?.[key] as string | undefined) : undefined;
  if (loId) return loId;
  const kit = getKitForCharacter(characterId);
  return kit?.defaultSkillIds[slot];
}

export function hasKit(characterId: string | undefined): boolean {
  return !!getKitForCharacter(characterId);
}

// Batch F.5 — cast one of the 4 alternate arsenal abilities (bound to extra keys J/K/L/I) by its abilitySlot.
export function castArsenalAbilityBySlot(characterId: string | undefined, abilitySlot: import('../../types/abilityArsenalTypes').AbilitySlot): SkillCastOutcome | null {
  const id = characterId ?? activeCombatantId();
  if (!id) return null;
  const ability = getAbilityBySlot(id, abilitySlot);
  if (!ability) return null;
  return castCharacterSkillById(id, ability.combat.skillDefinitionId);
}

// Cast a kit skill by slot name. Returns the combat outcome (or null if no kit / no skill).
export function castCharacterSkill(characterId: string | undefined, slot: SkillSlotName): SkillCastOutcome | null {
  const id = characterId ?? activeCombatantId();
  if (!id) return null;
  const skillId = getSkillIdForSlot(id, slot);
  if (!skillId) return null;
  return castCharacterSkillById(id, skillId);
}

// Cast a specific kit skill id for a character (used by slot + debug). Handles combo + utility.
export function castCharacterSkillById(characterId: string, skillId: string): SkillCastOutcome | null {
  const t = nowS();
  const skillStore = useCharacterSkillStore.getState();
  skillStore.recordCast(characterId, skillId, t);

  // Combo detection on the updated buffer.
  const kit = getKitForCharacter(characterId);
  const combos = kit?.combos ?? [];
  const buffer = useCharacterSkillStore.getState().comboStateByCharacterId[characterId]?.recentCasts ?? [];
  const combo = detectCombo(buffer, combos);

  const outcome = castSkillById(skillId, characterId, { forceCrit: combo?.bonusEffects?.forceCrit });
  if (!outcome?.ok) return outcome;
  accrueSyncFromAction(12); // Batch I — skill use fills the partner-fusion sync gauge

  // Utility (scan / stun / repair / speed-gate) from the cast hits.
  const castSkillDef = getCombatSkill(skillId);
  if (castSkillDef) applyUtilityFromCast(castSkillDef, outcome.hitIds);

  // Apply combo bonuses (energy refund / cooldown reduction) + flag for the HUD.
  if (combo) {
    const cs = useCombatStore.getState();
    if (combo.bonusEffects?.energyRefund) {
      const stats = cs.playerStatsByCharacterId[characterId];
      if (stats) cs.updateCombatStats(characterId, { energy: Math.min(stats.maxEnergy, stats.energy + combo.bonusEffects.energyRefund) });
    }
    if (combo.bonusEffects?.cooldownReductionSeconds) {
      const until = cs.activeCooldowns[skillId];
      if (until) cs.startCooldown(skillId, Math.max(Date.now(), until - combo.bonusEffects.cooldownReductionSeconds * 1000));
    }
    skillStore.setComboTriggered(characterId, combo.id, t);
  }
  return outcome;
}

export function cleanupCharacterSkillRuntime(): void {
  useCharacterSkillStore.getState().resetCharacterSkills();
}
