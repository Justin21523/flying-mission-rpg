// Cinematic Ability Arsenal (Batch F.5) — the 8-hero × 11-ability data model. Each ability WRAPS a real
// CombatSkillDefinition (so it casts/damages through the existing SkillRuntime/DamageResolver) and points at
// a CinematicEffectDefinition. A loadout maps a character's keyed slots to chosen arsenal abilities.

import type { DamageType, HitVolumeDefinition, TargetRuleDefinition } from './game/combat';

export type AbilityCategory = 'attack' | 'defense' | 'ultimate';
export const ABILITY_CATEGORIES: readonly AbilityCategory[] = ['attack', 'defense', 'ultimate'];

export type AbilitySlot =
  | 'attack-1' | 'attack-2' | 'attack-3' | 'attack-4' | 'attack-5' | 'attack-6'
  | 'defense-1' | 'defense-2' | 'defense-3'
  | 'ultimate-1' | 'ultimate-2';
export const ABILITY_SLOTS: readonly AbilitySlot[] = [
  'attack-1', 'attack-2', 'attack-3', 'attack-4', 'attack-5', 'attack-6',
  'defense-1', 'defense-2', 'defense-3', 'ultimate-1', 'ultimate-2',
];

export type VisualIntensity = 1 | 2 | 3 | 4 | 5;

export interface CinematicAbilityDefinition {
  id: string;
  characterId: string;
  name: string;
  description: string;

  abilityCategory: AbilityCategory;
  abilitySlot: AbilitySlot;
  inputBinding: string;

  combat: {
    skillDefinitionId: string;
    damageType?: DamageType;
    attackTags: string[];
    energyCost: number;
    cooldownSeconds: number;
    castTimeSeconds?: number;
    durationSeconds?: number;
    hitVolume: HitVolumeDefinition;
    targetRules: TargetRuleDefinition;
  };

  vfx: {
    cinematicEffectId: string;
    previewEffectId?: string;
    impactEffectId?: string;
    cleanupEffectId?: string;
  };

  gameplayHooks?: {
    affectsEnemies?: boolean;
    affectsObstacles?: boolean;
    affectsBossWeakpoints?: boolean;
    affectsSupportSynergy?: boolean;
    affectsZoneCondition?: boolean;
    appliesStatusTags?: string[];
    effectiveAgainstEnemyTypes?: string[];
    weakAgainstEnemyTypes?: string[];
    effectiveAgainstObstacleTypes?: string[];
    canDamageBoss?: boolean;
    canExposeWeakpoint?: boolean;
    canRepairDevice?: boolean;
    canBreakShield?: boolean;
  };

  balance: {
    baseDamage?: number;
    shieldDamage?: number;
    staggerValue?: number;
    knockbackForce?: number;
    repairAmount?: number;
    scanDurationSeconds?: number;
    defenseReductionPercent?: number;
  };

  editorMeta?: {
    notes?: string;
    difficulty?: 'easy' | 'normal' | 'hard';
    visualIntensity?: VisualIntensity;
    recommendedUse?: string;
    themeColor?: string;
  };
  enabled?: boolean;
}

// A character's equipped loadout: which arsenal abilities sit on the keyed slots + ultimate. The kit's
// defaultSkillIds are derived from this so the existing keyed-slot casting (Z/X/Y/H/B/N + ultimate) works.
export interface AbilityLoadoutDefinition {
  id: string; // === characterId
  characterId: string;
  basic: string;      // ability id → keyed slot Z
  special1: string;   // X
  special2: string;   // Y
  aoe: string;        // H
  defense: string;    // B
  utility: string;    // N
  ultimate: string;   // ultimate
  editorMeta?: { notes?: string };
}

export interface AbilityValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}
