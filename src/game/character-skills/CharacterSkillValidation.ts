import type { CharacterCombatKitDefinition, ComboSkillDefinition, CharacterModelSocketConfig, CharacterKitValidationResult } from '../../types/game/characterKit';
import { COMBAT_ROLE_TYPES } from '../../types/game/characterKit';

// Pure validators for character kits / combos / sockets (Batch D-kits). `skillExists` lets kit validation
// confirm its skill ids resolve in the shared skill registry.
export function validateKit(kit: CharacterCombatKitDefinition, skillExists: (id: string) => boolean): CharacterKitValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!kit.characterId.trim()) errors.push('Kit characterId must not be empty.');
  for (const role of kit.roleTypes) if (!COMBAT_ROLE_TYPES.includes(role)) errors.push(`unknown roleType "${role}".`);
  const d = kit.defaultSkillIds;
  for (const [slot, id] of Object.entries(d)) {
    if (!id) continue;
    if (!skillExists(id)) errors.push(`default skill "${id}" (${slot}) does not exist.`);
  }
  if (!d.basic) errors.push('kit needs a basic skill.');
  if (!d.defense) errors.push('kit needs a defense skill.');
  for (const c of kit.combos ?? []) {
    const cr = validateCombo(c, skillExists);
    errors.push(...cr.errors.map((e) => `combo ${c.id}: ${e}`));
  }
  if (kit.modelSocketConfig) {
    const sr = validateSocketConfig(kit.modelSocketConfig);
    errors.push(...sr.errors); warnings.push(...sr.warnings);
  }
  for (const u of kit.stageUtilityRules) {
    if (u.validTargetTags.length === 0) warnings.push(`utility ${u.id} has no validTargetTags.`);
  }
  return { ok: errors.length === 0, errors, warnings };
}

export function validateCombo(c: ComboSkillDefinition, skillExists: (id: string) => boolean): CharacterKitValidationResult {
  const errors: string[] = [];
  if (c.inputSequence.length === 0) errors.push('inputSequence must not be empty.');
  if (c.maxInputGapSeconds <= 0) errors.push('maxInputGapSeconds must be > 0.');
  if (!skillExists(c.resultSkillId)) errors.push(`resultSkillId "${c.resultSkillId}" does not exist.`);
  if (c.requiredPreviousSkillId && !skillExists(c.requiredPreviousSkillId)) errors.push(`requiredPreviousSkillId "${c.requiredPreviousSkillId}" does not exist.`);
  return { ok: errors.length === 0, errors, warnings: [] };
}

export function validateSocketConfig(config: CharacterModelSocketConfig): CharacterKitValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();
  for (const s of config.sockets) {
    if (!String(s.socketName).trim()) errors.push('socketName must not be empty.');
    if (s.fallbackOffset.length !== 3) errors.push(`socket "${s.socketName}" fallbackOffset must be [x,y,z].`);
    if (seen.has(s.socketName)) warnings.push(`duplicate socket "${s.socketName}".`);
    seen.add(s.socketName);
  }
  return { ok: errors.length === 0, errors, warnings };
}
