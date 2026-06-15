// Character Combat Kits (Batch D-kits) — a role-defined loadout of named skill slots + combos + stage-utility
// + sockets layered over the existing skill registry. The kit's defaultSkillIds reference CombatSkillDefinition
// ids; named slots map onto the existing z/x/y/h/b/n keys.

export type SkillSlotName = 'basic' | 'special1' | 'special2' | 'aoe' | 'defense' | 'utility' | 'ultimatePlaceholder';

// Named slot → numeric slot (the existing z/x/y/h/b/n bar). ultimatePlaceholder has no key (debug-cast only).
export const SLOT_NAME_TO_NUM: Record<SkillSlotName, number> = {
  basic: 1, special1: 2, special2: 3, aoe: 4, defense: 5, utility: 6, ultimatePlaceholder: 0,
};
export const KEYED_SLOT_NAMES: readonly SkillSlotName[] = ['basic', 'special1', 'special2', 'aoe', 'defense', 'utility'];

export type CharacterCombatRoleType =
  | 'speed' | 'rescue' | 'engineering' | 'defense' | 'control'
  | 'shield-break' | 'repair' | 'scanner' | 'precision' | 'stealth' | 'utility';
export const COMBAT_ROLE_TYPES: readonly CharacterCombatRoleType[] = [
  'speed', 'rescue', 'engineering', 'defense', 'control', 'shield-break', 'repair', 'scanner', 'precision', 'stealth', 'utility',
];

export type SocketName =
  | 'root' | 'hand-left' | 'hand-right' | 'wing-left' | 'wing-right'
  | 'thruster-left' | 'thruster-right' | 'tool-arm' | 'shield-front' | 'scanner-head' | 'chest-core' | string;

export interface CharacterModelSocketConfig {
  characterId: string;
  sockets: { socketName: SocketName; fallbackOffset: [number, number, number]; fallbackRotation?: [number, number, number] }[];
}

export type StageUtilityType =
  | 'speed-gate' | 'repair-device' | 'build-cover' | 'scan-weakpoint'
  | 'disable-trap' | 'clear-obstacle' | 'protect-npc' | 'open-shortcut';
export type StageUtilityEffect =
  | 'complete-zone-condition' | 'change-obstacle-state' | 'reveal-marker' | 'reduce-cooldown' | 'repair-object' | 'debug-log';

export interface StageUtilityRuleDefinition {
  id: string;
  utilityType: StageUtilityType;
  validTargetTags: string[];
  requiredSkillTags?: string[];
  effect: StageUtilityEffect;
  value?: number;
  editorMeta?: { notes?: string };
}

export interface ComboSkillDefinition {
  id: string;
  characterId: string;
  name: string;
  inputSequence: string[]; // sequence of skill ids (or slot names)
  maxInputGapSeconds: number;
  requiredPreviousSkillId?: string;
  requiredStateTags?: string[];
  resultSkillId: string;
  bonusEffects?: {
    damageMultiplier?: number;
    cooldownReductionSeconds?: number;
    energyRefund?: number;
    forceCrit?: boolean;
    addAttackTags?: string[];
  };
  editorMeta?: { notes?: string; difficulty?: 'easy' | 'normal' | 'hard' };
}

export interface CharacterCombatKitDefinition {
  characterId: string;
  displayName: string;
  roleTypes: CharacterCombatRoleType[];
  defaultSkillIds: {
    basic: string;
    special1: string;
    special2?: string;
    aoe?: string;
    defense: string;
    utility?: string;
    ultimatePlaceholder?: string;
  };
  comboSkillIds: string[];
  stageUtilityRules: StageUtilityRuleDefinition[];
  partnerSynergyPlaceholders?: { id: string; partnerCharacterId: string; notes?: string }[];
  modelSocketConfig?: CharacterModelSocketConfig;
  recommendedAgainst: { enemyTypes?: string[]; obstacleTypes?: string[]; zoneSegmentTypes?: string[] };
  weakAgainst?: { enemyTypes?: string[]; obstacleTypes?: string[]; notes?: string };
  combos?: ComboSkillDefinition[]; // inline-edited in the editor
  editorMeta?: { notes?: string; themeColor?: string; difficulty?: 'easy' | 'normal' | 'hard' };
  // a synthetic id for createEditorCollection (= characterId).
  id: string;
}

export interface CharacterKitValidationResult { ok: boolean; errors: string[]; warnings: string[] }
