import type { PartnerSynergyPlaceholderDefinition } from '../../types/game/supportCombat';

// Partner synergy PLACEHOLDERS (Batch E) — data + a simple runtime bonus + a UI toast. NOT full cinematic
// fusion. The SupportSynergyController checks the trigger and applies a small bonus (e.g. forceCrit / tag)
// to the primary character's next action.
export const SEED_SUPPORT_SYNERGIES: PartnerSynergyPlaceholderDefinition[] = [
  {
    id: 'synergy_chase_scan_jett_dash',
    primaryCharacterId: 'char_jett',
    supportCharacterId: 'char_chase',
    name: 'Recon Strike',
    triggerCondition: 'enemy-scanned',
    requiredSupportAbilityId: 'support_scan_chase',
    requiredSkillTags: ['speed', 'rescue'],
    resultEffectIds: ['jett_kit_speed'],
    cooldownSeconds: 8,
    editorMeta: { notes: 'Chase scan exposes a weakpoint → Jett next dash bonus (forceCrit).', futureFullFusion: true },
  },
  {
    id: 'synergy_paul_shield_donnie_repair',
    primaryCharacterId: 'char_donnie',
    supportCharacterId: 'char_paul',
    name: 'Covered Repair',
    triggerCondition: 'support-used-after-skill',
    requiredSupportAbilityId: 'support_shield_paul',
    requiredSkillTags: ['repair', 'engineering'],
    resultEffectIds: ['donnie_kit_repair'],
    cooldownSeconds: 10,
    editorMeta: { notes: 'Paul shield active → Donnie repair beam is uninterruptible (placeholder bonus).', futureFullFusion: true },
  },
  {
    id: 'synergy_chase_scan_paul_cuff',
    primaryCharacterId: 'char_paul',
    supportCharacterId: 'char_chase',
    name: 'Marked Restraint',
    triggerCondition: 'enemy-scanned',
    requiredSupportAbilityId: 'support_scan_chase',
    requiredSkillTags: ['control', 'restraint'],
    resultEffectIds: ['paul_kit_cuff'],
    cooldownSeconds: 9,
    editorMeta: { notes: 'Scanned enemy → Paul Containment Cuff lasts longer (placeholder bonus).', futureFullFusion: true },
  },
  {
    id: 'synergy_donnie_repair_jett_gate',
    primaryCharacterId: 'char_jett',
    supportCharacterId: 'char_donnie',
    name: 'Rapid Relink',
    triggerCondition: 'support-used-after-skill',
    requiredSupportAbilityId: 'support_repair_donnie',
    requiredSkillTags: ['speed', 'speed-gate'],
    resultEffectIds: ['jett_kit_speed'],
    cooldownSeconds: 12,
    editorMeta: { notes: 'Donnie repairs a device → Jett can speed-gate to the next marker (placeholder).', futureFullFusion: true },
  },
];

export function getSynergiesForPrimary(characterId: string | undefined): PartnerSynergyPlaceholderDefinition[] {
  if (!characterId) return [];
  return SEED_SUPPORT_SYNERGIES.filter((s) => s.primaryCharacterId === characterId);
}
